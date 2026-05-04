import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
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
  saveCharacter,
  saveRelation,
  getAllRelations,
  getCharacterRelations,
  generateId,
} from '@/utils/characterStorage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

// 关系类型定义
const RELATION_TYPES = [
  { key: 'father', label: '父亲', reverseKey: 'child', generateNPC: true },
  { key: 'mother', label: '母亲', reverseKey: 'child', generateNPC: true },
  { key: 'paternal_grandfather', label: '爷爷(父之父)', reverseKey: 'grandchild', generateNPC: true },
  { key: 'paternal_grandmother', label: '奶奶(父之母)', reverseKey: 'grandchild', generateNPC: true },
  { key: 'maternal_grandfather', label: '姥爷(母之父)', reverseKey: 'maternal_grandchild', generateNPC: true },
  { key: 'maternal_grandmother', label: '姥姥(母之母)', reverseKey: 'maternal_grandchild', generateNPC: true },
  { key: 'husband', label: '丈夫', reverseKey: 'wife', generateNPC: false },
  { key: 'wife', label: '妻子', reverseKey: 'husband', generateNPC: false },
  { key: 'spouse', label: '配偶', reverseKey: 'spouse', generateNPC: false },
  { key: 'son', label: '儿子', reverseKey: 'parent', generateNPC: true },
  { key: 'daughter', label: '女儿', reverseKey: 'parent', generateNPC: true },
  { key: 'child', label: '子女', reverseKey: 'parent', generateNPC: true },
  { key: 'brother', label: '兄弟', reverseKey: 'sibling', generateNPC: false },
  { key: 'sister', label: '姐妹', reverseKey: 'sibling', generateNPC: false },
  { key: 'sibling', label: '兄弟姐妹', reverseKey: 'sibling', generateNPC: false },
  { key: 'paternal_uncle', label: '伯伯/叔叔', reverseKey: 'nephew', generateNPC: false },
  { key: 'maternal_uncle', label: '舅舅', reverseKey: 'nephew', generateNPC: false },
  { key: 'paternal_aunt', label: '姑姑', reverseKey: 'nephew', generateNPC: false },
  { key: 'maternal_aunt', label: '姨妈', reverseKey: 'nephew', generateNPC: false },
  { key: 'father_in_law', label: '公公/岳父', reverseKey: 'son_in_law/daughter_in_law', generateNPC: false },
  { key: 'mother_in_law', label: '婆婆/岳母', reverseKey: 'son_in_law/daughter_in_law', generateNPC: false },
  { key: '姐夫', label: '姐夫(妻姐之夫，即大姨子的丈夫)', reverseKey: '小舅子', generateNPC: false },
  { key: '妹夫', label: '妹夫(妻妹之夫，即小姨子的丈夫)', reverseKey: '小姨子', generateNPC: false },
  { key: '小舅子', label: '小舅子(妻子的弟弟)', reverseKey: '姐夫', generateNPC: false },
  { key: '大舅子', label: '大舅子(妻子的哥哥)', reverseKey: '姐夫', generateNPC: false },
  { key: '小姨子', label: '小姨子(妻子的妹妹)', reverseKey: '妹夫', generateNPC: false },
  { key: '大姨子', label: '大姨子(妻子的姐姐)', reverseKey: '姐夫', generateNPC: false },
  { key: '小姑子', label: '小姑子(丈夫的妹妹)', reverseKey: '妹夫', generateNPC: false },
  { key: 'daughter_in_law', label: '儿媳', reverseKey: 'father_in_law/mother_in_law', generateNPC: false },
  { key: 'son_in_law', label: '女婿', reverseKey: 'father_in_law/mother_in_law', generateNPC: false },
  { key: 'nephew', label: '侄子', reverseKey: 'uncle', generateNPC: false },
  { key: 'niece', label: '侄女', reverseKey: 'aunt', generateNPC: false },
  { key: 'cousin_male', label: '堂兄弟/表兄弟', reverseKey: 'cousin_male', generateNPC: false },
  { key: 'cousin_female', label: '堂姐妹/表姐妹', reverseKey: 'cousin_female', generateNPC: false },
  { key: 'friend', label: '朋友', reverseKey: 'friend', generateNPC: false },
  { key: 'enemy', label: '敌人', reverseKey: 'enemy', generateNPC: false },
  { key: 'colleague', label: '同事', reverseKey: 'colleague', generateNPC: false },
  { key: 'lover', label: '恋人', reverseKey: 'lover', generateNPC: false },
  { key: 'mentor', label: '导师', reverseKey: 'student', generateNPC: false },
  { key: 'student', label: '学生', reverseKey: 'mentor', generateNPC: false },
];

