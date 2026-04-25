import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';

interface Chapter {
  id: string;
  title: string;
  startIndex: number;
  endIndex: number;
  content: string;
}

interface MarkerPosition {
  index: number;
  line: number;
}

export default function NovelTextEditor() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{
    fileContent: string;
    fileName: string;
  }>();

  const [text, setText] = useState(params.fileContent || '');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showChapterNameModal, setShowChapterNameModal] = useState(false);
  const [chapterName, setChapterName] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showInsertHint, setShowInsertHint] = useState(false);
  const [insertPosition, setInsertPosition] = useState<MarkerPosition | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<MarkerPosition[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [highlightedChapterIndex, setHighlightedChapterIndex] = useState<number>(-1);
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  // 中文数字映射
  const chineseNumberMap: Record<string, number> = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
  };

  // 将数字转换为中文数字（支持1-99）
  const numberToChinese = (num: number): string => {
    if (num <= 10) {
      return (chineseNumberMap[num.toString()] || num.toString()) as string;
    } else if (num < 20) {
      return '十' + (chineseNumberMap[(num % 10).toString()] || '');
    } else {
      const tens = Math.floor(num / 10);
      const ones = num % 10;
      const tensStr = tens === 1 ? '十' : ((chineseNumberMap[tens.toString()] || tens.toString()) + '十');
      const onesStr = ones > 0 ? (chineseNumberMap[ones.toString()] || ones.toString()) : '';
      return tensStr + onesStr;
    }
  };

  // 解析搜索查询，提取数字或中文数字
  const parseSearchQuery = (query: string): { number: number; isChinese: boolean; prefix: string; suffix: string } => {
    const trimmed = query.trim();

    // 尝试匹配"第X章"格式（中文）
    const chineseChapterMatch = trimmed.match(/^(第)([一二三四五六七八九十百千万零]+)(章|回|节)/);
    if (chineseChapterMatch) {
      const chineseNum = chineseChapterMatch[2];
      const num = chineseToNumber(chineseNum);
      return {
        number: num,
        isChinese: true,
        prefix: chineseChapterMatch[1],
        suffix: chineseChapterMatch[3]
      };
    }

    // 尝试匹配"第X章"格式（数字）
    const numberChapterMatch = trimmed.match(/^(第)(\d+)(章|回|节)/);
    if (numberChapterMatch) {
      return {
        number: parseInt(numberChapterMatch[2]),
        isChinese: false,
        prefix: numberChapterMatch[1],
        suffix: numberChapterMatch[3]
      };
    }

    // 尝试直接匹配数字
    const numberMatch = trimmed.match(/^(\d+)$/);
    if (numberMatch) {
      return {
        number: parseInt(numberMatch[1]),
        isChinese: false,
        prefix: '',
        suffix: ''
      };
    }

    // 默认返回null
    return { number: 0, isChinese: false, prefix: '', suffix: '' };
  };

  // 将中文数字转换为数字
  const chineseToNumber = (chineseNum: string): number => {
    let result = 0;
    let temp = 0;
    let prevValue = 0;

    for (let i = 0; i < chineseNum.length; i++) {
      const char = chineseNum[i];
      const value = chineseNumberMap[char] || 0;

      if (char === '百') {
        if (prevValue === 0) {
          temp = 100;
        } else {
          temp = prevValue * 100;
          prevValue = 0;
        }
      } else if (char === '千') {
        if (prevValue === 0) {
          temp = 1000;
        } else {
          temp = prevValue * 1000;
          prevValue = 0;
        }
      } else if (char === '万') {
        if (prevValue === 0) {
          temp = 10000;
        } else {
          temp = prevValue * 10000;
          prevValue = 0;
        }
      } else if (char === '十') {
        if (prevValue === 0) {
          temp = 10;
        } else {
          temp = prevValue * 10;
          prevValue = 0;
        }
      } else {
        if (temp === 0) {
          prevValue = value;
        } else {
          prevValue += value;
        }
      }
    }

    result = temp + prevValue;
    return result;
  };

  // 计算光标所在的行号
  const getLineNumber = (position: number): number => {
    const textBefore = text.substring(0, position);
    return textBefore.split('\n').length;
  };

  // 执行搜索
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const results: MarkerPosition[] = [];
    let index = 0;

    while (true) {
      const foundIndex = text.indexOf(query, index);
      if (foundIndex === -1) break;

      results.push({
        index: foundIndex,
        line: getLineNumber(foundIndex),
      });

      index = foundIndex + query.length;
    }

    setSearchResults(results);
    setCurrentSearchIndex(0);

    if (results.length > 0) {
      // 自动滚动到第一个搜索结果
      scrollToPosition(results[0].index);
    } else {
      Alert.alert('提示', '未找到匹配的内容');
    }
  };

  // 滚动到指定位置
  const scrollToPosition = (position: number) => {
    // 估算滚动位置（每个字符约2像素高度，简化计算）
    const scrollPosition = Math.max(0, position * 0.5);
    scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: true });
  };

  // 搜索章节（基于已提取章节）
  const searchChapters = (query?: string) => {
    const searchInput = (query || searchText).trim();
    if (!searchInput || chapters.length === 0) {
      setHighlightedChapterIndex(-1);
      return;
    }

    const parsed = parseSearchQuery(searchInput);
    if (parsed.number === 0) {
      // 如果解析失败，尝试模糊匹配
      const matchedIndex = chapters.findIndex(ch => ch.title.includes(searchInput));
      if (matchedIndex >= 0) {
        jumpToChapter(matchedIndex);
      } else {
        Alert.alert('提示', '未找到匹配的章节');
      }
      return;
    }

    // 查找匹配的章节
    const matchedIndex = chapters.findIndex(ch => {
      const chapterMatch = ch.title.match(/\d+/);
      if (chapterMatch) {
        const chapterNumber = parseInt(chapterMatch[0]);
        return chapterNumber === parsed.number;
      }
      return false;
    });

    if (matchedIndex >= 0) {
      jumpToChapter(matchedIndex);
    } else {
      Alert.alert('提示', `未找到第${parsed.number}章`);
    }
  };

  // 跳转到指定章节
  const jumpToChapter = (chapterIndex: number) => {
    setHighlightedChapterIndex(chapterIndex);

    const chapter = chapters[chapterIndex];
    if (chapter) {
      // 计算滚动位置（简单估算）
      const scrollY = chapter.startIndex * 0.5;
      scrollViewRef.current?.scrollTo({
        y: scrollY,
        animated: true,
      });
    }

    // 2秒后取消高亮
    setTimeout(() => {
      setHighlightedChapterIndex(-1);
    }, 2000);
  };

  // 处理搜索框回车
  const handleSearch = () => {
    // 优先搜索整个文本
    performSearch(searchText);

    // 如果已提取章节，同时搜索章节
    if (chapters.length > 0) {
      searchChapters();
    }
  };

  // 上一章：递减搜索
  const handlePreviousChapter = () => {
    const parsed = parseSearchQuery(searchText);
    if (parsed.number === 0) {
      Alert.alert('提示', '请先输入章节号');
      return;
    }

    const newNumber = Math.max(1, parsed.number - 1);
    const newQuery = parsed.isChinese
      ? `${parsed.prefix}${numberToChinese(newNumber)}${parsed.suffix}`
      : (parsed.prefix || '') + newNumber.toString() + (parsed.suffix || '');

    setSearchText(newQuery);
    performSearch(newQuery);
    if (chapters.length > 0) {
      searchChapters(newQuery);
    }
  };

  // 下一章：递增搜索
  const handleNextChapter = () => {
    const parsed = parseSearchQuery(searchText);
    if (parsed.number === 0) {
      Alert.alert('提示', '请先输入章节号');
      return;
    }

    const newNumber = parsed.number + 1;
    const newQuery = parsed.isChinese
      ? `${parsed.prefix}${numberToChinese(newNumber)}${parsed.suffix}`
      : (parsed.prefix || '') + newNumber.toString() + (parsed.suffix || '');

    setSearchText(newQuery);
    performSearch(newQuery);
    if (chapters.length > 0) {
      searchChapters(newQuery);
    }
  };

  // 插入分隔符 - 在光标位置显示提示
  const insertSeparator = () => {
    const line = getLineNumber(cursorPosition);

    setInsertPosition({
      index: cursorPosition,
      line: line,
    });
    setShowInsertHint(true);

    // 2秒后自动隐藏提示
    setTimeout(() => {
      setShowInsertHint(false);
      setInsertPosition(null);
    }, 2000);

    const separator = '\n===章节分隔符===\n';
    const newText =
      text.slice(0, cursorPosition) + separator + text.slice(cursorPosition);
    setText(newText);
    setCursorPosition(cursorPosition + separator.length);

    // 自动滚动到光标位置
    setTimeout(() => {
      scrollToPosition(cursorPosition);
    }, 100);
  };

  // 打开章节命名弹窗
  const openChapterNameModal = () => {
    setChapterName('');
    setShowChapterNameModal(true);
  };

  // 提取所有章节
  const extractChapters = () => {
    const separator = '===章节分隔符===';
    const parts = text.split(separator);

    if (parts.length < 2) {
      Alert.alert('提示', '请至少插入一个章节分隔符');
      return;
    }

    let currentIndex = 0;
    const extractedChapters: Chapter[] = [];

    parts.forEach((part, index) => {
      if (part.trim()) {
        extractedChapters.push({
          id: `chapter-${index}`,
          title: `第${index + 1}章`,
          startIndex: currentIndex,
          endIndex: currentIndex + part.length,
          content: part.trim(),
        });
        currentIndex += part.length + separator.length;
      }
    });

    setChapters(extractedChapters);

    Alert.alert(
      '提取成功',
      `共识别出 ${extractedChapters.length} 个章节，请继续编辑章节名称，完成后点击"完成导入"`
    );
  };

  // 更新章节名称
  const updateChapterName = (chapterId: string, newName: string) => {
    setChapters(
      chapters.map((ch) =>
        ch.id === chapterId ? { ...ch, title: newName } : ch
      )
    );
  };

  // 识别角色
  const identifyCharacters = async () => {
    if (chapters.length === 0) {
      Alert.alert('提示', '请先提取章节');
      return;
    }

    try {
      // 合并所有章节文本进行分析
      const fullText = chapters.map((ch) => ch.content).join('\n\n');

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/novel/analyze-characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullText,
          novelId: 'temp',
          existingCharacters: [],
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const { mentionedCharacters, newCharacters } = result.data;

        if (newCharacters && newCharacters.length > 0) {
          Alert.alert(
            '识别结果',
            `共识别到 ${newCharacters.length} 个新角色：\n${newCharacters.join('、')}\n\n点击"确定"开始创作，系统会在后续创作中自动创建这些角色。`,
            [
              { text: '取消', style: 'cancel' },
              {
                text: '确定',
                onPress: () => {
                  // 跳转到小说创作页面
                  router.replace('/novel-writing', {
                    importData: JSON.stringify({
                      chapters,
                      identifiedCharacters: newCharacters,
                      fileName: params.fileName,
                    }),
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert(
            '识别结果',
            '未识别到新角色，点击"确定"开始创作。',
            [
              { text: '取消', style: 'cancel' },
              {
                text: '确定',
                onPress: () => {
                  router.replace('/novel-writing', {
                    importData: JSON.stringify({
                      chapters,
                      identifiedCharacters: [],
                      fileName: params.fileName,
                    }),
                  });
                },
              },
            ]
          );
        }
      } else {
        Alert.alert('提示', '角色识别失败，将直接进入创作');
        router.replace('/novel-writing', {
          importData: JSON.stringify({
            chapters,
            identifiedCharacters: [],
            fileName: params.fileName,
          }),
        });
      }
    } catch (error) {
      console.error('Identify characters error:', error);
      Alert.alert('错误', '角色识别失败，将直接进入创作');
      router.replace('/novel-writing', {
        importData: JSON.stringify({
          chapters,
          identifiedCharacters: [],
          fileName: params.fileName,
        }),
      });
    }
  };

  // 完成导入
  const handleCompleteImport = async () => {
    if (chapters.length === 0) {
      Alert.alert('提示', '请先提取章节');
      return;
    }

    // 识别角色
    identifyCharacters();
  };

  // 计算光标在TextInput中的位置
  const handleSelectionChange = (event: any) => {
    const { selection } = event.nativeEvent;
    if (selection) {
      setSelection(selection);
      setCursorPosition(selection.start);
    }
  };

  return (
    <Screen statusBarStyle="dark">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* 顶部工具栏 */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topBarButton}
            onPress={() => router.back()}
          >
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{params.fileName || '导入小说'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.topBarButton, styles.actionButton]}
            onPress={handleCompleteImport}
          >
            <Text style={styles.actionButtonText}>完成导入</Text>
          </TouchableOpacity>
        </View>

        {/* 章节列表 */}
        {chapters.length > 0 && (
          <View style={styles.chapterListContainer}>
            <View style={styles.chapterListHeader}>
              <Text style={styles.chapterListTitle}>
                已识别章节 ({chapters.length})
              </Text>
            </View>
            <ScrollView
              style={styles.chapterList}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {chapters.map((chapter, index) => (
                <TouchableOpacity
                  key={chapter.id}
                  style={[
                    styles.chapterChip,
                    highlightedChapterIndex === index && styles.highlightedChapterChip,
                  ]}
                  onPress={() => {
                    Alert.prompt(
                      '修改章节名',
                      '请输入章节名称',
                      [
                        { text: '取消', style: 'cancel' },
                        {
                          text: '确定',
                          onPress: (text?: string) =>
                            updateChapterName(chapter.id, text || chapter.title),
                        },
                      ],
                      'plain-text',
                      chapter.title
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.chapterChipText,
                      highlightedChapterIndex === index && styles.highlightedChapterChipText,
                    ]}
                    numberOfLines={1}
                  >
                    {chapter.title}
                  </Text>
                  <Feather name="edit-2" size={12} color="#666" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 文本编辑区域 */}
        <View style={styles.editorContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.textScrollView}
            contentContainerStyle={styles.textContentContainer}
          >
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              multiline
              value={text}
              onChangeText={setText}
              onSelectionChange={handleSelectionChange}
              placeholder="开始编辑您的小说内容..."
              placeholderTextColor="#999"
              autoFocus
              textAlignVertical="top"
            />

            {/* 插入分隔符提示 - 显示在点击位置 */}
            {showInsertHint && insertPosition && (
              <View style={styles.insertHint}>
                <View style={styles.insertHintMarker}>
                  <Feather name="scissors" size={16} color="#C8102E" />
                </View>
                <Text style={styles.insertHintText}>
                  分隔符已插入第 {insertPosition.line} 行
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* 底部工具栏 */}
        <View style={styles.bottomContainer}>
          {/* 搜索区域 */}
          <View style={styles.searchArea}>
            <TextInput
              style={styles.searchInput}
              placeholder="输入章节标题搜索（如：1 或 第一章）"
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
              keyboardType="numbers-and-punctuation"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Feather name="search" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* 导航按钮 */}
          {searchResults.length > 0 && (
            <View style={styles.navButtons}>
              <TouchableOpacity
                style={[styles.navButton, currentSearchIndex === 0 && styles.navButtonDisabled]}
                onPress={handlePreviousChapter}
                disabled={currentSearchIndex === 0}
              >
                <Feather name="arrow-up" size={16} color={currentSearchIndex === 0 ? '#999' : '#fff'} />
                <Text style={[styles.navButtonText, currentSearchIndex === 0 && { color: '#999' }]}>
                  上一章
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, currentSearchIndex === searchResults.length - 1 && styles.navButtonDisabled]}
                onPress={handleNextChapter}
                disabled={currentSearchIndex === searchResults.length - 1}
              >
                <Feather name="arrow-down" size={16} color={currentSearchIndex === searchResults.length - 1 ? '#999' : '#fff'} />
                <Text style={[styles.navButtonText, currentSearchIndex === searchResults.length - 1 && { color: '#999' }]}>
                  下一章
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 操作按钮 */}
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={insertSeparator}
            >
              <Feather name="scissors" size={20} color="#333" />
              <Text style={styles.toolbarButtonText}>插入分隔符</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={openChapterNameModal}
            >
              <Feather name="list" size={20} color="#333" />
              <Text style={styles.toolbarButtonText}>提取章节</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => {
                const start = Math.max(0, cursorPosition - 100);
                const end = Math.min(text.length, cursorPosition + 100);
                const context = text.slice(start, end);
                Alert.alert('当前位置上下文', context);
              }}
            >
              <Feather name="map-pin" size={20} color="#333" />
              <Text style={styles.toolbarButtonText}>查看上下文</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* 章节命名弹窗 */}
      <Modal
        visible={showChapterNameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChapterNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>提取章节</Text>
              <TouchableOpacity onPress={() => setShowChapterNameModal(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                系统将根据您插入的分隔符自动分割章节，分割完成后您可以修改章节名称
              </Text>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowChapterNameModal(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  setShowChapterNameModal(false);
                  extractChapters();
                }}
              >
                <Text style={styles.confirmButtonText}>确定提取</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  topBarButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#C8102E',
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chapterListContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#fafafa',
  },
  chapterListHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  chapterListTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  chapterList: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chapterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  highlightedChapterChip: {
    backgroundColor: '#FFF5F5',
    borderColor: '#C8102E',
    borderWidth: 2,
  },
  chapterChipText: {
    fontSize: 13,
    color: '#333',
    marginRight: 6,
    maxWidth: 150,
  },
  highlightedChapterChipText: {
    color: '#C8102E',
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  textScrollView: {
    flex: 1,
  },
  textContentContainer: {
    padding: 16,
    minHeight: '100%',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  insertHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 16, 46, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#C8102E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 4,
  },
  insertHintMarker: {
    marginRight: 8,
  },
  insertHintText: {
    fontSize: 12,
    color: '#C8102E',
    fontWeight: '500',
  },
  bottomContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  searchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 8,
  },
  searchButton: {
    padding: 8,
    backgroundColor: '#C8102E',
    borderRadius: 8,
  },
  navButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#C8102E',
    borderRadius: 8,
    gap: 6,
  },
  navButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  navButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  toolbarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  toolbarButtonText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#C8102E',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});
