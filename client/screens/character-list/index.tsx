import React, { useState, useMemo, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
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
  getAllRelations,
  deleteCharacter,
} from '@/utils/characterStorage';
import { Novel, getAllNovels } from '@/utils/novelStorage';

type CharacterTab = 'permanent' | 'temporary';

export default function CharacterListScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const params = useSafeSearchParams<{
    mode?: string;
    returnTo?: string;
  }>();

  const isSelectMode = params.mode === 'select';

  const [characters, setCharacters] = useState<Character[]>([]);
  const [relations, setRelations] = useState<CharacterRelation[]>([]);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CharacterTab>('permanent');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

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

  useFocusEffect(
    useCallback(() => {
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

  const getCharacterRelations = (charId: string): CharacterRelation[] => {
    return relations.filter(
      r => r.characterId === charId || r.relatedCharacterId === charId
    );
  };

  const getRelationLabel = (relation: CharacterRelation, charId: string): string => {
    const relationTypes: Record<string, string> = {
      'father': '父亲',
      'mother': '母亲',
      'spouse': '配偶',
      'sibling': '兄弟姐妹',
      'child': '子女',
      'friend': '朋友',
      'enemy': '敌人',
      'colleague': '同事',
      'lover': '恋人',
      'mentor': '导师',
      'student': '学生',
    };
    
    const label = relationTypes[relation.relationType] || relation.relationType;
    return label;
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
                  style={[styles.characterCard, isLocked && styles.lockedCharacterCard, isTemp && styles.temporaryCharacterCard, isSelectMode && selectedCharacterId === char.id && styles.selectedCharacterCard]}
                  onPress={() => {
                    if (isSelectMode) {
                      setSelectedCharacterId(char.id);
                    }
                  }}
                  activeOpacity={isSelectMode ? 0.7 : 1}
                >
                  <View style={styles.characterHeader}>
                    <View style={styles.characterMain}>
                      <View style={styles.characterNameRow}>
                        {isSelectMode && (
                          <View style={styles.checkboxContainer}>
                            <View style={[styles.checkbox, selectedCharacterId === char.id && styles.checkboxChecked]}>
                              {selectedCharacterId === char.id && <Feather name="check" size={14} color="#fff" />}
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
                    {!isSelectMode && (
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
                          return (
                            <View key={relation.id} style={styles.relationTag}>
                              <ThemedText variant="caption" color={theme.textSecondary}>
                                {getRelationLabel(relation, char.id)}: {relatedChar?.name || '未知'}
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
                      if (isSelectMode) {
                        const returnTo = params.returnTo || '/home';
                        router.replace(returnTo, {
                          selectedCharacterId: char.id,
                        });
                      } else {
                        router.push('/character-detail', { characterId: char.id });
                      }
                    }}
                  >
                    <ThemedText variant="small" color={isLocked ? theme.textMuted : "#C8102E"}>
                      {isSelectMode ? '添加到配角' : '查看详情'}
                    </ThemedText>
                    <Feather name={isSelectMode ? 'plus' : 'chevron-right'} size={16} color={isLocked ? theme.textMuted : "#C8102E"} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

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

      <FloatingBall />
    </Screen>
  );
}
