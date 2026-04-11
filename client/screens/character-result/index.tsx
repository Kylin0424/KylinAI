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

// 临时使用线上地址测试
const EXPO_PUBLIC_BACKEND_BASE_URL = 'https://kylinai-1.onrender.com';

// 关系类型定义
const RELATION_TYPES = [
  { key: 'father', label: '父亲', reverseKey: 'child', generateNPC: true },
  { key: 'mother', label: '母亲', reverseKey: 'child', generateNPC: true },
  { key: 'spouse', label: '配偶', reverseKey: 'spouse', generateNPC: false },
  { key: 'sibling', label: '兄弟姐妹', reverseKey: 'sibling', generateNPC: false },
  { key: 'child', label: '子女', reverseKey: 'parent', generateNPC: true },
  { key: 'friend', label: '朋友', reverseKey: 'friend', generateNPC: false },
  { key: 'enemy', label: '敌人', reverseKey: 'enemy', generateNPC: false },
  { key: 'colleague', label: '同事', reverseKey: 'colleague', generateNPC: false },
  { key: 'lover', label: '恋人', reverseKey: 'lover', generateNPC: false },
  { key: 'mentor', label: '导师', reverseKey: 'student', generateNPC: false },
  { key: 'student', label: '学生', reverseKey: 'mentor', generateNPC: false },
];

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
    occupation: string;
    education: string;
    memberCount: string;
    familyRelation: string;
    familyMembersBrief: string;
    familyBackground: string;
    socialExperience: string;
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
       *          weight: string, group: string, occupation: string, education: string,
       *          memberCount: string, familyRelation: string, familyMembersBrief: string,
       *          familyBackground: string, socialExperience: string
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
          occupation: params.occupation,
          education: params.education,
          memberCount: params.memberCount,
          familyRelation: params.familyRelation,
          familyMembersBrief: params.familyMembersBrief,
          familyBackground: params.familyBackground,
          socialExperience: params.socialExperience,
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
        occupation: protagonistData.occupation || '未设定',
        education: params.education || '未设定',
        personality: protagonistData.personality || '',
        experience: protagonistData.experience || '',
        familyBackground: protagonistData.familyBackground || '',
        appearance: protagonistData.appearance || '',
        specialTraits: protagonistData.specialTraits || '',
        createdAt: Date.now(),
      };

      // 生成角色头像
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
            relationType: 'family',
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
                        {member.relationToProtagonist || params.familyRelation}
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
