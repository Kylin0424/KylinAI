import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { FloatingBall } from '@/components/FloatingBall';
import { createStyles } from './styles';
import {
  Character,
  CharacterRelation,
  getAllCharacters,
  getAllRelations,
  deleteCharacter,
  forceDeleteCharacters,
} from '@/utils/characterStorage';
import { Novel, getAllNovels } from '@/utils/novelStorage';
import { FAMILY_RELATIONS } from '@/constants/familyRelations';

// 补充的关系类型映射（用于不在 FAMILY_RELATIONS 中的通用关系类型）
const ADDITIONAL_RELATION_LABELS: Record<string, string> = {
  // 通用家庭关系（简化版，不区分父系/母系/长幼）
  'uncle': '舅舅/伯伯/叔叔',
  'uncle_husband_side': '伯伯/叔叔',
  'uncle_wife_side': '舅舅',
  'aunt': '姨妈/姑姑',
  'aunt_husband_side': '姑妈',
  'aunt_wife_side': '姨妈',
  'cousin': '堂兄弟/表兄弟',
  'cousin_male': '堂兄弟/表兄弟',
  'cousin_female': '堂姐妹/表姐妹',
  'nephew': '侄子/外甥',
  'nephew_husband_side': '外甥',
  'nephew_wife_side': '侄子',
  'niece': '侄女/外甥女',
  'niece_husband_side': '外甥女',
  'niece_wife_side': '侄女',
  'brother_in_law': '姐夫/妹夫/小舅子/小叔子/大伯子',
  'sister_in_law': '嫂子/弟妹/小姨子/大姨子/大姑子/小姑子',

  // 朋友关系
  'friend': '朋友',
  'best_friend': '挚友',
  'close_friend': '密友',
  'buddy': '好哥们',
  'teammate': '队友',
  'classmate': '同学',
  'childhood_friend': '发小',
  'neighbor': '邻居',
  'mentor': '导师',
  'disciple': '徒弟',
  'partner': '搭档',
  'rival': '对手',
  'acquaintance': '熟人',
  'old_friend': '老友',

  // 同事关系
  'colleague': '同事',
  'workmate': '工友',
  'boss': '上司',
  'subordinate': '下属',

  // 敌对/仇恨关系
  'enemy': '仇人',
  'adversary': '对手',
  'arch_rival': '宿敌',
  'bully': '欺负者',
  'victim': '受害者',

  // 其他关系
  'family': '家庭关系',
  'relative': '亲戚',
  'other': '其他关系',
};

// 从 FAMILY_RELATIONS 构建的映射表
const FAMILY_LABELS_MAP: Record<string, string> = FAMILY_RELATIONS.reduce((acc, r) => {
  acc[r.id] = r.name;
  return acc;
}, {} as Record<string, string>);

// 合并所有关系标签映射
const ALL_RELATION_LABELS: Record<string, string> = {
  ...FAMILY_LABELS_MAP,
  ...ADDITIONAL_RELATION_LABELS,
};

type CharacterTab = 'permanent' | 'temporary';

