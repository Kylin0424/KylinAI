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
  const [showInsertIndicator, setShowInsertIndicator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedChapterIndex, setHighlightedChapterIndex] = useState<number>(-1);
  const scrollViewRef = useRef<ScrollView>(null);

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

  // 搜索章节
  const searchChapters = (query?: string) => {
    const searchInput = (query || searchQuery).trim();
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
  const handleSearchChapter = () => {
    searchChapters();
  };

  // 上一章：递减搜索
  const handlePreviousChapter = () => {
    const parsed = parseSearchQuery(searchQuery);
    if (parsed.number === 0) {
      Alert.alert('提示', '请先输入章节号');
      return;
    }

    const newNumber = Math.max(1, parsed.number - 1);
    const newQuery = parsed.isChinese
      ? `${parsed.prefix}${numberToChinese(newNumber)}${parsed.suffix}`
      : (parsed.prefix || '') + newNumber.toString() + (parsed.suffix || '');

    setSearchQuery(newQuery);
    searchChapters(newQuery);
  };

  // 下一章：递增搜索
  const handleNextChapter = () => {
    const parsed = parseSearchQuery(searchQuery);
    if (parsed.number === 0) {
      Alert.alert('提示', '请先输入章节号');
      return;
    }

    const newNumber = parsed.number + 1;
    const newQuery = parsed.isChinese
      ? `${parsed.prefix}${numberToChinese(newNumber)}${parsed.suffix}`
      : (parsed.prefix || '') + newNumber.toString() + (parsed.suffix || '');

    setSearchQuery(newQuery);
    searchChapters(newQuery);
  };

  // 插入分隔符 - 添加视觉提示
  const insertSeparator = () => {
    setShowInsertIndicator(true);
    
    // 2秒后自动隐藏提示
    setTimeout(() => {
      setShowInsertIndicator(false);
    }, 2000);

    const separator = '\n===章节分隔符===\n';
    const newText =
      text.slice(0, cursorPosition) + separator + text.slice(cursorPosition);
    setText(newText);
    setCursorPosition(cursorPosition + separator.length);

    // 自动滚动到光标位置
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
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
            {/* 搜索框 */}
            <View style={styles.searchContainer}>
              <Feather name="search" size={16} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="搜索章节 (如: 1 或 第一章)"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                keyboardType="numbers-and-punctuation"
                onSubmitEditing={handleSearchChapter}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearchChapter}
              >
                <Text style={styles.searchButtonText}>搜索</Text>
              </TouchableOpacity>
            </View>
            {/* 上一章/下一章按钮 */}
            <View style={styles.chapterNavContainer}>
              <TouchableOpacity
                style={styles.chapterNavButton}
                onPress={handlePreviousChapter}
                disabled={!searchQuery.trim()}
              >
                <Feather
                  name="chevron-left"
                  size={16}
                  color={searchQuery.trim() ? "#C8102E" : "#CCC"}
                />
                <Text style={[styles.chapterNavButtonText, !searchQuery.trim() && styles.chapterNavButtonDisabled]}>
                  上一章
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chapterNavButton}
                onPress={handleNextChapter}
                disabled={!searchQuery.trim()}
              >
                <Text style={[styles.chapterNavButtonText, !searchQuery.trim() && styles.chapterNavButtonDisabled]}>
                  下一章
                </Text>
                <Feather
                  name="chevron-right"
                  size={16}
                  color={searchQuery.trim() ? "#C8102E" : "#CCC"}
                />
              </TouchableOpacity>
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
            {/* 插入分隔符视觉提示 */}
            {showInsertIndicator && (
              <View style={styles.insertIndicator}>
                <View style={styles.insertIndicatorArrow}>
                  <View style={styles.insertIndicatorArrowTriangle} />
                  <View style={styles.insertIndicatorLine} />
                </View>
                <View style={styles.insertIndicatorText}>
                  <Feather name="scissors" size={16} color="#C8102E" />
                  <Text style={styles.insertIndicatorLabel}>分隔符将插入此处</Text>
                </View>
              </View>
            )}

            <TextInput
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
          </ScrollView>
        </View>

        {/* 底部工具栏 */}
        <View style={styles.bottomToolbar}>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginLeft: 8,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  searchButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#C8102E',
    borderRadius: 6,
    marginLeft: 8,
  },
  searchButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  chapterNavContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    gap: 8,
  },
  chapterNavButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    gap: 6,
  },
  chapterNavButtonText: {
    fontSize: 13,
    color: '#C8102E',
    fontWeight: '600',
  },
  chapterNavButtonDisabled: {
    color: '#CCC',
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
    minHeight: 400,
  },
  insertIndicator: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFF5F5',
    borderWidth: 2,
    borderColor: '#C8102E',
    borderRadius: 8,
    padding: 12,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  insertIndicatorArrow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  insertIndicatorArrowTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#C8102E',
  },
  insertIndicatorLine: {
    width: 2,
    height: 20,
    backgroundColor: '#C8102E',
  },
  insertIndicatorText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  insertIndicatorLabel: {
    fontSize: 14,
    color: '#C8102E',
    fontWeight: '600',
  },
  bottomToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  toolbarButtonText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#C8102E',
    marginLeft: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
