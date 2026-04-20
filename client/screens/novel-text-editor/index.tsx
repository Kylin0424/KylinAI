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
  const scrollViewRef = useRef<ScrollView>(null);

  // 插入分隔符
  const insertSeparator = () => {
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

  // 完成导入
  const handleCompleteImport = () => {
    if (chapters.length === 0) {
      Alert.alert('提示', '请先提取章节');
      return;
    }

    // 保存章节到本地存储或传递给下一个页面
    // 这里我们通过router传递章节数据
    router.push('/novel', {
      chapters: JSON.stringify(chapters),
      fromImport: 'true',
    });
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
                  style={styles.chapterChip}
                  onPress={() => {
                    Alert.prompt(
                      '修改章节名',
                      '请输入章节名称',
                      [
                        { text: '取消', style: 'cancel' },
                        {
                          text: '确定',
                          onPress: (text) =>
                            updateChapterName(chapter.id, text || chapter.title),
                        },
                      ],
                      'plain-text',
                      chapter.title
                    );
                  }}
                >
                  <Text style={styles.chapterChipText} numberOfLines={1}>
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
  chapterChipText: {
    fontSize: 13,
    color: '#333',
    marginRight: 6,
    maxWidth: 150,
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