export default function CharacterListScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const params = useSafeSearchParams<{
    mode?: string;
    returnTo?: string;
    novelId?: string;  // 添加novelId参数
  }>();

  const isSelectMode = params.mode === 'select' || params.mode === 'select-relation';
  const isSelectRelationMode = params.mode === 'select-relation';

  const [characters, setCharacters] = useState<Character[]>([]);
  const [relations, setRelations] = useState<CharacterRelation[]>([]);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CharacterTab>('permanent');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);

  // 多选模式相关状态
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);
  const [showMultiSelectConfirm, setShowMultiSelectConfirm] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const chars = await getAllCharacters();
    const rels = await getAllRelations();
    const novelList = await getAllNovels();
    setCharacters(chars);
    setRelations(rels);
    setNovels(novelList);

    // 调试：打印所有角色信息
    console.log('[CharacterList] ========== 角色列表 ==========');
    chars.forEach((char, index) => {
      console.log(`[CharacterList] 角色 ${index + 1}:`);
      console.log(`  名字: ${char.name}`);
      console.log(`  ID: ${char.id}`);
      console.log(`  novelId: ${char.novelId || '无'}`);
      console.log(`  性别: ${char.gender}, 年龄: ${char.age}, 职业: ${char.occupation}`);
    });
    console.log('[CharacterList] =============================');

    setIsLoading(false);
  };

  // 状态持久化：保存activeTab
  useEffect(() => {
    AsyncStorage.setItem('characterList_activeTab', activeTab);
  }, [activeTab]);

  // 状态持久化：保存selectedCharacterIds
  useEffect(() => {
    AsyncStorage.setItem('characterList_selectedIds', JSON.stringify(selectedCharacterIds));
  }, [selectedCharacterIds]);

  useFocusEffect(
    useCallback(() => {
      // 加载持久化的状态
      const loadPersistedState = async () => {
        try {
          const savedTab = await AsyncStorage.getItem('characterList_activeTab');
          const savedIds = await AsyncStorage.getItem('characterList_selectedIds');

          if (savedTab) {
            setActiveTab(savedTab as CharacterTab);
          }
          if (savedIds) {
            setSelectedCharacterIds(JSON.parse(savedIds));
          }
        } catch (error) {
          console.error('[CharacterList] Error loading persisted state:', error);
        }
      };

      loadPersistedState();
      loadData();
    }, [])
  );

  // 根据选项卡过滤角色
  const filteredCharacters = useMemo(() => {
    if (activeTab === 'temporary') {
      return characters.filter(c => c.isTemporary || c.roleType === 'temp');
    }
    return characters.filter(c => !c.isTemporary && c.roleType !== 'temp');
  }, [characters, activeTab]);

  // 获取角色关联的小说名称
  const getLinkedNovelName = (novelId: string | undefined): string | null => {
    if (!novelId) return null;
    const novel = novels.find(n => n.id === novelId);
    return novel ? novel.title : null;
  };

  // 检查角色是否被锁定
  const isCharacterLocked = (character: Character): boolean => {
    return !!character.novelId;
  };

  const handleDeleteCharacter = (character: Character) => {
    console.log('========================================');
    console.log('[CharacterList] handleDeleteCharacter called');
    console.log('[CharacterList] Character name:', character.name);
    console.log('[CharacterList] Character ID:', character.id);
    console.log('[CharacterList] Character novelId:', character.novelId);
    console.log('========================================');

    // 使用Modal显示确认对话框
    setCharacterToDelete(character);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!characterToDelete) return;

    console.log('[CharacterList] Delete confirmed for:', characterToDelete.name);
    try {
      await deleteCharacter(characterToDelete.id);
      console.log('[CharacterList] Character deleted successfully');
      loadData();
      setDeleteModalVisible(false);
      setCharacterToDelete(null);
    } catch (error) {
      console.error('[CharacterList] Error deleting character:', error);
      Alert.alert('错误', '删除失败，请重试');
    }
  };

  const handleCancelDelete = () => {
    console.log('[CharacterList] Delete cancelled');
    setDeleteModalVisible(false);
    setCharacterToDelete(null);
  };

  // 多选模式相关函数
  const handleLongPress = (character: Character) => {
    console.log('[CharacterList] Long pressed on:', character.name);
    // 触发多选模式确认弹窗
    setShowMultiSelectConfirm(true);
  };

  const handleConfirmMultiSelect = () => {
    console.log('[CharacterList] Confirmed entering multi-select mode');
    setIsMultiSelectMode(true);
    setShowMultiSelectConfirm(false);
  };

  const handleCancelMultiSelect = () => {
    console.log('[CharacterList] Cancelled entering multi-select mode');
    setShowMultiSelectConfirm(false);
  };

  const handleExitMultiSelect = () => {
    console.log('[CharacterList] Exiting multi-select mode');
    setIsMultiSelectMode(false);
    setSelectedForDelete([]);
  };

  const handleToggleSelection = (characterId: string) => {
    console.log('[CharacterList] Toggling selection for:', characterId);
    if (selectedForDelete.includes(characterId)) {
      setSelectedForDelete(selectedForDelete.filter(id => id !== characterId));
    } else {
      setSelectedForDelete([...selectedForDelete, characterId]);
    }
  };

  const handleBatchDelete = () => {
    console.log('[CharacterList] Batch delete requested for:', selectedForDelete);
    setShowBatchDeleteConfirm(true);
  };

  const handleConfirmBatchDelete = async () => {
    console.log('[CharacterList] Confirmed batch delete for:', selectedForDelete);
    try {
      await forceDeleteCharacters(selectedForDelete);
      console.log('[CharacterList] Batch delete successful');
      setSelectedForDelete([]);
      setIsMultiSelectMode(false);
      setShowBatchDeleteConfirm(false);
      loadData();
      Alert.alert('成功', `已删除 ${selectedForDelete.length} 个角色`);
    } catch (error) {
      console.error('[CharacterList] Error in batch delete:', error);
      Alert.alert('错误', '删除失败，请重试');
    }
  };

  const handleCancelBatchDelete = () => {
    console.log('[CharacterList] Cancelled batch delete');
    setShowBatchDeleteConfirm(false);
  };

  const getCharacterRelations = (charId: string): CharacterRelation[] => {
    return relations.filter(
      r => r.characterId === charId || r.relatedCharacterId === charId
    );
  };

  // 反向关系映射表
  const REVERSE_RELATIONS: Record<string, string> = {
    '父亲': '儿子',
    '母亲': '女儿',
    '爷爷': '孙子',
    '奶奶': '孙女',
    '外公': '外孙',
    '外婆': '外孙女',
    '丈夫': '妻子',
    '妻子': '丈夫',
    '儿子': '父亲',
    '女儿': '母亲',
    '兄弟': '兄弟',
    '姐妹': '姐妹',
    '兄妹': '兄妹',
    '伯伯': '侄子',
    '叔叔': '侄子',
    '姑姑': '侄子',
    '舅舅': '外甥',
    '姨妈': '外甥女',
    '公公': '儿媳',
    '婆婆': '女婿',
    '岳父': '女婿',
    '岳母': '儿媳',
    '小舅子': '姐夫',
    '大舅子': '姐夫',
    '小姨子': '妹夫',
    '大姨子': '姐夫',
    '儿媳': '公公',
    '女婿': '岳母',
    '侄子': '伯伯',
    '侄女': '伯伯',
    '外甥': '舅舅',
    '外甥女': '姨妈',
    '堂兄弟': '堂兄弟',
    '堂姐妹': '堂姐妹',
    '表兄弟': '表兄弟',
    '表姐妹': '表姐妹',
    '朋友': '朋友',
    '同事': '同事',
    '上司': '下属',
    '下属': '上司',
    '客户': '客户',
    '合伙人': '合伙人',
    '同学': '同学',
    '室友': '室友',
    '邻居': '邻居',
    '发小': '发小',
    '老同学': '老同学',
    '好哥们': '好哥们',
    '闺蜜': '闺蜜',
    '死党': '死党',
    '导师': '学生',
    '学生': '导师',
    '师傅': '徒弟',
    '徒弟': '师傅',
    '搭档': '搭档',
    '恋人': '恋人',
    '粉丝': '偶像',
    '偶像': '粉丝',
    '恩人': '受恩者',
    '债主': '债务人',
    '仇人': '仇人',
    '对手': '对手',
    '宿敌': '宿敌',
  };

  // 获取反向关系标签（系统性处理所有关系类型）
