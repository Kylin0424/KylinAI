import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Character, generateId, saveCharacter, addRelationToNetwork } from '@/utils/characterStorage';
import { Novel, createNovel, saveNovel, addChapter, updateChapter } from '@/utils/novelStorage';

const { width } = Dimensions.get('window');

interface SavedChapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface MarkerPosition {
  index: number;
  text: string;
}

export default function NovelPreview() {
  const { theme } = useThemeContext();
  const router = useSafeRouter();
  const params = useSafeSearchParams<{
    filename: string;
    content: string;
    characters?: string;
    title?: string;
    themeType?: string;
  }>();

  // 从路由参数获取数据
  const filename = params.filename || '';
  const fullContent = params.content || '';
  const characters = params.characters ? JSON.parse(params.characters) : [];
  const novelTitle = params.title || filename;
  const themeType = params.themeType || '未分类';

  // 状态管理
  const [savedChapters, setSavedChapters] = useState<SavedChapter[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // 搜索和导航状态
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<MarkerPosition[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showInsertHint, setShowInsertHint] = useState(false);
  const [insertPosition, setInsertPosition] = useState<MarkerPosition | null>(null);

  // ScrollView引用
  const scrollViewRef = useRef<ScrollView>(null);

  // 小说和角色状态
  const [novelId, setNovelId] = useState<string | null>(null);
  const [characterIdMap, setCharacterIdMap] = useState<Record<string, string>>({});

  // 计算未保存的起始位置
  const lastSavedPosition = savedChapters.reduce((total, chapter) => total + chapter.content.length, 0);

  // 计算当前可预览的章节内容（已保存章节 + 未保存部分）
  const previewChapters = [
    ...savedChapters,
    {
      id: 'current',
      title: `第${savedChapters.length + 1}章（未保存）`,
      content: fullContent.substring(lastSavedPosition),
      order: savedChapters.length + 1,
    },
  ].filter(ch => ch.content.length > 0);

  // 执行搜索
  const performSearch = (text: string) => {
    if (!text.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const results: MarkerPosition[] = [];
    let index = 0;

    while (true) {
      const foundIndex = fullContent.indexOf(text, index);
      if (foundIndex === -1) break;

      // 获取匹配位置的文本上下文
      const contextStart = Math.max(0, foundIndex - 20);
      const contextEnd = Math.min(fullContent.length, foundIndex + text.length + 20);
      const contextText = fullContent.substring(contextStart, contextEnd);

      results.push({
        index: foundIndex,
        text: contextText,
      });

      index = foundIndex + text.length;
    }

    setSearchResults(results);
    setCurrentSearchIndex(0);

    if (results.length > 0) {
      // 自动滚动到第一个搜索结果
      scrollToPosition(results[0].index);
    }
  };

  // 滚动到指定位置
  const scrollToPosition = (position: number) => {
    // 估算滚动位置（每个字符约2像素高度，简化计算）
    const scrollPosition = Math.max(0, position * 0.5);
    scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: true });
  };

  // 上一章
  const handlePreviousChapter = () => {
    if (currentSearchIndex > 0) {
      const newIndex = currentSearchIndex - 1;
      setCurrentSearchIndex(newIndex);
      scrollToPosition(searchResults[newIndex].index);
    } else {
      Alert.alert('提示', '已经是第一个搜索结果');
    }
  };

  // 下一章
  const handleNextChapter = () => {
    if (currentSearchIndex < searchResults.length - 1) {
      const newIndex = currentSearchIndex + 1;
      setCurrentSearchIndex(newIndex);
      scrollToPosition(searchResults[newIndex].index);
    } else {
      Alert.alert('提示', '已经是最后一个搜索结果');
    }
  };

  // 插入分隔符
  const handleInsertMarker = () => {
    if (!searchText.trim()) {
      Alert.alert('提示', '请先输入要搜索的章节标题');
      return;
    }

    // 使用当前搜索位置作为分隔符位置
    if (searchResults.length > 0 && currentSearchIndex < searchResults.length) {
      const markerPos = searchResults[currentSearchIndex];

      setInsertPosition(markerPos);
      setShowInsertHint(true);
      setModalVisible(true);

      // 滚动到分隔符位置
      scrollToPosition(markerPos.index);
    } else {
      Alert.alert('提示', '请先搜索并选择要插入的位置');
    }
  };

  // 添加定位符并保存章节
  const handleAddMarker = () => {
    if (!inputTitle.trim()) {
      Alert.alert('提示', '请输入章节标题', [{ text: '确定' }]);
      return;
    }

    if (!insertPosition) {
      Alert.alert('提示', '插入位置无效');
      return;
    }

    // 计算上一章的内容（从lastSavedPosition到insertPosition）
    const previousContent = fullContent.substring(lastSavedPosition, insertPosition.index);

    if (previousContent.length < 10) {
      Alert.alert('提示', '章节内容太少，请选择一个更合适的位置');
      return;
    }

    const newChapter: SavedChapter = {
      id: generateId(),
      title: inputTitle.trim(),
      content: previousContent,
      order: savedChapters.length + 1,
    };

    // 添加到已保存章节列表
    setSavedChapters([...savedChapters, newChapter]);

    // 清理状态
    setModalVisible(false);
    setInputTitle('');
    setShowInsertHint(false);
    setInsertPosition(null);
    setSearchText('');
    setSearchResults([]);
    setCurrentSearchIndex(0);

    Alert.alert('成功', `已添加第${newChapter.order}章：${newChapter.title}`);
  };

  // 完成章节定位，开始导入
  const handleFinish = async () => {
    if (savedChapters.length === 0) {
      Alert.alert('提示', '请至少保存一个章节');
      return;
    }

    setIsSaving(true);

    try {
      // 1. 创建小说
      const novel = await createNovel(
        novelTitle,
        themeType,
        themeType.toLowerCase(),
        undefined,
        undefined,
        true // 标记为导入小说
      );
      setNovelId(novel.id);

      // 2. 保存所有角色
      const charIdMap: Record<string, string> = {};
      for (const char of characters) {
        let roleType: 'male_lead' | 'female_lead' | 'npc' | undefined = undefined;
        if (char.roleType === '男主' || char.roleType === '主角') {
          roleType = 'male_lead';
        } else if (char.roleType === '女主') {
          roleType = 'female_lead';
        } else if (char.roleType === '配角' || char.roleType === '反派') {
          roleType = 'npc';
        }

        const newCharacter: Character = {
          id: generateId(),
          name: char.name,
          gender: char.gender || '未知',
          age: char.age || 25,
          height: char.height || '未知',
          occupation: char.occupation || '未知',
          education: char.education || '未知',
          personality: char.personality || '',
          experience: char.experience || '',
          familyBackground: char.familyBackground || '',
          appearance: char.appearance || '',
          specialTraits: char.specialTraits || '',
          avatarUrl: char.avatarUrl,
          novelId: novel.id,
          roleType: roleType,
          isTemporary: false,
          createdAt: Date.now(),
        };

        await saveCharacter(newCharacter);
        charIdMap[char.name] = newCharacter.id;

        // 更新男女主角ID
        if (roleType === 'male_lead') {
          novel.maleCharacterId = newCharacter.id;
        } else if (roleType === 'female_lead') {
          novel.femaleCharacterId = newCharacter.id;
        }
      }
      setCharacterIdMap(charIdMap);

      // 保存男女主角ID到小说
      if (novel.maleCharacterId || novel.femaleCharacterId) {
        await saveNovel(novel);
      }

      // 3. 保存角色关系
      for (const char of characters) {
        if (char.relationships && char.relationships.length > 0) {
          const sourceId = charIdMap[char.name];
          if (!sourceId) continue;

          for (const rel of char.relationships) {
            const targetId = charIdMap[rel.targetName];
            if (!targetId) continue;

            await addRelationToNetwork(
              novel.id,
              sourceId,
              char.name,
              char.gender,
              targetId,
              rel.targetName,
              '',
              rel.relationType,
              undefined
            );
          }
        }
      }

      // 4. 保存所有章节
      for (let i = 0; i < savedChapters.length; i++) {
        const chapter = savedChapters[i];
        const newChapter = await addChapter(novel.id, chapter.title, false, chapter.order);

        // 在最后一章末尾添加作者更换声明
        let chapterContent = chapter.content;
        if (i === savedChapters.length - 1) {
          const authorNote = '\n\n---\n\n【本书作者已更换】\n尊敬的读者，原作品至此章节完结。后续内容将由新作者续写，风格可能有所变化，敬请理解。感谢您对原作者的尊重和对本续作的支持。';
          chapterContent = chapter.content + authorNote;
        }

        await updateChapter(novel.id, newChapter.id, {
          content: chapterContent,
        });
      }

      setIsSaving(false);
      setIsFinished(true);

      // 显示成功弹窗
      Alert.alert(
        '导入成功',
        `已导入小说《${novelTitle}》\n共识别 ${characters.length} 个角色，${savedChapters.length} 个章节`,
        [
          {
            text: '返回首页',
            onPress: () => router.replace('/home'),
          },
          {
            text: '开始创作',
            onPress: () => router.replace('/novel-writing', { novelId: novel.id }),
          },
        ]
      );

    } catch (error) {
      setIsSaving(false);
      Alert.alert('错误', `导入失败: ${error instanceof Error ? error.message : '请重试'}`);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.backgroundDefault,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    scrollContainer: {
      flex: 1,
      marginBottom: 180, // 为底部搜索区域留出空间
    },
    savedChaptersList: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.backgroundDefault,
      marginBottom: 8,
    },
    savedChaptersTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: 8,
    },
    savedChapterItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    savedChapterTitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    chapterSection: {
      marginBottom: 32,
    },
    chapterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      backgroundColor: '#FFF5F5',
      borderRadius: 8,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    chapterHeaderText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#C8102E',
      flex: 1,
    },
    chapterContent: {
      fontSize: 14,
      lineHeight: 24,
      color: theme.textSecondary,
    },
    insertHint: {
      backgroundColor: 'rgba(200, 16, 46, 0.1)',
      borderLeftWidth: 3,
      borderLeftColor: '#C8102E',
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    insertHintText: {
      fontSize: 12,
      color: '#C8102E',
    },
    bottomSearchArea: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.backgroundDefault,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    },
    searchInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.textPrimary,
      backgroundColor: theme.backgroundRoot,
    },
    searchResultInfo: {
      fontSize: 12,
      color: theme.textMuted,
    },
    navButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    navButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      backgroundColor: '#C8102E',
      borderRadius: 8,
    },
    navButtonDisabled: {
      backgroundColor: '#E5E5E5',
    },
    navButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
    },
    secondaryButton: {
      backgroundColor: theme.backgroundDefault,
      borderWidth: 1,
      borderColor: theme.border,
    },
    secondaryButtonText: {
      color: theme.textPrimary,
    },
    primaryButton: {
      backgroundColor: '#C8102E',
    },
    primaryButtonText: {
      color: '#FFFFFF',
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: 12,
      padding: 20,
      width: '100%',
      maxWidth: 320,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: 16,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.textPrimary,
      marginBottom: 16,
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
    modalCancelButton: {
      backgroundColor: theme.backgroundDefault,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalConfirmButton: {
      backgroundColor: '#C8102E',
    },
    modalButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    modalCancelButtonText: {
      color: theme.textPrimary,
    },
    modalConfirmButtonText: {
      color: '#FFFFFF',
    },
  });

  return (
    <Screen style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerLeft}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
          <Text style={{ marginLeft: 8, fontSize: 14, color: theme.textPrimary }}>返回</Text>
        </TouchableOpacity>
        <View>
          <ThemedText style={styles.headerTitle}>{novelTitle}</ThemedText>
          <ThemedText style={styles.headerSubtitle}>已保存 {savedChapters.length} 章</ThemedText>
        </View>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
        {/* 已保存章节列表 */}
        {savedChapters.length > 0 && (
          <View style={styles.savedChaptersList}>
            <ThemedText style={styles.savedChaptersTitle}>已保存章节：</ThemedText>
            {savedChapters.map((chapter) => (
              <View key={chapter.id} style={styles.savedChapterItem}>
                <ThemedText style={styles.savedChapterTitle}>
                  第{chapter.order}章：{chapter.title}
                </ThemedText>
                <Feather name="check-circle" size={16} color="#10B981" />
              </View>
            ))}
          </View>
        )}

        {/* 章节内容预览 */}
        <View style={styles.contentContainer}>
          {previewChapters.map((chapter, index) => (
            <View key={chapter.id} style={styles.chapterSection}>
              <View style={styles.chapterHeader}>
                <Feather name="book-open" size={18} color="#C8102E" style={{ marginRight: 8 }} />
                <Text style={styles.chapterHeaderText}>
                  {chapter.title}
                </Text>
              </View>
              <Text style={styles.chapterContent}>
                {chapter.content}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 底部搜索和操作区域 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.bottomSearchArea}
      >
        {/* 搜索输入 */}
        <View style={styles.searchInputRow}>
          <View style={{ flex: 1 }}>
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="输入章节标题搜索..."
              placeholderTextColor={theme.textMuted}
              returnKeyType="search"
              onSubmitEditing={() => performSearch(searchText)}
            />
          </View>
        </View>

        {/* 搜索结果和导航 */}
        {searchResults.length > 0 && (
          <>
            <View style={styles.searchResultInfo}>
              <Text>找到 {searchResults.length} 个结果，当前第 {currentSearchIndex + 1} 个</Text>
            </View>
            <View style={styles.navButtons}>
              <TouchableOpacity
                style={[styles.navButton, currentSearchIndex === 0 && styles.navButtonDisabled]}
                onPress={handlePreviousChapter}
                disabled={currentSearchIndex === 0}
              >
                <Feather name="arrow-up" size={16} color={currentSearchIndex === 0 ? '#999' : '#FFFFFF'} />
                <Text style={[styles.navButtonText, currentSearchIndex === 0 && { color: '#999' }]}>
                  上一章
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, currentSearchIndex === searchResults.length - 1 && styles.navButtonDisabled]}
                onPress={handleNextChapter}
                disabled={currentSearchIndex === searchResults.length - 1}
              >
                <Feather name="arrow-down" size={16} color={currentSearchIndex === searchResults.length - 1 ? '#999' : '#FFFFFF'} />
                <Text style={[styles.navButtonText, currentSearchIndex === searchResults.length - 1 && { color: '#999' }]}>
                  下一章
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* 操作按钮 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleInsertMarker}
            disabled={searchResults.length === 0 || isSaving || isFinished}
          >
            <Feather name="bookmark" size={18} color={searchResults.length === 0 ? '#999' : theme.textPrimary} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              插入分隔符
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleFinish}
            disabled={savedChapters.length === 0 || isSaving || isFinished}
          >
            {isSaving ? (
              <Feather name="loader" size={18} color="#FFFFFF" />
            ) : (
              <Feather name="check" size={18} color="#FFFFFF" />
            )}
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {isSaving ? '导入中...' : '完成导入'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 章节标题输入弹窗 */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>输入章节标题</Text>
            <TextInput
              style={styles.input}
              value={inputTitle}
              onChangeText={setInputTitle}
              placeholder={`第${savedChapters.length + 1}章`}
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setInputTitle('');
                  setShowInsertHint(false);
                  setInsertPosition(null);
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalCancelButtonText]}>
                  取消
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleAddMarker}
              >
                <Text style={[styles.modalButtonText, styles.modalConfirmButtonText]}>
                  确认
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
