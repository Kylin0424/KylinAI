import React, { useState, useEffect } from 'react';
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
  const [currentChapterContent, setCurrentChapterContent] = useState('');
  const [currentChapterOrder, setCurrentChapterOrder] = useState(1);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // 小说和角色状态
  const [novelId, setNovelId] = useState<string | null>(null);
  const [characterIdMap, setCharacterIdMap] = useState<Record<string, string>>({});

  // 初始化：在开头放置定位符
  useEffect(() => {
    if (fullContent) {
      setCurrentChapterContent(fullContent);
      setCurrentPosition(0);
    }
  }, [fullContent]);

  // 添加定位符并保存上一章
  const handleAddMarker = () => {
    if (!inputTitle.trim()) {
      Alert.alert('提示', '请输入章节标题', [{ text: '确定' }]);
      return;
    }

    // 计算上一章的内容（从当前位置到用户点击的位置）
    // 由于我们无法精确知道用户点击的位置，这里简化处理：
    // 假设用户已经阅读了currentChapterContent，我们将整个currentChapterContent保存为一章

    const newChapter: SavedChapter = {
      id: generateId(),
      title: inputTitle.trim(),
      content: currentChapterContent,
      order: currentChapterOrder,
    };

    // 添加到已保存章节列表
    setSavedChapters([...savedChapters, newChapter]);

    // 准备下一章
    setCurrentChapterOrder(currentChapterOrder + 1);
    setCurrentChapterContent(''); // 下一章内容为空，需要用户提供
    setCurrentPosition(0);
    setModalVisible(false);
    setInputTitle('');
  };

  // 完成章节定位，开始导入
  const handleFinish = async () => {
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
      backgroundColor: theme.surface,
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
    contentContainer: {
      flex: 1,
      padding: 16,
    },
    chapterInfo: {
      marginBottom: 16,
    },
    chapterTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
      marginBottom: 8,
    },
    chapterContent: {
      fontSize: 14,
      lineHeight: 24,
      color: theme.textSecondary,
      maxHeight: 400,
    },
    savedChaptersList: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.surface,
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
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      backgroundColor: '#C8102E',
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
      marginLeft: 8,
    },
    secondaryButton: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
  },
  secondaryButtonText: {
    color: theme.textPrimary,
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
    backgroundColor: theme.surface,
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
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
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

      <ScrollView style={{ flex: 1 }}>
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

        {/* 当前章节内容 */}
        <View style={styles.contentContainer}>
          <View style={styles.chapterInfo}>
            <ThemedText style={styles.chapterTitle}>
              第{currentChapterOrder}章
            </ThemedText>
            <ThemedText style={styles.chapterContent}>
              {currentChapterContent || '暂无内容'}
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* 底部操作按钮 */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => setModalVisible(true)}
          disabled={isSaving || isFinished}
        >
          <Feather name="bookmark" size={18} color={theme.textPrimary} />
          <ThemedText style={[styles.actionButtonText, styles.secondaryButtonText]}>
            标记此章
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleFinish}
          disabled={savedChapters.length === 0 || isSaving || isFinished}
        >
          {isSaving ? (
            <Feather name="loader" size={18} color="#FFFFFF" />
          ) : (
            <Feather name="check" size={18} color="#FFFFFF" />
          )}
          <ThemedText style={styles.actionButtonText}>
            {isSaving ? '导入中...' : '完成导入'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* 章节标题输入弹窗 */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>输入章节标题</ThemedText>
            <TextInput
              style={styles.input}
              value={inputTitle}
              onChangeText={setInputTitle}
              placeholder={`第${currentChapterOrder}章`}
              placeholderTextColor={theme.textMuted}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setInputTitle('');
                }}
              >
                <ThemedText style={[styles.modalButtonText, styles.modalCancelButtonText]}>
                  取消
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleAddMarker}
              >
                <ThemedText style={[styles.modalButtonText, styles.modalConfirmButtonText]}>
                  确认
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