// 将中文关系映射到英文key
const mapRelationToKey = (relationStr: string): string => {
  const relation = relationStr.trim();
  
  // 直系亲属 - 父母祖辈
  // 区分父系和母系
  if (relation.includes('父亲') || relation.includes('爸爸')) return '父亲';
  if (relation.includes('母亲') || relation.includes('妈妈')) return '母亲';
  if (relation.includes('爷爷') || relation.includes('祖父')) return '爷爷'; // 父之父
  if (relation.includes('奶奶') || relation.includes('祖母')) return '奶奶'; // 父之母
  if (relation.includes('姥爷') || relation.includes('外祖父')) return '姥爷'; // 母之父
  if (relation.includes('姥姥') || relation.includes('外祖母')) return '姥姥'; // 母之母
  if (relation.includes('丈夫') || relation.includes('老公')) return '丈夫';
  if (relation.includes('妻子') || relation.includes('老婆')) return '妻子';
  if (relation.includes('配偶')) return '配偶';
  if (relation.includes('儿子')) return '儿子';
  if (relation.includes('女儿')) return '女儿';
  if (relation.includes('子女')) return '子女';
  if (relation.includes('孙子') && !relation.includes('外孙')) return '孙子'; // 父系孙子
  if (relation.includes('孙女') && !relation.includes('外孙女')) return '孙女'; // 父系孙女
  if (relation.includes('外孙')) return '外孙'; // 母系外孙
  if (relation.includes('外孙女')) return '外孙女'; // 母系外孙女
  if (relation.includes('哥哥') || relation.includes('弟弟') || relation.includes('兄弟')) return '兄弟';
  if (relation.includes('姐姐') || relation.includes('妹妹') || relation.includes('姐妹')) return '姐妹';
  if (relation.includes('兄妹') || relation.includes('姐弟')) return '兄妹';
  if (relation.includes('伯父') || relation.includes('伯伯') || relation.includes('大爷')) return '伯伯'; // 父系伯父
  if (relation.includes('叔叔')) return '叔叔'; // 父系叔父
  if (relation.includes('姑姑') && !relation.includes('姑父')) return '姑姑'; // 父系姑母
  if (relation.includes('姑父')) return '姑父'; // 父系姑父
  if (relation.includes('舅舅')) return '舅舅'; // 母系舅父
  if (relation.includes('舅妈') || relation.includes('舅母')) return '舅妈'; // 母系舅母
  if (relation.includes('姨妈') || relation.includes('姨母')) return '姨妈'; // 母系姨母
  if (relation.includes('姨父')) return '姨父'; // 母系姨父
  // 修复：先匹配岳父/岳母（男性主角），再匹配公公/婆婆（女性主角）
  if (relation.includes('岳父') || relation.includes('丈人')) return '岳父';
  if (relation.includes('岳母') || relation.includes('丈母娘')) return '岳母';
  if (relation.includes('公公') || relation.includes('婆父')) return '公公';
  if (relation.includes('婆婆') || relation.includes('婆母')) return '婆婆';
  if (relation.includes('姐夫')) return '姐夫';
  if (relation.includes('妹夫')) return '妹夫';
  if (relation.includes('小舅子') || relation.includes('内弟') || relation.includes('妻弟')) return '小舅子';
  if (relation.includes('大舅子') || relation.includes('内兄') || relation.includes('妻兄')) return '大舅子';
  if (relation.includes('小姨子')) return '小姨子'; // 妻子的妹妹
  if (relation.includes('大姨子')) return '大姨子'; // 妻子的姐姐
  if (relation.includes('小姑子')) return '小姑子'; // 丈夫的妹妹
  if (relation.includes('儿媳') || relation.includes('儿媳妇')) return '儿媳';
  if (relation.includes('女婿')) return '女婿';
  if (relation.includes('侄子')) return '侄子';
  if (relation.includes('侄女')) return '侄女';
  if (relation.includes('堂兄弟') || relation.includes('堂哥') || relation.includes('堂弟')) return '堂兄弟';
  if (relation.includes('堂姐妹') || relation.includes('堂姐') || relation.includes('堂妹')) return '堂姐妹';
  if (relation.includes('表兄弟') || relation.includes('表哥') || relation.includes('表弟')) return '表兄弟';
  if (relation.includes('表姐妹') || relation.includes('表姐') || relation.includes('表妹')) return '表姐妹';
  if (relation.includes('朋友')) return '朋友';
  if (relation.includes('敌人') || relation.includes('仇人')) return '仇人';
  if (relation.includes('同事')) return '同事';
  if (relation.includes('恋人') || relation.includes('情人')) return '恋人';
  if (relation.includes('导师') || relation.includes('老师')) return '导师';
  if (relation.includes('学生')) return '学生';
  if (relation.includes('发小') || relation.includes('青梅竹马')) return '发小';
  if (relation.includes('老同学') || relation.includes('老友') || relation.includes('故交')) return '老同学';
  if (relation.includes('哥们') || relation.includes('好兄弟')) return '好哥们';
  if (relation.includes('闺蜜')) return '闺蜜';
  if (relation.includes('死党')) return '死党';
  if (relation.includes('战友')) return '战友';
  if (relation.includes('室友') || relation.includes('舍友')) return '室友';
  if (relation.includes('邻居') || relation.includes('街坊')) return '邻居';
  if (relation.includes('老板') || relation.includes('上司') || relation.includes('领导')) return '上司';
  if (relation.includes('客户') || relation.includes('顾客')) return '客户';
  if (relation.includes('合作伙伴') || relation.includes('合伙人')) return '合伙人';
  if (relation.includes('校友') || relation.includes('同窗')) return '校友';
  if (relation.includes('队友')) return '队友';
  if (relation.includes('粉丝') || relation.includes('追星族')) return '粉丝';
  if (relation.includes('偶像') || relation.includes('爱豆')) return '偶像';
  if (relation.includes('对手') || relation.includes('竞争者')) return '对手';
  if (relation.includes('宿敌') || relation.includes('死对头')) return '宿敌';
  if (relation.includes('债主')) return '债主';
  if (relation.includes('债务人') || relation.includes('欠债人')) return '债务人';
  if (relation.includes('恩人') || relation.includes('救命恩人')) return '恩人';
  if (relation.includes('师傅') || relation.includes('师父')) return '师傅';
  if (relation.includes('徒弟') || relation.includes('弟子')) return '徒弟';
  if (relation.includes('搭档')) return '搭档';
  if (relation.includes('熟人')) return '熟人';
  if (relation.includes('亲戚')) return '亲戚';
  if (relation.includes('义父') || relation.includes('干爹')) return '义父';
  if (relation.includes('义母') || relation.includes('干妈')) return '义母';
  if (relation.includes('干儿子') || relation.includes('干子')) return '干儿子';
  if (relation.includes('干女儿')) return '干女儿';
  
  // 未能识别的关系，直接返回原字符串（不返回family）
  return relation;
};

