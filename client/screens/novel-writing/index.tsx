import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  LayoutAnimation,
  UIManager,
  Modal,
} from 'react-native';
import RNSSE from 'react-native-sse';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useFocusEffect } from 'expo-router';
import { createStyles } from './styles';
import { FloatingBall } from '@/components/FloatingBall';
import {
  Novel,
  getNovelById,
  updateNovelContent,
  updateNovelWorldSettings,
  createNovel,
  addChapter,
  updateChapter,
  updateNovelCharacter,
  addSideCharacterToNovel,
  syncCharactersToNovel,
} from '@/utils/novelStorage';
import {
  Character,
  getCharacterById,
  getNovelCharacters,
  saveCharacter,
  generateId,
} from '@/utils/characterStorage';
import { NOVEL_THEME_TYPES } from '@/constants/occupations';
import { getEducationConstraintsPrompt } from '@/constants/education';

// 启用 Android 的 LayoutAnimation
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 临时使用线上地址测试
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'https://kylinai-1.onrender.com';

type InputMode = 'manual' | 'voice';

// 常用标点符号
const PUNCTUATION_MARKS: string[] = [
  String.fromCharCode(0xFF0C), // 逗号
  String.fromCharCode(0x3002), // 句号
  String.fromCharCode(0xFF01), // 感叹号
  String.fromCharCode(0xFF1F), // 问号
  String.fromCharCode(0x3001), // 顿号
  String.fromCharCode(0xFF1A), // 冒号
  String.fromCharCode(0xFF1B), // 分号
  String.fromCharCode(0x201C), // 左双引号
  String.fromCharCode(0x201D), // 右双引号
  String.fromCharCode(0x2018), // 左单引号
  String.fromCharCode(0x2019), // 右单引号
  String.fromCharCode(0x3010), // 左方括号
  String.fromCharCode(0x3011), // 右方括号
];

