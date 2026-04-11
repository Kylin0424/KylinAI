import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// 获取文档目录
const getDocumentDirectory = (): string => {
  try {
    return Paths.document?.uri || '';
  } catch {
    return '';
  }
};
import { useThemeContext } from '@/contexts/ThemeContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useFocusEffect } from 'expo-router';
import { createStyles } from './styles';
import { FloatingBall } from '@/components/FloatingBall';
import {
  Character,
  getAvailableCharactersByGender,
  getCharacterById,
  linkCharacterToNovel,
} from '@/utils/characterStorage';
import {
  Novel,
  getAllNovels,
  getWritingNovels,
  createNovel,
  deleteNovel,
  getNovelById,
} from '@/utils/novelStorage';
import {
  DraftNovel,
  getAllDrafts,
  addToDraft,
  deleteFromDraft,
  restoreFromDraft,
} from '@/utils/draftStorage';
import { NOVEL_THEME_TYPES } from '@/constants/occupations';

// 临时使用线上地址测试
const EXPO_PUBLIC_BACKEND_BASE_URL = 'http://localhost:9091';

export default function HomeScreen() {
  const { theme, isDark } = useThemeContext();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const swipeableRef = useRef<Swipeable | null>(null);

  // 小说标题
  const [novelTitle, setNovelTitle] = useState('');

  // 角色选择状态
  const [maleCharacter, setMaleCharacter] = useState<Character | null>(null);
  const [femaleCharacter, setFemaleCharacter] = useState<Character | null>(null);
  const [activeGenderTab, setActiveGenderTab] = useState<'male' | 'female'>('male');

  // 小说主题选择
  const [selectedThemeType, setSelectedThemeType] = useState<string | null>(null);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // 角色选择弹窗
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);

  // 正在写作的小说
  const [writingNovels, setWritingNovels] = useState<Novel[]>([]);
  const [draftNovels, setDraftNovels] = useState<DraftNovel[]>([]);

  // 生成中状态
  const [isGenerating, setIsGenerating] = useState(false);

  // 剧本生成弹窗
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [selectedNovelForScript, setSelectedNovelForScript] = useState<Novel | null>(null);
  const [selectedChapterForScript, setSelectedChapterForScript] = useState<number>(0);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // 删除确认弹窗
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [novelToDelete, setNovelToDelete] = useState<Novel | null>(null);
  const [moveToDraft, setMoveToDraft] = useState(true);

  // 导出格式选择弹窗
  const [showExportModal, setShowExportModal] = useState(false);
  const [novelToExport, setNovelToExport] = useState<Novel | null>(null);

  // 草稿箱弹窗
  const [showDraftModal, setShowDraftModal] = useState(false);

  // 设置弹窗
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // 世界背景设定弹窗
  const [showWorldSettingModal, setShowWorldSettingModal] = useState(false);
  const [worldName, setWorldName] = useState('');
  const [eraBackground, setEraBackground] = useState('');
  const [seasonSetting, setSeasonSetting] = useState('');
  const [region, setRegion] = useState(''); // 所处地域
  const [provinceInput, setProvinceInput] = useState(''); // 省份输入
  const [cityInput, setCityInput] = useState(''); // 城市输入
  const [districtInput, setDistrictInput] = useState(''); // 区县输入
  const [protagonistDoing, setProtagonistDoing] = useState(''); // 主角正在做什么
  const [isCreatingNovel, setIsCreatingNovel] = useState(false);

  // 写作设置
  const [settings, setSettings] = useState({
    autoSave: true,
    autoSaveInterval: 1000,
    fontSize: 16,
    lineHeight: 26,
    fontFamily: '默认字体',
    darkMode: false,
  });

  // 加载数据
  const loadData = useCallback(async () => {
    const novels = await getWritingNovels();
    setWritingNovels(novels);
    const drafts = await getAllDrafts();
    setDraftNovels(drafts);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // 打开角色选择弹窗
  const handleOpenCharacterModal = async (genderTab: 'male' | 'female') => {
    setActiveGenderTab(genderTab);
    const gender = genderTab === 'male' ? '男' : '女';
    const chars = await getAvailableCharactersByGender(gender);
    setAvailableCharacters(chars);
    setShowCharacterModal(true);
  };

  // 选择角色
  const handleSelectCharacter = (character: Character) => {
    if (activeGenderTab === 'male') {
      if (femaleCharacter?.id === character.id) {
        setFemaleCharacter(null);
      }
      setMaleCharacter(character);
    } else {
      if (maleCharacter?.id === character.id) {
        setMaleCharacter(null);
      }
      setFemaleCharacter(character);
    }
    setShowCharacterModal(false);
  };

  // 清除角色选择
  const handleClearCharacter = (gender: 'male' | 'female') => {
    if (gender === 'male') {
      setMaleCharacter(null);
    } else {
      setFemaleCharacter(null);
    }
  };

  // 查看角色详情
  const handleViewCharacterDetail = (characterId: string) => {
    setShowCharacterModal(false);
    router.push('/character-detail', { characterId });
  };

  // 开始创作 - 打开世界背景设定弹窗
  const handleGenerate = () => {
    if (!novelTitle.trim()) {
      Alert.alert('提示', '请输入小说标题');
      return;
    }
    setShowWorldSettingModal(true);
  };

  // 确认世界背景设定并创建小说
  const handleConfirmWorldSetting = async () => {
    if (!worldName.trim()) {
      Alert.alert('提示', '请输入世界名字');
      return;
    }

    setIsCreatingNovel(true);

    try {
      const novel = await createNovel(
        novelTitle.trim(),
        selectedThemeType || '都市',
        selectedThemeType || 'urban',
        maleCharacter?.id,
        femaleCharacter?.id
      );

      // 锁定选中的角色到当前小说
      if (maleCharacter?.id) {
        await linkCharacterToNovel(maleCharacter.id, novel.id, 'male_lead');
      }
      if (femaleCharacter?.id) {
        await linkCharacterToNovel(femaleCharacter.id, novel.id, 'female_lead');
      }

      // 关闭世界设定弹窗
      setShowWorldSettingModal(false);
      
      // 清空输入
      setNovelTitle('');
      setWorldName('');
      setEraBackground('');
      setSeasonSetting('');
      setProtagonistDoing('');
      setMaleCharacter(null);
      setFemaleCharacter(null);
      setSelectedThemeType(null);
      setRegion('');
      setProvinceInput('');
      setCityInput('');
      setDistrictInput('');

      // 跳转到小说创作页面，传递世界设定信息
      router.push('/novel-writing', { 
        novelId: novel.id,
        worldName: worldName.trim(),
        eraBackground: eraBackground.trim() || '现代社会',
        seasonSetting: seasonSetting.trim() || '春季',
        protagonistDoing: protagonistDoing.trim(),
        region: region.trim(),
        cityLocation: `${provinceInput.trim()}${cityInput.trim()}${districtInput.trim()}`,
        autoGeneratePrologue: 'true'
      });
    } catch (error) {
      console.error('Error creating novel:', error);
      Alert.alert('错误', '创建小说失败，请重试');
    } finally {
      setIsCreatingNovel(false);
    }
  };

  // 续写小说
  const handleContinueWriting = (novel: Novel) => {
    router.push('/novel-writing', { novelId: novel.id });
  };

  // 导出小说为TXT
  const handleExportNovel = async (novel: Novel) => {
    try {
      const fullNovel = await getNovelById(novel.id);
      if (!fullNovel) {
        Alert.alert('错误', '小说不存在');
        return;
      }

      // 移除格式标记符号的函数
      const removeFormatMarks = (text: string): string => {
        return text
          .replace(/\*\*(.+?)\*\*/g, '$1')  // 移除加粗标记
          .replace(/\*(.+?)\*/g, '$1')        // 移除斜体标记
          .replace(/__(.+?)__/g, '$1')        // 移除下划线标记
          .replace(/~~(.+?)~~/g, '$1')        // 移除删除线标记
          .replace(/==(.+?)==/g, '$1');       // 移除标记线标记
      };

      // 构建TXT内容
      let txtContent = `${fullNovel.title}\n`;
      txtContent += `${'='.repeat(40)}\n\n`;
      
      if (fullNovel.chapters.length > 0) {
        fullNovel.chapters.forEach((chapter, index) => {
          const chapterTitle = chapter.isPrologue ? '楔子' : `第${index + 1}章 ${chapter.title}`;
          txtContent += `${chapterTitle}\n\n`;
          // 添加章节内容，移除格式标记
          if (chapter.content) {
            txtContent += removeFormatMarks(chapter.content) + '\n\n';
          }
        });
      }
      
      txtContent += `${'='.repeat(40)}\n`;
      txtContent += `创作时间: ${new Date(fullNovel.createdAt).toLocaleDateString()}\n`;
      txtContent += `由"齐思秒说"生成\n`;

      // 创建文件并分享
      const docDir = getDocumentDirectory();
      const fileUri = `${docDir}${fullNovel.title}.txt`;
      await (FileSystem as any).writeAsStringAsync(fileUri, txtContent, { encoding: 'utf8' });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: '导出小说',
          UTI: 'public.plain-text',
        });
      } else {
        Alert.alert('成功', '小说已导出');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('错误', '导出失败，请重试');
    }
  };

  // 导出小说为Word文档（保留格式）
  const handleExportNovelAsDocx = async (novel: Novel) => {
    try {
      const fullNovel = await getNovelById(novel.id);
      if (!fullNovel) {
        Alert.alert('错误', '小说不存在');
        return;
      }

      setIsCreatingNovel(true);

      /**
       * 服务端文件：server/src/routes/novel.ts
       * 接口：POST /api/v1/novel/export-docx
       * Body 参数：title: string, chapters: array, author?: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/novel/export-docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fullNovel.title,
          chapters: fullNovel.chapters,
          author: '齐思秒说',
        }),
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      // 获取二进制数据
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      // 保存文件
      const docDir = getDocumentDirectory();
      const fileUri = `${docDir}${fullNovel.title}.docx`;
      await (FileSystem as any).writeAsStringAsync(fileUri, base64, { encoding: 'base64' });

      setIsCreatingNovel(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          dialogTitle: '导出Word文档',
          UTI: 'org.openxmlformats.wordprocessingml.document',
        });
      } else {
        Alert.alert('成功', 'Word文档已导出');
      }
    } catch (error) {
      console.error('Export DOCX error:', error);
      setIsCreatingNovel(false);
      Alert.alert('错误', '导出Word文档失败，请重试');
    }
  };

  // 打开剧本生成弹窗
  const handleOpenScriptModal = (novel: Novel) => {
    setSelectedNovelForScript(novel);
    setSelectedChapterForScript(0);
    setShowScriptModal(true);
  };

  // 生成剧本
  const handleGenerateScript = async () => {
    if (!selectedNovelForScript) return;

    setIsGeneratingScript(true);

    try {
      const fullNovel = await getNovelById(selectedNovelForScript.id);
      if (!fullNovel) {
        Alert.alert('错误', '小说不存在，请重新选择');
        return;
      }

      const chapter = fullNovel.chapters[selectedChapterForScript];
      if (!chapter) {
        Alert.alert('错误', '章节不存在，请重新选择');
        return;
      }

      // 检查章节内容是否为空
      if (!chapter.content || chapter.content.trim().length < 50) {
        Alert.alert(
          '提示', 
          '当前章节内容过少或为空，无法生成剧本。\n\n请先在创作页面为该章节添加内容后再试。',
          [{ text: '知道了' }]
        );
        return;
      }

      // 加载角色信息
      let maleCharInfo = '';
      let femaleCharInfo = '';
      
      if (fullNovel.maleCharacterId) {
        const male = await getCharacterById(fullNovel.maleCharacterId);
        if (male) {
          maleCharInfo = `【男主角】
姓名：${male.name}
职业：${male.occupation}
年龄：${male.age}岁
外貌：${male.appearance || '未设定'}
性格：${male.personality || '未设定'}
说话风格：${male.specialTraits || '未设定'}`;
        }
      }
      
      if (fullNovel.femaleCharacterId) {
        const female = await getCharacterById(fullNovel.femaleCharacterId);
        if (female) {
          femaleCharInfo = `【女主角】
姓名：${female.name}
职业：${female.occupation}
年龄：${female.age}岁
外貌：${female.appearance || '未设定'}
性格：${female.personality || '未设定'}
说话风格：${female.specialTraits || '未设定'}`;
        }
      }

      const prompt = `请将以下小说章节内容改编为专业短剧剧本。

═══════════════════════════════════════
【小说信息】
标题：${fullNovel.title}
章节：第${selectedChapterForScript + 1}章 ${chapter.title}

═══════════════════════════════════════
【角色设定】
${maleCharInfo}
${femaleCharInfo}

═══════════════════════════════════════
【章节内容】
${chapter.content || '（暂无章节内容，请根据标题自由创作）'}

═══════════════════════════════════════
【剧本格式要求】

请严格按照以下格式输出剧本，每个场景都要详细描述：

【场景】详细描述场景的物理空间
- 必须包含：空间大小、布局、光线明暗、温度感知、气味氛围
- 物理特性：阳光角度、物体质感、声音传播特点
- 氛围暗示：通过环境细节暗示情绪基调

【时间】具体时间点（如：清晨6点、正午12点、深夜11点）

【人物】本场出场人物列表

【画面】使用专业镜头语言
- 示例：镜头从窗外缓缓推入、特写主角颤抖的手、全景展示空旷的房间
- 包含构图、景别、运镜方式

【音效】环境音和特效音
- 示例：钟表滴答声、远处警笛声、心跳加速声

（人物动作）
- 动作必须细致、合理、符合物理特性
- 示例：（缓缓抬起右手，指尖微微颤抖，玻璃杯从指间滑落，碎片四溅）

人物名：台词
- 台词要符合人物性格和说话风格
- 每句话要有情绪暗示
- 示例：李明：（压低声音，带着一丝沙哑）我等了这一天，等了整整十年。

---
【场景转换标记】

═══════════════════════════════════════
【创作要求】

1. 场景描述要细致入微，让读者能"看到"、"听到"、"感受到"
2. 人物动作要符合性格，每个动作都有目的性
3. 对话要简洁有力，适合短视频节奏（每句不超过30字为宜）
4. 情绪变化要有层次，通过动作和细节展现
5. 镜头语言要专业，画面感要强

请生成完整的剧本，至少包含3-5个场景转换。`;

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/novel/script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          title: fullNovel.title,
          chapterTitle: chapter.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `服务器错误(${response.status})`;
        throw new Error(`剧本生成失败：${errorMessage}`);
      }

      const data = await response.json();
      
      if (!data.content) {
        throw new Error('剧本生成失败：AI返回内容为空，请重试');
      }
      
      // 调用后端API生成Word文档
      /**
       * 服务端文件：server/src/routes/novel.ts
       * 接口：POST /api/v1/novel/export-script-docx
       * Body 参数：title: string, chapterTitle: string, content: string
       */
      const docxResponse = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/novel/export-script-docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fullNovel.title,
          chapterTitle: `第${selectedChapterForScript + 1}章 ${chapter.title}`,
          content: data.content,
        }),
      });

      if (!docxResponse.ok) {
        const errorData = await docxResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || `服务器错误(${docxResponse.status})`;
        throw new Error(`Word文档导出失败：${errorMessage}`);
      }

      // 获取二进制数据 - React Native 中直接使用 arrayBuffer()
      const arrayBuffer = await docxResponse.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // 转换为 base64
      let base64 = '';
      for (let i = 0; i < uint8Array.length; i++) {
        base64 += String.fromCharCode(uint8Array[i]);
      }
      base64 = btoa(base64);

      // 保存文件 - 使用安全的文件名（移除特殊字符）
      const safeTitle = fullNovel.title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '_');
      const docDir = getDocumentDirectory();
      const fileUri = `${docDir}${safeTitle}_第${selectedChapterForScript + 1}章_剧本.docx`;
      await (FileSystem as any).writeAsStringAsync(fileUri, base64, { encoding: 'base64' });
      
      setShowScriptModal(false);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          dialogTitle: '导出剧本',
          UTI: 'org.openxmlformats.wordprocessingml.document',
        });
      } else {
        Alert.alert('成功', '剧本已生成');
      }
    } catch (error) {
      console.error('Script generation error:', error);
      
      // 分析错误类型，给用户友好的提示
      let userMessage = '请稍后重试';
      let suggestion = '';
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('timeout')) {
          userMessage = '网络连接失败';
          suggestion = '请检查网络连接后重试';
        } else if (errorMsg.includes('arraybuffer') || errorMsg.includes('blob')) {
          userMessage = '文件下载失败';
          suggestion = '请检查网络稳定性后重试';
        } else if (errorMsg.includes('ai返回内容为空')) {
          userMessage = 'AI生成失败';
          suggestion = '请重试，或检查章节内容是否完整';
        } else if (errorMsg.includes('服务器错误')) {
          userMessage = '服务器暂时繁忙';
          suggestion = '请稍后重试';
        } else if (errorMsg.includes('章节内容过少')) {
          userMessage = '章节内容不足';
          suggestion = '请先为该章节添加更多内容';
        }
      }
      
      Alert.alert(
        '剧本生成失败', 
        `${userMessage}\n\n${suggestion || '如问题持续，请联系客服'}`,
        [{ text: '我知道了' }]
      );
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // 打开删除确认弹窗
  const handleOpenDeleteModal = (novel: Novel) => {
    setNovelToDelete(novel);
    setMoveToDraft(true);
    setShowDeleteModal(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!novelToDelete) return;

    try {
      if (moveToDraft) {
        // 移动到草稿箱
        await addToDraft(novelToDelete);
      }
      // 删除原小说
      await deleteNovel(novelToDelete.id);
      
      setShowDeleteModal(false);
      setNovelToDelete(null);
      loadData();
      
      Alert.alert('成功', moveToDraft ? '已移至草稿箱' : '已彻底删除');
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('错误', '删除失败，请重试');
    }
  };

  // 从草稿箱恢复
  const handleRestoreDraft = async (draft: DraftNovel) => {
    try {
      // 这里需要重新创建小说，因为已经删除了
      // 简化处理：创建新小说
      const newNovel = await createNovel(
        draft.title,
        draft.themeType || '都市',
        draft.themeName || 'urban',
        draft.maleCharacterId,
        draft.femaleCharacterId
      );
      
      // 删除草稿
      await deleteFromDraft(draft.id);
      
      setShowDraftModal(false);
      loadData();
      
      Alert.alert('成功', '小说已恢复');
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('错误', '恢复失败，请重试');
    }
  };

  // 彻底删除草稿
  const handleDeleteDraft = async (draft: DraftNovel) => {
    Alert.alert(
      '确认删除',
      `确定要彻底删除"${draft.title}"吗？此操作不可恢复。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '彻底删除',
          style: 'destructive',
          onPress: async () => {
            await deleteFromDraft(draft.id);
            loadData();
          },
        },
      ]
    );
  };

  // 渲染小说左滑操作按钮（只显示图标）
  const renderRightActions = (novel: Novel) => {
    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, styles.exportAction]}
          onPress={() => {
            setNovelToExport(novel);
            setShowExportModal(true);
          }}
        >
          <Feather name="download" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeAction, styles.scriptAction]}
          onPress={() => handleOpenScriptModal(novel)}
        >
          <Feather name="film" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => handleOpenDeleteModal(novel)}
        >
          <Feather name="trash-2" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  // 渲染正在写作的小说项
  const renderWritingNovel = ({ item }: { item: Novel }) => {
    return (
      <Swipeable
        ref={(ref) => { swipeableRef.current = ref; }}
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
        friction={2}
      >
        <View style={styles.novelItem}>
          <View style={styles.novelInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ThemedText variant="small" color={theme.textPrimary} style={styles.novelTitleText}>
                {item.title}
              </ThemedText>
              {item.isImported && (
                <View style={styles.importedBadge}>
                  <ThemedText variant="caption" color="#FFFFFF" style={styles.importedBadgeText}>
                    转载续写
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText variant="caption" color={theme.textMuted}>
              {item.themeType ? NOVEL_THEME_TYPES.find(t => t.id === item.themeType)?.name : '未分类'} · {item.chapters.length}章
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.novelContinueButton}
            onPress={() => handleContinueWriting(item)}
          >
            <Feather name="edit-3" size={14} color="#C8102E" />
            <ThemedText variant="caption" color="#C8102E">续写</ThemedText>
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      {/* 右上角设置按钮 */}
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={() => router.push('/settings')}
      >
        <Feather name="settings" size={20} color={theme.textPrimary} />
      </TouchableOpacity>

      <View style={styles.scrollContent}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText variant="h1" color={theme.textPrimary} style={styles.title}>
            齐思秒说
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.subtitle}>
            AI · 第三人称叙事
          </ThemedText>
        </View>

        {/* 正在写作的小说 */}
        {writingNovels.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText variant="small" color={theme.textPrimary} style={styles.sectionTitle}>
                正在创作 ({writingNovels.length})
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                左滑操作
              </ThemedText>
            </View>
            <FlatList
              data={writingNovels.slice(0, 10)}
              renderItem={renderWritingNovel}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* 小说标题 */}
        <View style={styles.titleSection}>
          <View style={styles.labelRow}>
            <View style={styles.labelIconSmall}>
              <Feather name="book" size={12} color={theme.textPrimary} />
            </View>
            <ThemedText variant="small" color={theme.textPrimary} style={styles.labelText}>
              小说标题
            </ThemedText>
          </View>
          <TextInput
            style={styles.titleInput}
            placeholder="输入小说标题..."
            placeholderTextColor={theme.textMuted}
            value={novelTitle}
            onChangeText={setNovelTitle}
          />
        </View>

        {/* 角色选择 */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <View style={styles.labelIconSmall}>
              <Feather name="users" size={12} color={theme.textPrimary} />
            </View>
            <ThemedText variant="small" color={theme.textPrimary} style={styles.labelText}>
              角色设定
            </ThemedText>
          </View>

          <View style={styles.characterRow}>
            <View style={styles.characterColumn}>
              <TouchableOpacity
                style={[styles.genderTab, maleCharacter && styles.genderTabActive]}
                onPress={() => handleOpenCharacterModal('male')}
              >
                <ThemedText variant="caption" color={maleCharacter ? '#C8102E' : theme.textMuted}>
                  男主
                </ThemedText>
              </TouchableOpacity>
              <View style={styles.characterPreview}>
                {maleCharacter ? (
                  <View style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                      <ThemedText variant="caption" color={theme.textPrimary} numberOfLines={1}>
                        {maleCharacter.name}
                      </ThemedText>
                      <TouchableOpacity onPress={() => handleClearCharacter('male')}>
                        <Feather name="x" size={12} color={theme.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.emptyPreview} onPress={() => handleOpenCharacterModal('male')}>
                    <Feather name="plus" size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.characterColumn}>
              <TouchableOpacity
                style={[styles.genderTab, femaleCharacter && styles.genderTabActive]}
                onPress={() => handleOpenCharacterModal('female')}
              >
                <ThemedText variant="caption" color={femaleCharacter ? '#C8102E' : theme.textMuted}>
                  女主
                </ThemedText>
              </TouchableOpacity>
              <View style={styles.characterPreview}>
                {femaleCharacter ? (
                  <View style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                      <ThemedText variant="caption" color={theme.textPrimary} numberOfLines={1}>
                        {femaleCharacter.name}
                      </ThemedText>
                      <TouchableOpacity onPress={() => handleClearCharacter('female')}>
                        <Feather name="x" size={12} color={theme.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.emptyPreview} onPress={() => handleOpenCharacterModal('female')}>
                    <Feather name="plus" size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* 小说主题 */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <View style={styles.labelIconSmall}>
              <Feather name="tag" size={12} color={theme.textPrimary} />
            </View>
            <ThemedText variant="small" color={theme.textPrimary} style={styles.labelText}>
              小说主题
            </ThemedText>
          </View>
          <TouchableOpacity style={styles.themeSelector} onPress={() => setShowThemeModal(true)}>
            <ThemedText variant="caption" color={selectedThemeType ? theme.textPrimary : theme.textMuted}>
              {selectedThemeType ? NOVEL_THEME_TYPES.find(t => t.id === selectedThemeType)?.name : '选择小说主题...'}
            </ThemedText>
            <Feather name="chevron-down" size={14} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 开始创作按钮 */}
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color={theme.buttonPrimaryText} />
          ) : (
            <>
              <Feather name="feather" size={16} color={theme.buttonPrimaryText} />
              <ThemedText variant="smallMedium" color={theme.buttonPrimaryText} style={styles.buttonText}>
                开始创作
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* 功能入口 */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.smallActionButton}
            onPress={() => router.push('/character-list')}
          >
            <Feather name="users" size={12} color={theme.textPrimary} />
            <ThemedText variant="caption" color={theme.textPrimary}>角色库</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.generatorButton}
            onPress={() => router.push('/character')}
          >
            <Feather name="user-plus" size={14} color="#C8102E" />
            <ThemedText variant="caption" color="#C8102E">角色生成器</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallActionButton}
            onPress={() => router.push('/novel-import')}
          >
            <Feather name="upload" size={12} color={theme.textPrimary} />
            <ThemedText variant="caption" color={theme.textPrimary}>导入</ThemedText>
          </TouchableOpacity>
        </View>

        {/* 第二行功能入口 */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.smallActionButton}
            onPress={() => setShowDraftModal(true)}
          >
            <Feather name="archive" size={12} color={theme.textPrimary} />
            <ThemedText variant="caption" color={theme.textPrimary}>草稿箱</ThemedText>
            {draftNovels.length > 0 && (
              <View style={styles.draftBadge}>
                <ThemedText variant="caption" color="#FFFFFF">{draftNovels.length}</ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 角色选择弹窗 */}
      <Modal visible={showCharacterModal} transparent animationType="slide" onRequestClose={() => setShowCharacterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                选择{activeGenderTab === 'male' ? '男主' : '女主'}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowCharacterModal(false)}>
                <Feather name="x" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            {availableCharacters.length > 0 ? (
              <FlatList
                data={availableCharacters}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.characterOption} onPress={() => handleSelectCharacter(item)}>
                    <View style={styles.characterOptionInfo}>
                      <ThemedText variant="small" color={theme.textPrimary}>{item.name}</ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {item.gender} · {item.age}岁 · {item.occupation}
                      </ThemedText>
                    </View>
                    <TouchableOpacity onPress={() => handleViewCharacterDetail(item.id)}>
                      <Feather name="eye" size={16} color="#C8102E" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
                style={styles.characterList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Feather name="users" size={40} color={theme.textMuted} />
                <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: 10 }}>暂无可选角色</ThemedText>
                <TouchableOpacity style={styles.createCharacterButton} onPress={() => { setShowCharacterModal(false); router.push('/character'); }}>
                  <ThemedText variant="small" color="#C8102E">创建新角色</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 主题选择弹窗 */}
      <Modal visible={showThemeModal} transparent animationType="slide" onRequestClose={() => setShowThemeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>选择小说主题</ThemedText>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <Feather name="x" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.themeGrid}>
              {NOVEL_THEME_TYPES.map((themeType) => (
                <TouchableOpacity
                  key={themeType.id}
                  style={[styles.themeOption, selectedThemeType === themeType.id && styles.themeOptionSelected]}
                  onPress={() => { setSelectedThemeType(themeType.id); setShowThemeModal(false); }}
                >
                  <ThemedText variant="small" color={selectedThemeType === themeType.id ? '#C8102E' : theme.textPrimary}>
                    {themeType.name}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: 2 }}>
                    {themeType.description}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* 剧本生成弹窗 */}
      <Modal visible={showScriptModal} transparent animationType="slide" onRequestClose={() => setShowScriptModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>生成短剧剧本</ThemedText>
              <TouchableOpacity onPress={() => setShowScriptModal(false)}>
                <Feather name="x" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {selectedNovelForScript && (
              <>
                <ThemedText variant="small" color={theme.textMuted} style={{ marginBottom: 12 }}>
                  选择要生成剧本的章节
                </ThemedText>
                
                <View style={styles.chapterSelectList}>
                  {selectedNovelForScript.chapters.map((chapter, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.chapterSelectItem, selectedChapterForScript === index && styles.chapterSelectItemActive]}
                      onPress={() => setSelectedChapterForScript(index)}
                    >
                      <ThemedText variant="small" color={selectedChapterForScript === index ? '#C8102E' : theme.textPrimary}>
                        第{index + 1}章 {chapter.title}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.scriptGenerateButton, isGeneratingScript && styles.scriptGenerateButtonDisabled]}
                  onPress={handleGenerateScript}
                  disabled={isGeneratingScript}
                >
                  {isGeneratingScript ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="film" size={16} color="#FFFFFF" />
                      <ThemedText variant="small" color="#FFFFFF" style={{ marginLeft: 8 }}>生成剧本</ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: 12 }}>
              确认删除小说
            </ThemedText>
            <ThemedText variant="small" color={theme.textMuted} style={{ marginBottom: 16 }}>
              "{novelToDelete?.title}"
            </ThemedText>

            <View style={styles.deleteOptions}>
              <TouchableOpacity
                style={[styles.deleteOption, moveToDraft && styles.deleteOptionActive]}
                onPress={() => setMoveToDraft(true)}
              >
                <View style={styles.radioOuter}>
                  {moveToDraft && <View style={styles.radioInner} />}
                </View>
                <ThemedText variant="small" color={theme.textPrimary}>移至草稿箱</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteOption, !moveToDraft && styles.deleteOptionActive]}
                onPress={() => setMoveToDraft(false)}
              >
                <View style={styles.radioOuter}>
                  {!moveToDraft && <View style={styles.radioInner} />}
                </View>
                <ThemedText variant="small" color={theme.textPrimary}>彻底删除</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.deleteModalActions}>
              <TouchableOpacity style={styles.deleteCancelButton} onPress={() => setShowDeleteModal(false)}>
                <ThemedText variant="small" color={theme.textMuted}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={handleConfirmDelete}>
                <ThemedText variant="small" color="#FFFFFF">确认删除</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 导出格式选择弹窗 */}
      <Modal visible={showExportModal} transparent animationType="fade" onRequestClose={() => setShowExportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: 12 }}>
              选择导出格式
            </ThemedText>
            <ThemedText variant="small" color={theme.textMuted} style={{ marginBottom: 16 }}>
              "{novelToExport?.title}"
            </ThemedText>

            <View style={styles.exportOptions}>
              <TouchableOpacity
                style={styles.exportOption}
                onPress={async () => {
                  setShowExportModal(false);
                  if (novelToExport) {
                    await handleExportNovel(novelToExport);
                  }
                }}
              >
                <View style={styles.exportOptionIcon}>
                  <Feather name="file-text" size={24} color="#C8102E" />
                </View>
                <View style={styles.exportOptionContent}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>TXT 纯文本</ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>无格式，适合阅读分享</ThemedText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exportOption}
                onPress={async () => {
                  setShowExportModal(false);
                  if (novelToExport) {
                    await handleExportNovelAsDocx(novelToExport);
                  }
                }}
              >
                <View style={styles.exportOptionIcon}>
                  <Feather name="file-plus" size={24} color="#3B82F6" />
                </View>
                <View style={styles.exportOptionContent}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>Word 文档</ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>保留格式，适合编辑发布</ThemedText>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.deleteCancelButton, { marginTop: 16, width: '100%' }]} 
              onPress={() => setShowExportModal(false)}
            >
              <ThemedText variant="small" color={theme.textMuted}>取消</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 草稿箱弹窗 */}
      <Modal visible={showDraftModal} transparent animationType="slide" onRequestClose={() => setShowDraftModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>草稿箱</ThemedText>
              <TouchableOpacity onPress={() => setShowDraftModal(false)}>
                <Feather name="x" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {draftNovels.length > 0 ? (
              <FlatList
                data={draftNovels}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={styles.draftItem}>
                    <View style={styles.draftInfo}>
                      <ThemedText variant="small" color={theme.textPrimary}>{item.title}</ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        删除于 {new Date(item.deletedAt).toLocaleDateString()}
                      </ThemedText>
                    </View>
                    <View style={styles.draftActions}>
                      <TouchableOpacity style={styles.draftRestoreBtn} onPress={() => handleRestoreDraft(item)}>
                        <Feather name="rotate-ccw" size={14} color="#C8102E" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.draftDeleteBtn} onPress={() => handleDeleteDraft(item)}>
                        <Feather name="trash-2" size={14} color={theme.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                style={styles.draftList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Feather name="archive" size={40} color={theme.textMuted} />
                <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: 10 }}>草稿箱为空</ThemedText>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 设置弹窗 */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.settingsModalOverlay}>
          <View style={styles.settingsModalContent}>
            <View style={styles.settingsModalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                写作设置
              </ThemedText>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Feather name="x" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsSection}>
              {/* 自动保存 */}
              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Feather name="save" size={18} color={theme.textPrimary} />
                  <ThemedText variant="small" color={theme.textPrimary}>自动保存</ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.toggleSwitch, settings.autoSave && styles.toggleSwitchActive]}
                  onPress={() => setSettings(s => ({ ...s, autoSave: !s.autoSave }))}
                >
                  <View style={[styles.toggleKnob, settings.autoSave && styles.toggleKnobActive]} />
                </TouchableOpacity>
              </View>

              {/* 保存间隔 */}
              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Feather name="clock" size={18} color={theme.textPrimary} />
                  <ThemedText variant="small" color={theme.textPrimary}>保存间隔</ThemedText>
                </View>
                <View style={styles.settingsOptions}>
                  {['500ms', '1000ms', '2000ms', '3000ms'].map((interval) => (
                    <TouchableOpacity
                      key={interval}
                      style={[
                        styles.settingsOption,
                        settings.autoSaveInterval === parseInt(interval) && styles.settingsOptionActive,
                      ]}
                      onPress={() => setSettings(s => ({ ...s, autoSaveInterval: parseInt(interval) }))}
                    >
                      <ThemedText 
                        variant="caption" 
                        color={settings.autoSaveInterval === parseInt(interval) ? '#C8102E' : theme.textMuted}
                      >
                        {interval}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 字体大小 */}
              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Feather name="type" size={18} color={theme.textPrimary} />
                  <ThemedText variant="small" color={theme.textPrimary}>字体大小</ThemedText>
                </View>
                <View style={styles.settingsOptions}>
                  {[14, 16, 18, 20].map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.settingsOption,
                        settings.fontSize === size && styles.settingsOptionActive,
                      ]}
                      onPress={() => setSettings(s => ({ ...s, fontSize: size }))}
                    >
                      <ThemedText 
                        variant="caption" 
                        color={settings.fontSize === size ? '#C8102E' : theme.textMuted}
                      >
                        {size}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 行高 */}
              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Feather name="align-left" size={18} color={theme.textPrimary} />
                  <ThemedText variant="small" color={theme.textPrimary}>行高</ThemedText>
                </View>
                <View style={styles.settingsOptions}>
                  {[22, 24, 26, 28, 30].map((height) => (
                    <TouchableOpacity
                      key={height}
                      style={[
                        styles.settingsOption,
                        settings.lineHeight === height && styles.settingsOptionActive,
                      ]}
                      onPress={() => setSettings(s => ({ ...s, lineHeight: height }))}
                    >
                      <ThemedText 
                        variant="caption" 
                        color={settings.lineHeight === height ? '#C8102E' : theme.textMuted}
                      >
                        {height}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 字体选择 */}
              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Feather name="type" size={18} color={theme.textPrimary} />
                  <ThemedText variant="small" color={theme.textPrimary}>字体</ThemedText>
                </View>
                <View style={styles.settingsOptions}>
                  {['默认字体', '黑体', '宋体', '楷体'].map((font) => (
                    <TouchableOpacity
                      key={font}
                      style={[
                        styles.settingsOption,
                        settings.fontFamily === font && styles.settingsOptionActive,
                      ]}
                      onPress={() => setSettings(s => ({ ...s, fontFamily: font }))}
                    >
                      <ThemedText 
                        variant="caption" 
                        color={settings.fontFamily === font ? '#C8102E' : theme.textMuted}
                      >
                        {font}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.settingsCloseButton}
              onPress={() => setShowSettingsModal(false)}
            >
              <ThemedText variant="small" color="#FFFFFF">完成</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 世界背景设定弹窗 */}
      <Modal
        visible={showWorldSettingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWorldSettingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.worldSettingModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                世界背景设定
              </ThemedText>
              <TouchableOpacity onPress={() => setShowWorldSettingModal(false)}>
                <Feather name="x" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* 说明栏 */}
            <View style={styles.worldSettingHint}>
              <Feather name="info" size={16} color="#C8102E" />
              <ThemedText variant="small" color={theme.textSecondary} style={styles.hintText}>
                请输入故事发生的世界背景信息，AI将根据您的设定自动生成楔子
              </ThemedText>
            </View>

            <ScrollView style={styles.worldSettingForm} showsVerticalScrollIndicator={false}>
              {/* 世界名字 */}
              <View style={styles.worldSettingField}>
                <View style={styles.fieldLabel}>
                  <Feather name="globe" size={14} color="#C8102E" />
                  <ThemedText variant="small" color={theme.textPrimary}>世界名字</ThemedText>
                  <ThemedText variant="caption" color="#C8102E">*</ThemedText>
                </View>
                <TextInput
                  style={styles.worldSettingInput}
                  placeholder="例如：塔拉星、地球、修仙界..."
                  placeholderTextColor={theme.textMuted}
                  value={worldName}
                  onChangeText={setWorldName}
                />
              </View>

              {/* 年代背景 */}
              <View style={styles.worldSettingField}>
                <View style={styles.fieldLabel}>
                  <Feather name="clock" size={14} color="#C8102E" />
                  <ThemedText variant="small" color={theme.textPrimary}>年代背景</ThemedText>
                </View>
                <TextInput
                  style={styles.worldSettingInput}
                  placeholder="例如：现代社会、古代王朝、未来世界..."
                  placeholderTextColor={theme.textMuted}
                  value={eraBackground}
                  onChangeText={setEraBackground}
                />
                <View style={styles.quickSelectRow}>
                  {['现代社会', '古代王朝', '未来世界', '民国时期'].map((era) => (
                    <TouchableOpacity
                      key={era}
                      style={[styles.quickSelectTag, eraBackground === era && styles.quickSelectTagActive]}
                      onPress={() => setEraBackground(era)}
                    >
                      <ThemedText variant="caption" color={eraBackground === era ? '#C8102E' : theme.textMuted}>
                        {era}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 季节情况 */}
              <View style={styles.worldSettingField}>
                <View style={styles.fieldLabel}>
                  <Feather name="sun" size={14} color="#C8102E" />
                  <ThemedText variant="small" color={theme.textPrimary}>季节情况</ThemedText>
                </View>
                <TextInput
                  style={styles.worldSettingInput}
                  placeholder="例如：春季、炎热的夏天、寒冷的冬季..."
                  placeholderTextColor={theme.textMuted}
                  value={seasonSetting}
                  onChangeText={setSeasonSetting}
                />
                <View style={styles.quickSelectRow}>
                  {['春季', '夏季', '秋季', '冬季'].map((season) => (
                    <TouchableOpacity
                      key={season}
                      style={[styles.quickSelectTag, seasonSetting === season && styles.quickSelectTagActive]}
                      onPress={() => setSeasonSetting(season)}
                    >
                      <ThemedText variant="caption" color={seasonSetting === season ? '#C8102E' : theme.textMuted}>
                        {season}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 所处地域 */}
              <View style={styles.worldSettingField}>
                <View style={styles.fieldLabel}>
                  <Feather name="map-pin" size={14} color="#C8102E" />
                  <ThemedText variant="small" color={theme.textPrimary}>所处地域</ThemedText>
                </View>
                <View style={styles.regionTabContainer}>
                  {[
                    { key: '东部', icon: 'sunrise', desc: '沿海繁华' },
                    { key: '南部', icon: 'thermometer', desc: '湿热热带' },
                    { key: '西部', icon: 'wind', desc: '荒凉壮美' },
                    { key: '北部', icon: 'snow', desc: '寒冷冰雪' },
                    { key: '中部', icon: 'home', desc: '腹地秀美' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.regionTab, region === item.key && styles.regionTabActive]}
                      onPress={() => setRegion(item.key)}
                    >
                      <Feather 
                        name={item.icon as any} 
                        size={16} 
                        color={region === item.key ? '#C8102E' : theme.textMuted} 
                      />
                      <ThemedText 
                        variant="caption" 
                        color={region === item.key ? '#C8102E' : theme.textMuted}
                        style={styles.regionTabText}
                      >
                        {item.key}
                      </ThemedText>
                      <ThemedText 
                        variant="caption" 
                        color={theme.textMuted}
                        style={styles.regionTabDesc}
                      >
                        {item.desc}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 城市地点 */}
              <View style={styles.worldSettingField}>
                <View style={styles.fieldLabel}>
                  <Feather name="navigation" size={14} color="#C8102E" />
                  <ThemedText variant="small" color={theme.textPrimary}>城市地点</ThemedText>
                </View>
                <View style={styles.cityInputContainer}>
                  <View style={styles.cityInputWithSuffix}>
                    <TextInput
                      style={styles.cityInputWithSuffixInput}
                      placeholder="省/直辖市"
                      placeholderTextColor={theme.textMuted}
                      value={provinceInput}
                      onChangeText={setProvinceInput}
                    />
                    <ThemedText variant="body" color={theme.textSecondary}>省</ThemedText>
                  </View>
                  <View style={styles.cityInputWithSuffix}>
                    <TextInput
                      style={styles.cityInputWithSuffixInput}
                      placeholder="市"
                      placeholderTextColor={theme.textMuted}
                      value={cityInput}
                      onChangeText={setCityInput}
                    />
                    <ThemedText variant="body" color={theme.textSecondary}>市</ThemedText>
                  </View>
                  <View style={styles.cityInputWithSuffix}>
                    <TextInput
                      style={styles.cityInputWithSuffixInput}
                      placeholder="区/县"
                      placeholderTextColor={theme.textMuted}
                      value={districtInput}
                      onChangeText={setDistrictInput}
                    />
                    <ThemedText variant="body" color={theme.textSecondary}>区</ThemedText>
                  </View>
                </View>
                {(provinceInput || cityInput || districtInput) && (
                  <ThemedText variant="caption" color={theme.textMuted} style={styles.cityPreview}>
                    完整地点：{provinceInput}{cityInput}{districtInput}
                  </ThemedText>
                )}
              </View>

              {/* 主角正在做什么 */}
              <View style={styles.worldSettingField}>
                <View style={styles.fieldLabel}>
                  <Feather name="edit-3" size={14} color="#C8102E" />
                  <ThemedText variant="small" color={theme.textPrimary}>主角正在做什么</ThemedText>
                </View>
                <TextInput
                  style={[styles.worldSettingInput, styles.protagonistInput]}
                  placeholder="例如：正在咖啡馆写代码、在公园晨跑、在书房看书..."
                  placeholderTextColor={theme.textMuted}
                  value={protagonistDoing}
                  onChangeText={setProtagonistDoing}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <ThemedText variant="caption" color={theme.textMuted} style={styles.fieldHint}>
                  描述主角的初始状态和活动，AI将据此创作楔子
                </ThemedText>
              </View>
            </ScrollView>

            {/* 开始创作按钮 */}
            <TouchableOpacity
              style={[styles.worldSettingConfirmButton, isCreatingNovel && styles.generateButtonDisabled]}
              onPress={handleConfirmWorldSetting}
              disabled={isCreatingNovel}
            >
              {isCreatingNovel ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="feather" size={16} color="#FFFFFF" />
                  <ThemedText variant="smallMedium" color="#FFFFFF" style={styles.buttonText}>
                    开始创作
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 悬浮球 */}
      <FloatingBall />
    </Screen>
  );
}
