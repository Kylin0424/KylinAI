import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Character, generateId } from '@/utils/characterStorage';
import { Novel, createNovel, saveNovel, addChapter } from '@/utils/novelStorage';

const { width } = Dimensions.get('window');

// 章节标记前缀（足够特殊，不会被正则误匹配）
const CHAPTER_MARK_PREFIX = '<<CHAPTER_SPLIT::';
const CHAPTER_MARK_SUFFIX = '>>';

interface ChapterMark {
  id: string;
  title: string;
  position: number; // 在文本中的位置
  order: number; // 章节序号
}

interface NovelPreviewProps {
  content: string; // 原始小说内容
  filename: string;
  characters?: Character[];
}

export default function NovelPreview({ content, filename, characters = [] }: NovelPreviewProps) {
  const { colors } = useThemeContext();
  const router = useSafeRouter();
  const [chapterMarks, setChapterMarks] = useState<ChapterMark[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // 将内容按段落分割，用于渲染
  const paragraphs = useMemo(() => {
    return content.split('\n');
  }, [content]);

  // 检查某个段落位置是否已存在章节标记
  const hasMarkAtPosition = (paragraphIndex: number) => {
    // 计算该段落在原文中的位置
    let position = 0;
    for (let i = 0; i < paragraphIndex; i++) {
      position += paragraphs[i].length + 1; // +1 是换行符
    }
    return chapterMarks.some(mark => mark.position === position);
  };

  // 点击段落，弹出输入框
  const handleParagraphPress = (paragraphIndex: number) => {
    // 计算该段落在原文中的位置
    let position = 0;
    for (let i = 0; i < paragraphIndex; i++) {
      position += paragraphs[i].length + 1; // +1 是换行符
    }

    if (hasMarkAtPosition(paragraphIndex)) {
      Alert.alert('提示', '该位置已存在章节标记', [{ text: '确定' }]);
      return;
    }

    setCurrentPosition(position);
    setInputTitle(`第${chapterMarks.length + 1}章`);
    setModalVisible(true);
  };

  // 添加章节标记
  const handleAddMark = () => {
    if (!inputTitle.trim()) {
      Alert.alert('提示', '请输入章节标题', [{ text: '确定' }]);
      return;
    }

    const newMark: ChapterMark = {
      id: generateId(),
      title: inputTitle.trim(),
      position: currentPosition,
      order: chapterMarks.length + 1,
    };

    setChapterMarks([...chapterMarks, newMark]);
    setModalVisible(false);
    setInputTitle('');

    // 滚动到标记位置
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, currentPosition / 10), // 简单估算位置
        animated: true,
      });
    }, 100);
  };

  // 删除章节标记
  const handleDeleteMark = (markId: string) => {
    setChapterMarks(chapterMarks.filter(mark => mark.id !== markId));
  };

  // 根据标记切割章节
  const handleConfirmSplit = () => {
    if (chapterMarks.length === 0) {
      Alert.alert('提示', '请至少添加一个章节标记', [{ text: '确定' }]);
      return;
    }

    // 按位置排序章节标记
    const sortedMarks = [...chapterMarks].sort((a, b) => a.position - b.position);

    // 切割章节
    const chapters: { title: string; content: string; order: number }[] = [];

    for (let i = 0; i < sortedMarks.length; i++) {
      const mark = sortedMarks[i];
      const nextMark = sortedMarks[i + 1];

      const start = mark.position;
      const end = nextMark ? nextMark.position : content.length;

      const chapterContent = content.substring(start, end).trim();

      chapters.push({
        title: mark.title,
        content: chapterContent,
        order: i + 1,
      });
    }

    // 跳转到导入确认页面，传入切割后的章节数据
    router.push('/novel-import', {
      filename,
      content,
      chapters: JSON.stringify(chapters),
      characters: JSON.stringify(characters),
      previewMode: 'manual', // 标记为手动模式
    });
  };

  // 获取已标记的章节数量
  const markedCount = chapterMarks.length;

  return (
    <Screen style={styles.container}>
      {/* 顶部操作栏 */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {filename}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            已标记 {markedCount} 章
          </ThemedText>
        </View>

        <TouchableOpacity
          onPress={handleConfirmSplit}
          style={[styles.confirmButton, markedCount === 0 && styles.confirmButtonDisabled]}
          disabled={markedCount === 0}
        >
          <Feather name="check" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 已标记章节列表 */}
      {markedCount > 0 && (
        <View style={[styles.marksList, { backgroundColor: colors.surface }]}>
          <ThemedText style={styles.marksListTitle}>已标记章节：</ThemedText>
          <View style={styles.marksContainer}>
            {chapterMarks.map((mark) => (
              <View key={mark.id} style={[styles.markItem, { backgroundColor: colors.background }]}>
                <ThemedText style={styles.markText}>{mark.order}. {mark.title}</ThemedText>
                <TouchableOpacity onPress={() => handleDeleteMark(mark.id)}>
                  <Feather name="trash-2" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 小说内容预览 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.contentContainer}
        contentContainerStyle={styles.content}
      >
        {paragraphs.map((paragraph, index) => {
          const isMarked = hasMarkAtPosition(index);

          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleParagraphPress(index)}
              activeOpacity={0.7}
              style={[
                styles.paragraphWrapper,
                isMarked && styles.markedParagraphWrapper,
              ]}
            >
              {isMarked && (
                <View style={styles.markIndicator}>
                  <Feather name="bookmark" size={16} color="#007AFF" />
                </View>
              )}
              <ThemedText
                style={[
                  styles.paragraph,
                  isMarked && styles.markedParagraph,
                ]}
              >
                {paragraph || '\u00A0'}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 底部提示 */}
      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <ThemedText style={styles.footerText}>
          点击段落添加章节标记
        </ThemedText>
      </View>

      {/* 输入章节标题弹窗 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ThemedText style={styles.modalTitle}>添加章节标记</ThemedText>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
              value={inputTitle}
              onChangeText={setInputTitle}
              placeholder="请输入章节标题"
              placeholderTextColor={colors.text + '80'}
              autoFocus
              onSubmitEditing={handleAddMark}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText style={styles.modalButtonCancelText}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleAddMark}
              >
                <ThemedText style={styles.modalButtonConfirmText}>确定</ThemedText>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  confirmButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  marksList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  marksListTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  marksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  markItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  markText: {
    fontSize: 13,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  paragraphWrapper: {
    marginBottom: 12,
    position: 'relative',
  },
  markedParagraphWrapper: {
    marginLeft: 24,
  },
  markIndicator: {
    position: 'absolute',
    left: -24,
    top: 2,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
  },
  markedParagraph: {
    color: '#007AFF',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  modalButtonConfirm: {
    backgroundColor: '#007AFF',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