/**
 * 获取反向关系标签
 * @param relation 原关系（中文）
 * @param charGender 被叫者的性别（男/女）
 * 
 * 核心原则：根据被叫者的性别选择称呼
 * - 被叫者是男性 → 男性称呼（叔叔、舅舅、伯伯）
 * - 被叫者是女性 → 女性称呼（姑姑、姨妈、舅妈）
 */
const getReverseRelationLabel = (relation: string, charGender: string): string => {
  const r = relation;

  // 1. 父母子女关系
  // 父亲/母亲的反向是儿子/女儿（根据子女性别）
  if (r === '父亲' || r === '爸爸' || r === '爹' || r === '父亲') {
    return charGender === '男' ? '儿子' : '女儿';
  }
  if (r === '母亲' || r === '妈妈' || r === '妈') {
    return charGender === '男' ? '儿子' : '女儿';
  }
  // 儿子/女儿的反向是父亲/母亲（根据父母性别）
  if (r === '儿子') {
    return '父亲';
  }
  if (r === '女儿') {
    return '母亲';
  }

  // 2. 祖父母与孙辈（父系）
  // 爷爷/祖父（父亲的父亲）的反向是孙子/孙女
  if (r === '爷爷' || r === '祖父') {
    return charGender === '男' ? '孙子' : '孙女';
  }
  // 奶奶/祖母（父亲的母亲）的反向是孙子/孙女
  if (r === '奶奶' || r === '祖母') {
    return charGender === '男' ? '孙子' : '孙女';
  }
  // 孙子/孙女的反向：需要区分父系还是母系
  // 父系（父亲的孙子）→ 爷爷；母系（母亲的孙子）→ 外公
  if (r === '孙子') {
    return '爷爷'; // 默认父系，可在设置关系时区分
  }
  if (r === '孙女') {
    return '奶奶'; // 默认父系，可在设置关系时区分
  }

  // 2a. 外祖父母与外孙辈（母系）
  // 外公/外祖父（母亲的父亲）的反向是外孙/外孙女
  if (r === '外公' || r === '外祖父' || r === '姥爷') {
    return charGender === '男' ? '外孙' : '外孙女';
  }
  // 外婆/外祖母（母亲的母亲）的反向是外孙/外孙女
  if (r === '外婆' || r === '外祖母' || r === '姥姥') {
    return charGender === '男' ? '外孙' : '外孙女';
  }
  // 外孙/外孙女（必须是母系）的反向是外公/外婆
  if (r === '外孙') {
    return '外公';
  }
  if (r === '外孙女') {
    return '外婆';
  }

  // 3. 兄弟姐妹
  // 兄弟/兄妹/姐弟是双向对称关系，互为兄弟/姐妹
  if (r === '兄弟') {
    return '兄弟';
  }
  if (r === '姐妹') {
    return '姐妹';
  }
  if (r === '兄妹' || r === '姐弟') {
    return charGender === '男' ? '兄妹' : '姐弟';
  }
  // 单向称谓：哥哥/弟弟/姐姐/妹妹
  // 被叫者是哥哥/弟弟时，返回弟弟/哥哥
  if (r === '哥哥' || r === '兄长' || r === '哥') {
    return charGender === '男' ? '弟弟' : '妹妹';
  }
  if (r === '弟弟' || r === '弟') {
    return charGender === '男' ? '哥哥' : '姐姐';
  }
  if (r === '姐姐' || r === '姐') {
    return charGender === '男' ? '弟弟' : '妹妹';
  }
  if (r === '妹妹' || r === '妹') {
    return charGender === '男' ? '哥哥' : '姐姐';
  }

  // 4. 叔伯姑姨舅（核心原则：根据被叫者性别选择）
  // 被叫者是男性长辈 → 男性晚辈称呼（叔叔、伯伯、舅舅）
  if (r === '叔叔' || r === '伯伯' || r === '伯父' || r === '叔父' || r === '大爷') {
    return charGender === '男' ? '侄子' : '侄女';
  }
  if (r === '舅舅' || r === '舅父' || r === '舅伯' || r === '大舅' || r === '小舅') {
    return charGender === '男' ? '外甥' : '外甥女';
  }
  // 被叫者是女性长辈 → 女性晚辈称呼（姑姑、姨妈）
  if (r === '姑姑' || r === '姑妈' || r === '姑母') {
    return charGender === '男' ? '侄子' : '侄女';
  }
  if (r === '姨妈' || r === '姨母' || r === '姨姨' || r === '大姨' || r === '小姨') {
    return charGender === '男' ? '外甥' : '外甥女';
  }
  // 侄子/侄女：被叫者是侄子（男）时，叫叔叔；被叫者是侄女（女）时，叫姑姑
  if (r === '侄子') {
    return charGender === '男' ? '叔叔' : '姑姑';
  }
  if (r === '侄女') {
    return charGender === '男' ? '叔叔' : '姑姑';
  }
  // 外甥/外甥女：被叫者是外甥（男）时，叫舅舅；被叫者是外甥女（女）时，叫姨妈
  if (r === '外甥') {
    return charGender === '男' ? '舅舅' : '姨妈';
  }
  if (r === '外甥女') {
    return charGender === '男' ? '舅舅' : '姨妈';
  }

  // 5. 堂亲关系（核心原则：根据被叫者性别选择）
  // 堂哥/堂弟/堂姐/堂妹
  if (r === '堂哥' || r === '堂兄') {
    return charGender === '男' ? '堂弟' : '堂妹';
  }
  if (r === '堂弟') {
    return charGender === '男' ? '堂哥' : '堂姐';
  }
  if (r === '堂姐') {
    return charGender === '男' ? '堂弟' : '堂妹';
  }
  if (r === '堂妹') {
    return charGender === '男' ? '堂哥' : '堂姐';
  }
  // 堂兄弟/堂姐妹（统称）→ 根据性别返回具体称呼
  if (r === '堂兄弟') {
    return charGender === '男' ? '堂弟' : '堂妹';
  }
  if (r === '堂姐妹') {
    return charGender === '男' ? '堂哥' : '堂姐';
  }

  // 5a. 表亲关系（核心原则：根据被叫者性别选择）
  // 表哥/表弟/表姐/表妹
  if (r === '表哥') {
    return charGender === '男' ? '表弟' : '表妹';
  }
  if (r === '表弟') {
    return charGender === '男' ? '表哥' : '表姐';
  }
  if (r === '表姐') {
    return charGender === '男' ? '表弟' : '表妹';
  }
  if (r === '表妹') {
    return charGender === '男' ? '表哥' : '表姐';
  }
  // 表兄弟/表姐妹（统称）→ 根据性别返回具体称呼
  if (r === '表兄弟') {
    return charGender === '男' ? '表弟' : '表妹';
  }
  if (r === '表姐妹') {
    return charGender === '男' ? '表哥' : '表姐';
  }

  // 6. 翁婿/婆媳关系
  // 岳父/岳母（男性主角的岳父岳母）的反向是女婿
  if (r === '岳父' || r === '丈人') {
    return '女婿';
  }
  if (r === '岳母' || r === '丈母娘') {
    return '女婿';
  }
  // 公公/婆婆（女性主角的公公婆婆）的反向是儿媳
  if (r === '公公' || r === '婆父') {
    return '儿媳';
  }
  if (r === '婆婆' || r === '婆母') {
    return '儿媳';
  }
  // 女婿的反向：男主的岳父/女主的公公
  if (r === '女婿') {
    return charGender === '男' ? '岳父' : '公公';
  }
  // 儿媳的反向：女主的岳母/男主的婆婆
  if (r === '儿媳' || r === '儿媳妇') {
    return charGender === '男' ? '婆婆' : '岳母';
  }

  // 7. 配偶兄弟姐妹（连襟/妯娌）
  // 小舅子/大舅子（妻子的兄弟）：反向是姐夫/妹夫
  // 注意：姐夫=妻子姐姐的丈夫，妹夫=妻子妹妹的丈夫
  // 需要根据对方的性别选择
  if (r === '大舅子' || r === '小舅子' || r === '舅兄' || r === '舅弟') {
    // 被叫者是丈夫（男）→ 你是姐夫（因为对方是妻子的姐姐）
    // 被叫者是妻子（女）→ 你是嫂子
    return charGender === '男' ? '姐夫' : '嫂子';
  }
  // 小姨子/大姨子（妻子的姐妹）：反向是妹夫/弟媳
  if (r === '大姨子' || r === '小姨子' || r === '姨姐' || r === '姨妹') {
    return charGender === '男' ? '妹夫' : '弟媳';
  }
  // 大舅子（妻子的哥哥）：妻子是妹妹，妹妹的丈夫 = 妹夫
  if (r === '大舅子') {
    return '妹夫';
  }
  // 小姨子（妻子的妹妹）：妻子是姐姐，姐姐的丈夫 = 姐夫
  if (r === '小姨子') {
    return '姐夫';
  }
  // 小舅子（妻子的弟弟）：妻子是姐姐，姐姐的丈夫 = 姐夫
  if (r === '小舅子') {
    return '姐夫';
  }
  // 大姨子（妻子的姐姐）：妻子是妹妹，妹妹的丈夫 = 妹夫
  if (r === '大姨子') {
    return '妹夫';
  }
  // 小姑子（丈夫的妹妹）：丈夫是哥哥，哥哥的妻子 = 嫂子
  if (r === '小姑子') {
    return '嫂子';
  }
  // 嫂子/弟媳的反向
  if (r === '嫂子') {
    return '小叔子';
  }
  if (r === '弟媳' || r === '弟妹') {
    return '大伯子';
  }

  // 8. 配偶关系（核心原则：根据被叫者性别选择）
  // 丈夫/老公/郎君：被叫者是男性，反向是妻子
  const spouseMale = ['丈夫', '老公', '郎君', '相公', '官人'];
  // 妻子/老婆/娘子：被叫者是女性，反向是丈夫
  const spouseFemale = ['妻子', '老婆', '娘子', '太太', '夫人', '媳妇', '配偶', '爱人'];
  
  if (spouseMale.includes(r)) {
    return charGender === '男' ? '妻子' : '丈夫';
  }
  if (spouseFemale.includes(r)) {
    return charGender === '男' ? '丈夫' : '妻子';
  }

  // 9. 继亲关系
  if (r === '继父') {
    return charGender === '男' ? '继子' : '继女';
  }
  if (r === '继母') {
    return charGender === '男' ? '继子' : '继女';
  }
  if (r === '继子') {
    return charGender === '男' ? '继父' : '继母';
  }
  if (r === '继女') {
    return charGender === '男' ? '继父' : '继母';
  }

  // 10. 养亲关系
  if (r === '养父') {
    return charGender === '男' ? '养子' : '养女';
  }
  if (r === '养母') {
    return charGender === '男' ? '养子' : '养女';
  }
  if (r === '养子') {
    return charGender === '男' ? '养父' : '养母';
  }
  if (r === '养女') {
    return charGender === '男' ? '养父' : '养母';
  }

  // 11. 兄弟姐妹配偶关系（嫂子/弟妹/姐夫）
  // 嫂子（兄长的妻子）：被叫者是女性
  if (r === '嫂子' || r === '嫂嫂' || r === '兄嫂') {
    return charGender === '男' ? '小叔子' : '小姑子';
  }
  // 弟妹/弟媳（弟弟的妻子）：被叫者是女性
  if (r === '弟妹' || r === '弟妇' || r === '弟媳') {
    return charGender === '男' ? '大伯子' : '大姑子';
  }
  // 姐夫/妹夫：被叫者是姐夫（男）时，叫小姨子；被叫者是妹夫（男）时，叫大姨子
  // 注：已在第7部分处理

  // 12. 祖孙关系
  if (r === '曾祖父' || r === '高祖父') {
    return charGender === '男' ? '曾孙' : '曾孙女';
  }
  if (r === '曾祖母' || r === '高祖母') {
    return charGender === '男' ? '曾孙' : '曾孙女';
  }
  if (r === '曾孙') {
    return '曾祖父';
  }
  if (r === '曾孙女') {
    return '曾祖母';
  }

  // 13. 其他亲戚（连襟/妯娌）
  if (r === '大伯子' || r === '小伯子') {
    return charGender === '男' ? '弟妹' : '嫂子';
  }
  if (r === '大姑子' || r === '小姑子') {
    return charGender === '男' ? '弟妹' : '嫂子';
  }

  // 14. 社会关系（对称关系）
  const symmetricRelations = ['朋友', '同学', '同事', '邻居', '战友', '闺蜜', '哥们', '姐妹', '伙伴', '搭档', '合伙人', '客户', '老板', '上司', '老师', '学生', '偶像', '粉丝', '恩人', '仇人', '敌人', '对手', '发小', '老同学', '好哥们', '死党', '室友', '导师', '徒弟', '师傅', '恋人', '债主'];
  if (symmetricRelations.includes(r)) {
    return r;
  }

  // 默认返回原关系
  return r;
};
  // 如果当前卡片是关系角色，显示原关系
  const getRelationLabel = (relation: CharacterRelation, char: Character): string => {
    // 获取关系类型的原始值（可能是中文或英文）
    const originalRelation = relation.relationType;
    
    // 如果relationType已经是中文
    if (/[\u4e00-\u9fa5]/.test(originalRelation)) {
      // 如果当前卡片是主角，显示反向关系
      if (char.roleType === 'male_lead' || char.roleType === 'female_lead') {
        return getReverseRelationLabel(originalRelation, char.gender);
      }
      // 其他情况显示原关系
      return originalRelation;
    }
    
    // 使用预定义的 ALL_RELATION_LABELS 映射表（兼容旧的英文ID）
    const mappedRelation = ALL_RELATION_LABELS[originalRelation] || originalRelation;
    
    // 如果当前卡片是主角，显示反向关系
    if (char.roleType === 'male_lead' || char.roleType === 'female_lead') {
      return getReverseRelationLabel(mappedRelation, char.gender);
    }
    
    return mappedRelation;
  };

  const getRelatedCharacter = (relation: CharacterRelation, charId: string): Character | undefined => {
    const relatedId = relation.characterId === charId 
      ? relation.relatedCharacterId 
      : relation.characterId;
    return characters.find(c => c.id === relatedId);
  };

  // 永久角色数量
  const permanentCount = characters.filter(c => !c.isTemporary && c.roleType !== 'temp').length;
  // 临时角色数量
  const temporaryCount = characters.filter(c => c.isTemporary || c.roleType === 'temp').length;

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      {/* Header with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (isSelectMode) {
              const returnTo = params.returnTo || '/home';
              router.replace(returnTo);
            } else {
              router.push('/home');
            }
          }}
        >
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
          <ThemedText variant="small" color={theme.textPrimary} style={styles.backText}>
            {isSelectMode ? '取消' : '返回首页'}
          </ThemedText>
        </TouchableOpacity>
        {!isSelectMode && (
          <View style={styles.topRightButtons}>
            <TouchableOpacity style={styles.networkButton} onPress={() => router.push('/relation-network')}>
              <Feather name="git-branch" size={20} color="#C8102E" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/character')}>
              <Feather name="plus" size={20} color="#C8102E" />
            </TouchableOpacity>
          </View>
        )}
        {isSelectMode && (
          <ThemedText variant="small" color={theme.textMuted}>
            选择一个角色
          </ThemedText>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.decorativeLine} />
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
            角色库
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.subtitle}>
            共 {characters.length} 个角色
          </ThemedText>
        </View>

        {/* 选项卡切换 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'permanent' && styles.tabActive]}
            onPress={() => setActiveTab('permanent')}
          >
            <Feather 
              name="user" 
              size={16} 
              color={activeTab === 'permanent' ? '#C8102E' : theme.textMuted} 
            />
            <ThemedText 
              variant="small" 
              color={activeTab === 'permanent' ? '#C8102E' : theme.textMuted}
              style={styles.tabText}
            >
              永久角色
            </ThemedText>
            <View style={[styles.tabBadge, activeTab === 'permanent' && styles.tabBadgeActive]}>
              <ThemedText variant="caption" color={activeTab === 'permanent' ? '#C8102E' : theme.textMuted}>
                {permanentCount}
              </ThemedText>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'temporary' && styles.tabActive]}
            onPress={() => setActiveTab('temporary')}
          >
            <Feather 
              name="user-plus" 
              size={16} 
              color={activeTab === 'temporary' ? '#C8102E' : theme.textMuted} 
            />
            <ThemedText 
              variant="small" 
              color={activeTab === 'temporary' ? '#C8102E' : theme.textMuted}
              style={styles.tabText}
            >
              临时角色
            </ThemedText>
            <View style={[styles.tabBadge, activeTab === 'temporary' && styles.tabBadgeActive]}>
              <ThemedText variant="caption" color={activeTab === 'temporary' ? '#C8102E' : theme.textMuted}>
                {temporaryCount}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ThemedText variant="body" color={theme.textMuted}>
              加载中...
            </ThemedText>
          </View>
        ) : filteredCharacters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather 
              name={activeTab === 'temporary' ? 'user-plus' : 'users'} 
              size={48} 
              color={theme.textMuted} 
            />
            <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
              {activeTab === 'temporary' ? '暂无临时角色' : '还没有创建任何角色'}
            </ThemedText>
            {activeTab === 'permanent' && (
              <TouchableOpacity style={styles.createButton} onPress={() => router.push('/character')}>
                <Feather name="user-plus" size={20} color={theme.buttonPrimaryText} />
                <ThemedText variant="smallMedium" color={theme.buttonPrimaryText} style={styles.createButtonText}>
                  创建角色
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.characterList}>
            {filteredCharacters.map(char => {
              const charRelations = getCharacterRelations(char.id);
              const isLocked = isCharacterLocked(char);
              const linkedNovelName = getLinkedNovelName(char.novelId);
              const isTemp = char.isTemporary || char.roleType === 'temp';
              const roleTypeLabel = char.roleType === 'male_lead' ? '男主' : 
                                    char.roleType === 'female_lead' ? '女主' : 
                                    char.roleType === 'npc' ? '配角' : 
                                    isTemp ? '临时' : '';
              
              return (
                <TouchableOpacity
                  key={char.id}
                  style={[
                    styles.characterCard,
                    isLocked && styles.lockedCharacterCard,
                    isTemp && styles.temporaryCharacterCard,
                    isSelectMode && selectedCharacterIds.includes(char.id) && styles.selectedCharacterCard,
                    isMultiSelectMode && selectedForDelete.includes(char.id) && styles.selectedCharacterCard
                  ]}
                  onPress={() => {
                    if (isSelectMode) {
                      // 多选逻辑：如果已选中则取消，未选中则添加
                      if (selectedCharacterIds.includes(char.id)) {
                        setSelectedCharacterIds(selectedCharacterIds.filter(id => id !== char.id));
                      } else {
                        setSelectedCharacterIds([...selectedCharacterIds, char.id]);
                      }
                    } else if (isMultiSelectMode) {
                      // 多选删除模式：切换选中状态
                      handleToggleSelection(char.id);
                    }
                  }}
                  onLongPress={() => {
                    if (!isSelectMode && !isMultiSelectMode) {
                      handleLongPress(char);
                    }
                  }}
                  activeOpacity={isSelectMode || isMultiSelectMode ? 0.7 : 1}
                >
                  <View style={styles.characterHeader}>
                    <View style={styles.characterMain}>
                      <View style={styles.characterNameRow}>
                        {(isSelectMode || isMultiSelectMode) && (
                          <View style={styles.checkboxContainer}>
                            <View style={[
                              styles.checkbox,
                              ((isSelectMode && selectedCharacterIds.includes(char.id)) ||
                               (isMultiSelectMode && selectedForDelete.includes(char.id))) &&
                              styles.checkboxChecked
                            ]}>
                              {((isSelectMode && selectedCharacterIds.includes(char.id)) ||
                                (isMultiSelectMode && selectedForDelete.includes(char.id))) &&
                                <Feather name="check" size={14} color="#fff" />
                              }
                            </View>
                          </View>
                        )}
                        <ThemedText variant="h3" color={isLocked ? theme.textMuted : theme.textPrimary}>
                          {char.name}
                        </ThemedText>
                        {isLocked && (
                          <View style={styles.lockedBadge}>
                            <Feather name="lock" size={12} color="#C8102E" />
                            <ThemedText variant="caption" color="#C8102E" style={styles.lockedText}>
                              已锁定
                            </ThemedText>
                          </View>
                        )}
                        {isTemp && (
                          <View style={styles.temporaryBadge}>
                            <Feather name="zap" size={12} color="#FF9500" />
                            <ThemedText variant="caption" color="#FF9500" style={styles.temporaryText}>
                              临时
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {char.gender} · {char.age}岁 · {char.occupation}
                      </ThemedText>
                      {linkedNovelName && (
                        <View style={styles.lockedInfo}>
                          <Feather name="book" size={12} color={theme.textMuted} />
                          <ThemedText variant="caption" color={theme.textMuted} style={styles.lockedNovelName}>
                            {linkedNovelName} · {roleTypeLabel}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    {!isSelectMode && !isMultiSelectMode && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          console.log('[CharacterList] Delete button pressed for:', char.name);
                          handleDeleteCharacter(char);
                        }}
                        disabled={isLocked}
                        activeOpacity={0.7}
                      >
                        <Feather name="trash-2" size={16} color={isLocked ? theme.textMuted : "#C8102E"} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {charRelations.length > 0 && (
                    <View style={styles.relationsContainer}>
                      <ThemedText variant="caption" color={theme.textMuted} style={styles.relationsTitle}>
                        关系
                      </ThemedText>
                      <View style={styles.relationsList}>
                        {charRelations.map(relation => {
                          const relatedChar = getRelatedCharacter(relation, char.id);
                          const relationLabel = getRelationLabel(relation, char);

                          console.log('[CharacterList] 关系显示调试:', {
                            charName: char.name,
                            relatedCharName: relatedChar?.name,
                            relationType: relation.relationType,
                            relationLabel: relationLabel,
                            isMainCharacter: char.roleType === 'male_lead' || char.roleType === 'female_lead',
                            relatedIsMainCharacter: relatedChar ? (relatedChar.roleType === 'male_lead' || relatedChar.roleType === 'female_lead') : false,
                            fullDebug: relation
                          });

                          return (
                            <View key={relation.id} style={styles.relationTag}>
                              <ThemedText variant="caption" color={theme.textSecondary}>
                                {relatedChar?.name}的{relationLabel}
                              </ThemedText>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.viewDetailButton}
                    onPress={() => {
                      if (isSelectRelationMode) {
                        // select-relation模式：跳转回character-detail，显示选择关系类型弹窗
                        const returnTo = params.returnTo || '/character-detail';
                        router.replace(returnTo, {
                          characterId: params.characterId,
                          selectedRelationCharacterId: char.id,
                          selectedRelationCharacterName: char.name,
                        });
                      } else if (isSelectMode) {
                        // select模式：跳转回novel-writing
                        const returnTo = params.returnTo || '/home';
                        router.replace(returnTo, {
                          selectedCharacterId: char.id,
                          novelId: params.novelId,  // 保留novelId参数
                        });
                      } else {
                        // 普通模式：跳转到角色详情
                        router.push('/character-detail', { characterId: char.id });
                      }
                    }}
                  >
                    <ThemedText variant="small" color={isLocked ? theme.textMuted : "#C8102E"}>
                      {isSelectRelationMode ? '选择' : (isSelectMode ? '添加到配角' : '查看详情')}
                    </ThemedText>
                    <Feather name={isSelectRelationMode ? 'check' : (isSelectMode ? 'plus' : 'chevron-right')} size={16} color={isLocked ? theme.textMuted : "#C8102E"} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 多选模式控制栏 - 固定在页面底部 */}
      {isMultiSelectMode && (
        <View style={styles.multiSelectBar}>
          <ThemedText variant="small" color="#FFFFFF">
            已选择 {selectedForDelete.length} 个角色
          </ThemedText>
          <View style={styles.multiSelectButtons}>
            <TouchableOpacity
              style={[styles.multiSelectButton, styles.cancelButton]}
              onPress={handleExitMultiSelect}
            >
              <ThemedText variant="small" color="#FFFFFF">取消</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.multiSelectButton,
                styles.deleteSelectedButton,
                selectedForDelete.length === 0 && styles.multiSelectButtonDisabled
              ]}
              onPress={handleBatchDelete}
              disabled={selectedForDelete.length === 0}
            >
              <Feather name="trash-2" size={16} color="#C8102E" />
              <ThemedText variant="small" color="#C8102E" style={{ marginLeft: 6 }}>
                删除选中
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 删除确认Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCancelDelete}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.modalTitle}>
              确认删除
            </ThemedText>
            <ThemedText variant="body" color={theme.textSecondary} style={styles.modalMessage}>
              确定要删除角色"{characterToDelete?.name}"吗？相关的角色关系也会被删除。
            </ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelDelete}
              >
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  取消
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={handleConfirmDelete}
              >
                <ThemedText variant="smallMedium" color="#FFFFFF">
                  删除
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 多选模式确认弹窗 */}
      <Modal
        visible={showMultiSelectConfirm}
        transparent
        animationType="fade"
        onRequestClose={handleCancelMultiSelect}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCancelMultiSelect}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.modalTitle}>
              进入删除模式
            </ThemedText>
            <ThemedText variant="body" color={theme.textSecondary} style={styles.modalMessage}>
              即将进入角色删除模式，可以批量删除角色。此操作不可撤销，请谨慎选择。
            </ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelMultiSelect}
              >
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  取消
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={handleConfirmMultiSelect}
              >
                <ThemedText variant="smallMedium" color="#FFFFFF">
                  确认进入
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 批量删除确认弹窗 */}
      <Modal
        visible={showBatchDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={handleCancelBatchDelete}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCancelBatchDelete}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.modalTitle}>
              确认批量删除
            </ThemedText>
            <ThemedText variant="body" color={theme.textSecondary} style={styles.modalMessage}>
              将删除以下角色：
            </ThemedText>
            <ScrollView style={styles.deleteListContainer}>
              {selectedForDelete.map(id => {
                const char = characters.find(c => c.id === id);
                return (
                  <View key={id} style={styles.deleteListItem}>
                    <Feather name="user" size={14} color={theme.textMuted} />
                    <ThemedText variant="caption" color={theme.textPrimary}>
                      {char?.name || '未知角色'}
                    </ThemedText>
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelBatchDelete}
              >
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  取消
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={handleConfirmBatchDelete}
              >
                <ThemedText variant="smallMedium" color="#FFFFFF">
                  确认删除 ({selectedForDelete.length})
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 确认添加按钮（仅在选择模式下显示） */}
      {isSelectMode && selectedCharacterIds.length > 0 && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            const returnTo = params.returnTo || '/home';
            router.replace(returnTo, {
              selectedCharacterIds: selectedCharacterIds.join(','),
              novelId: params.novelId,  // 保留novelId参数
            });
          }}
        >
          <ThemedText variant="smallMedium" color="#fff">
            确认添加 ({selectedCharacterIds.length})
          </ThemedText>
        </TouchableOpacity>
      )}

      <FloatingBall />
    </Screen>
  );
}