export default function NovelWritingScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const params = useSafeSearchParams<{
    novelId: string;
    worldName?: string;
    eraBackground?: string;
    seasonSetting?: string;
    protagonistDoing?: string;
    region?: string;
    cityLocation?: string;
    autoGeneratePrologue?: string;
    maleCharacterId?: string;
    femaleCharacterId?: string;
    importData?: string;
    selectedCharacterId?: string;
    selectedCharacterIds?: string; // 多个角色ID，逗号分隔
  }>();

  const [novel, setNovel] = useState<Novel | null>(null);
  const [maleCharacter, setMaleCharacter] = useState<Character | null>(null);
  const [femaleCharacter, setFemaleCharacter] = useState<Character | null>(null);
  const [sideCharacters, setSideCharacters] = useState<Character[]>([]); // 配角列表
  const [showAddSideCharacterModal, setShowAddSideCharacterModal] = useState(false); // 显示添加配角选择框
  const [content, setContent] = useState('');
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [currentChapterName, setCurrentChapterName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // 手动保存状态
  // 世界设定状态（确保从小说数据加载后持久化）
  const [worldSettings, setWorldSettings] = useState<{
    worldName?: string;
    eraBackground?: string;
    seasonSetting?: string;
    protagonistDoing?: string;
    region?: string;
    cityLocation?: string;
  }>({});
  // 世界设定编辑相关状态
  const [showWorldSettingsModal, setShowWorldSettingsModal] = useState(false);
  const [editingWorldSettings, setEditingWorldSettings] = useState<{
    worldName?: string;
    eraBackground?: string;
    seasonSetting?: string;
    protagonistDoing?: string;
    region?: string;
    cityLocation?: string;
  }>({});
  const [showChapterList, setShowChapterList] = useState(false);
  const [showChapterInput, setShowChapterInput] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // AI模型选择相关状态
  const [aiModels, setAiModels] = useState<Array<{
    id: string;
    name: string;
    provider: string;
    dailyLimit: number;
    description: string;
  }>>([]);
  const [selectedModelId, setSelectedModelId] = useState('doubao-seed');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [aiUsage, setAiUsage] = useState<{
    modelId: string;
    modelName: string;
    modelProvider: string;
    todayCalls: number;
    dailyLimit: number;
    remainingCalls: number;
    description: string;
  } | null>(null);

  // 第一章生成状态
  const [isGeneratingFirstChapter, setIsGeneratingFirstChapter] = useState(false);
  const [firstChapterContent, setFirstChapterContent] = useState('');
  const hasGeneratedFirstChapter = useRef(false);

  // AI续写弹窗
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [continueDirection, setContinueDirection] = useState('');
  const [analyzedCharacters, setAnalyzedCharacters] = useState<{
    matched: Character[];
    unmatched: string[];
  }>({ matched: [], unmatched: [] });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 冲突检测弹窗
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<{
    hasConflict: boolean;
    conflicts: {
      characterName: string;
      conflictType: string;
      description: string;
      reason: string;
    }[];
    suggestion?: {
      canCreateTempCharacter: boolean;
      tempCharacterSuggestion?: {
        name: string;
        role: string;
        reason: string;
        suggestedDialogue: string;
      };
    };
  } | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);

  // 角色详情弹窗
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // 文本格式设置 - 用于整体样式
  const [textFormat, setTextFormat] = useState({
    fontFamily: '黑体',
    fontSize: 16,
    isBold: false,
    boldLevel: 1,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    highlightColor: null as string | null,
  });

  // 字数监测与提醒
  const [showWordCountAlert, setShowWordCountAlert] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const hasShownWordCountAlert = useRef(false);
  const WORD_COUNT_WARNING_THRESHOLD = 4500; // 提醒阈值
  const WORD_COUNT_MAX = 5000; // 最大字数

  // 文字选择状态 - 使用ref保存最后的选中范围，避免失去焦点后丢失
  const lastSelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  
  // 处理选择变化
  const handleSelectionChange = (e: any) => {
    const newSelection = e.nativeEvent.selection;
    setSelection(newSelection);
    lastSelectionRef.current = newSelection;
  };

  // 格式设置弹窗
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [formatModalType, setFormatModalType] = useState<'font' | 'fontSize' | 'bold' | 'highlight' | null>(null);

  // 查找替换功能
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchResults, setSearchResults] = useState<{
    exact: { index: number; text: string; isAI?: boolean }[];
    synonyms: { index: number; text: string; synonym: string }[];
  }>({ exact: [], synonyms: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // 可选字体
  const FONT_OPTIONS = ['黑体', '宋体', '楷体', '仿宋', '默认字体'];

  // 可选字号
  const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 22, 24];

  // 加粗档位
  const BOLD_OPTIONS = [
    { label: '轻度', value: 1, fontWeight: '500' as const },
    { label: '中度', value: 2, fontWeight: '600' as const },
    { label: '重度', value: 3, fontWeight: '700' as const },
  ];

  // 标记线颜色
  const HIGHLIGHT_COLORS = [
    { label: '红色', value: '#EF4444' },
    { label: '橙色', value: '#F97316' },
    { label: '黄色', value: '#EAB308' },
    { label: '绿色', value: '#22C55E' },
    { label: '蓝色', value: '#3B82F6' },
    { label: '紫色', value: '#8B5CF6' },
  ];

  // 自动保存相关
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>('');
  const continueLengthRef = useRef<number>(0); // 记录续写前的内容长度
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  // 记录短期经历（保存到小说专属数据）
  const recordShortTermMemory = async (newContent: string) => {
    if (!params.novelId) return;

    try {
      // 更新小说专属数据中主角的短期经历
      if (maleCharacter) {
        const updatedMale: Character = {
          ...maleCharacter,
          shortTermMemory: [...(maleCharacter.shortTermMemory || []), newContent]
        };
        await updateNovelCharacter(params.novelId, updatedMale);
        setMaleCharacter(updatedMale); // 更新本地状态
      }

      if (femaleCharacter) {
        const updatedFemale: Character = {
          ...femaleCharacter,
          shortTermMemory: [...(femaleCharacter.shortTermMemory || []), newContent]
        };
        await updateNovelCharacter(params.novelId, updatedFemale);
        setFemaleCharacter(updatedFemale); // 更新本地状态
      }

      // 更新配角短期经历
      if (sideCharacters.length > 0) {
        for (const char of sideCharacters) {
          const updatedChar: Character = {
            ...char,
            shortTermMemory: [...(char.shortTermMemory || []), newContent]
          };
          await updateNovelCharacter(params.novelId, updatedChar);
        }
        // 更新本地状态
        const updatedSide = sideCharacters.map(char => ({
          ...char,
          shortTermMemory: [...(char.shortTermMemory || []), newContent]
        }));
        setSideCharacters(updatedSide);
      }

      // 检查是否需要整合记忆（累积10条后）
      const shouldIntegrate = (maleCharacter?.shortTermMemory?.length || 0) >= 10 ||
                              (femaleCharacter?.shortTermMemory?.length || 0) >= 10;

      if (shouldIntegrate) {
        // TODO: 调用AI进行记忆整合
        console.log('【记忆系统】短期经历累积达到10条，建议进行记忆整合');
      }
    } catch (error) {
      console.error('记录短期经历失败:', error);
    }
  };

  // 加载数据
  const loadData = async () => {
    if (!params.novelId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log('[NovelWriting] loadData 开始加载, novelId:', params.novelId);
    try {
      const novelData = await getNovelById(params.novelId);
      console.log('[NovelWriting] getNovelById 返回:', novelData ? '找到小说: ' + novelData.title : 'null');
      setNovel(novelData);

    if (novelData) {
      // 自动同步角色库到小说数据库（同名覆盖，确保AI读取最新的角色信息）
      await syncCharactersToNovel(novelData.id);
      
      // 重新加载同步后的数据
      const syncedNovelData = await getNovelById(params.novelId);
      if (syncedNovelData) {
        setNovel(syncedNovelData);
      }
      
      // 从小说对象加载世界设定信息（确保数据持久化）
      setWorldSettings({
        worldName: novelData.worldName || params.worldName || '',
        eraBackground: novelData.eraBackground || params.eraBackground || '现代社会',
        seasonSetting: novelData.seasonSetting || params.seasonSetting || '春季',
        protagonistDoing: novelData.protagonistDoing || params.protagonistDoing || '',
        region: novelData.region || params.region || '',
        cityLocation: novelData.cityLocation || params.cityLocation || '',
      });
      
      // 优先从小说专属数据加载角色（确保AI读取的是小说专属数据）
      if (novelData.maleCharacterData) {
        setMaleCharacter(novelData.maleCharacterData);
      } else if (params.maleCharacterId) {
        // 兼容旧数据：如果小说数据中没有，从角色库读取
        const male = await getCharacterById(params.maleCharacterId);
        setMaleCharacter(male);
      }

      if (novelData.femaleCharacterData) {
        setFemaleCharacter(novelData.femaleCharacterData);
      } else if (params.femaleCharacterId) {
        // 兼容旧数据：如果小说数据中没有，从角色库读取
        const female = await getCharacterById(params.femaleCharacterId);
        setFemaleCharacter(female);
      }

      // 加载配角列表
      if (novelData.sideCharacters && novelData.sideCharacters.length > 0) {
        setSideCharacters(novelData.sideCharacters);
      }

      // 处理从角色库选择的配角（新增绑定）
      const selectedIds = params.selectedCharacterIds;
      if (selectedIds) {
        const ids = selectedIds.split(",").filter(Boolean);
        const charsToAdd: Character[] = [];
        for (const id of ids) {
          const char = await getCharacterById(id);
          if (char && !sideCharacters.find(s => s.id === char.id)) {
            charsToAdd.push(char);
          }
        }
        if (charsToAdd.length > 0) {
          setSideCharacters(prev => [...prev, ...charsToAdd]);
        }
      }

      // 如果当前没有选中的章节
      if (!currentChapterId) {
        // 如果有章节，自动选中第一个章节
        if (novelData.chapters.length > 0) {
          const firstChapter = novelData.chapters[0];
          setCurrentChapterId(firstChapter.id);
          setCurrentChapterName(firstChapter.title);
          setContent(firstChapter.content || '');
        } else {
          // 没有章节时，显示小说主内容
          setContent(novelData.content);
        }
      } else {
        // 如果已有选中的章节，加载该章节的最新内容
        const currentChapter = novelData.chapters.find(c => c.id === currentChapterId);
        if (currentChapter) {
          setContent(currentChapter.content || '');
        } else {
          // 章节不存在了，切换到第一个章节
          if (novelData.chapters.length > 0) {
            const firstChapter = novelData.chapters[0];
            setCurrentChapterId(firstChapter.id);
            setCurrentChapterName(firstChapter.title);
            setContent(firstChapter.content || '');
          } else {
            setContent(novelData.content);
          }
        }
      }
    }

    setIsLoading(false);
  } catch (error) {
    console.error('Load data error:', error);
    Alert.alert('错误', '加载数据失败');
    setIsLoading(false);
  }
};

  // 处理导入的小说数据
  const handleImportData = async () => {
    const importDataStr = params.importData;
    if (!importDataStr) return;

    try {
      setIsLoading(true);
      const importData = JSON.parse(importDataStr) as {
        chapters: { id: string; title: string; content: string }[];
        identifiedCharacters: string[];
        fileName: string;
      };

      if (!importData.chapters || importData.chapters.length === 0) {
        Alert.alert('提示', '没有导入的章节数据');
        setIsLoading(false);
        return;
      }

      // 创建新的小说记录
      const newNovel = await createNovel(
        importData.fileName || '导入的小说',
        importData.chapters.map(ch => ch.title).join('、'),
        '导入',
        undefined,
        undefined,
        [], // sideCharacterIds
        true // isImported
      );

      // 创建角色
      if (importData.identifiedCharacters && importData.identifiedCharacters.length > 0) {
        for (const charName of importData.identifiedCharacters) {
          const newCharacter: Character = {
            id: generateId(),
            name: charName,
            gender: '未知',
            age: 0,
            height: '0cm',
            weight: '0kg',
            group: '',
            position: '',
            occupation: '未知',
            personality: '待完善',
            experience: '待完善',
            familyBackground: '待完善',
            appearance: '待完善',
            specialTraits: '待完善',
            createdAt: Date.now(),
            novelId: newNovel.id,
            roleType: 'npc',
            isTemporary: true,
          };
          await saveCharacter(newCharacter);

          // 不需要添加到关系网络，因为角色之间还没有明确的关系
        }
      }

      // 保存导入的章节
      const savedChapters = [];
      for (let i = 0; i < importData.chapters.length; i++) {
        const chapter = importData.chapters[i];
        const savedChapter = await addChapter(newNovel.id, chapter.title, false, i + 1);
        await updateChapter(newNovel.id, savedChapter.id, { content: chapter.content });
        savedChapters.push(savedChapter);
      }

      // 添加作者更换通知章节（作为第一章节）
      const noticeChapter = await addChapter(newNovel.id, '作者更换通知', true);
      const noticeContent = `【作者更换通知】\n\n本小说已更换作者继续创作。作者将在保持原有故事风格和人物设定的基础上，继续完善和扩展故事内容。\n\n导入时间：${new Date().toLocaleString()}\n导入章节数：${importData.chapters.length} 章\n识别角色数：${importData.identifiedCharacters?.length || 0} 个`;
      await updateChapter(newNovel.id, noticeChapter.id, { content: noticeContent });

      // 加载新创建的小说
      const novelData = await getNovelById(newNovel.id);
      setNovel(novelData);

      // 选中第一个导入的章节
      if (savedChapters.length > 0) {
        setCurrentChapterId(savedChapters[0].id);
        setCurrentChapterName(savedChapters[0].title);
        setContent(savedChapters[0].content);
      }

      Alert.alert(
        '导入成功',
        `已成功导入 ${importData.chapters.length} 个章节${importData.identifiedCharacters?.length ? `和 ${importData.identifiedCharacters.length} 个角色` : ''}`,
        [
          {
            text: '查看角色',
            onPress: () => {
              // 跳转到角色列表页面
              router.push('/character-list');
            }
          },
          {
            text: '开始创作',
            style: 'default',
            onPress: () => {
              // 清除importData参数，避免重复处理
              router.replace('/novel-writing', {
                novelId: newNovel.id,
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Handle import data error:', error);
      Alert.alert('错误', '导入小说数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理从角色库选择的角色
  const handleSelectedCharacter = async (characterId: string) => {
    if (!params.novelId) {
      Alert.alert('错误', '小说未加载');
      return;
    }

    try {
      const character = await getCharacterById(characterId);
      if (!character) {
        Alert.alert('错误', '角色不存在');
        return;
      }

      // 检查是否已经在配角列表中
      const exists = sideCharacters.some((sc) => sc.id === characterId);
      if (exists) {
        Alert.alert('提示', '该角色已在配角列表中');
        return;
      }

      // 添加到小说专属配角列表
      await addSideCharacterToNovel(params.novelId, character);
      // 同时更新本地状态
      setSideCharacters((prev) => [...prev, character]);
      Alert.alert('成功', `已添加角色：${character.name}`);
    } catch (error) {
      console.error('Handle selected character error:', error);
      Alert.alert('错误', '添加角色失败');
    }
  };

  // 处理从角色库选择的多个角色（保存到小说专属数据）
  const handleSelectedCharacters = async (characterIds: string) => {
    if (!params.novelId) {
      Alert.alert('错误', '小说未加载');
      return;
    }

    const ids = characterIds.split(',').filter(id => id.trim());
    if (ids.length === 0) return;

    try {
      let addedCount = 0;
      let duplicateCount = 0;
      const newCharacters: Character[] = [];

      for (const id of ids) {
        const character = await getCharacterById(id);
        if (!character) {
          console.warn(`角色不存在: ${id}`);
          continue;
        }

        // 检查是否已经在配角列表中
        const exists = sideCharacters.some((sc) => sc.id === id);
        if (exists) {
          duplicateCount++;
          continue;
        }

        // 添加到小说专属配角列表
        await addSideCharacterToNovel(params.novelId, character);
        newCharacters.push(character);
        addedCount++;
      }

      // 批量更新本地状态
      if (newCharacters.length > 0) {
        setSideCharacters((prev) => [...prev, ...newCharacters]);
      }

      if (addedCount > 0) {
        Alert.alert('成功', `已添加 ${addedCount} 个角色${duplicateCount > 0 ? `（${duplicateCount} 个已存在）` : ''}`);
      } else if (duplicateCount > 0) {
        Alert.alert('提示', `所有角色都已存在于配角列表中`);
      }
    } catch (error) {
      console.error('Handle selected characters error:', error);
      Alert.alert('错误', '添加角色失败');
    }
  };

  // 检测是否有导入数据，如果有则处理
  useEffect(() => {
    if (params.importData && !novel) {
      handleImportData();
    }
  }, [params.importData, novel]);

  // 检测是否从角色库选择了角色
  const handledCharacterIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (params.selectedCharacterId && novel && params.selectedCharacterId !== handledCharacterIdRef.current) {
      handledCharacterIdRef.current = params.selectedCharacterId;
      handleSelectedCharacter(params.selectedCharacterId);
      // 清除参数，避免重复处理，但保留其他参数
      router.replace('/novel-writing', {
        novelId: novel.id,
        maleCharacterId: params.maleCharacterId,
        femaleCharacterId: params.femaleCharacterId,
      });
    }
  }, [params.selectedCharacterId, novel, params.maleCharacterId, params.femaleCharacterId]);

  // 检测是否从角色库选择了多个角色
  const handledCharacterIdsRef = useRef<string | null>(null);

  useEffect(() => {
    // 只有当有selectedCharacterIds参数，且未被处理过，且当前页面已加载小说时才执行
    if (params.selectedCharacterIds && novel && params.selectedCharacterIds !== handledCharacterIdsRef.current) {
      console.log('[NovelWriting] 从角色库选择多个角色:', params.selectedCharacterIds);
      console.log('[NovelWriting] 当前小说:', novel.id, novel.title);
      handledCharacterIdsRef.current = params.selectedCharacterIds;

      handleSelectedCharacters(params.selectedCharacterIds);

      // 清除参数，避免重复处理，但保留其他参数
      router.replace('/novel-writing', {
        novelId: novel.id,
        maleCharacterId: params.maleCharacterId || novel.maleCharacterId,
        femaleCharacterId: params.femaleCharacterId || novel.femaleCharacterId,
      });
    }
  }, [params.selectedCharacterIds, novel]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [params.novelId])
  );

  // 字数监测与提醒
  useEffect(() => {
    const currentWordCount = content.length;
    setWordCount(currentWordCount);
    
    // 当字数接近阈值且未提醒过时，显示提醒
    if (currentWordCount >= WORD_COUNT_WARNING_THRESHOLD && !hasShownWordCountAlert.current) {
      hasShownWordCountAlert.current = true;
      setShowWordCountAlert(true);
    }
    
    // 如果字数降到阈值以下，重置提醒状态（允许再次提醒）
    if (currentWordCount < WORD_COUNT_WARNING_THRESHOLD - 200) {
      hasShownWordCountAlert.current = false;
    }
  }, [content]);

  // 获取可用的大模型列表
  const fetchAiModels = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/usage/models`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAiModels(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch AI models:', error);
    }
  };

  // 获取AI调用次数
  const fetchAiUsage = async (modelId?: string) => {
    try {
      const currentModelId = modelId || selectedModelId;
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/usage/ai-calls?modelId=${currentModelId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAiUsage(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch AI usage:', error);
    }
  };

  // 选择模型
  const handleSelectModel = async (modelId: string) => {
    setSelectedModelId(modelId);
    setShowModelSelector(false);
    await fetchAiUsage(modelId);
  };

  // 打开世界设定编辑
  const handleEditWorldSettings = () => {
    setEditingWorldSettings({ ...worldSettings });
    setShowWorldSettingsModal(true);
  };

  // 保存世界设定
  const handleSaveWorldSettings = async () => {
    if (!novel) return;
    try {
      await updateNovelWorldSettings(novel.id, editingWorldSettings);
      setWorldSettings({ ...editingWorldSettings });
      setShowWorldSettingsModal(false);
      Alert.alert('成功', '世界设定已保存');
      
      // 检查是否需要自动生成第一章（如果还没有章节的话）
      const novelData = await getNovelById(novel.id);
      if (novelData && (!novelData.chapters || novelData.chapters.length === 0)) {
        console.log('【世界设定保存】开始生成第一章...');
        generateFirstChapterOpening();
      }
    } catch (error) {
      console.error('保存世界设定失败:', error);
      Alert.alert('错误', '保存世界设定失败');
    }
  };

  // 初始加载AI模型列表和调用次数
  useEffect(() => {
    fetchAiModels();
    fetchAiUsage();
  }, []);

  // 自动生成第一章开头
  useEffect(() => {
    console.log('【自动生成检查】autoGeneratePrologue:', params.autoGeneratePrologue);
    console.log('【自动生成检查】worldName:', params.worldName);
    console.log('【自动生成检查】novel:', novel?.id);
    console.log('【自动生成检查】hasGenerated:', hasGeneratedFirstChapter.current);
    
    if (
      params.autoGeneratePrologue === 'true' &&
      params.worldName &&
      novel &&
      !hasGeneratedFirstChapter.current
    ) {
      console.log('【自动生成】准备开始生成第一章...');
      hasGeneratedFirstChapter.current = true;
      generateFirstChapterOpening();
    }
  }, [params.autoGeneratePrologue, params.worldName, novel]);

  // 生成第一章开头
  const generateFirstChapterOpening = async () => {
    // 使用最新的 novelId 获取最新数据，避免闭包问题
    const currentNovelId = params.novelId || novel?.id;
    const currentNovel = currentNovelId ? await getNovelById(currentNovelId) : null;
    
    if (!currentNovel) return;
    
    // 调试日志
    console.log('【生成第一章】currentNovel 世界设定:', {
      worldName: currentNovel.worldName,
      eraBackground: currentNovel.eraBackground,
      maleCharacterData: currentNovel.maleCharacterData,
      femaleCharacterData: currentNovel.femaleCharacterData
    });
    
    // 直接从 currentNovel 中获取角色数据（而不是依赖可能未更新的状态变量）
    const maleChar = maleCharacter || currentNovel.maleCharacterData;
    const femaleChar = femaleCharacter || currentNovel.femaleCharacterData;
    
    console.log('【生成第一章】实际使用的主角信息:', {
      maleChar: maleChar,
      femaleChar: femaleChar
    });

    setIsGeneratingFirstChapter(true);
    setFirstChapterContent('');

    try {
      // 使用 currentNovel 中的世界设定
      const novelWorldSettings = currentNovel;
      
      // 构建世界背景设定
      const worldSetting = `【世界背景】
世界：${novelWorldSettings.worldName || novelWorldSettings.title || '未设置'}
年代：${novelWorldSettings.eraBackground || '现代社会'}
季节：${novelWorldSettings.seasonSetting || '春季'}
地区：${novelWorldSettings.region || ''}
城市：${novelWorldSettings.cityLocation || ''}

【主角当前活动】
${novelWorldSettings.protagonistDoing || '暂无'}
`;

      const url = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/novel/continue`;
      
      // 构建明确的世界设定字符串，直接嵌入prompt
      const explicitWorldSetting = `
世界：${novelWorldSettings.worldName || '地球'}
年代：${novelWorldSettings.eraBackground || '千禧年'}（千禧年前后，即1999-2001年左右）
季节：${novelWorldSettings.seasonSetting || '春季'}
地区：${novelWorldSettings.region || '中国北方'}
城市：${novelWorldSettings.cityLocation || '黑龙江省哈尔滨市'}
`.trim();
      
      const body = JSON.stringify({
        worldSetting: worldSetting,
        prompt: `你是一位专业的小说作家，请严格按照以下设定创作小说第一章开头。

【必须严格遵守的世界设定】
${explicitWorldSetting}

【必须严格使用的主角】
男主角：${maleChar?.name || '未设置'}
- 年龄：${maleChar?.age || '?'}岁
- 学历：${maleChar?.education || '未设置'}
- 职业：${maleChar?.occupation || '未设置'}
- 性格：${maleChar?.personality || '未设置'}

女主角：${femaleChar?.name || '未设置'}
- 年龄：${femaleChar?.age || '?'}岁
- 学历：${femaleChar?.education || '未设置'}
- 职业：${femaleChar?.occupation || '未设置'}
- 性格：${femaleChar?.personality || '未设置'}

【创作要求】
1. 绝对必须使用上述主角姓名，禁止使用任何其他姓名作为主角！
2. 故事必须发生在"${novelWorldSettings.eraBackground || '千禧年'}"时期的"${novelWorldSettings.cityLocation || '哈尔滨市'}"
3. 必须体现时代特色（千禧年前后的社会背景、生活方式等）
4. 必须体现地域特色（哈尔滨的地方风貌、方言习惯等）
5. 字数要求：800-1000字`,
        title: currentNovel.title,
        themeType: currentNovel.themeType,
        maleCharacter: maleChar,
        femaleCharacter: femaleChar,
        previousChapters: [],
      });

      const sse = new RNSSE(url, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: body,
      });

      let fullContent = '';

      sse.addEventListener('message', async (event) => {
        if (event.data === '[DONE]') {
          // 生成完成，保存第一章（isPrologue: false）
          if (fullContent) {
            try {
              console.log('【创作页面】正在保存第一章...');
              const chapter = await addChapter(currentNovel.id, '第一章', false);
              console.log('【创作页面】章节创建成功:', chapter.id);
              await updateChapter(currentNovel.id, chapter.id, { content: fullContent });
              console.log('【创作页面】章节内容已保存');
              
              // 更新小说数据
              const updatedNovel = await getNovelById(currentNovel.id);
              if (updatedNovel) {
                console.log('【创作页面】小说数据已更新，章节数:', updatedNovel.chapters?.length);
                setNovel(updatedNovel);
              }
              
              // 自动选中第一章
              setCurrentChapterId(chapter.id);
              setCurrentChapterName('第一章');
              setContent(fullContent);
              hasGeneratedFirstChapter.current = true;
              console.log('【创作页面】第一章生成完成，内容长度:', fullContent.length);
              
              // 重新加载数据以刷新章节列表
              console.log('【创作页面】重新加载数据...');
              loadData();
            } catch (saveError) {
              console.error('【创作页面】保存第一章失败:', saveError);
              Alert.alert('提示', '第一章生成完成，但保存时出现问题');
            }
          } else {
            console.warn('【创作页面】生成内容为空');
          }
          sse.close();
          setIsGeneratingFirstChapter(false);
          return;
        }

        // 处理SSE数据，去掉 'data: ' 前缀
        if (!event.data || event.data.trim() === '') {
          return;
        }

        try {
          // 去掉 SSE 的 'data: ' 前缀
          let dataStr = event.data;
          if (dataStr.startsWith('data: ')) {
            dataStr = dataStr.substring(6);
          }
          
          const parsed = JSON.parse(dataStr);
          if (parsed.content && typeof parsed.content === 'string') {
            fullContent += parsed.content;
            setFirstChapterContent(fullContent);
          }
        } catch (e) {
          // 忽略解析错误，不输出到控制台
          // event.data可能不是有效的JSON格式（如心跳包、空格等）
        }
      });

      sse.addEventListener('error', (error) => {
        console.error('SSE error:', error);
        sse.close();
        setIsGeneratingFirstChapter(false);
        Alert.alert('错误', '生成第一章开头失败，请重试');
      });
    } catch (error) {
      console.error('First chapter opening generation error:', error);
      setIsGeneratingFirstChapter(false);
      Alert.alert('错误', '生成第一章开头失败，请重试');
    }
  };

  // 监听键盘状态
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // 自动保存
  const saveContent = async () => {
    if (!novel || content === lastSavedContentRef.current) return;

    try {
      if (currentChapterId) {
        // 保存到当前章节
        await updateChapter(novel.id, currentChapterId, { content });
      } else {
        // 保存到小说主内容
        await updateNovelContent(novel.id, content);
      }
      lastSavedContentRef.current = content;
      
      // 更新 novel 状态
      const updatedNovel = await getNovelById(novel.id);
      if (updatedNovel) {
        setNovel(updatedNovel);
      }
    } catch (error) {
      console.error('Auto save error:', error);
    }
  };

  // 手动保存
  const handleManualSave = async () => {
    if (!novel || isSaving) return;
    
    setIsSaving(true);
    try {
      if (currentChapterId) {
        // 保存到当前章节
        await updateChapter(novel.id, currentChapterId, { content });
      } else {
        // 保存到小说主内容
        await updateNovelContent(novel.id, content);
      }
      lastSavedContentRef.current = content;
      
      // 更新 novel 状态
      const updatedNovel = await getNovelById(novel.id);
      if (updatedNovel) {
        setNovel(updatedNovel);
      }
      
      // 显示保存成功提示
      Alert.alert('保存成功', '内容已保存');
    } catch (error) {
      console.error('Manual save error:', error);
      Alert.alert('保存失败', '请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 防抖保存
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveContent();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, currentChapterId]);

  // 退出时保存
  useEffect(() => {
    return () => {
      if (content !== lastSavedContentRef.current && novel) {
        if (currentChapterId) {
          updateChapter(novel.id, currentChapterId, { content });
        } else {
          updateNovelContent(novel.id, content);
        }
      }
    };
  }, [content, novel]);

  // 切换输入模式
  const toggleInputMode = () => {
    LayoutAnimation.easeInEaseOut();
    if (inputMode === 'manual') {
      setInputMode('voice');
      Keyboard.dismiss();
    } else {
      setInputMode('manual');
    }
  };

  // 插入标点符号
  const insertPunctuation = (mark: string) => {
    if (textInputRef.current) {
      setContent(prev => prev + mark);
      textInputRef.current?.focus();
    }
  };

  // 打开格式设置弹窗
  const openFormatModal = (type: 'font' | 'fontSize' | 'bold' | 'highlight') => {
    setFormatModalType(type);
    setShowFormatModal(true);
  };

  // 对选中文字应用格式标记
  const applyFormatToSelection = (prefix: string, suffix: string) => {
    // 使用ref保存的最后选择状态，避免点击按钮后selection丢失
    const { start, end } = lastSelectionRef.current;
    const hasSelection = start !== end;
    
    if (hasSelection) {
      // 有选中文字，在选中文字前后添加标记
      const before = content.substring(0, start);
      const selected = content.substring(start, end);
      const after = content.substring(end);
      
      // 检查是否已经有标记（取消格式）
      const alreadyFormatted = content.substring(start - prefix.length, start) === prefix &&
                                 content.substring(end, end + suffix.length) === suffix;
      
      if (alreadyFormatted) {
        // 移除格式标记
        const newContent = content.substring(0, start - prefix.length) + selected + content.substring(end + suffix.length);
        setContent(newContent);
        lastSelectionRef.current = { start: start - prefix.length, end: end - prefix.length };
      } else {
        // 添加格式标记
        const newContent = before + prefix + selected + suffix + after;
        setContent(newContent);
        lastSelectionRef.current = { start: start + prefix.length, end: end + prefix.length };
      }
    } else {
      // 没有选中文字，插入空的标记，光标放在中间
      const before = content.substring(0, start);
      const after = content.substring(start);
      const newContent = before + prefix + suffix + after;
      setContent(newContent);
      // 将光标放在标记中间
      const newCursorPos = start + prefix.length;
      lastSelectionRef.current = { start: newCursorPos, end: newCursorPos };
      setSelection({ start: newCursorPos, end: newCursorPos });
    }
    
    // 聚焦输入框
    textInputRef.current?.focus();
  };

  // 切换加粗
  const toggleBold = () => {
    applyFormatToSelection('**', '**');
  };

  // 设置加粗档位
  const setBoldLevel = (level: number) => {
    setTextFormat(prev => ({ ...prev, boldLevel: level, isBold: true }));
    setShowFormatModal(false);
    applyFormatToSelection('**', '**');
  };

  // 切换斜体
  const toggleItalic = () => {
    applyFormatToSelection('*', '*');
  };

  // 切换下划线
  const toggleUnderline = () => {
    applyFormatToSelection('__', '__');
  };

  // 切换删除线
  const toggleStrikethrough = () => {
    applyFormatToSelection('~~', '~~');
  };

  // 设置标记线颜色
  const setHighlightColor = (color: string | null) => {
    setTextFormat(prev => ({ ...prev, highlightColor: color }));
    setShowFormatModal(false);
    if (color) {
      // 使用简单的标记格式，颜色信息保存在textFormat中
      applyFormatToSelection('==', '==');
    }
  };

  // 设置字体
  const setFontFamily = (font: string) => {
    setTextFormat(prev => ({ ...prev, fontFamily: font }));
    setShowFormatModal(false);
  };

  // 设置字号
  const setFontSize = (size: number) => {
    setTextFormat(prev => ({ ...prev, fontSize: size }));
    setShowFormatModal(false);
  };

  // 清除所有格式
  const clearAllFormats = () => {
    setTextFormat({
      fontFamily: '黑体',
      fontSize: 16,
      isBold: false,
      boldLevel: 1,
      isItalic: false,
      isUnderline: false,
      isStrikethrough: false,
      highlightColor: null,
    });
  };

  // 获取当前字体粗细
  const getCurrentFontWeight = () => {
    if (!textFormat.isBold) return '400';
    const boldOption = BOLD_OPTIONS.find(o => o.value === textFormat.boldLevel);
    return boldOption?.fontWeight || '600';
  };

  // 执行搜索（包括AI近义词）
  const performSearch = async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults({ exact: [], synonyms: [] });
      return;
    }

    setIsSearching(true);
    const exactResults: { index: number; text: string }[] = [];
    const synonymResults: { index: number; text: string; synonym: string }[] = [];

    // 1. 精确匹配搜索
    let searchPos = 0;
    while (true) {
      const index = content.indexOf(keyword, searchPos);
      if (index === -1) break;
      exactResults.push({ index, text: keyword });
      searchPos = index + keyword.length;
    }

    // 2. AI近义词搜索
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/search/synonyms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });

      if (response.ok) {
        const data = await response.json();
        const synonyms = data.synonyms || [];

        // 对每个近义词进行搜索
        for (const synonym of synonyms) {
          let synPos = 0;
          while (true) {
            const synIndex = content.indexOf(synonym, synPos);
            if (synIndex === -1) break;
            // 避免与精确匹配重复
            const isDuplicate = exactResults.some(
              r => r.index === synIndex && r.text === synonym
            );
            if (!isDuplicate) {
              synonymResults.push({ index: synIndex, text: synonym, synonym });
            }
            synPos = synIndex + synonym.length;
          }
        }
      }
    } catch (error) {
      console.error('AI synonym search error:', error);
    }

    setSearchResults({ exact: exactResults, synonyms: synonymResults });
    setCurrentSearchIndex(0);
    setIsSearching(false);
  };

  // 替换单个结果
  const replaceSingle = (index: number, originalText: string) => {
    if (!replaceText.trim()) return;
    const newContent = content.substring(0, index) + replaceText + content.substring(index + originalText.length);
    setContent(newContent);
    // 重新搜索
    performSearch(searchText);
  };

  // 跳转到搜索结果位置
  const jumpToSearchResult = (index: number, textLength: number) => {
    // 设置选择位置
    setSelection({ start: index, end: index + textLength });
    // 关闭搜索弹窗
    setShowSearchModal(false);
    // 使用setTimeout确保选择生效后再聚焦
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  // 一键全部替换
  const replaceAll = () => {
    if (!replaceText.trim() || (searchResults.exact.length === 0 && searchResults.synonyms.length === 0)) return;

    // 从后往前替换，避免索引变化
    const allResults = [
      ...searchResults.exact.map(r => ({ ...r, isSynonym: false })),
      ...searchResults.synonyms.map(r => ({ index: r.index, text: r.text, isSynonym: true })),
    ].sort((a, b) => b.index - a.index);

    let newContent = content;
    for (const result of allResults) {
      newContent = newContent.substring(0, result.index) + replaceText + newContent.substring(result.index + result.text.length);
    }
    setContent(newContent);
    setSearchResults({ exact: [], synonyms: [] });
  };

  // 打开搜索弹窗
  const openSearchModal = () => {
    setShowSearchModal(true);
    setSearchText('');
    setReplaceText('');
    setSearchResults({ exact: [], synonyms: [] });
  };

  // 打开AI续写弹窗
  const handleOpenContinueModal = () => {
    setShowContinueModal(true);
    setContinueDirection('');
    setAnalyzedCharacters({ matched: [], unmatched: [] });
  };

  // 分析续写走向中的角色
  const analyzeCharactersInDirection = async (text: string) => {
    if (!novel) return;
    
    setIsAnalyzing(true);
    try {
      // 获取小说关联的所有角色
      const novelCharacters = await getNovelCharacters(novel.id);
      const allCharacters = [...novelCharacters];
      if (maleCharacter) allCharacters.push(maleCharacter);
      if (femaleCharacter) allCharacters.push(femaleCharacter);
      
      // 提取可能的人名
      const mentionedNames = extractNamesFromText(text);
      
      // 匹配已有角色
      const matched: Character[] = [];
      const unmatched: string[] = [];
      
      mentionedNames.forEach(name => {
        const existingChar = allCharacters.find(c => c.name === name);
        if (existingChar) {
          if (!matched.find(c => c.id === existingChar.id)) {
            matched.push(existingChar);
          }
        } else {
          if (!unmatched.includes(name)) {
            unmatched.push(name);
          }
        }
      });
      
      setAnalyzedCharacters({ matched, unmatched });
    } catch (error) {
      console.error('Error analyzing characters:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 从文本中提取可能的人名（简单实现：匹配2-4个汉字的常见人名模式）
  const extractNamesFromText = (text: string): string[] => {
    // 匹配2-4个汉字，可能是人名
    const namePattern = /[\u4e00-\u9fa5]{2,4}/g;
    const matches = text.match(namePattern) || [];
    // 过滤常见非人名词汇
    const nonNameWords = ['主角', '故事', '情节', '突然', '发现', '开始', '继续', '一个', '这个', '那个', '什么', '怎么', '这样', '那样', '但是', '然后', '虽然', '因为', '所以', '如果', '可能', '应该', '可以', '已经', '还是', '就是', '不是', '只是', '还有', '没有', '正在', '将要', '将要', '关于', '对于', '通过', '根据', '按照', '为了', '由于', '以及', '或者', '而且', '并且', '不过', '可是', '然而', '其实', '忽然', '终于', '正在', '一时', '突然', '然后', '接着', '随后', '最后', '首先', '其次', '再次', '最终', '刚才', '刚刚', '已经', '将要', '正在', '一直', '总是', '从来', '经常', '往往', '有时', '偶尔', '曾经', '已经', '即将', '赶快', '连忙', '赶紧', '急忙', '匆匆', '渐渐', '慢慢', '静静', '悄悄', '默默', '深深', '远远', '高高兴兴', '快快乐乐', '平平安安', '安安全全', '干干净净', '整整齐齐', '漂漂亮亮', '明明白白', '清清楚楚', '实实在在', '客客气气', '热热闹闹', '冷冷清清', '忙忙碌碌', '轻轻松松', '舒舒服服', '痛痛快快', '仔仔细细', '认认真真', '马马虎虎', '糊糊涂涂', '迷迷糊糊', '隐隐约约', '模模糊糊', '恍恍惚惚', '昏昏沉沉', '浑浑噩噩', '迷迷瞪瞪', '晕晕乎乎', '呆呆傻傻', '疯疯癫癫', '神神叨叨', '鬼鬼祟祟', '偷偷摸摸', '躲躲闪闪', '遮遮掩掩', '支支吾吾', '吞吞吐吐', '含含糊糊', '断断续续', '陆陆续续', '三三两两', '稀稀拉拉', '星星点点', '零零散散', '零零碎碎', '点点滴滴', '丝丝缕缕', '条条框框', '方方面面', '上上下下', '左左右右', '前前后后', '里里外外', '进进出出', '来来回回', '反反复复', '来来往往', '往往来来', '走走过场', '说说笑笑', '打打闹闹', '吵吵闹闹', '哭哭啼啼', '骂骂咧咧', '嘻嘻哈哈', '哈哈大笑', '嘿嘿一笑', '呵呵一笑', '呵呵呵', '哈哈哈', '嘿嘿嘿', '嘻嘻嘻', '哦哦哦', '啊啊啊', '嗯嗯嗯', '哎呀呀', '哎哟哟', '哇塞塞', '天哪哪', '神啊啊', '天啊啊', '妈呀呀', '爸呀呀', '哥呀呀', '姐呀呀', '弟呀呀', '妹呀呀', '叔呀呀', '婶呀呀', '伯呀呀', '舅呀呀', '姑呀呀', '姨呀呀', '爷呀呀', '奶呀呀', '外公外婆', '爷爷奶奶', '爸爸妈妈', '哥哥姐姐', '弟弟妹妹', '叔叔阿姨', '爷爷奶奶', '外公外婆', '舅舅舅妈', '姑姑姑父', '姨妈姨夫', '表哥表姐', '表弟表妹', '堂哥堂姐', '堂弟堂妹', '侄子侄女', '外甥外甥女', '孙子孙女', '外孙外孙女', '曾孙曾孙女', '玄孙玄孙女', '太太爷爷', '太爷爷', '太奶奶', '曾祖父', '曾祖母', '高祖父', '高祖母', '老祖宗', '老太爷', '老夫人', '老先生', '老太太', '老爷子', '老婆婆', '老公公', '大伯子', '小叔子', '大姑子', '小姑子', '大舅子', '小舅子', '大姨子', '小姨子', '连襟', '妯娌', '儿媳妇', '女婿', '公公婆婆', '岳父岳母', '公公', '婆婆', '岳父', '岳母', '丈人', '丈母娘', '公公婆婆', '老公老婆', '丈夫妻子', '先生太太', '男朋友', '女朋友', '男闺蜜', '女闺蜜', '知己', '红颜知己', '蓝颜知己', '情人', '恋人', '爱人', '情侣', '夫妻', '两口子', '两口儿', '老两口', '小两口', '新婚夫妇', '新郎新娘', '伴郎伴娘', '媒人', '证婚人', '主婚人', '司仪', '主持人', '嘉宾', '来宾', '客人', '主人', '东道主', '邀请人', '被邀请人', '参加者', '参与者', '观众', '听众', '读者', '作者', '编者', '译者', '出版社', '编辑', '主编', '记者', '通讯员', '撰稿人', '投稿人', '审稿人', '排版员', '校对员', '印刷工', '发行员', '书店老板', '图书管理员', '图书馆长', '档案管理员', '资料员', '研究员', '教授', '副教授', '讲师', '助教', '导师', '学生', '博士生', '硕士生', '本科生', '专科生', '高中生', '初中生', '小学生', '幼儿园', '小朋友', '小朋友', '同学们', '老师们', '校长', '院长', '系主任', '班主任', '辅导员', '班长', '学习委员', '体育委员', '文艺委员', '生活委员', '劳动委员', '宣传委员', '组织委员', '纪律委员', '课代表', '小组长', '寝室长', '舍长', '社长', '部长', '会长', '干事', '会员', '社员', '队员', '队员', '选手', '运动员', '裁判', '教练', '队长', '主力', '替补', '观众', '球迷', '粉丝', '追星族', '偶像', '明星', '演员', '歌手', '舞者', '模特', '主持人', '导演', '制片人', '编剧', '摄影师', '化妆师', '造型师', '服装师', '灯光师', '音响师', '场记', '剧务', '道具', '美工', '后期', '剪辑师', '配音演员', '配音员', '播音员', '主播', '网红', '博主', '大V', '粉丝', '关注者', '订阅者', '会员', 'VIP', '普通用户', '管理员', '版主', '群主', '群管', '管理员', '超级管理员', '系统管理员', '客服', '售后', '技术支持', '销售人员', '市场人员', '运营人员', '产品经理', '项目经理', '程序员', '设计师', '工程师', '架构师', '技术总监', 'CTO', 'CEO', 'CFO', 'COO', 'CMO', 'CHO', '董事长', '总经理', '副总经理', '总监', '经理', '主管', '组长', '员工', '实习生', '兼职', '临时工', '外包', '合同工', '正式工', '编制内', '编制外', '公务员', '事业编', '国企', '外企', '私企', '民企', '合资', '独资', '个体户', '自由职业', '创业者', '老板', '合伙人', '股东', '投资人', '天使投资人', '风险投资', '私募基金', '公募基金', '基金经理', '分析师', '研究员', '交易员', '操盘手', '经纪人', '代理人', '中介', '房产中介', '保险代理', '银行职员', '柜员', '信贷员', '客户经理', '理财顾问', '投资顾问', '税务师', '会计师', '审计师', '律师', '法官', '检察官', '警察', '消防员', '医生', '护士', '药剂师', '检验师', '放射师', '麻醉师', '外科医生', '内科医生', '儿科医生', '妇科医生', '产科医生', '牙科医生', '眼科医生', '耳鼻喉科医生', '皮肤科医生', '精神科医生', '心理医生', '中医', '西医', '中西医结合', '针灸师', '推拿师', '按摩师', '理疗师', '康复师', '营养师', '健身教练', '瑜伽教练', '游泳教练', '舞蹈教练', '音乐老师', '美术老师', '书法老师', '围棋老师', '象棋老师', '钢琴老师', '小提琴老师', '吉他老师', '架子鼓老师', '声乐老师', '主持人老师', '表演老师', '模特老师', '礼仪老师', '化妆老师', '摄影老师', '剪辑老师', '编程老师', '机器人老师', '乐高老师', '积木老师', '拼图老师', '手工老师', '烘焙老师', '烹饪老师', '茶艺老师', '花艺老师', '陶艺老师', '插花老师', '刺绣老师', '编织老师', '缝纫老师', '裁缝老师', '服装设计老师', '珠宝设计老师', '室内设计老师', '建筑设计老师', '园林设计老师', '景观设计老师', '城市规划老师', '工业设计老师', '产品设计老师', '包装设计老师', '广告设计老师', '平面设计老师', '动画设计老师', '游戏设计老师', 'UI设计老师', 'UX设计老师', '交互设计老师', '用户体验设计老师', '用户研究老师', '数据分析老师', '人工智能老师', '机器学习老师', '深度学习老师', '大数据老师', '云计算老师', '区块链老师', '物联网老师', '网络安全老师', '信息安全老师', '软件工程老师', '计算机科学老师', '电子信息老师', '通信工程老师', '自动化老师', '电气工程老师', '机械工程老师', '土木工程老师', '水利工程老师', '化学工程老师', '生物工程老师', '环境工程老师', '材料科学老师', '物理学老师', '化学老师', '生物学老师', '地理学老师', '历史学老师', '哲学老师', '文学老师', '语言学老师', '心理学老师', '社会学老师', '政治学老师', '经济学老师', '管理学老师', '法学老师', '教育学老师', '体育学老师', '艺术学老师', '新闻传播学老师', '图书情报学老师', '档案学老师', '博物馆学老师', '考古学老师', '人类学老师', '民族学老师', '宗教学老师', '天文学老师', '地质学老师', '海洋学老师', '气象学老师', '生态学老师', '环境科学老师', '地球科学老师', '行星科学老师', '空间科学老师', '航空航天老师', '核科学老师', '能源科学老师', '材料科学老师', '纳米科技老师', '量子科技老师', '生命科学老师', '脑科学老师', '认知科学老师', '神经科学老师', '遗传学老师', '基因组学老师', '蛋白质组学老师', '生物信息学老师', '系统生物学老师', '合成生物学老师', '干细胞研究老师', '再生医学老师', '精准医疗老师', '基因治疗老师', '免疫治疗老师', '靶向治疗老师', '质子治疗老师', '重离子治疗老师', '放射治疗老师', '化疗治疗老师', '中西医结合治疗老师', '中医养生老师', '西医保健老师', '健康管理老师', '康复医学老师', '老年医学老师', '儿科医学老师', '妇产科医学老师', '男科学老师', '性医学老师', '生殖医学老师', '辅助生殖老师', '试管婴儿老师', '人工授精老师', '代孕妈妈', '捐卵者', '捐精者', '代孕机构', '生殖中心', '不孕不育', '优生优育', '产前诊断', '基因检测', '亲子鉴定', 'DNA鉴定', '法医鉴定', '伤情鉴定', '精神病鉴定', '司法鉴定', '公证处', '律师事务所', '法院', '检察院', '公安局', '派出所', '看守所', '监狱', '戒毒所', '劳教所', '少管所', '拘留所', '收容所', '救助站', '福利院', '养老院', '敬老院', '孤儿院', '幼儿园', '托儿所', '早教中心', '培训中心', '辅导班', '补习班', '兴趣班', '特长班', '才艺班', '考级班', '竞赛班', '冲刺班', '提高班', '基础班', '入门班', '进阶班', '高级班', '大师班', 'VIP班', '一对一', '小班课', '大班课', '网课', '直播课', '录播课', '混合式教学', '翻转课堂', '慕课', '微课', '短视频', '直播', '抖音', '快手', 'B站', '小红书', '微博', '微信', '朋友圈', '公众号', '视频号', '小程序', 'APP', '网站', '网页', 'H5', '小程序', '快应用', '轻应用', '小程序', '小游戏', '小工具', '小插件', '小功能', '小模块', '小组件', '小部件', '小配件', '小零件', '小玩意', '小东西', '小物件', '小礼品', '小纪念品', '小奖品', '小礼物', '小心意', '小意思', '小事情', '小问题', '小麻烦', '小困难', '小挫折', '小坎坷', '小波折', '小插曲', '小意外', '小惊喜', '小确幸', '小幸福', '小满足', '小成就', '小进步', '小成长', '小收获', '小心得', '小感悟', '小体会', '小经验', '小教训', '小启发', '小灵感', '小创意', '小点子', '小想法', '小主意', '小建议', '小意见', '小看法', '小观点', '小态度', '小立场', '小原则', '小底线', '小规矩', '小约定', '小承诺', '小誓言', '小誓言', '小愿望', '小梦想', '小目标', '小计划', '小安排', '小打算', '小准备', '小心愿', '小期待', '小盼望', '小希望', '小憧憬', '小向往', '小追求', '小奋斗', '小努力', '小拼搏', '小坚持', '小坚守', '小执着', '小倔强', '小倔犟', '小脾气', '小性格', '小个性', '小特点', '小特色', '小风格', '小气质', '小气场', '小魅力', '小魔力', '小吸引力', '小感染力', '小影响力', '小号召力', '小领导力', '小执行力', '小创造力', '小想象力', '小观察力', '小判断力', '小决策力', '小分析力', '小思考力', '小理解力', '小记忆力', '小学习力', '小适应力', '小抗压力', '小承受力', '小忍耐力', '小意志力', '小自制力', '小控制力', '小约束力', '小监督力', '小管理力', '小组织力', '小协调力', '小沟通力', '小表达力', '小说服力', '小谈判力', '小协商力', '小调解力', '小化解力', '小解决力', '小处理力', '小应对力', '小应变力', '小反应力', '小洞察力', '小预见力', '小预测力', '小推断力', '小推理力', '小归纳力', '小总结力', '小概括力', '小提炼力', '小萃取力', '小吸收力', '小消化力', '小融合力', '小整合力', '小组合力', '小搭配力', '小配对力', '小匹配力', '小适应力', '小调节力', '小调整力', '小修正力', '小改正力', '小改善力', '小改进力', '小改良力', '小改革力', '小革新力', '小创新力', '小突破力', '小超越力', '小领先力', '小优势力', '小竞争力', '小影响力', '小感召力', '小凝聚力', '小向心力', '小团结力', '小合作力', '小协作力', '小配合力', '小支持力', '小帮助力', '小助力力', '小推动力', '小促进力', '小催化力', '小激发力', '小激活力', '小唤醒力', '小启蒙力', '小启迪力', '小启发力', '小引导力', '小指引力', '小带领力', '小带领力', '小牵引力', '小拉动力', '小驱动力', '小推动力', '小原动力', '小创造力', '小想象力', '小构思力', '小设计力', '小规划力', '小策划力', '小计划力', '小安排力', '小部署力', '小布局力', '小谋略力', '小战略力', '小战术力', '小策略力', '小方法力', '小技巧力', '小技术力', '小技能力', '小能力力', '小本领力', '小功夫力', '小实力力', '小势力力', '小威力力', '小权力力', '小权利力', '小权益力', '小利益力', '小好处力', '小便利力', '小方便力', '小舒适力', '小惬意力', '小舒畅力', '小畅快力', '小愉悦力', '小快乐力', '小高兴力', '小欢喜力', '小喜悦力', '小欣喜力', '小欣慰力', '小满足力', '小得意力', '小骄傲力', '小自豪力', '小自信力', '小自立力', '小自强力', '小自尊力', '小自爱力', '小自律力', '小自觉力', '小自省力', '小自知力', '小自制力', '小自控力', '小自主力', '小自由力', '小自在力', '小自然力', '小自发力', '小自愿力', '小自动力', '小自动力', '小主动力', '小积极力', '小正面力', '小正向力', '小正能量', '小负能量', '小消极力', '小负面力', '小反向力', '小对抗力', '小反对力', '小抵制力', '小抗拒力', '小排斥力', '小拒绝力', '小否认力', '小否定力', '小质疑力', '小怀疑力', '小猜疑力', '小误解力', '小曲解力', '小偏见力', '小成见力', '小歧视力', '小偏视力', '小冷落力', '小忽视力', '小漠视力', '小轻视力', '小鄙视力', '小蔑视力', '小瞧不起', '小看不上', '小不待见', '小不喜欢', '小讨厌力', '小厌恶力', '小憎恨力', '小愤恨力', '小怨恨力', '小仇恨力', '小敌意力', '小恶意力', '小善意愿', '小好意愿', '小真心愿', '小诚意愿', '小诚意力', '小真心力', '小真情意', '小真实感', '小真切感', '小真诚感', '小真挚感', '小诚恳感', '小诚实感', '小诚信感', '小诚信度', '小可信度', '小可靠度', '小稳定度', '小安定度', '小安全度', '小保障度', '小保护度', '小爱护度', '小关心度', '小关注度', '小重视度', '小重要度', '小关键度', '小核心度', '小中心度', '小重心点', '小要点', '小重点', '小难点', '小疑点', '小焦点', '小热点', '小亮点', '小闪光点', '小突破点', '小切入点', '小着力点', '小发力点', '小支撑点', '小落脚点', '小出发点', '小归宿点', '小终点线', '小起跑线', '小基准线', '小标准线', '小水平线', '小等高线', '小轮廓线', '小边界线', '小分界线', '小分割线', '小分隔线', '小隔离线', '小封锁线', '小警戒线', '小安全线', '小危险线', '小警戒区', '小安全区', '小缓冲区', '小过渡区', '小交界区', '小边缘区', '小核心区', '小中心区', '小外围区', '小边缘带', '小过渡带', '小缓冲带', '小隔离带', '小绿化带', '小风景带', '小观光带', '小旅游带', '小文化带', '小经济带', '小产业带', '小发展带', '小增长带', '小崛起带', '小复兴带', '小振兴带', '小腾飞带', '小跨越带', '小超越带', '小领先带', '小示范带', '小标杆带', '小榜样带', '小典型带', '小模范带', '小先进带', '小优秀带', '小杰出带', '小卓越带', '小辉煌带', '小灿烂带', '小光辉带', '小光明带', '小希望带', '小未来带', '小前景带', '小展望带', '小憧憬带', '小向往带', '小追求带', '小奋斗带', '小拼搏带', '小努力带', '小坚持带', '小坚守带', '小执着带', '小倔强带', '小倔犟带', '小倔脾气', '小坏脾气', '小臭脾气', '小牛脾气', '小倔性子', '小坏性子', '小臭性子', '小牛性子', '小倔骨头', '小硬骨头', '小软骨头', '小懒骨头', '小贱骨头', '小贱皮子', '小欠皮子', '小找抽型', '小欠揍型', '小找打型', '小欠打型', '小找骂型', '小欠骂型', '小找茬型', '小找事型', '小惹事型', '小生事型', '小闹事型', '小滋事型', '小肇事型', '小闯祸型', '小惹祸型', '小招惹型', '小招灾型', '小惹祸型', '小招事型', '小招非型', '小惹非型', '小招怨型', '小惹怨型', '小招恨型', '小惹恨型', '小招嫌型', '小惹嫌型', '小招厌型', '小惹厌型', '小招烦型', '小惹烦型', '小招恼型', '小惹恼型', '小招怒型', '小惹怒型', '小招气型', '小惹气型', '小招火型', '小惹火型', '小点火力', '小煽火力', '小挑拨力', '小离间力', '小分裂力', '小破坏力', '小毁坏力', '小摧毁力', '小毁灭力', '小消亡力', '小消失力', '小消逝力', '小湮灭力', '小泯灭力', '小灭绝力', '小绝种力', '小绝迹力', '小绝版力', '小绝唱力', '小绝笔力', '小绝招力', '小绝技力', '小绝活力', '小绝艺力', '小绝妙力', '小绝佳力', '小绝好力', '小绝美力', '小绝伦力', '小绝顶力', '小绝对力', '小绝配力', '小绝搭力', '小绝合力', '小绝发力', '小绝动力', '小绝境力', '小绝地力', '小绝路力', '小绝境力', '小绝处逢生', '小柳暗花明', '小峰回路转', '小豁然开朗', '小恍然大悟', '小茅塞顿开', '小醍醐灌顶', '小如梦初醒', '小大彻大悟', '小大彻大悟', '小幡然醒悟', '小迷途知返', '小改邪归正', '小弃暗投明', '小洗心革面', '小重新做人', '小改过自新', '小痛改前非', '小悬崖勒马', '小回头是岸', '小浪子回头', '小金不换', '小重新出发', '小重新开始', '小从头再来', '小重整旗鼓', '小重振旗鼓', '小重振雄风', '小东山再起', '小卷土重来', '小死灰复燃', '小枯木逢春', '小枯木再生', '小枯木复苏', '小枯木复活', '小枯木重春', '小枯木回春', '小枯木再生', '小枯木复苏', '小枯木复生', '小枯木重生', '小枯木更生', '小枯木新生', '小枯木春生', '小枯木春发', '小枯木春长', '小枯木春绿', '小枯木春芽', '小枯木春叶', '小枯木春枝', '小枯木春干', '小枯木春根', '小枯木春花', '小枯木春果', '小枯木春实', '小枯木春华', '小枯木春秀', '小枯木春荣', '小枯木春盛', '小枯木春茂', '小枯木春繁', '小枯木春昌', '小枯木春兴', '小枯木春旺', '小枯木春发', '小枯木春长', '小枯木春大', '小枯木春强', '小枯木春壮', '小枯木春健', '小枯木春康', '小枯木春宁', '小枯木春安', '小枯木春和', '小枯木春平', '小枯木春顺', '小枯木春畅', '小枯木春达', '小枯木春通', '小枯木春畅', '小枯木春顺', '小枯木春利', '小枯木春吉', '小枯木春祥', '小枯木春瑞', '小枯木春福', '小枯木春禧', '小枯木春庆', '小枯木春贺', '小枯木春喜', '小枯木春乐', '小枯木春欢', '小枯木春悦', '小枯木春怡', '小枯木春恬', '小枯木春适', '小枯木舒适', '小枯木惬意', '小枯木舒畅', '小枯木畅快', '小枯木愉悦', '小枯木快乐', '小枯木高兴', '小枯木欢喜', '小枯木喜悦', '小枯木欣喜', '小枯木欣慰', '小枯木满足', '小枯木得意', '小枯木骄傲', '小枯木自豪', '小枯木自信', '小枯木自立', '小枯木自强', '小枯木自尊', '小枯木自爱', '小枯木自律', '小枯木自觉', '小枯木自省', '小枯木自知', '小枯木自制', '小枯木自控', '小枯木自主', '小枯木自由', '小枯木自在', '小枯木自然', '小枯木自发', '小枯木自愿', '小枯木自动', '小枯木主动', '小枯木积极', '小枯木正面', '小枯木正向', '小枯木正能量', '小枯木负能量', '小枯木消极', '小枯木负面', '小枯木反向', '小枯木对抗', '小枯木反对', '小枯木抵制', '小枯木抗拒', '小枯木排斥', '小枯木拒绝', '小枯木否认', '小枯木否定', '小枯木质疑', '小枯木怀疑', '小枯木猜疑', '小枯木误解', '小枯木曲解', '小枯木偏见', '小枯木成见', '小枯木歧视', '小枯木偏视', '小枯木冷落', '小枯木忽视', '小枯木漠视', '小枯木轻视', '小枯木鄙视', '小枯木蔑视', '小枯木瞧不起', '小枯木看不上', '小枯木不待见', '小枯木不喜欢', '小枯木讨厌', '小枯木厌恶', '小枯木憎恨', '小枯木愤恨', '小枯木怨恨', '小枯木仇恨', '小枯木敌意', '小枯木恶意', '小枯木善意', '小枯木好意', '小枯木真心', '小枯木诚意', '小枯木真情', '小枯木真实', '小枯木真切', '小枯木真诚', '小枯木真挚', '小枯木诚恳', '小枯木诚实', '小枯木诚信', '小枯木可信', '小枯木可靠', '小枯木稳定', '小枯木安定', '小枯木安全', '小枯木保障', '小枯木保护', '小枯木爱护', '小枯木关心', '小枯木关注', '小枯木重视', '小枯木重要', '小枯木关键', '小枯木核心', '小枯木中心', '小枯木重心', '小枯木要点', '小枯木重点', '小枯木难点', '小枯木疑点', '小枯木焦点', '小枯木热点', '小枯木亮点', '小枯木闪光点', '小枯木突破点', '小枯木切入点', '小枯木着力点', '小枯木发力点', '小枯木支撑点', '小枯木落脚点', '小枯木出发点', '小枯木归宿点', '小枯木终点线', '小枯木起跑线', '小枯木基准线', '小枯木标准线', '小枯木水平线', '小枯木等高线', '小枯木轮廓线', '小枯木边界线', '小枯木分界线', '小枯木分割线', '小枯木分隔线', '小枯木隔离线', '小枯木封锁线', '小枯木警戒线', '小枯木安全线', '小枯木危险线', '小枯木警戒区', '小枯木安全区', '小枯木缓冲区', '小枯木过渡区', '小枯木交界区', '小枯木边缘区', '小枯木核心区', '小枯木中心区', '小枯木外围区'];
    
    return matches.filter(name => !nonNameWords.includes(name));
  };

  // 检测续写冲突
  const checkConflict = async (): Promise<{
    hasConflict: boolean;
    conflicts: {
      characterName: string;
      conflictType: string;
      description: string;
      reason: string;
    }[];
    suggestion?: {
      canCreateTempCharacter: boolean;
      tempCharacterSuggestion?: {
        name: string;
        role: string;
        reason: string;
        suggestedDialogue: string;
      };
    };
  } | null> => {
    if (!novel || !continueDirection.trim()) return null;

    try {
      setIsCheckingConflict(true);

      // 获取所有相关角色
      const novelCharacters = await getNovelCharacters(novel.id);
      const allCharacters = [
        ...novelCharacters,
        ...(maleCharacter ? [maleCharacter] : []),
        ...(femaleCharacter ? [femaleCharacter] : [])
      ];

      // 调用冲突检测API
      /**
       * 服务端文件：server/src/routes/novel.ts
       * 接口：POST /api/v1/novel/check-conflict
       * Body 参数：novelId: number, currentContent: string, continueDirection: string, characters: Character[], previousChapters: Array
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/novel/check-conflict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId: novel.id,
          currentContent: content,
          continueDirection,
          characters: allCharacters.map(c => ({
            name: c.name,
            occupation: c.occupation,
            age: c.age,
            personality: c.personality,
            education: c.education,
            roleType: c.roleType
          })),
          // 传递之前章节的内容作为上下文，用于检测上下文一致性冲突
          previousChapters: novel.chapters.map(ch => ({
            title: ch.title,
            content: ch.content || ''
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Conflict check error:', error);
      return null;
    } finally {
      setIsCheckingConflict(false);
    }
  };

  // 保存小说内容
  const handleSave = async () => {
    if (!novel) return;
    try {
      if (currentChapterId) {
        await updateChapter(novel.id, currentChapterId, { content });
      } else {
        await updateNovelContent(novel.id, content);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  // 记录角色经历
  const recordCharacterExperience = async (novelData: Novel, newContent: string, contentLength: number) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/experience/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId: novelData.id,
          content: newContent,
          contentLength,
          maleCharacterId: maleCharacter?.id,
          femaleCharacterId: femaleCharacter?.id,
          sideCharacterIds: sideCharacters.map(c => c.id),
        }),
      });
      
      if (response.ok) {
        // 刷新角色数据
        const updatedNovel = await getNovelById(novelData.id);
        if (updatedNovel) {
          setNovel(updatedNovel);
          // 刷新本地角色状态
          if (updatedNovel.maleCharacterData) {
            setMaleCharacter(updatedNovel.maleCharacterData);
          }
          if (updatedNovel.femaleCharacterData) {
            setFemaleCharacter(updatedNovel.femaleCharacterData);
          }
        }
      }
    } catch (error) {
      console.error('Record experience error:', error);
    }
  };

  // 生成小说内容
  const handleGenerate = async (skipConflictCheck = false) => {
    if (!novel) return;

    // 冲突检测
    if (!skipConflictCheck && continueDirection.trim()) {
      const conflictResult = await checkConflict();
      
      if (conflictResult && conflictResult.hasConflict) {
        setConflictInfo(conflictResult);
        setShowConflictModal(true);
        return;
      }
    }

    setIsGenerating(true);
    setShowContinueModal(false);
    setShowConflictModal(false);

    // 记录续写前的内容长度
    continueLengthRef.current = content.length;

    try {
      const themeType = NOVEL_THEME_TYPES.find(t => t.id === novel.themeType);
      const themeName = themeType?.name || '都市';

      // 获取小说关联的所有角色
      const novelCharacters = await getNovelCharacters(novel.id);
      
      // 分析续写走向中的角色名
      const mentionedNames = extractNamesFromText(continueDirection);
      
      // 匹配已有角色
      const matchedCharacters: Character[] = [];
      let unmatchedNames: string[] = [];
      
      mentionedNames.forEach(name => {
        const existingChar = novelCharacters.find(c => c.name === name);
        if (existingChar) {
          matchedCharacters.push(existingChar);
        } else {
          // 检查是否是男女主角
          if (maleCharacter?.name === name) {
            matchedCharacters.push(maleCharacter);
          } else if (femaleCharacter?.name === name) {
            matchedCharacters.push(femaleCharacter);
          } else {
            unmatchedNames.push(name);
          }
        }
      });

      // 为未匹配的角色创建临时角色设定
      const tempCharacters: Character[] = [];
      if (unmatchedNames.length > 0) {
        // 批量创建临时角色
        for (const name of unmatchedNames) {
          try {
            const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/novel/create-temp-character`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name,
                novelId: novel.id,
                context: continueDirection
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.character) {
                const tempChar: Character = {
                  ...data.character,
                  height: '',
                  experience: '',
                  familyBackground: '',
                  specialTraits: ''
                };
                tempCharacters.push(tempChar);
                // 保存临时角色到本地
                await saveCharacter(tempChar);
              }
            }
          } catch (error) {
            console.error('Failed to create temp character:', error);
          }
        }
        
        // 更新未匹配列表（移除已创建临时角色的名字）
        unmatchedNames = [];
      }

      // 构建角色信息
      let charactersInfo = '';
      
      // 获取所有角色（包括主角和配角）的记忆信息
      const getCharacterMemory = (char: Character | null): string => {
        if (!char) return '';
        const longTerm = char.longTermMemory || [];
        const shortTerm = char.shortTermMemory || [];
        
        let memoryInfo = '';
        if (longTerm.length > 0) {
          memoryInfo += `\n  【重要背景】${longTerm.join('；')}`;
        }
        if (shortTerm.length > 0) {
          memoryInfo += `\n  【近期事件】${shortTerm.slice(-3).join('；')}（AI应了解但不一定每次都提及）`;
        }
        return memoryInfo;
      };
      
      // 添加男女主角信息
      if (maleCharacter) {
        const educationConstraint = maleCharacter.education 
          ? `\n  ${getEducationConstraintsPrompt(maleCharacter.education)}` 
          : '';
        const memoryInfo = getCharacterMemory(maleCharacter);
        charactersInfo += `- 男主角：${maleCharacter.name}，${maleCharacter.occupation}，${maleCharacter.age}岁。性格：${maleCharacter.personality?.substring(0, 100) || '未知'}${educationConstraint}${memoryInfo}\n`;
      }
      if (femaleCharacter) {
        const educationConstraint = femaleCharacter.education 
          ? `\n  ${getEducationConstraintsPrompt(femaleCharacter.education)}` 
          : '';
        const memoryInfo = getCharacterMemory(femaleCharacter);
        charactersInfo += `- 女主角：${femaleCharacter.name}，${femaleCharacter.occupation}，${femaleCharacter.age}岁。性格：${femaleCharacter.personality?.substring(0, 100) || '未知'}${educationConstraint}${memoryInfo}\n`;
      }
      
      // 添加小说专属配角信息（从小说数据库读取）
      if (sideCharacters.length > 0) {
        sideCharacters.forEach(char => {
          const educationConstraint = char.education 
            ? `\n  ${getEducationConstraintsPrompt(char.education)}` 
            : '';
          const memoryInfo = getCharacterMemory(char);
          charactersInfo += `- 配角：${char.name}，${char.occupation || '身份未知'}，${char.age || '?'}岁。性格：${char.personality?.substring(0, 50) || '未知'}${educationConstraint}${memoryInfo}\n`;
        });
      }
      
      // 添加其他已匹配角色
      matchedCharacters.forEach(char => {
        if (char.id !== maleCharacter?.id && char.id !== femaleCharacter?.id) {
          const educationConstraint = char.education 
            ? `\n  ${getEducationConstraintsPrompt(char.education)}` 
            : '';
          const memoryInfo = getCharacterMemory(char);
          charactersInfo += `- ${char.roleType === 'temp' ? '临时角色' : '配角'}：${char.name}，${char.occupation || '身份未知'}，${char.age || '?'}岁。性格：${char.personality?.substring(0, 50) || '未知'}${educationConstraint}${memoryInfo}\n`;
        }
      });
      
      // 添加临时角色
      tempCharacters.forEach(char => {
        const educationConstraint = char.education 
          ? `\n  ${getEducationConstraintsPrompt(char.education)}` 
          : '';
        charactersInfo += `- 临时角色：${char.name}，${char.occupation || '身份未知'}，${char.age || '?'}岁。性格：${char.personality?.substring(0, 50) || '未知'}${educationConstraint}\n`;
      });

      const prompt = `请继续创作以下小说：

小说标题：${novel.title}
主题类型：${themeName}

主要角色：
${charactersInfo || '暂无特定角色'}

章节大纲：
${novel.chapters.map((ch, i) => `${i + 1}. ${ch.title}`).join('\n')}

已有内容：
${content || '（暂无内容，请开始创作第一章）'}

${continueDirection ? `续写走向要求：${continueDirection}` : ''}

${unmatchedNames.length > 0 ? `\n注意：用户提及了"${unmatchedNames.join('、')}"等角色名，但系统中没有找到对应角色设定。请根据上下文合理推断这些角色的身份、性格，并在情节中自然引入。` : ''}

【重要创作规则】
1. 学历约束：必须严格遵守每个角色的学历设定！
   - 低学历角色（小学/初中）：说话简单直白，不会使用专业术语，遇到复杂情况不会深入分析，不会说出超出其认知范围的话
   - 中等学历角色（高中/专科）：能进行基本的分析和表达，但不会使用过于专业的术语，知识面有限
   - 高学历角色（大本/硕士/博士）：表达专业、有逻辑，能进行深入分析，但不会表现出超出其专业范围的深奥知识
   
2. 知识一致性：角色所说的话、所做的事必须与其学历和知识水平相符
   - 一个初中学历的人绝对不会说出大学级别的知识
   - 一个研究生不会表现得什么都不懂
   - 角色的分析能力、表达能力必须与其学历匹配

3. 行为合理性：角色的反应和决策要符合其认知水平
   - 低学历角色面对复杂问题时，不会进行复杂的分析推理
   - 高学历角色遇到问题会理性分析，不会盲目冲动

请继续创作小说内容（约500-800字），保持第三人称叙事风格，注意情节连贯性、角色性格一致性以及学历设定的严格遵守。如果提到了新角色，请合理设定其形象和学历。`;

      // 使用 SSE 流式接收数据
      const url = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/novel/continue`;
      const body = JSON.stringify({
        prompt,
        title: novel.title,
        themeType: novel.themeType,
        maleCharacter: maleCharacter ? {
          name: maleCharacter.name,
          occupation: maleCharacter.occupation,
          personality: maleCharacter.personality,
          education: maleCharacter.education,
        } : null,
        femaleCharacter: femaleCharacter ? {
          name: femaleCharacter.name,
          occupation: femaleCharacter.occupation,
          personality: femaleCharacter.personality,
          education: femaleCharacter.education,
        } : null,
        previousChapters: novel.chapters.map(ch => ({
          title: ch.title,
          content: ch.content || ''
        })),
      });

      const sse = new RNSSE(url, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: body,
      });

      let generatedContent = '';

      sse.addEventListener('message', async (event) => {
        if (event.data === '[DONE]') {
          // 生成完成
          if (generatedContent) {
            setContent(prev => prev + '\n\n' + generatedContent);
            setContinueDirection(''); // 清空续写走向
            
            // 记录角色短期经历
            await recordCharacterExperience(novel, generatedContent, continueLengthRef.current);
            
            // 自动保存生成的内容
            await handleSave();
            Alert.alert('成功', 'AI续写内容已生成并保存');
          } else {
            console.warn('【创作页面】AI续写内容为空');
          }
          sse.close();
          setIsGenerating(false);
          return;
        }

        // 处理SSE数据，去掉 'data: ' 前缀
        if (!event.data || event.data.trim() === '') {
          return;
        }

        try {
          // 去掉 SSE 的 'data: ' 前缀
          let dataStr = event.data;
          if (dataStr.startsWith('data: ')) {
            dataStr = dataStr.substring(6);
          }
          
          const parsed = JSON.parse(dataStr);
          if (parsed.content && typeof parsed.content === 'string') {
            generatedContent += parsed.content;
            setContent(prev => prev + parsed.content);
          }
        } catch (e) {
          // 忽略解析错误
        }
      });

      sse.addEventListener('error', (error) => {
        console.error('SSE error:', error);
        sse.close();
        setIsGenerating(false);
        Alert.alert('错误', '生成内容失败，请重试');
      });
    } catch (error) {
      console.error('Novel generation error:', error);
      setIsGenerating(false);
      Alert.alert('错误', '生成内容失败，请重试');
    }
  };

  // 使用建议解决冲突并继续生成
  const handleGenerateWithSuggestion = async () => {
    if (!novel || !conflictInfo?.conflicts) return;
    
    setShowConflictModal(false);
    
    // 从冲突信息中提取解决建议
    const conflictDescriptions = conflictInfo.conflicts
      .map(c => `${c.characterName}: ${c.description}`)
      .join('\n');
    
    const resolutionText = `
【注意处理以下角色冲突】
${conflictDescriptions}

请根据以上冲突调整剧情，在续写时确保角色设定的一致性。
`.trim();
    
    setContinueDirection(prev => prev ? `${prev}\n\n${resolutionText}` : resolutionText);
    
    // 调用正常生成流程，跳过冲突检测
    handleGenerate(true);
  };

  // 添加配角
  const addSideCharacter = (character: Character) => {
    if (!sideCharacters.find(c => c.id === character.id)) {
      setSideCharacters([...sideCharacters, character]);
    }
  };

  // 移除配角
  const removeSideCharacter = (characterId: string) => {
    setSideCharacters(sideCharacters.filter(c => c.id !== characterId));
  };

  // 添加章节
  const handleAddChapter = async () => {
    if (!novel) return;
    setShowChapterInput(true);
    // 计算下一个章节号
    const nextChapterNum = novel.chapters.length + 1;
    setNewChapterName(`第${nextChapterNum}章 `);
  };

  // 确认添加章节
  const confirmAddChapter = async () => {
    if (!novel) return;
    if (newChapterName.trim()) {
      // 添加正文章节（isPrologue: false）
      const chapter = await addChapter(novel.id, newChapterName.trim(), false);
      setNovel(prev => prev ? { ...prev, chapters: [...prev.chapters, chapter] } : null);
      setShowChapterInput(false);
      setNewChapterName('');
      // 自动选中新添加的章节
      setCurrentChapterId(chapter.id);
      setCurrentChapterName(chapter.title);
      setContent('');
    }
  };

  // 选择章节
  const handleSelectChapter = (chapterId: string, chapterTitle: string) => {
    // 查找选中的章节
    const selectedChapter = novel?.chapters.find(c => c.id === chapterId);
    if (selectedChapter) {
      setCurrentChapterId(chapterId);
      setCurrentChapterName(chapterTitle);
      // 加载章节内容
      setContent(selectedChapter.content || '');
      setShowChapterList(false);
    }
  };

  // 返回首页
  const handleBack = () => {
    if (content !== lastSavedContentRef.current && novel) {
      updateNovelContent(novel.id, content).then(() => {
        router.push('/home');
      });
    } else {
      router.push('/home');
    }
  };

  // 处理内容变化并保持光标可见
  const handleContentSizeChange = (width: number, height: number) => {
    if (isKeyboardVisible && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // 语音输入（模拟）
  const handleVoiceInput = () => {
    Alert.alert('语音输入', '语音输入功能开发中，敬请期待');
  };

  if (isLoading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C8102E" />
        </View>
      </Screen>
    );
  }

  // 加载中状态显示加载界面
  if (!novel) {
    if (isLoading) {
      return (
        <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
          <View style={styles.errorContainer}>
            <ActivityIndicator size="large" color="#C8102E" />
            <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: 12 }}>
              加载中...
            </ThemedText>
          </View>
        </Screen>
      );
    }
    
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={theme.textMuted} />
          <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: 12 }}>
            小说不存在
          </ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/home')}>
            <ThemedText variant="smallMedium" color="#C8102E">返回首页</ThemedText>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const themeType = NOVEL_THEME_TYPES.find(t => t.id === novel.themeType);

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* 顶部工具栏 - 缩小 */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarButton} onPress={handleBack}>
            <Feather name="arrow-left" size={18} color={theme.textPrimary} />
          </TouchableOpacity>

          <View style={styles.novelInfo}>
            <ThemedText variant="small" color={theme.textPrimary} numberOfLines={1}>
              {novel.title}
            </ThemedText>
            <TouchableOpacity
              style={styles.chapterSelector}
              onPress={() => setShowChapterList(!showChapterList)}
            >
              <ThemedText variant="caption" color={theme.textMuted} numberOfLines={1}>
                {currentChapterName || '选择章节'}
              </ThemedText>
              <Feather name="chevron-down" size={12} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.topBarRight}>
            <TouchableOpacity style={styles.databaseButton} onPress={() => router.push(`/novel-database?novelId=${novel?.id || ''}`)}>
              <Feather name="database" size={16} color={theme.textPrimary} />
              <ThemedText variant="caption" color={theme.textPrimary} style={{ marginLeft: 4 }}>数据库</ThemedText>
            </TouchableOpacity>
            <ThemedText 
              variant="caption" 
              color={wordCount >= WORD_COUNT_WARNING_THRESHOLD ? '#C8102E' : theme.textMuted}
            >
              {wordCount}字
            </ThemedText>
            <TouchableOpacity style={styles.searchButton} onPress={openSearchModal}>
              <Feather name="search" size={16} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 章节选择下拉 */}
        {showChapterList && (
          <View style={styles.chapterDropdown}>
            <View style={styles.chapterDropdownHeader}>
              <ThemedText variant="small" color={theme.textPrimary}>章节</ThemedText>
              <TouchableOpacity onPress={handleAddChapter}>
                <Feather name="plus" size={18} color="#C8102E" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.chapterDropdownList}>
              {novel.chapters.map((chapter, index) => {
                // 计算显示标题：第一章节显示"正文显示"第X章"
                const displayTitle = `第${chapter.order}章 ${chapter.title}`;
                return (
                  <TouchableOpacity
                    key={chapter.id}
                    style={[
                      styles.chapterDropdownItem,
                      currentChapterId === chapter.id && styles.chapterDropdownItemActive,
                    ]}
                    onPress={() => handleSelectChapter(chapter.id, chapter.title)}
                  >
                    <ThemedText
                      variant="caption"
                      color={currentChapterId === chapter.id ? '#C8102E' : theme.textPrimary}
                      numberOfLines={1}
                    >
                      {displayTitle}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 第一章生成区域 */}
        {isGeneratingFirstChapter && (
          <View style={styles.firstChapterGeneratingContainer}>
            <View style={styles.firstChapterHeader}>
              <ActivityIndicator size="small" color="#C8102E" />
              <ThemedText variant="small" color="#C8102E" style={styles.firstChapterHeaderText}>
                正在生成第一章开头...
              </ThemedText>
            </View>
            <View style={styles.firstChapterContentBox}>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.firstChapterContentText}>
                {firstChapterContent || '正在构思中...'}
              </ThemedText>
            </View>
            <View style={styles.firstChapterHint}>
              <View style={styles.worldSettingsRow}>
                <ThemedText variant="caption" color={theme.textMuted}>
                  世界：{worldSettings.worldName || '未设置'} · 年代：{worldSettings.eraBackground || '现代社会'} · 季节：{worldSettings.seasonSetting || '春季'}
                </ThemedText>
                <TouchableOpacity onPress={handleEditWorldSettings} style={styles.editWorldSettingsBtn}>
                  <ThemedText variant="caption" color="#C8102E">编辑</ThemedText>
                </TouchableOpacity>
              </View>
              {worldSettings.protagonistDoing && (
                <ThemedText variant="caption" color={theme.textMuted}>
                  主角正在：{worldSettings.protagonistDoing}
                </ThemedText>
              )}
            </View>
          </View>
        )}

        {/* AI模型选择与调用次数显示 */}
        <View style={styles.aiUsageContainer}>
          {/* 模型选择按钮 */}
          <TouchableOpacity 
            style={styles.modelSelector}
            onPress={() => setShowModelSelector(!showModelSelector)}
          >
            <View style={styles.modelSelectorLeft}>
              <Feather name="cpu" size={16} color="#C8102E" />
              <View style={styles.modelInfo}>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  {aiUsage?.modelName || '选择模型'}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  {aiUsage?.modelProvider || ''}
                </ThemedText>
              </View>
            </View>
            <Feather 
              name={showModelSelector ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={theme.textMuted} 
            />
          </TouchableOpacity>

          {/* 调用次数显示 */}
          {aiUsage && (
            <View style={styles.usageStats}>
              <View style={styles.usageProgressContainer}>
                <View style={styles.usageProgress}>
                  <View 
                    style={[
                      styles.usageProgressFill, 
                      { width: `${Math.min(100, (aiUsage.todayCalls / aiUsage.dailyLimit) * 100)}%` }
                    ]} 
                  />
                </View>
                <ThemedText variant="caption" color={theme.textMuted}>
                  今日 {aiUsage.todayCalls}/{aiUsage.dailyLimit}
                </ThemedText>
              </View>
              <View style={styles.usageRemaining}>
                <ThemedText variant="smallMedium" color="#C8102E">
                  剩余 {aiUsage.remainingCalls} 次
                </ThemedText>
              </View>
            </View>
          )}

          {/* 模型选择下拉菜单 */}
          {showModelSelector && (
            <View style={styles.modelDropdown}>
              <ScrollView style={styles.modelDropdownList} nestedScrollEnabled>
                {aiModels.map((model) => (
                  <TouchableOpacity
                    key={model.id}
                    style={[
                      styles.modelOption,
                      selectedModelId === model.id && styles.modelOptionActive,
                    ]}
                    onPress={() => handleSelectModel(model.id)}
                  >
                    <View style={styles.modelOptionContent}>
                      <View style={styles.modelOptionHeader}>
                        <ThemedText 
                          variant="smallMedium" 
                          color={selectedModelId === model.id ? '#C8102E' : theme.textPrimary}
                        >
                          {model.name}
                        </ThemedText>
                        <ThemedText variant="caption" color={theme.textMuted}>
                          {model.provider}
                        </ThemedText>
                      </View>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {model.description}
                      </ThemedText>
                      <View style={styles.modelOptionFooter}>
                        <View style={styles.modelLimitTag}>
                          <ThemedText variant="caption" color="#C8102E">
                            每日 {model.dailyLimit} 次
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                    {selectedModelId === model.id && (
                      <Feather name="check" size={18} color="#C8102E" style={styles.modelCheckIcon} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* 书写区域 - 最大化 */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.writingArea}
          contentContainerStyle={[
            styles.writingContent,
            isKeyboardVisible && styles.writingContentKeyboard,
          ]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            ref={textInputRef}
            style={[
              styles.contentInput, 
              {
                fontSize: textFormat.fontSize,
                fontFamily: textFormat.fontFamily === '默认字体' ? undefined : textFormat.fontFamily,
                fontWeight: getCurrentFontWeight(),
                fontStyle: textFormat.isItalic ? 'italic' : 'normal',
                textDecorationLine: [
                  textFormat.isUnderline ? 'underline' : undefined,
                  textFormat.isStrikethrough ? 'line-through' : undefined,
                ].filter(Boolean).join(' ') as any || 'none',
                lineHeight: textFormat.fontSize * 1.6,
              }
            ]}
            value={content}
            onChangeText={setContent}
            placeholder="开始创作你的故事..."
            placeholderTextColor={theme.textMuted}
            multiline
            textAlignVertical="top"
            editable={inputMode === 'manual'}
            onContentSizeChange={(e) => handleContentSizeChange(e.nativeEvent.contentSize.width, e.nativeEvent.contentSize.height)}
            scrollEnabled={false}
            selection={selection}
            onSelectionChange={handleSelectionChange}
          />
        </ScrollView>

        {/* 底部工具栏 - 紧凑布局 */}
        <View style={styles.inputToolbar}>
          {/* 保存按钮和格式工具栏同行 */}
          <View style={styles.formatToolbar}>
            {/* 保存按钮 */}
            <TouchableOpacity
              style={[styles.saveButtonInline, isSaving && styles.saveButtonDisabled]}
              onPress={handleManualSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="save" size={14} color="#FFFFFF" />
                  <ThemedText variant="caption" color="#FFFFFF" style={{ marginLeft: 2 }}>
                    保存
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>

            {/* 分隔线 */}
            <View style={styles.formatDivider} />

            {/* 字体选择 */}
            <TouchableOpacity 
              style={styles.formatBtn}
              onPress={() => openFormatModal('font')}
            >
              <Feather name="type" size={14} color={theme.textPrimary} />
              <ThemedText variant="caption" color={theme.textMuted} style={{ marginLeft: 2 }}>
                {textFormat.fontFamily}
              </ThemedText>
            </TouchableOpacity>

            {/* 字号选择 */}
            <TouchableOpacity 
              style={styles.formatBtn}
              onPress={() => openFormatModal('fontSize')}
            >
              <ThemedText variant="small" color={theme.textPrimary} style={{ fontWeight: '600' }}>
                {textFormat.fontSize}
              </ThemedText>
            </TouchableOpacity>

            {/* 分隔线 */}
            <View style={styles.formatDivider} />

            {/* 加粗 */}
            <TouchableOpacity 
              style={[styles.formatBtn, textFormat.isBold && styles.formatBtnActive]}
              onPress={toggleBold}
            >
              <ThemedText 
                variant="small" 
                color={textFormat.isBold ? '#C8102E' : theme.textPrimary}
                style={{ fontWeight: '700' }}
              >
                B
              </ThemedText>
            </TouchableOpacity>

            {/* 斜体 */}
            <TouchableOpacity 
              style={[styles.formatBtn, textFormat.isItalic && styles.formatBtnActive]}
              onPress={toggleItalic}
            >
              <ThemedText 
                variant="small" 
                color={textFormat.isItalic ? '#C8102E' : theme.textPrimary}
                style={{ fontStyle: 'italic' }}
              >
                I
              </ThemedText>
            </TouchableOpacity>

            {/* 下划线 */}
            <TouchableOpacity 
              style={[styles.formatBtn, textFormat.isUnderline && styles.formatBtnActive]}
              onPress={toggleUnderline}
            >
              <ThemedText 
                variant="small" 
                color={textFormat.isUnderline ? '#C8102E' : theme.textPrimary}
                style={{ textDecorationLine: 'underline' }}
              >
                U
              </ThemedText>
            </TouchableOpacity>

            {/* 删除线 */}
            <TouchableOpacity 
              style={[styles.formatBtn, textFormat.isStrikethrough && styles.formatBtnActive]}
              onPress={toggleStrikethrough}
            >
              <ThemedText 
                variant="small" 
                color={theme.textPrimary}
                style={{ textDecorationLine: 'line-through' }}
              >
                S
              </ThemedText>
            </TouchableOpacity>

            {/* 标记线 */}
            <TouchableOpacity 
              style={[styles.formatBtn, textFormat.highlightColor && styles.formatBtnActive]}
              onPress={() => openFormatModal('highlight')}
            >
              <View style={[
                styles.highlightIcon, 
                textFormat.highlightColor && { borderColor: textFormat.highlightColor }
              ]}>
                <Feather name="circle" size={12} color={textFormat.highlightColor || theme.textMuted} />
              </View>
            </TouchableOpacity>

            {/* 清除格式 */}
            <TouchableOpacity 
              style={styles.formatBtn}
              onPress={clearAllFormats}
            >
              <Feather name="x-circle" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* 角色信息栏 - 缩小 */}
          <View style={styles.characterBar}>
            {maleCharacter && (
              <TouchableOpacity
                style={styles.characterChip}
                onPress={() => {
                  setSelectedCharacter(maleCharacter);
                  setShowCharacterModal(true);
                }}
              >
                <ThemedText variant="caption" color="#C8102E">男主角：</ThemedText>
                <ThemedText variant="caption" color={theme.textPrimary} numberOfLines={1}>
                  {maleCharacter.name}
                </ThemedText>
                <Feather name="info" size={12} color={theme.textMuted} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            )}
            {femaleCharacter && (
              <TouchableOpacity
                style={styles.characterChip}
                onPress={() => {
                  setSelectedCharacter(femaleCharacter);
                  setShowCharacterModal(true);
                }}
              >
                <ThemedText variant="caption" color="#C8102E">女主角：</ThemedText>
                <ThemedText variant="caption" color={theme.textPrimary} numberOfLines={1}>
                  {femaleCharacter.name}
                </ThemedText>
                <Feather name="info" size={12} color={theme.textMuted} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            )}

            {/* 配角信息加号 */}
            <TouchableOpacity
              style={[styles.characterChip, styles.addCharacterChip]}
              onPress={() => setShowAddSideCharacterModal(true)}
            >
              <Feather name="plus" size={16} color="#C8102E" />
            </TouchableOpacity>
          </View>

          {/* 输入控制栏 */}
          <View style={styles.controlBar}>
            {/* 左侧：输入模式 */}
            <TouchableOpacity style={styles.modeButton} onPress={toggleInputMode}>
              <Feather
                name={inputMode === 'manual' ? 'edit-3' : 'mic'}
                size={14}
                color={inputMode === 'manual' ? theme.textPrimary : '#C8102E'}
              />
              <ThemedText
                variant="caption"
                color={inputMode === 'manual' ? theme.textMuted : '#C8102E'}
                style={{ marginLeft: 4 }}
              >
                {inputMode === 'manual' ? '手动' : '语音'}
              </ThemedText>
            </TouchableOpacity>

            {/* 中间：标点符号快捷输入 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.punctuationBar}
              contentContainerStyle={styles.punctuationContent}
            >
              {PUNCTUATION_MARKS.map((mark, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.punctuationBtn}
                  onPress={() => insertPunctuation(mark)}
                >
                  <ThemedText variant="small" color={theme.textPrimary}>{mark}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 右侧：AI续写 */}
            <TouchableOpacity
              style={[styles.aiButton, isGenerating && styles.aiButtonDisabled]}
              onPress={handleOpenContinueModal}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="feather" size={14} color="#FFFFFF" />
                  <ThemedText variant="caption" color="#FFFFFF" style={{ marginLeft: 4 }}>
                    AI续写
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 语音输入按钮（语音模式下显示） */}
        {inputMode === 'voice' && (
          <TouchableOpacity style={styles.voiceButton} onPress={handleVoiceInput}>
            <View style={styles.voiceButtonInner}>
              <Feather name="mic" size={24} color="#FFFFFF" />
            </View>
            <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: 8 }}>
              点击开始语音输入
            </ThemedText>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>

      {/* 添加章节对话框 */}
      {showChapterInput && (
        <View style={styles.chapterInputOverlay}>
          <View style={styles.chapterInputDialog}>
            <ThemedText variant="small" color={theme.textPrimary} style={styles.chapterInputTitle}>
              添加章节
            </ThemedText>
            <TextInput
              style={styles.chapterInputField}
              value={newChapterName}
              onChangeText={setNewChapterName}
              placeholder="请输入章节名称"
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            <View style={styles.chapterInputActions}>
              <TouchableOpacity
                style={styles.chapterInputCancel}
                onPress={() => {
                  setShowChapterInput(false);
                  setNewChapterName('');
                }}
              >
                <ThemedText variant="small" color={theme.textMuted}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chapterInputConfirm} onPress={confirmAddChapter}>
                <ThemedText variant="small" color="#FFFFFF">确定</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* AI续写弹窗 */}
      <Modal
        visible={showContinueModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContinueModal(false)}
      >
        <View style={styles.continueModalOverlay}>
          <View style={styles.continueModalContent}>
            <View style={styles.continueModalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                AI续写
              </ThemedText>
              <TouchableOpacity onPress={() => setShowContinueModal(false)}>
                <Feather name="x" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: 8 }}>
              输入续写走向（可选）
            </ThemedText>

            <TextInput
              style={styles.continueInput}
              value={continueDirection}
              onChangeText={(text) => {
                setContinueDirection(text);
                // 分析续写走向中的角色
                if (text.length > 2 && novel) {
                  analyzeCharactersInDirection(text);
                } else {
                  setAnalyzedCharacters({ matched: [], unmatched: [] });
                }
              }}
              placeholder="例如：主角发现了一个惊天秘密..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              autoFocus
            />

            {/* 角色分析结果显示 */}
            {(analyzedCharacters.matched.length > 0 || analyzedCharacters.unmatched.length > 0) && (
              <View style={{ marginTop: 12, padding: 12, backgroundColor: theme.backgroundDefault, borderRadius: 8 }}>
                <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: 8 }}>
                  角色识别结果
                </ThemedText>
                
                {analyzedCharacters.matched.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <ThemedText variant="caption" color={theme.success}>
                      ✓ 已匹配角色：{analyzedCharacters.matched.map(c => c.name).join('、')}
                    </ThemedText>
                  </View>
                )}
                
                {analyzedCharacters.unmatched.length > 0 && (
                  <View>
                    <ThemedText variant="caption" color={theme.error}>
                      ⚠ 新角色（将自动创建）：{analyzedCharacters.unmatched.join('、')}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            {isAnalyzing && (
              <View style={{ marginTop: 8, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            )}

            <View style={styles.continueQuickOptions}>
              <TouchableOpacity
                style={styles.quickOption}
                onPress={() => setContinueDirection('情节出现意外转折')}
              >
                <ThemedText variant="caption" color="#C8102E">意外转折</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickOption}
                onPress={() => setContinueDirection('增加浪漫情节')}
              >
                <ThemedText variant="caption" color="#C8102E">浪漫情节</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickOption}
                onPress={() => setContinueDirection('引入新角色')}
              >
                <ThemedText variant="caption" color="#C8102E">引入新角色</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickOption}
                onPress={() => setContinueDirection('增加悬念')}
              >
                <ThemedText variant="caption" color="#C8102E">增加悬念</ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.continueGenerateButton}
              onPress={() => handleGenerate(false)}
              disabled={isGenerating || isCheckingConflict}
            >
              {isGenerating || isCheckingConflict ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="feather" size={16} color="#FFFFFF" />
                  <ThemedText variant="small" color="#FFFFFF" style={{ marginLeft: 8 }}>
                    开始续写
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 冲突检测弹窗 */}
      <Modal
        visible={showConflictModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConflictModal(false)}
      >
        <View style={styles.continueModalOverlay}>
          <View style={[styles.continueModalContent, { maxHeight: '70%' }]}>
            <View style={styles.continueModalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                ⚠️ 检测到潜在冲突
              </ThemedText>
              <TouchableOpacity onPress={() => setShowConflictModal(false)}>
                <Feather name="x" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: 16 }}>
                续写走向与部分角色设定存在冲突，请选择处理方式
              </ThemedText>

              {conflictInfo?.conflicts.map((conflict, index) => (
                <View key={index} style={[styles.characterInfoSection, { backgroundColor: theme.backgroundDefault, borderRadius: 8, padding: 12, marginBottom: 12 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Feather name="alert-triangle" size={16} color={theme.error} style={{ marginRight: 8 }} />
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>
                      {conflict.characterName}
                    </ThemedText>
                  </View>
                  <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: 4 }}>
                    冲突类型：{conflict.conflictType}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: 4 }}>
                    问题描述：{conflict.description}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.error}>
                    原因：{conflict.reason}
                  </ThemedText>
                </View>
              ))}

              {conflictInfo?.suggestion?.canCreateTempCharacter && conflictInfo.suggestion.tempCharacterSuggestion && (
                <View style={{ marginTop: 16, padding: 16, backgroundColor: theme.primaryLight, borderRadius: 8 }}>
                  <ThemedText variant="smallMedium" color={theme.primary} style={{ marginBottom: 8 }}>
                    💡 建议创建临时角色
                  </ThemedText>
                  <ThemedText variant="small" color={theme.textPrimary} style={{ marginBottom: 4 }}>
                    角色名：{conflictInfo.suggestion.tempCharacterSuggestion.name}
                  </ThemedText>
                  <ThemedText variant="small" color={theme.textPrimary} style={{ marginBottom: 4 }}>
                    角色定位：{conflictInfo.suggestion.tempCharacterSuggestion.role}
                  </ThemedText>
                  <ThemedText variant="small" color={theme.textPrimary} style={{ marginBottom: 4 }}>
                    创建理由：{conflictInfo.suggestion.tempCharacterSuggestion.reason}
                  </ThemedText>
                  <ThemedText variant="small" color={theme.textMuted}>
                    建议台词："{conflictInfo.suggestion.tempCharacterSuggestion.suggestedDialogue}"
                  </ThemedText>
                </View>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              <TouchableOpacity
                style={[styles.continueGenerateButton, { backgroundColor: theme.textMuted }]}
                onPress={() => setShowConflictModal(false)}
              >
                <ThemedText variant="small" color="#FFFFFF">取消续写</ThemedText>
              </TouchableOpacity>
              {conflictInfo?.suggestion?.canCreateTempCharacter && conflictInfo.suggestion.tempCharacterSuggestion && (
                <TouchableOpacity
                  style={[styles.continueGenerateButton, { backgroundColor: theme.primary }]}
                  onPress={() => handleGenerateWithSuggestion()}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <ThemedText variant="small" color="#FFFFFF">采用建议</ThemedText>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.continueGenerateButton, { flex: 1, minWidth: 120 }]}
                onPress={() => handleGenerate(true)}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText variant="small" color="#FFFFFF">忽略冲突继续</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 角色详情弹窗 */}
      <Modal
        visible={showCharacterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCharacterModal(false)}
      >
        <TouchableOpacity 
          style={styles.characterModalOverlay}
          activeOpacity={1}
          onPress={() => setShowCharacterModal(false)}
        >
          <TouchableOpacity 
            style={styles.characterModalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.characterModalHeader}>
              <View style={styles.characterModalTitleRow}>
                <View style={[styles.characterAvatar, { backgroundColor: selectedCharacter?.gender === '男' ? '#3B82F6' : '#EC4899' }]}>
                  <Feather name="user" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {selectedCharacter?.name}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {selectedCharacter?.gender === '男' ? '男主角' : '女主角'}
                  </ThemedText>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCharacterModal(false)}>
                <Feather name="x" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.characterModalBody}>
              <View style={styles.characterInfoRow}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.characterInfoLabel}>
                  年龄
                </ThemedText>
                <ThemedText variant="small" color={theme.textPrimary}>
                  {selectedCharacter?.age}岁
                </ThemedText>
              </View>

              <View style={styles.characterInfoRow}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.characterInfoLabel}>
                  职业
                </ThemedText>
                <ThemedText variant="small" color={theme.textPrimary}>
                  {selectedCharacter?.occupation}
                </ThemedText>
              </View>

              <View style={styles.characterInfoRow}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.characterInfoLabel}>
                  外貌
                </ThemedText>
                <ThemedText variant="small" color={theme.textPrimary}>
                  {selectedCharacter?.appearance || '暂无'}
                </ThemedText>
              </View>

              <View style={styles.characterInfoSection}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.characterInfoLabel}>
                  性格特点
                </ThemedText>
                <ThemedText variant="small" color={theme.textPrimary} style={styles.characterInfoValue}>
                  {selectedCharacter?.personality || '暂无'}
                </ThemedText>
              </View>

              <View style={styles.characterInfoSection}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.characterInfoLabel}>
                  背景故事
                </ThemedText>
                <ThemedText variant="small" color={theme.textPrimary} style={styles.characterInfoValue}>
                  {selectedCharacter?.background || '暂无'}
                </ThemedText>
              </View>

              {selectedCharacter?.traits && selectedCharacter.traits.length > 0 && (
                <View style={styles.characterInfoSection}>
                  <ThemedText variant="caption" color={theme.textMuted} style={styles.characterInfoLabel}>
                    人物标签
                  </ThemedText>
                  <View style={styles.traitsContainer}>
                    {selectedCharacter.traits.map((trait, index) => (
                      <View key={index} style={styles.traitTag}>
                        <ThemedText variant="caption" color="#C8102E">{trait}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={styles.characterModalClose}
              onPress={() => setShowCharacterModal(false)}
            >
              <ThemedText variant="small" color="#C8102E">关闭</ThemedText>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 格式设置弹窗 */}
      <Modal
        visible={showFormatModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFormatModal(false)}
      >
        <TouchableOpacity 
          style={styles.formatModalOverlay}
          activeOpacity={1}
          onPress={() => setShowFormatModal(false)}
        >
          <TouchableOpacity 
            style={styles.formatModalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.formatModalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                {formatModalType === 'font' && '选择字体'}
                {formatModalType === 'fontSize' && '选择字号'}
                {formatModalType === 'bold' && '加粗程度'}
                {formatModalType === 'highlight' && '标记线颜色'}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowFormatModal(false)}>
                <Feather name="x" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* 字体选择 */}
            {formatModalType === 'font' && (
              <View style={styles.formatOptions}>
                {FONT_OPTIONS.map((font) => (
                  <TouchableOpacity
                    key={font}
                    style={[
                      styles.formatOption,
                      textFormat.fontFamily === font && styles.formatOptionActive,
                    ]}
                    onPress={() => setFontFamily(font)}
                  >
                    <ThemedText 
                      variant="small" 
                      color={textFormat.fontFamily === font ? '#C8102E' : theme.textPrimary}
                    >
                      {font}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 字号选择 */}
            {formatModalType === 'fontSize' && (
              <View style={styles.formatOptions}>
                {FONT_SIZE_OPTIONS.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.formatOption,
                      textFormat.fontSize === size && styles.formatOptionActive,
                    ]}
                    onPress={() => setFontSize(size)}
                  >
                    <ThemedText 
                      variant="small" 
                      color={textFormat.fontSize === size ? '#C8102E' : theme.textPrimary}
                    >
                      {size}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 加粗档位选择 */}
            {formatModalType === 'bold' && (
              <View style={styles.formatOptions}>
                {BOLD_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.formatOption,
                      textFormat.boldLevel === option.value && styles.formatOptionActive,
                    ]}
                    onPress={() => setBoldLevel(option.value)}
                  >
                    <ThemedText 
                      variant="small" 
                      color={textFormat.boldLevel === option.value ? '#C8102E' : theme.textPrimary}
                      style={{ fontWeight: option.fontWeight }}
                    >
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 标记线颜色选择 */}
            {formatModalType === 'highlight' && (
              <View style={styles.formatOptions}>
                <TouchableOpacity
                  style={[styles.formatOption, !textFormat.highlightColor && styles.formatOptionActive]}
                  onPress={() => setHighlightColor(null)}
                >
                  <ThemedText variant="small" color={!textFormat.highlightColor ? '#C8102E' : theme.textPrimary}>
                    无
                  </ThemedText>
                </TouchableOpacity>
                {HIGHLIGHT_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color.value}
                    style={[
                      styles.formatOption,
                      textFormat.highlightColor === color.value && styles.formatOptionActive,
                    ]}
                    onPress={() => setHighlightColor(color.value)}
                  >
                    <View style={[styles.colorPreview, { backgroundColor: color.value }]} />
                    <ThemedText 
                      variant="caption" 
                      color={textFormat.highlightColor === color.value ? '#C8102E' : theme.textPrimary}
                    >
                      {color.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 查找替换弹窗 */}
      <Modal
        visible={showSearchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.searchModalOverlay}>
          <View style={styles.searchModalContent}>
            <View style={styles.searchModalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                查找与替换
              </ThemedText>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                <Feather name="x" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* 搜索输入 */}
            <View style={styles.searchInputRow}>
              <View style={styles.searchInputWrap}>
                <Feather name="search" size={16} color={theme.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={searchText}
                  onChangeText={(text) => {
                    setSearchText(text);
                    if (text.trim()) {
                      performSearch(text);
                    } else {
                      setSearchResults({ exact: [], synonyms: [] });
                    }
                  }}
                  placeholder="输入要查找的内容..."
                  placeholderTextColor={theme.textMuted}
                  returnKeyType="search"
                />
                {isSearching && <ActivityIndicator size="small" color="#C8102E" />}
              </View>
            </View>

            {/* 替换输入 */}
            <View style={styles.searchInputRow}>
              <View style={styles.searchInputWrap}>
                <Feather name="edit-2" size={16} color={theme.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={replaceText}
                  onChangeText={setReplaceText}
                  placeholder="替换为..."
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            {/* 搜索结果 */}
            <ScrollView style={styles.searchResultsList}>
              {/* 精确匹配结果 */}
              {searchResults.exact.length > 0 && (
                <View style={styles.searchResultSection}>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    精确匹配 ({searchResults.exact.length}处)
                  </ThemedText>
                  {searchResults.exact.map((result, idx) => {
                    // 获取上下文
                    const contextStart = Math.max(0, result.index - 10);
                    const contextEnd = Math.min(content.length, result.index + result.text.length + 10);
                    const beforeText = content.substring(contextStart, result.index);
                    const matchText = content.substring(result.index, result.index + result.text.length);
                    const afterText = content.substring(result.index + result.text.length, contextEnd);
                    
                    return (
                      <TouchableOpacity
                        key={`exact-${idx}`}
                        style={[
                          styles.searchResultItem,
                          currentSearchIndex === idx && styles.searchResultItemActive,
                        ]}
                        onPress={() => {
                          setCurrentSearchIndex(idx);
                          jumpToSearchResult(result.index, result.text.length);
                        }}
                        onLongPress={() => {
                          if (replaceText.trim()) {
                            replaceSingle(result.index, result.text);
                          }
                        }}
                      >
                        <ThemedText variant="small" color={theme.textPrimary} numberOfLines={1}>
                          ...{beforeText}
                          <ThemedText variant="small" color="#C8102E" style={{ fontWeight: '600' }}>
                            {matchText}
                          </ThemedText>
                          {afterText}...
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* AI近义词匹配结果 */}
              {searchResults.synonyms.length > 0 && (
                <View style={styles.searchResultSection}>
                  <View style={styles.synonymSectionHeader}>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      AI近义词匹配 ({searchResults.synonyms.length}处)
                    </ThemedText>
                    <View style={styles.aiTag}>
                      <ThemedText variant="caption" color="#FFFFFF">AI</ThemedText>
                    </View>
                  </View>
                  {searchResults.synonyms.map((result, idx) => {
                    const contextStart = Math.max(0, result.index - 10);
                    const contextEnd = Math.min(content.length, result.index + result.text.length + 10);
                    const beforeText = content.substring(contextStart, result.index);
                    const matchText = content.substring(result.index, result.index + result.text.length);
                    const afterText = content.substring(result.index + result.text.length, contextEnd);
                    
                    return (
                      <TouchableOpacity
                        key={`synonym-${idx}`}
                        style={styles.searchResultItem}
                        onPress={() => jumpToSearchResult(result.index, result.text.length)}
                        onLongPress={() => {
                          if (replaceText.trim()) {
                            replaceSingle(result.index, result.text);
                          }
                        }}
                      >
                        <ThemedText variant="small" color={theme.textPrimary} numberOfLines={1}>
                          ...{beforeText}
                          <ThemedText variant="small" color="#8B5CF6" style={{ fontWeight: '600' }}>
                            {matchText}
                          </ThemedText>
                          {afterText}...
                        </ThemedText>
                        <ThemedText variant="caption" color="#8B5CF6" style={styles.synonymLabel}>
                          "{searchText}"的近义词: {result.synonym}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* 无结果提示 */}
              {searchText && !isSearching && searchResults.exact.length === 0 && searchResults.synonyms.length === 0 && (
                <View style={styles.noResultContainer}>
                  <Feather name="search" size={32} color={theme.textMuted} />
                  <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: 8 }}>
                    未找到相关内容
                  </ThemedText>
                </View>
              )}
            </ScrollView>

            {/* 操作按钮 */}
            <View style={styles.searchActions}>
              <TouchableOpacity
                style={[
                  styles.searchActionBtn,
                  (searchResults.exact.length === 0 && searchResults.synonyms.length === 0) && styles.searchActionBtnDisabled,
                ]}
                onPress={replaceAll}
                disabled={searchResults.exact.length === 0 && searchResults.synonyms.length === 0}
              >
                <Feather name="refresh-cw" size={16} color="#FFFFFF" />
                <ThemedText variant="small" color="#FFFFFF" style={{ marginLeft: 6 }}>
                  全部替换 ({searchResults.exact.length + searchResults.synonyms.length}处)
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 字数提醒弹窗 */}
      <Modal
        visible={showWordCountAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWordCountAlert(false)}
      >
        <View style={styles.wordCountAlertOverlay}>
          <View style={styles.wordCountAlertContent}>
            <View style={styles.wordCountAlertIcon}>
              <Feather name="alert-circle" size={48} color="#C8102E" />
            </View>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.wordCountAlertTitle}>
              字数提醒
            </ThemedText>
            <ThemedText variant="body" color={theme.textSecondary} style={styles.wordCountAlertText}>
              当前章节已达到 {wordCount} 字，接近建议上限 {WORD_COUNT_MAX} 字。
            </ThemedText>
            <ThemedText variant="small" color={theme.textMuted} style={styles.wordCountAlertHint}>
              {'\n'}过长章节可能导致剧本生成时超时，建议分章节创作。{'\n\n'}
              您可以继续创作，或考虑新建章节。
            </ThemedText>
            <View style={styles.wordCountAlertButtons}>
              <TouchableOpacity
                style={styles.wordCountAlertButtonSecondary}
                onPress={() => {
                  setShowWordCountAlert(false);
                  handleAddChapter();
                }}
              >
                <ThemedText variant="body" color="#C8102E">新建章节</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.wordCountAlertButtonPrimary}
                onPress={() => setShowWordCountAlert(false)}
              >
                <ThemedText variant="body" color="#FFFFFF">继续创作</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 添加配角选择框 */}
      <Modal
        visible={showAddSideCharacterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddSideCharacterModal(false)}
      >
        <View style={styles.addSideCharacterModalOverlay}>
          <View style={styles.addSideCharacterModalContent}>
            <View style={styles.addSideCharacterModalHeader}>
              <ThemedText variant="h3" color={theme.textPrimary}>
                添加配角
              </ThemedText>
              <TouchableOpacity onPress={() => setShowAddSideCharacterModal(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.addSideCharacterModalBody}>
              <TouchableOpacity
                style={styles.addSideCharacterOption}
                onPress={() => {
                  setShowAddSideCharacterModal(false);
                  router.push('/character');
                }}
              >
                <View style={styles.addSideCharacterOptionIcon}>
                  <Feather name="plus-circle" size={32} color="#C8102E" />
                </View>
                <View style={styles.addSideCharacterOptionContent}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    生成新角色
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    生成后会自动绑定到本小说
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addSideCharacterOption}
                onPress={() => {
                  setShowAddSideCharacterModal(false);
                  // 传递novelId，确保返回时novel不会丢失
                  router.push(`/character-list?mode=select&returnTo=/novel-writing&novelId=${novel?.id || ''}`);
                }}
              >
                <View style={styles.addSideCharacterOptionIcon}>
                  <Feather name="users" size={32} color="#C8102E" />
                </View>
                <View style={styles.addSideCharacterOptionContent}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    从角色库选择
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    选择已创建的角色
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 世界设定编辑弹窗 */}
      <Modal
        visible={showWorldSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWorldSettingsModal(false)}
      >
        <View style={styles.addSideCharacterModalOverlay}>
          <View style={styles.addSideCharacterModalContent}>
            <View style={styles.addSideCharacterModalHeader}>
              <ThemedText variant="h3" color={theme.textPrimary}>
                世界设定
              </ThemedText>
              <TouchableOpacity onPress={() => setShowWorldSettingsModal(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.addSideCharacterModalBody}>
              <View style={styles.addSideCharacterOption}>
                <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: 8 }}>
                  世界名称
                </ThemedText>
                <TextInput
                  style={styles.continueInput}
                  value={editingWorldSettings.worldName || ''}
                  onChangeText={(text) => setEditingWorldSettings({ ...editingWorldSettings, worldName: text })}
                  placeholder="如：现代都市、古风仙侠等"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.addSideCharacterOption}>
                <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: 8 }}>
                  年代背景
                </ThemedText>
                <TextInput
                  style={styles.continueInput}
                  value={editingWorldSettings.eraBackground || ''}
                  onChangeText={(text) => setEditingWorldSettings({ ...editingWorldSettings, eraBackground: text })}
                  placeholder="如：现代社会、80年代等"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.addSideCharacterOption}>
                <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: 8 }}>
                  季节设定
                </ThemedText>
                <TextInput
                  style={styles.continueInput}
                  value={editingWorldSettings.seasonSetting || ''}
                  onChangeText={(text) => setEditingWorldSettings({ ...editingWorldSettings, seasonSetting: text })}
                  placeholder="如：春季、夏季等"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.addSideCharacterOption}>
                <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: 8 }}>
                  主角当前活动
                </ThemedText>
                <TextInput
                  style={styles.continueInput}
                  value={editingWorldSettings.protagonistDoing || ''}
                  onChangeText={(text) => setEditingWorldSettings({ ...editingWorldSettings, protagonistDoing: text })}
                  placeholder="描述主角当前正在做什么"
                  placeholderTextColor={theme.textMuted}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.addSideCharacterModalBody}>
              <TouchableOpacity
                style={[styles.addSideCharacterOption, { backgroundColor: '#C8102E', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
                onPress={handleSaveWorldSettings}
              >
                <ThemedText variant="smallMedium" color="#FFFFFF">
                  保存
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 悬浮球 */}
      <FloatingBall />
    </Screen>
  );
}
