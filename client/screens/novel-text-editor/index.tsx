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
  const [matchedChapterIndices, setMatchedChapterIndices] = useState<number[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // 搜索章节
  const searchChapters = () => {
    if (!searchQuery.trim() || chapters.length === 0) {
      setMatchedChapterIndices([]);
      setHighlightedChapterIndex(-1);
      return;
    }

    // 解析搜索查询，支持数字和"第X章"格式
    const query = searchQuery.trim();
    let targetNumber: number | null = null;

    // 尝试匹配数字
    const numberMatch = query.match(/\d+/);
    if (numberMatch) {
      targetNumber = parseInt(numberMatch[0]);
    }

    // 查找所有匹配的章节索引
    const matchedIndices: number[] = [];
    chapters.forEach((chapter, index) => {
      const chapterNumberMatch = chapter.title.match(/\d+/);
      if (chapterNumberMatch) {
        const chapterNumber = parseInt(chapterNumberMatch[0]);
        if (targetNumber !== null && chapterNumber === targetNumber) {
          matchedIndices.push(index);
        } else if (chapter.title.includes(query) || query.includes(chapter.title)) {
          matchedIndices.push(index);
        }
      }
    });

    setMatchedChapterIndices(matchedIndices);

    // 如果有匹配结果，高亮第一个
    if (matchedIndices.length > 0) {
      jumpToChapter(matchedIndices[0]);
    } else {
      Alert.alert('提示', '未找到匹配的章节');
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

  // 上一个搜索结果
  const handlePreviousSearch = () => {
    if (matchedChapterIndices.length === 0) {
      Alert.alert('提示', '请先输入搜索内容');
      return;
    }

    const currentIndex = matchedChapterIndices.indexOf(highlightedChapterIndex);
    if (currentIndex === -1) {
      // 当前没有高亮，高亮最后一个
      jumpToChapter(matchedChapterIndices[matchedChapterIndices.length - 1]);
    } else {
      // 高亮前一个（循环）
      const prevIndex = (currentIndex - 1 + matchedChapterIndices.length) % matchedChapterIndices.length;
      jumpToChapter(matchedChapterIndices[prevIndex]);
    }
  };

  // 下一个搜索结果
  const handleNextSearch = () => {
    if (matchedChapterIndices.length === 0) {
      Alert.alert('提示', '请先输入搜索内容');
      return;
    }

    const currentIndex = matchedChapterIndices.indexOf(highlightedChapterIndex);
    if (currentIndex === -1) {
      // 当前没有高亮，高亮第一个
      jumpToChapter(matchedChapterIndices[0]);
    } else {
      // 高亮后一个（循环）
      const nextIndex = (currentIndex + 1) % matchedChapterIndices.length;
      jumpToChapter(matchedChapterIndices[nextIndex]);
    }
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
              {/* 上箭头 */}
              <TouchableOpacity
                style={[styles.arrowButton, styles.arrowUpButton]}
                onPress={handlePreviousSearch}
                disabled={matchedChapterIndices.length === 0}
              >
                <Feather
                  name="chevron-up"
                  size={16}
                  color={matchedChapterIndices.length > 0 ? "#C8102E" : "#CCC"}
                />
              </TouchableOpacity>
              {/* 下箭头 */}
              <TouchableOpacity
                style={[styles.arrowButton, styles.arrowDownButton]}
                onPress={handleNextSearch}
                disabled={matchedChapterIndices.length === 0}
              >
                <Feather
                  name="chevron-down"
                  size={16}
                  color={matchedChapterIndices.length > 0 ? "#C8102E" : "#CCC"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearchChapter}
              >
                <Text style={styles.searchButtonText}>搜索</Text>
              </TouchableOpacity>
            </View>
            {/* 搜索结果提示 */}
            {matchedChapterIndices.length > 0 && (
              <View style={styles.searchResultHint}>
                <Text style={styles.searchResultText}>
                  找到 {matchedChapterIndices.length} 个结果
                  {matchedChapterIndices.length > 1 &&
                    ` (使用箭头键切换 ${highlightedChapterIndex >= 0 ? matchedChapterIndices.indexOf(highlightedChapterIndex) + 1 : 0}/${matchedChapterIndices.length})`
                  }
                </Text>
              </View>
            )}
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
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  arrowUpButton: {
    marginRight: 2,
  },
  arrowDownButton: {
    marginRight: 2,
  },
  searchResultHint: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#FFF5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchResultText: {
    fontSize: 11,
    color: '#C8102E',
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
