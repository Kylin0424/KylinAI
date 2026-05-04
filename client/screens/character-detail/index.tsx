import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { FloatingBall } from '@/components/FloatingBall';
import { useFocusEffect } from 'expo-router';
import { createStyles } from './styles';
import {
  Character,
  getCharacterById,
  updateCharacter,
  deleteCharacter,
  getNovelCharacters,
  getRelationNetwork,
  addRelationToNetwork,
  removeRelationFromNetwork,
  getCharacterRelationsFromNetwork,
  saveRelation,
  RelationNetworkNode,
} from '@/utils/characterStorage';
import { getNovelById, Novel } from '@/utils/novelStorage';
import {
  FAMILY_RELATIONS,
  getReverseRelation,
  RELATION_CATEGORIES,
} from '@/constants/familyRelations';

// 临时使用线上地址测试
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'https://kylinai-1.onrender.com';

export default function CharacterDetailScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const params = useSafeSearchParams<{
    characterId: string;
    selectedRelationCharacterId?: string;
    selectedRelationCharacterName?: string;
  }>();

  const [character, setCharacter] = useState<Character | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    name: '',
    gender: '',
    age: '',
    height: '',
    weight: '',
    group: '',
    position: '',
    occupation: '',
    personality: '',
    experience: '',
    familyBackground: '',
    appearance: '',
    specialTraits: '',
  });

  // 关系网络状态
  const [relationNetwork, setRelationNetwork] = useState<RelationNetworkNode[]>([]);
  const [characterRelations, setCharacterRelations] = useState<{
    targetId: string;
    targetName: string;
    relationType: string;
    reverseRelation?: string;
  }[]>([]);
  const [showAddRelationModal, setShowAddRelationModal] = useState(false);
  const [showAddRelationOptionsModal, setShowAddRelationOptionsModal] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [selectedRelation, setSelectedRelation] = useState<string>('');
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [isSavingRelation, setIsSavingRelation] = useState(false);

  // 关系类型映射（英文key到中文标签）
  const RELATION_LABELS: Record<string, string> = {
    'father': '父亲',
    'mother': '母亲',
    'paternal_grandfather': '爷爷(父之父)',
    'paternal_grandmother': '奶奶(父之母)',
    'maternal_grandfather': '姥爷(母之父)',
    'maternal_grandmother': '姥姥(母之母)',
    'husband': '丈夫',
    'wife': '妻子',
    'spouse': '配偶',
    'son': '儿子',
    'daughter': '女儿',
    'child': '子女',
    'brother': '兄弟',
    'sister': '姐妹',
    'sibling': '兄弟姐妹',
    'paternal_uncle': '伯伯/叔叔',
    'maternal_uncle': '舅舅',
    'paternal_aunt': '姑姑',
    'maternal_aunt': '姨妈',
    'father_in_law': '岳父', // 男性主角叫岳父，女性主角叫公公
    'mother_in_law': '岳母', // 男性主角叫岳母，女性主角叫婆婆
    '姐夫': '姐夫(妻姐之夫，即大姨子的丈夫)',
    '妹夫': '妹夫(妻妹之夫，即小姨子的丈夫)',
    '小舅子': '小舅子(妻子的弟弟)',
    '大舅子': '大舅子(妻子的哥哥)',
    '小姨子': '小姨子(妻子的妹妹)',
    '大姨子': '大姨子(妻子的姐姐)',
    '小姑子': '小姑子(丈夫的妹妹)',
    'daughter_in_law': '儿媳',
    'son_in_law': '女婿',
    'nephew': '侄子',
    'niece': '侄女',
    'cousin_male': '堂兄弟/表兄弟',
    'cousin_female': '堂姐妹/表姐妹',
    'friend': '朋友',
    'enemy': '敌人',
    'colleague': '同事',
    'lover': '恋人',
    'mentor': '导师',
    'student': '学生',
    // 中文key映射
    '父亲': '父亲',
    '母亲': '母亲',
    '爷爷': '爷爷(父之父)',
    '奶奶': '奶奶(父之母)',
    '姥爷': '姥爷(母之父)',
    '姥姥': '姥姥(母之母)',
    '外公': '外公(母之父)',
    '外婆': '外婆(母之母)',
    '孙子': '孙子',
    '孙女': '孙女',
    '外孙': '外孙',
    '外孙女': '外孙女',
    '丈夫': '丈夫',
    '妻子': '妻子',
    '配偶': '配偶',
    '儿子': '儿子',
    '女儿': '女儿',
    '子女': '子女',
    '孙子': '孙子(父系)',
    '孙女': '孙女(父系)',
    '外孙': '外孙(母系)',
    '外孙女': '外孙女(母系)',
    '兄弟': '兄弟',
    '姐妹': '姐妹',
    '兄妹': '兄妹',
    '伯伯': '伯伯',
    '叔叔': '叔叔',
    '姑姑': '姑姑',
    '舅舅': '舅舅',
    '姨妈': '姨妈',
    '公公': '公公',
    '婆婆': '婆婆',
    '小舅子': '小舅子',
    '大舅子': '大舅子',
    '小姨子': '小姨子',
    '大姨子': '大姨子',
    '儿媳': '儿媳',
    '女婿': '女婿',
    '侄子': '侄子',
    '侄女': '侄女',
    '堂兄弟': '堂兄弟',
    '堂姐妹': '堂姐妹',
    '表兄弟': '表兄弟',
    '表姐妹': '表姐妹',
    '朋友': '朋友',
    '仇人': '仇人',
    '同事': '同事',
    '恋人': '恋人',
    '导师': '导师',
    '学生': '学生',
    '发小': '发小',
    '老同学': '老同学',
    '好哥们': '好哥们',
    '闺蜜': '闺蜜',
    '死党': '死党',
    '战友': '战友',
    '室友': '室友',
    '邻居': '邻居',
    '上司': '上司',
    '客户': '客户',
    '合伙人': '合伙人',
    '校友': '校友',
    '队友': '队友',
    '粉丝': '粉丝',
    '偶像': '偶像',
  };

  // 获取关系类型的中文名称
  const getRelationLabel = (relationKey: string): string => {
    // 优先使用RELATION_LABELS映射表（保持原有逻辑，确保功能不受影响）
    if (RELATION_LABELS[relationKey]) {
      return RELATION_LABELS[relationKey];
    }
    // 如果RELATION_LABELS中没有，从FAMILY_RELATIONS数组中查找
    const relation = FAMILY_RELATIONS.find(r => r.id === relationKey);
    return relation?.name || relationKey;
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadCharacterData = async () => {
        if (!params.characterId) return;
        setIsLoading(true);
        const char = await getCharacterById(params.characterId);
        setCharacter(char);
        if (char) {
          // 初始化编辑表单
          setEditForm({
            name: char.name,
            gender: char.gender,
            age: char.age.toString(),
            height: char.height,
            weight: char.weight || '',
            group: char.group || '',
            position: char.position || '',
            occupation: char.occupation,
            personality: char.personality,
            experience: char.experience,
            familyBackground: char.familyBackground,
            appearance: char.appearance,
            specialTraits: char.specialTraits,
          });

          if (char.novelId) {
            const n = await getNovelById(char.novelId);
            setNovel(n);

            // 加载关系网络
            const network = await getRelationNetwork(char.novelId);
            setRelationNetwork(network);

            // 加载当前角色的关系
            const relations = await getCharacterRelationsFromNetwork(char.novelId, char.id);
            setCharacterRelations(relations);

            // 加载小说的其他角色（用于添加关系）
            const novelChars = await getNovelCharacters(char.novelId);
            setAvailableCharacters(novelChars.filter(c => c.id !== char.id));
          }
        }
        setIsLoading(false);
      };
      loadCharacterData();
    }, [params.characterId])
  );

  // 处理从角色库返回的选择（独立的useEffect，避免在useFocusEffect中重复执行）
  React.useEffect(() => {
    const handleReturnFromLibrary = async () => {
      if (!params.selectedRelationCharacterId || !character?.novelId) return;

      console.log('[AddRelation] 从角色库返回，角色ID:', params.selectedRelationCharacterId);
      console.log('[AddRelation] 当前角色信息:', character.name, 'novelId:', character.novelId);
      console.log('[AddRelation] 可用角色列表:', availableCharacters.map(c => ({id: c.id, name: c.name})));

      // 检查角色是否属于当前小说
      const targetChar = availableCharacters.find(c => c.id === params.selectedRelationCharacterId);
      console.log('[AddRelation] 查找结果:', targetChar ? `找到角色 ${targetChar.name}` : '角色不在可用列表中');

      if (!targetChar) {
        // 角色不在当前小说中，尝试从角色库查找并添加
        try {
          console.log('[AddRelation] 开始从角色库查找角色...');
          const libraryChar = await getCharacterById(params.selectedRelationCharacterId);
          console.log('[AddRelation] 角色库返回:', libraryChar);

          if (libraryChar) {
            console.log('[AddRelation] 角色信息:', libraryChar.name, '当前小说ID:', libraryChar.novelId, '目标小说ID:', character.novelId);

            if (libraryChar.novelId !== character.novelId) {
              console.log('[AddRelation] 将角色添加到当前小说:', libraryChar.name);
              await updateCharacter(params.selectedRelationCharacterId, {
                novelId: character.novelId,
              });

              // 重新加载可用角色列表
              const novelChars = await getNovelCharacters(character.novelId);
              setAvailableCharacters(novelChars.filter(c => c.id !== character.id));
              console.log('[AddRelation] 更新后的可用角色数量:', novelChars.length);
              console.log('[AddRelation] 更新后的可用角色列表:', novelChars.filter(c => c.id !== character.id).map(c => ({id: c.id, name: c.name})));
            } else {
              console.log('[AddRelation] 角色已属于当前小说，重新加载列表');
              // 角色已属于当前小说，但不在availableCharacters中，重新加载
              const novelChars = await getNovelCharacters(character.novelId);
              setAvailableCharacters(novelChars.filter(c => c.id !== character.id));
              console.log('[AddRelation] 重新加载后的可用角色列表:', novelChars.filter(c => c.id !== character.id).map(c => ({id: c.id, name: c.name})));
            }
          }
        } catch (error) {
          console.error('[AddRelation] Error adding character to novel:', error);
          Alert.alert('错误', '添加角色到小说失败');
          return;
        }
      }

      // 直接设置选中的目标角色ID，不再重复检查
      console.log('[AddRelation] 设置选中的目标角色ID:', params.selectedRelationCharacterId);
      setSelectedTargetId(params.selectedRelationCharacterId);
      setShowAddRelationModal(true);
    };

    handleReturnFromLibrary();
  }, [params.selectedRelationCharacterId, character?.novelId]); // 移除availableCharacters依赖，避免无限循环

  // 检查是否可编辑（未关联小说的角色可编辑）
  const canEdit = !character?.novelId;

  const handleStartEdit = () => {
    if (!canEdit) {
      Alert.alert('提示', '该角色已用于小说创作，为保持角色一致性，禁止编辑');
      return;
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // 重置表单
    if (character) {
      setEditForm({
        name: character.name,
        gender: character.gender,
        age: character.age.toString(),
        height: character.height,
        weight: character.weight || '',
        group: character.group || '',
        position: character.position || '',
        occupation: character.occupation,
        personality: character.personality,
        experience: character.experience,
        familyBackground: character.familyBackground,
        appearance: character.appearance,
        specialTraits: character.specialTraits,
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!character || !editForm.name.trim()) {
      Alert.alert('提示', '姓名不能为空');
      return;
    }

    setIsSaving(true);
    try {
      const updatedCharacter: Character = {
        ...character,
        name: editForm.name.trim(),
        gender: editForm.gender,
        age: parseInt(editForm.age) || character.age,
        height: editForm.height,
        weight: editForm.weight,
        group: editForm.group,
        position: editForm.position,
        occupation: editForm.occupation,
        personality: editForm.personality,
        experience: editForm.experience,
        familyBackground: editForm.familyBackground,
        appearance: editForm.appearance,
        specialTraits: editForm.specialTraits,
      };

      await updateCharacter(updatedCharacter);
      setCharacter(updatedCharacter);
      setIsEditing(false);
      Alert.alert('成功', '角色信息已更新');
    } catch (error) {
      console.error('Error updating character:', error);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!character) return;

    if (!canEdit) {
      Alert.alert('提示', '该角色已用于小说创作，无法删除');
      return;
    }

    Alert.alert(
      '确认删除',
      `确定要删除角色"${character.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await deleteCharacter(character.id);
            router.back();
          },
        },
      ]
    );
  };

  // 添加关系
  const handleAddRelation = async () => {
    if (!character?.novelId || !selectedTargetId || !selectedRelation) {
      Alert.alert('提示', '请选择角色和关系');
      return;
    }

    setIsSavingRelation(true);
    try {
      console.log('[AddRelation] 开始添加关系');
      console.log('[AddRelation] selectedTargetId:', selectedTargetId);
      console.log('[AddRelation] availableCharacters:', availableCharacters.map(c => ({ id: c.id, name: c.name })));

      // 尝试从不同来源查找角色
      let targetChar = availableCharacters.find(c => c.id === selectedTargetId);

      if (!targetChar) {
        console.log('[AddRelation] 从可用角色列表未找到，尝试从角色库查找');
        try {
          targetChar = await getCharacterById(selectedTargetId);
          console.log('[AddRelation] 从角色库找到角色:', targetChar?.name);

          // 如果角色存在但不属于当前小说，将其添加到小说中
          if (targetChar && targetChar.novelId !== character.novelId) {
            console.log('[AddRelation] 角色不属于当前小说，将其添加到小说中');
            await updateCharacter(selectedTargetId, {
              novelId: character.novelId,
            });
            targetChar.novelId = character.novelId;

            // 更新可用角色列表
            const novelChars = await getNovelCharacters(character.novelId);
            setAvailableCharacters(novelChars.filter(c => c.id !== character.id));
          }
        } catch (error) {
          console.error('[AddRelation] Error fetching character from library:', error);
        }
      }

      if (!targetChar) {
        console.error('[AddRelation] 角色不存在，selectedTargetId:', selectedTargetId);
        Alert.alert('错误', `角色不存在 (ID: ${selectedTargetId})，请重新选择`);
        setIsSavingRelation(false);
        return;
      }

      console.log('[AddRelation] 添加关系:', character.name, '->', targetChar.name, selectedRelation);

      // 获取反向关系
      const reverseRelation = getReverseRelation(
        selectedRelation,
        (targetChar.gender === '男' ? 'male' : 'female') as 'male' | 'female'
      );

      // 辅助函数：根据关系类型ID获取中文名称
      const getRelationLabelFromType = (relationType: string): string => {
        const relationDef = FAMILY_RELATIONS.find(r => r.id === relationType);
        if (relationDef) {
          return relationDef.name;
        }

        // 通用关系类型映射
        const LABELS: Record<string, string> = {
          'uncle': '舅舅/伯伯/叔叔',
          'aunt': '姨妈/姑姑',
          'cousin': '堂兄弟/表兄弟',
          'nephew': '侄子/外甥',
          'niece': '侄女/外甥女',
          'brother_in_law': '姐夫/妹夫/小舅子',
          'sister_in_law': '嫂子/弟妹/小姑子',
        };

        return LABELS[relationType] || relationType;
      };

      // 添加到关系网络
      await addRelationToNetwork(
        character.novelId,
        character.id,
        character.name,
        character.gender,
        targetChar.id,
        targetChar.name,
        targetChar.gender,
        selectedRelation,
        reverseRelation
      );

      // 保存正向关系到CharacterRelation数组（供角色库显示）
      await saveRelation({
        id: `${character.id}_${targetChar.id}_${Date.now()}`,
        characterId: character.id,
        relatedCharacterId: targetChar.id,
        relationType: selectedRelation,
        description: `${character.name}的${getRelationLabelFromType(selectedRelation)}是${targetChar.name}`,
        createdAt: Date.now(),
        novelId: character.novelId,
      });

      // 保存反向关系到CharacterRelation数组（供角色库显示）
      if (reverseRelation) {
        await saveRelation({
          id: `${targetChar.id}_${character.id}_${Date.now()}`,
          characterId: targetChar.id,
          relatedCharacterId: character.id,
          relationType: reverseRelation,
          description: `${targetChar.name}的${getRelationLabelFromType(reverseRelation)}是${character.name}`,
          createdAt: Date.now(),
          novelId: targetChar.novelId,
        });
      }

      // 刷新关系列表
      const relations = await getCharacterRelationsFromNetwork(character.novelId, character.id);
      setCharacterRelations(relations);

      // 刷新关系网络
      const network = await getRelationNetwork(character.novelId);
      setRelationNetwork(network);

      setShowAddRelationModal(false);
      setSelectedTargetId('');
      setSelectedRelation('');
      Alert.alert('成功', '关系已添加');
    } catch (error) {
      console.error('[AddRelation] Error adding relation:', error);
      Alert.alert('错误', `添加关系失败: ${error instanceof Error ? error.message : '请重试'}`);
    } finally {
      setIsSavingRelation(false);
    }
  };

  // 删除关系
  const handleRemoveRelation = async (targetId: string) => {
    if (!character?.novelId) return;
    
    Alert.alert(
      '确认删除',
      '确定要删除这个关系吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeRelationFromNetwork(character.novelId!, character.id, targetId);
              
              // 刷新关系列表
              const relations = await getCharacterRelationsFromNetwork(character.novelId!, character.id);
              setCharacterRelations(relations);
              
              // 刷新关系网络
              const network = await getRelationNetwork(character.novelId!);
              setRelationNetwork(network);
              
              Alert.alert('成功', '关系已删除');
            } catch (error) {
              console.error('Error removing relation:', error);
              Alert.alert('错误', '删除关系失败');
            }
          },
        },
      ]
    );
  };

  // AI识别并自动填充关系
  const handleAIIdentifyRelations = async () => {
    if (!character?.novelId || !novel) return;
    
    setIsSavingRelation(true);
    try {
      // 构建上下文
      const context = `
角色信息：
- 姓名：${character.name}
- 性别：${character.gender}
- 年龄：${character.age}
- 职业：${character.occupation}
- 性格：${character.personality}
- 背景：${character.familyBackground}

小说标题：${novel.title}
小说类型：${novel.themeType}
      `;
      
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/novel/identify-relations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          characterName: character.name,
          characterGender: character.gender,
          novelId: character.novelId,
          novelTitle: novel.title,
          context,
          existingCharacters: availableCharacters.map(c => ({
            id: c.id,
            name: c.name,
            gender: c.gender,
            age: c.age,
            occupation: c.occupation,
          })),
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.relations) {
          // 批量添加识别到的关系
          for (const rel of data.relations) {
            const targetChar = availableCharacters.find(c => c.name === rel.targetName);
            if (targetChar && rel.relationType) {
              const reverseRelation = getReverseRelation(
                rel.relationType,
                (targetChar.gender === '男' ? 'male' : 'female') as 'male' | 'female'
              );
              
              await addRelationToNetwork(
                character.novelId!,
                character.id,
                character.name,
                character.gender,
                targetChar.id,
                targetChar.name,
                targetChar.gender,
                rel.relationType,
                reverseRelation
              );
            }
          }
          
          // 刷新关系列表
          const relations = await getCharacterRelationsFromNetwork(character.novelId!, character.id);
          setCharacterRelations(relations);
          
          // 刷新关系网络
          const network = await getRelationNetwork(character.novelId!);
          setRelationNetwork(network);
          
          Alert.alert('成功', `AI识别并添加了 ${data.relations.length} 个关系`);
        } else {
          Alert.alert('提示', 'AI未能识别到明确的关系');
        }
      }
    } catch (error) {
      console.error('Error AI identifying relations:', error);
      Alert.alert('错误', 'AI识别失败');
    } finally {
      setIsSavingRelation(false);
    }
  };

  // 获取分类后的关系列表
  const getRelationsByCategory = () => {
    const categories: Record<string, { name: string; relations: typeof FAMILY_RELATIONS }> = {};
    
    FAMILY_RELATIONS.forEach(relation => {
      const categoryKey = relation.category;
      if (!categories[categoryKey]) {
        categories[categoryKey] = {
          name: RELATION_CATEGORIES[categoryKey].name,
          relations: [],
        };
      }
      categories[categoryKey].relations.push(relation);
    });
    
    return categories;
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

  if (!character) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={theme.textMuted} />
          <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: 12 }}>
            角色不存在
          </ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ThemedText variant="smallMedium" color="#C8102E">返回</ThemedText>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
          <ThemedText variant="small" color={theme.textPrimary} style={styles.backText}>
            返回
          </ThemedText>
        </TouchableOpacity>
        {!isEditing && (
          <TouchableOpacity style={styles.editButton} onPress={handleStartEdit}>
            <Feather name="edit-2" size={18} color={canEdit ? '#C8102E' : theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 角色基本信息 */}
        <View style={styles.characterHeader}>
          <View style={styles.characterAvatar}>
            {character.avatarUrl ? (
              <Image
                source={{ uri: character.avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <ThemedText variant="h2" color="#C8102E">
                {character.name.charAt(0)}
              </ThemedText>
            )}
          </View>
          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={editForm.name}
              onChangeText={(text) => setEditForm({ ...editForm, name: text })}
              placeholder="角色姓名"
              placeholderTextColor={theme.textMuted}
            />
          ) : (
            <ThemedText variant="h2" color={theme.textPrimary} style={styles.characterName}>
              {character.name}
            </ThemedText>
          )}
          {!isEditing && (
            <View style={styles.metaInfo}>
              <ThemedText variant="small" color={theme.textMuted}>
                {character.gender} · {character.age}岁
              </ThemedText>
            </View>
          )}
        </View>

        {/* 基本信息卡片 */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <ThemedText variant="caption" color={theme.textMuted}>性别</ThemedText>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editForm.gender}
                  onChangeText={(text) => setEditForm({ ...editForm, gender: text })}
                  placeholder="男/女"
                  placeholderTextColor={theme.textMuted}
                />
              ) : (
                <ThemedText variant="smallMedium" color={theme.textPrimary}>{character.gender}</ThemedText>
              )}
            </View>
            <View style={styles.infoItem}>
              <ThemedText variant="caption" color={theme.textMuted}>年龄</ThemedText>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editForm.age}
                  onChangeText={(text) => setEditForm({ ...editForm, age: text })}
                  placeholder="年龄"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                />
              ) : (
                <ThemedText variant="smallMedium" color={theme.textPrimary}>{character.age}岁</ThemedText>
              )}
            </View>
            <View style={styles.infoItem}>
              <ThemedText variant="caption" color={theme.textMuted}>身高</ThemedText>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editForm.height}
                  onChangeText={(text) => setEditForm({ ...editForm, height: text })}
                  placeholder="身高"
                  placeholderTextColor={theme.textMuted}
                />
              ) : (
                <ThemedText variant="smallMedium" color={theme.textPrimary}>{character.height}</ThemedText>
              )}
            </View>
            <View style={styles.infoItem}>
              <ThemedText variant="caption" color={theme.textMuted}>体重</ThemedText>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editForm.weight}
                  onChangeText={(text) => setEditForm({ ...editForm, weight: text })}
                  placeholder="体重"
                  placeholderTextColor={theme.textMuted}
                />
              ) : (
                <ThemedText variant="smallMedium" color={theme.textPrimary}>{character.weight || '未设定'}</ThemedText>
              )}
            </View>
          </View>
          {/* 团体、职位、职业信息 */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <ThemedText variant="caption" color={theme.textMuted}>所属团体</ThemedText>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editForm.group}
                  onChangeText={(text) => setEditForm({ ...editForm, group: text })}
                  placeholder="团体"
                  placeholderTextColor={theme.textMuted}
                />
              ) : (
                <ThemedText variant="smallMedium" color={theme.textPrimary}>{character.group || '未设定'}</ThemedText>
              )}
            </View>
            <View style={styles.infoItem}>
              <ThemedText variant="caption" color={theme.textMuted}>职位</ThemedText>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editForm.position}
                  onChangeText={(text) => setEditForm({ ...editForm, position: text })}
                  placeholder="职位"
                  placeholderTextColor={theme.textMuted}
                />
              ) : (
                <ThemedText variant="smallMedium" color={theme.textPrimary}>{character.position || '未设定'}</ThemedText>
              )}
            </View>
            <View style={styles.infoItem}>
              <ThemedText variant="caption" color={theme.textMuted}>职业</ThemedText>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editForm.occupation}
                  onChangeText={(text) => setEditForm({ ...editForm, occupation: text })}
                  placeholder="职业"
                  placeholderTextColor={theme.textMuted}
                />
              ) : (
                <ThemedText variant="smallMedium" color={theme.textPrimary}>{character.occupation}</ThemedText>
              )}
            </View>
          </View>
        </View>

        {/* 所属小说提示 */}
        {novel && (
          <View style={styles.lockedNotice}>
            <Feather name="lock" size={14} color={theme.textMuted} />
            <ThemedText variant="caption" color={theme.textMuted}>
              该角色已用于小说《{novel.title}》，为保持一致性禁止编辑
            </ThemedText>
          </View>
        )}

        {/* 详细信息编辑区域 */}
        {isEditing ? (
          <>
            <View style={styles.section}>
              <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.sectionTitle}>性格特点</ThemedText>
              <TextInput
                style={styles.textArea}
                value={editForm.personality}
                onChangeText={(text) => setEditForm({ ...editForm, personality: text })}
                placeholder="描述性格特点..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.section}>
              <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.sectionTitle}>外貌描述</ThemedText>
              <TextInput
                style={styles.textArea}
                value={editForm.appearance}
                onChangeText={(text) => setEditForm({ ...editForm, appearance: text })}
                placeholder="描述外貌特征..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.section}>
              <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.sectionTitle}>人生经历</ThemedText>
              <TextInput
                style={styles.textArea}
                value={editForm.experience}
                onChangeText={(text) => setEditForm({ ...editForm, experience: text })}
                placeholder="描述人生经历..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.section}>
              <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.sectionTitle}>家庭背景</ThemedText>
              <TextInput
                style={styles.textArea}
                value={editForm.familyBackground}
                onChangeText={(text) => setEditForm({ ...editForm, familyBackground: text })}
                placeholder="描述家庭背景..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.section}>
              <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.sectionTitle}>特殊特征</ThemedText>
              <TextInput
                style={styles.textArea}
                value={editForm.specialTraits}
                onChangeText={(text) => setEditForm({ ...editForm, specialTraits: text })}
                placeholder="描述特殊特征..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* 编辑操作按钮 */}
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText variant="smallMedium" color="#FFFFFF">保存</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* 性格特点 */}
            {character.personality && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.labelIcon}>
                    <Feather name="heart" size={14} color={theme.textPrimary} />
                  </View>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>性格特点</ThemedText>
                </View>
                <View style={styles.contentCard}>
                  <ThemedText variant="small" color={theme.textSecondary}>{character.personality}</ThemedText>
                </View>
              </View>
            )}

            {/* 外貌描述 */}
            {character.appearance && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.labelIcon}>
                    <Feather name="eye" size={14} color={theme.textPrimary} />
                  </View>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>外貌描述</ThemedText>
                </View>
                <View style={styles.contentCard}>
                  <ThemedText variant="small" color={theme.textSecondary}>{character.appearance}</ThemedText>
                </View>
              </View>
            )}

            {/* 人生经历 */}
            {character.experience && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.labelIcon}>
                    <Feather name="briefcase" size={14} color={theme.textPrimary} />
                  </View>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>人生经历</ThemedText>
                </View>
                <View style={styles.contentCard}>
                  <ThemedText variant="small" color={theme.textSecondary}>{character.experience}</ThemedText>
                </View>
              </View>
            )}

            {/* 家庭背景 */}
            {character.familyBackground && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.labelIcon}>
                    <Feather name="home" size={14} color={theme.textPrimary} />
                  </View>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>家庭背景</ThemedText>
                </View>
                <View style={styles.contentCard}>
                  <ThemedText variant="small" color={theme.textSecondary}>{character.familyBackground}</ThemedText>
                </View>
              </View>
            )}

            {/* 特殊特征 */}
            {character.specialTraits && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.labelIcon}>
                    <Feather name="star" size={14} color={theme.textPrimary} />
                  </View>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>特殊特征</ThemedText>
                </View>
                <View style={styles.contentCard}>
                  <ThemedText variant="small" color={theme.textSecondary}>{character.specialTraits}</ThemedText>
                </View>
              </View>
            )}

            {/* 关系网络 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.labelIcon}>
                  <Feather name="users" size={14} color={theme.textPrimary} />
                </View>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>关系网络</ThemedText>
              </View>
              
              {/* 已有关系列表 */}
              {characterRelations.length > 0 ? (
                <View style={styles.relationList}>
                  {characterRelations.map((rel, index) => {
                    // 查找relationType对应的关系定义
                    const relationDef = FAMILY_RELATIONS.find(r => r.id === rel.relationType);
                    const relationLabel = relationDef?.name || getRelationLabel(rel.relationType);

                    console.log('[Debug] 关系显示调试:', {
                      characterName: character.name,
                      targetName: rel.targetName,
                      relationType: rel.relationType,
                      relationLabel: relationLabel,
                      reverseRelation: rel.reverseRelation,
                      relationDef: relationDef
                    });

                    return (
                      <View key={index} style={styles.relationItem}>
                        <View style={styles.relationInfo}>
                          <ThemedText variant="smallMedium" color={theme.textPrimary}>
                            {rel.targetName}的{relationLabel}
                          </ThemedText>
                          {rel.reverseRelation && (
                            <ThemedText variant="caption" color={theme.textMuted}>
                              {' (' + getRelationLabel(rel.reverseRelation) + ')'}
                            </ThemedText>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.removeRelationButton}
                          onPress={() => handleRemoveRelation(rel.targetId)}
                        >
                          <Feather name="x" size={16} color={theme.textMuted} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyRelationContainer}>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    暂无关系记录
                  </ThemedText>
                </View>
              )}
              
              {/* 添加关系按钮 */}
              <View style={styles.relationActions}>
                <TouchableOpacity
                  style={styles.addRelationButton}
                  onPress={() => {
                    setShowAddRelationOptionsModal(true);
                  }}
                >
                  <Feather name="plus" size={14} color="#C8102E" />
                  <ThemedText variant="small" color="#C8102E" style={{ marginLeft: 4 }}>
                    添加关系
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.aiIdentifyButton}
                  onPress={handleAIIdentifyRelations}
                  disabled={isSavingRelation}
                >
                    {isSavingRelation ? (
                      <ActivityIndicator size="small" color="#C8102E" />
                    ) : (
                      <>
                        <Feather name="cpu" size={14} color="#C8102E" />
                        <ThemedText variant="small" color="#C8102E" style={{ marginLeft: 4 }}>
                          AI识别关系
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

            {canEdit && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Feather name="trash-2" size={16} color="#C8102E" />
                <ThemedText variant="small" color="#C8102E" style={{ marginLeft: 6 }}>
                  删除角色
                </ThemedText>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* 添加关系选项弹窗 */}
      <Modal
        visible={showAddRelationOptionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddRelationOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>添加关系</ThemedText>
              <TouchableOpacity onPress={() => setShowAddRelationOptionsModal(false)}>
                <Feather name="x" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  setShowAddRelationOptionsModal(false);
                  setShowAddRelationModal(true);
                }}
              >
                <View style={styles.optionIcon}>
                  <Feather name="users" size={24} color="#C8102E" />
                </View>
                <View style={styles.optionText}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>从当前小说角色添加</ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {availableCharacters.length > 0 ? `${availableCharacters.length} 个可选角色` : '暂无可用角色'}
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={16} color={theme.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  setShowAddRelationOptionsModal(false);
                  router.push('/character-list?mode=select-relation&returnTo=/character-detail&characterId=' + params.characterId);
                }}
              >
                <View style={styles.optionIcon}>
                  <Feather name="database" size={24} color="#C8102E" />
                </View>
                <View style={styles.optionText}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>从角色库添加</ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>从已有角色库中选择</ThemedText>
                </View>
                <Feather name="chevron-right" size={16} color={theme.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => {
                  setShowAddRelationOptionsModal(false);
                  router.push('/character');
                }}
              >
                <View style={styles.optionIcon}>
                  <Feather name="user-plus" size={24} color="#C8102E" />
                </View>
                <View style={styles.optionText}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>创建新角色</ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>生成新的关系角色</ThemedText>
                </View>
                <Feather name="chevron-right" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 添加关系弹窗 */}
      <Modal
        visible={showAddRelationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddRelationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>添加关系</ThemedText>
              <TouchableOpacity onPress={() => setShowAddRelationModal(false)}>
                <Feather name="x" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {/* 选择角色 */}
            <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: 8 }}>
              选择角色
            </ThemedText>
            <ScrollView style={styles.characterList} horizontal>
              {availableCharacters.map(char => (
                <TouchableOpacity
                  key={char.id}
                  style={[
                    styles.characterOption,
                    selectedTargetId === char.id && styles.characterOptionSelected,
                  ]}
                  onPress={() => setSelectedTargetId(char.id)}
                >
                  <ThemedText
                    variant="small"
                    color={selectedTargetId === char.id ? '#FFFFFF' : theme.textPrimary}
                  >
                    {char.name}
                  </ThemedText>
                  <ThemedText
                    variant="caption"
                    color={selectedTargetId === char.id ? '#FFFFFF' : theme.textMuted}
                  >
                    {char.gender} · {char.age}岁
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* 选择关系 */}
            {selectedTargetId && (
              <>
                <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: 16, marginBottom: 8 }}>
                  选择关系类型
                </ThemedText>
                <ScrollView style={styles.relationTypeList}>
                  {Object.entries(getRelationsByCategory()).map(([categoryKey, category]) => (
                    <View key={categoryKey} style={styles.relationCategorySection}>
                      <ThemedText variant="caption" color={theme.textMuted} style={styles.categoryLabel}>
                        {category.name}
                      </ThemedText>
                      <View style={styles.relationTypeGrid}>
                        {category.relations.map(relation => (
                          <TouchableOpacity
                            key={relation.id}
                            style={[
                              styles.relationTypeOption,
                              selectedRelation === relation.id && styles.relationTypeOptionSelected,
                            ]}
                            onPress={() => setSelectedRelation(relation.id)}
                          >
                            <ThemedText
                              variant="caption"
                              color={selectedRelation === relation.id ? '#FFFFFF' : theme.textPrimary}
                            >
                              {relation.name}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
            
            {/* 确认按钮 */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedTargetId || !selectedRelation) && styles.confirmButtonDisabled,
              ]}
              onPress={handleAddRelation}
              disabled={!selectedTargetId || !selectedRelation || isSavingRelation}
            >
              {isSavingRelation ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText variant="smallMedium" color="#FFFFFF">确认添加</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FloatingBall />
    </Screen>
  );
}