export default function CharacterResultScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const params = useSafeSearchParams<{
    sliders: string;
    name: string;
    gender: string;
    age: string;
    height: string;
    weight: string;
    group: string;
    position: string; // 职位
    occupation: string;
    education: string;
    memberCount: string;
    familyRelation: string;
    familyMembersBrief: string;
    familyBackground: string;
    socialExperience: string;
    familyMembersData: string; // 用户手动设置的家庭成员数据
  }>();

  const [character, setCharacter] = useState<Character | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Character[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [relations, setRelations] = useState<CharacterRelation[]>([]);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<Character | null>(null);

  // 添加关系相关状态
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [selectedRelationType, setSelectedRelationType] = useState<string | null>(null);
  const [selectedTargetCharacter, setSelectedTargetCharacter] = useState<Character | null>(null);
  const [isGeneratingNPC, setIsGeneratingNPC] = useState(false);

  useEffect(() => {
    generateCharacter();
  }, []);

  useEffect(() => {
    if (character) {
      loadRelations();
    }
  }, [character]);

  const loadRelations = async () => {
    if (!character) return;
    const rels = await getCharacterRelations(character.id);
    setRelations(rels);
  };

  const generateCharacter = async () => {
    if (!params.sliders) {
      setError('缺少角色参数');
      setIsGenerating(false);
      return;
    }

    try {
      // 加载已有角色
      const existingChars = await getAllCharacters();
      setAllCharacters(existingChars);

      /**
       * 服务端文件：server/src/routes/character.ts
       * 接口：POST /api/v1/character/generate
       * Body 参数：sliders: object, name: string, gender: string, age: string, height: string,
       *          weight: string, group: string, position: string, occupation: string, education: string,
       *          memberCount: string, familyRelation: string, familyMembersBrief: string,
       *          familyBackground: string, socialExperience: string, familyMembersData: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/character/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sliders: JSON.parse(params.sliders),
          name: params.name,
          gender: params.gender,
          age: params.age,
          height: params.height,
          weight: params.weight,
          group: params.group,
          position: params.position, // 职位
          occupation: params.occupation,
          education: params.education,
          memberCount: params.memberCount,
          familyRelation: params.familyRelation,
          familyMembersBrief: params.familyMembersBrief,
          familyBackground: params.familyBackground,
          socialExperience: params.socialExperience,
          familyMembersData: params.familyMembersData, // 传递用户设置的家庭成员数据
        }),
      });

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const data = await response.json();

      // 创建主角对象
      const protagonistData = data.protagonist || data;
      const newCharacter: Character = {
        id: generateId(),
        name: protagonistData.name || params.name,
        gender: protagonistData.gender || params.gender || '未设定',
        age: parseInt(protagonistData.age || params.age || '25'),
        height: protagonistData.height || params.height || '170cm',
        weight: params.weight || '未设定',
        group: params.group || '未设定',
        position: params.position || '未设定', // 职位
        occupation: protagonistData.occupation || '未设定',
        education: params.education || '未设定',
        personality: protagonistData.personality || '',
        experience: protagonistData.experience || '',
        familyBackground: protagonistData.familyBackground || '',
        appearance: protagonistData.appearance || '',
        specialTraits: protagonistData.specialTraits || '',
        createdAt: Date.now(),
        roleType: params.gender === '男' ? 'male_lead' : 'female_lead', // 设置主角类型
      };

      // 生成角色头像（暂时禁用，避免404错误影响核心功能）
      // TODO: 修复图片生成API配置后重新启用
      try {
        /**
         * 服务端文件：server/src/routes/character.ts
         * 接口：POST /api/v1/character/generate-avatar
         * Body 参数：name: string, gender: string, age: string, height: string, weight: string,
         *          occupation: string, appearance: string, personality: string
         */
        const avatarResponse = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/character/generate-avatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newCharacter.name,
            gender: newCharacter.gender,
            age: newCharacter.age.toString(),
            height: newCharacter.height,
            weight: newCharacter.weight,
            occupation: newCharacter.occupation,
            appearance: newCharacter.appearance,
            personality: newCharacter.personality,
          }),
        });

        if (avatarResponse.ok) {
          const avatarData = await avatarResponse.json();
          if (avatarData.success && avatarData.avatarUrl) {
            newCharacter.avatarUrl = avatarData.avatarUrl;
          }
        }
      } catch (avatarError) {
        console.warn('Avatar generation failed, using default:', avatarError);
        // 头像生成失败不影响角色生成流程
      }

      // 保存主角到本地存储
      await saveCharacter(newCharacter);
      setCharacter(newCharacter);

      // 处理家庭成员
      const savedFamilyMembers: Character[] = [];
      if (data.familyMembers && Array.isArray(data.familyMembers)) {
        for (const memberData of data.familyMembers) {
          const familyMember: Character = {
            id: generateId(),
            name: memberData.name,
            gender: memberData.gender,
            age: parseInt(memberData.age) || 25,
            height: memberData.height || '170cm',
            weight: memberData.weight || '未设定',
            group: memberData.group || '未设定',
            position: memberData.position || '未设定',
            occupation: memberData.occupation || '未设定',
            personality: memberData.personality || '',
            experience: memberData.experience || '',
            familyBackground: memberData.familyBackground || '',
            appearance: memberData.appearance || '',
            specialTraits: memberData.specialTraits || '',
            createdAt: Date.now(),
          };
          await saveCharacter(familyMember);
          savedFamilyMembers.push(familyMember);

          // 创建关系
          const relation: CharacterRelation = {
            id: generateId(),
            characterId: newCharacter.id,
            relatedCharacterId: familyMember.id,
            relationType: mapRelationToKey(memberData.relationToProtagonist || params.familyRelation || '家庭成员'),
            description: memberData.relationToProtagonist || params.familyRelation || '家庭成员',
            createdAt: Date.now(),
          };
          await saveRelation(relation);
        }
        setFamilyMembers(savedFamilyMembers);
      }

      // 更新角色列表
      setAllCharacters([...existingChars, newCharacter, ...savedFamilyMembers]);
      setIsGenerating(false);
    } catch (err) {
      console.error('Character generation error:', err);
      setError('生成角色失败，请重试');
      setIsGenerating(false);
    }
  };

  const handleAddRelation = () => {
    setShowRelationModal(true);
    setSelectedRelationType(null);
    setSelectedTargetCharacter(null);
  };

  const handleSelectRelationType = (relationKey: string) => {
    const relationType = RELATION_TYPES.find(r => r.key === relationKey);
    if (relationType?.generateNPC) {
      // 需要生成NPC
      Alert.alert(
        '生成关联角色',
        `是否自动生成${relationType.label}角色？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '自动生成',
            onPress: () => generateNPCCharacter(relationKey)
          },
          {
            text: '选择已有角色',
            onPress: () => {
              setSelectedRelationType(relationKey);
            }
          },
        ]
      );
    } else {
      setSelectedRelationType(relationKey);
    }
  };

  const generateNPCCharacter = async (relationKey: string) => {
    if (!character) return;

    setIsGeneratingNPC(true);
    setShowRelationModal(false);

    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/character/generate-npc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseCharacter: character,
          relationType: relationKey,
        }),
      });

      if (!response.ok) {
        throw new Error('NPC生成失败');
      }

      const npcData = await response.json();

      // 创建NPC角色
      const npcCharacter: Character = {
        id: generateId(),
        name: npcData.name,
        gender: npcData.gender,
        age: npcData.age,
        height: npcData.height,
        occupation: npcData.occupation,
        personality: npcData.personality,
        experience: npcData.experience,
        familyBackground: npcData.familyBackground,
        appearance: npcData.appearance,
        specialTraits: npcData.specialTraits,
        createdAt: Date.now(),
      };

      // 保存NPC角色
      await saveCharacter(npcCharacter);

      // 创建关系
      const relation: CharacterRelation = {
        id: generateId(),
        characterId: character.id,
        relatedCharacterId: npcCharacter.id,
        relationType: relationKey,
        description: `${character.name}的${RELATION_TYPES.find(r => r.key === relationKey)?.label}`,
        createdAt: Date.now(),
      };
      await saveRelation(relation);

      // 更新状态
      setAllCharacters(prev => [...prev, npcCharacter]);
      await loadRelations();

      Alert.alert('成功', `已生成${npcCharacter.name}作为${character.name}的${RELATION_TYPES.find(r => r.key === relationKey)?.label}`);
    } catch (err) {
      console.error('NPC generation error:', err);
      Alert.alert('错误', '生成NPC失败，请重试');
    } finally {
      setIsGeneratingNPC(false);
    }
  };

  const handleSelectTargetCharacter = async (targetChar: Character) => {
    if (!character || !selectedRelationType) return;

    // 创建关系
    const relation: CharacterRelation = {
      id: generateId(),
      characterId: character.id,
      relatedCharacterId: targetChar.id,
      relationType: selectedRelationType,
      description: `${character.name}的${RELATION_TYPES.find(r => r.key === selectedRelationType)?.label}是${targetChar.name}`,
      createdAt: Date.now(),
    };

    await saveRelation(relation);
    await loadRelations();
    setShowRelationModal(false);
    setSelectedRelationType(null);
    setSelectedTargetCharacter(null);
  };

  const getRelationTypeName = (key: string) => {
    return RELATION_TYPES.find(r => r.key === key)?.label || key;
  };

  const getRelatedCharacterName = (relation: CharacterRelation) => {
    if (!character) return '';
    const relatedId = relation.characterId === character.id
      ? relation.relatedCharacterId
      : relation.characterId;
    const relatedChar = allCharacters.find(c => c.id === relatedId);
    return relatedChar?.name || '未知角色';
  };

  const renderField = (icon: string, label: string, value: string | number) => (
    <View style={styles.fieldRow}>
      <View style={styles.fieldIcon}>
        <Feather name={icon as any} size={16} color="#C8102E" />
      </View>
      <View style={styles.fieldContent}>
        <ThemedText variant="caption" color={theme.textMuted} style={styles.fieldLabel}>
          {label}
        </ThemedText>
        <ThemedText variant="body" color={theme.textPrimary}>
          {value}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      {/* Header with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/home')}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
          <ThemedText variant="small" color={theme.textPrimary} style={styles.backText}>
            返回首页
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.decorativeLine} />
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
            角色档案
          </ThemedText>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#C8102E" />
            <ThemedText variant="body" color={theme.textSecondary} style={styles.errorText}>
              {error}
            </ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={generateCharacter}>
              <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>
                重试
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : isGenerating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#C8102E" />
            <ThemedText variant="body" color={theme.textMuted} style={styles.loadingText}>
              正在生成角色...
            </ThemedText>
          </View>
        ) : character ? (
          <View style={styles.characterCard}>
            {/* Name Header */}
            <View style={styles.nameSection}>
              <ThemedText variant="h1" color={theme.textPrimary} style={styles.characterName}>
                {character.name}
              </ThemedText>
              <View style={styles.nameDivider} />
            </View>

            {/* Basic Info */}
            <View style={styles.infoSection}>
              {renderField('user', '性别', character.gender)}
              {renderField('calendar', '年龄', `${character.age}岁`)}
              {renderField('ruler', '身高', character.height)}
              {renderField('briefcase', '职业', character.occupation)}
            </View>

            {/* Divider */}
            <View style={styles.sectionDivider} />

            {/* Detailed Info */}
            <View style={styles.infoSection}>
              <View style={styles.sectionTitleRow}>
                <Feather name="star" size={16} color="#C8102E" />
                <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitleText}>
                  性格特点
                </ThemedText>
              </View>
              <ThemedText variant="body" color={theme.textSecondary} style={styles.descriptionText}>
                {character.personality}
              </ThemedText>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.sectionTitleRow}>
                <Feather name="book" size={16} color="#C8102E" />
                <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitleText}>
                  人生经历
                </ThemedText>
              </View>
              <ThemedText variant="body" color={theme.textSecondary} style={styles.descriptionText}>
                {character.experience}
              </ThemedText>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.sectionTitleRow}>
                <Feather name="home" size={16} color="#C8102E" />
                <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitleText}>
                  家庭背景
                </ThemedText>
              </View>
              <ThemedText variant="body" color={theme.textSecondary} style={styles.descriptionText}>
                {character.familyBackground}
              </ThemedText>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.sectionTitleRow}>
                <Feather name="eye" size={16} color="#C8102E" />
                <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitleText}>
                  外貌特征
                </ThemedText>
              </View>
              <ThemedText variant="body" color={theme.textSecondary} style={styles.descriptionText}>
                {character.appearance}
              </ThemedText>
            </View>

            {character.specialTraits && (
              <View style={styles.infoSection}>
                <View style={styles.sectionTitleRow}>
                  <Feather name="award" size={16} color="#C8102E" />
                  <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitleText}>
                    特殊特质
                  </ThemedText>
                </View>
                <ThemedText variant="body" color={theme.textSecondary} style={styles.descriptionText}>
                  {character.specialTraits}
                </ThemedText>
              </View>
            )}

            {/* Relations Section */}
            <View style={styles.sectionDivider} />

            <View style={styles.infoSection}>
              <View style={styles.sectionTitleRow}>
                <Feather name="users" size={16} color="#C8102E" />
                <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitleText}>
                  角色关系
                </ThemedText>
              </View>

              {relations.length > 0 ? (
                relations.map(relation => (
                  <View key={relation.id} style={styles.relationItem}>
                    <ThemedText variant="small" color={theme.textPrimary}>
                      {getRelationTypeName(relation.relationType)}: {getRelatedCharacterName(relation)}
                    </ThemedText>
                  </View>
                ))
              ) : (
                <ThemedText variant="small" color={theme.textMuted}>
                  暂无关联角色
                </ThemedText>
              )}

              <TouchableOpacity style={styles.addRelationButton} onPress={handleAddRelation}>
                <Feather name="plus" size={16} color="#C8102E" />
                <ThemedText variant="small" color="#C8102E" style={styles.addRelationText}>
                  添加关系
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Family Members Section */}
            {familyMembers.length > 0 && (
              <View style={styles.familyMembersSection}>
                <View style={styles.familyMembersHeader}>
                  <ThemedText variant="h3" color={theme.textPrimary}>
                    家庭成员 ({familyMembers.length}人)
                  </ThemedText>
                  <View style={styles.decorativeLine} />
                </View>

                {familyMembers.map((member, index) => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.familyMemberCard}
                    onPress={() => setSelectedFamilyMember(member)}
                  >
                    <View style={styles.familyMemberHeader}>
                      <ThemedText variant="h4" color={theme.textPrimary}>
                        {member.name}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {params.name}的{member.relationToProtagonist || '家庭成员'}
                      </ThemedText>
                    </View>

                    <View style={styles.familyMemberInfo}>
                      <ThemedText variant="small" color={theme.textSecondary}>
                        {member.gender} · {member.age}岁 · {member.occupation}
                      </ThemedText>
                    </View>

                    <ThemedText variant="body" color={theme.textSecondary} numberOfLines={2}>
                      {member.personality}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Relation Modal */}
      <Modal
        visible={showRelationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRelationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h3" color={theme.textPrimary}>
                添加角色关系
              </ThemedText>
              <TouchableOpacity onPress={() => setShowRelationModal(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {!selectedRelationType ? (
              <View style={styles.modalBody}>
                <ThemedText variant="small" color={theme.textMuted} style={styles.modalLabel}>
                  选择关系类型
                </ThemedText>
                <ScrollView>
                  {RELATION_TYPES.map(relation => (
                    <TouchableOpacity
                      key={relation.key}
                      style={styles.relationTypeButton}
                      onPress={() => handleSelectRelationType(relation.key)}
                    >
                      <ThemedText variant="body" color={theme.textPrimary}>
                        {relation.label}
                      </ThemedText>
                      {relation.generateNPC && (
                        <ThemedText variant="caption" color={theme.textMuted}>
                          可自动生成
                        </ThemedText>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <TouchableOpacity
                  style={styles.backToTypesButton}
                  onPress={() => setSelectedRelationType(null)}
                >
                  <Feather name="arrow-left" size={16} color={theme.textPrimary} />
                  <ThemedText variant="small" color={theme.textPrimary}>
                    返回选择关系类型
                  </ThemedText>
                </TouchableOpacity>

                <ThemedText variant="small" color={theme.textMuted} style={styles.modalLabel}>
                  选择已有角色作为{getRelationTypeName(selectedRelationType)}
                </ThemedText>

                <ScrollView>
                  {allCharacters
                    .filter(c => c.id !== character?.id)
                    .map(char => (
                      <TouchableOpacity
                        key={char.id}
                        style={styles.characterSelectButton}
                        onPress={() => handleSelectTargetCharacter(char)}
                      >
                        <View style={styles.characterInfo}>
                          <ThemedText variant="body" color={theme.textPrimary}>
                            {char.name}
                          </ThemedText>
                          <ThemedText variant="caption" color={theme.textMuted}>
                            {char.gender} · {char.age}岁
                          </ThemedText>
                        </View>
                        <Feather name="chevron-right" size={16} color={theme.textMuted} />
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Loading Overlay for NPC Generation */}
      {isGeneratingNPC && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingOverlayContent}>
            <ActivityIndicator size="large" color="#C8102E" />
            <ThemedText variant="body" color={theme.textPrimary} style={styles.loadingOverlayText}>
              正在生成关联角色...
            </ThemedText>
          </View>
        </View>
      )}

      <FloatingBall />
    </Screen>
  );
}
