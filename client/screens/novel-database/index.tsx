import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useRouter } from '@/hooks/useSafeRouter';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';
import { NovelData, loadNovel, saveNovel } from '@/utils/novelStorage';
import { CharacterData, loadCharacters, saveCharacter } from '@/utils/characterStorage';

interface Props {
  novelData: NovelData;
  novelId: string;
}

export default function NovelDatabase({ novelData, novelId }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'characters' | 'settings' | 'plot'>('characters');
  const [characters, setCharacters] = useState<CharacterData[]>(() => {
    return loadCharacters().filter(
      (char) => char.novelId === novelId && char.roleType
    );
  });
  const [selectedChar, setSelectedChar] = useState<CharacterData | null>(null);
  const [editingChar, setEditingChar] = useState<CharacterData | null>(null);
  const [experienceModalVisible, setExperienceModalVisible] = useState(false);

  // 提取男性主角和女性主角
  const maleLead = characters.find((c) => c.roleType === 'male_lead');
  const femaleLead = characters.find((c) => c.roleType === 'female_lead');
  const supportingChars = characters.filter(
    (c) => !['male_lead', 'female_lead'].includes(c.roleType || '')
  );

  // 更新角色社会经历
  const handleSaveExperience = useCallback(() => {
    if (!editingChar) return;
    
    // 保存到角色库
    const allChars = loadCharacters();
    const updatedChars = allChars.map((c) =>
      c.id === editingChar.id ? editingChar : c
    );
    saveCharacter(updatedChars);
    
    // 更新本地状态
    setCharacters((prev) =>
      prev.map((c) => (c.id === editingChar.id ? editingChar : c))
    );
    setExperienceModalVisible(false);
  }, [editingChar]);

  // 添加社会经历
  const handleAddExperience = useCallback((char: CharacterData) => {
    setEditingChar({
      ...char,
      socialExperiences: char.socialExperiences || [],
      shortTermMemory: char.shortTermMemory || [],
      longTermMemory: char.longTermMemory || [],
    });
    setExperienceModalVisible(true);
  }, []);

  // 更新长期记忆
  const handleUpdateLongTermMemory = useCallback((index: number, value: string) => {
    if (!editingChar) return;
    const newMemory = [...(editingChar.longTermMemory || [])];
    newMemory[index] = value;
    setEditingChar({ ...editingChar, longTermMemory: newMemory });
  }, [editingChar]);

  // 删除长期记忆
  const handleDeleteLongTermMemory = useCallback((index: number) => {
    if (!editingChar) return;
    const newMemory = (editingChar.longTermMemory || []).filter((_, i) => i !== index);
    setEditingChar({ ...editingChar, longTermMemory: newMemory });
  }, [editingChar]);

  // 添加新记忆
  const handleAddLongTermMemory = useCallback(() => {
    if (!editingChar) return;
    const newMemory = [...(editingChar.longTermMemory || []), ''];
    setEditingChar({ ...editingChar, longTermMemory: newMemory });
  }, [editingChar]);

  const renderCharacterCard = (char: CharacterData, label: string) => (
    <View key={char.id} style={styles.charCard}>
      <View style={styles.charHeader}>
        <View>
          <Text style={styles.charLabel}>{label}</Text>
          <Text style={styles.charName}>{char.name}</Text>
        </View>
        <View style={styles.charMeta}>
          <Text style={styles.charMetaText}>
            {char.gender} · {char.age}岁 · {char.occupation}
          </Text>
        </View>
      </View>
      
      {/* 记忆统计 */}
      <View style={styles.memoryStats}>
        <View style={styles.memoryStat}>
          <Text style={styles.memoryStatLabel}>长期记忆</Text>
          <Text style={styles.memoryStatValue}>
            {char.longTermMemory?.length || 0} 条
          </Text>
        </View>
        <View style={styles.memoryStat}>
          <Text style={styles.memoryStatLabel}>短期经历</Text>
          <Text style={styles.memoryStatValue}>
            {char.shortTermMemory?.length || 0} 条
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.experienceButton}
        onPress={() => handleAddExperience(char)}
      >
        <Text style={styles.experienceButtonText}>查看/编辑社会经历</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>小说数据库</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab切换 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'characters' && styles.tabActive]}
          onPress={() => setActiveTab('characters')}
        >
          <Text style={[styles.tabText, activeTab === 'characters' && styles.tabTextActive]}>
            角色库
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            设定资料
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plot' && styles.tabActive]}
          onPress={() => setActiveTab('plot')}
        >
          <Text style={[styles.tabText, activeTab === 'plot' && styles.tabTextActive]}>
            剧情概要
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'characters' && (
          <View style={styles.section}>
            {/* 主角 */}
            {maleLead && renderCharacterCard(maleLead, '男主')}
            {femaleLead && renderCharacterCard(femaleLead, '女主')}
            
            {/* 配角 */}
            {supportingChars.length > 0 && (
              <View style={styles.supportingSection}>
                <Text style={styles.sectionTitle}>配角</Text>
                {supportingChars.map((char) =>
                  renderCharacterCard(char, char.name)
                )}
              </View>
            )}

            {characters.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>暂无角色</Text>
                <Text style={styles.emptyHint}>
                  请在角色库中添加角色后再编辑社会经历
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.section}>
            <View style={styles.settingCard}>
              <Text style={styles.settingTitle}>小说标题</Text>
              <Text style={styles.settingValue}>{novelData.title}</Text>
            </View>
            
            <View style={styles.settingCard}>
              <Text style={styles.settingTitle}>世界背景</Text>
              <Text style={styles.settingValue}>{novelData.worldView || '未设置'}</Text>
            </View>
            
            <View style={styles.settingCard}>
              <Text style={styles.settingTitle}>主角当前状态</Text>
              <Text style={styles.settingValue}>
                {novelData.maleLead?.occupation || '未设置'}
              </Text>
            </View>
            
            <View style={styles.settingCard}>
              <Text style={styles.settingTitle}>主角当前地点</Text>
              <Text style={styles.settingValue}>
                {novelData.maleLead?.location || '未设置'}
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'plot' && (
          <View style={styles.section}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>暂无剧情概要</Text>
              <Text style={styles.emptyHint}>
                AI续写完成后会自动生成剧情概要
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 社会经历编辑弹窗 */}
      <Modal
        visible={experienceModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {editingChar && (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingChar.name} - 社会经历
                </Text>
                <TouchableOpacity onPress={() => setExperienceModalVisible(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* 长期记忆 */}
                <View style={styles.memorySection}>
                  <Text style={styles.memorySectionTitle}>
                    长期记忆 ({editingChar.longTermMemory?.length || 0}条)
                  </Text>
                  <Text style={styles.memoryHint}>
                    这些是角色的重要经历摘要，AI创作时会参考
                  </Text>
                  
                  {(editingChar.longTermMemory || []).map((memory, index) => (
                    <View key={index} style={styles.memoryItem}>
                      <TextInput
                        style={styles.memoryInput}
                        value={memory}
                        onChangeText={(text) => handleUpdateLongTermMemory(index, text)}
                        placeholder="输入经历摘要..."
                        multiline
                      />
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteLongTermMemory(index)}
                      >
                        <Text style={styles.deleteBtnText}>删除</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  
                  <TouchableOpacity
                    style={styles.addMemoryBtn}
                    onPress={handleAddLongTermMemory}
                  >
                    <Text style={styles.addMemoryBtnText}>+ 添加经历</Text>
                  </TouchableOpacity>
                </View>

                {/* 短期经历 */}
                <View style={styles.memorySection}>
                  <Text style={styles.memorySectionTitle}>
                    短期经历 ({editingChar.shortTermMemory?.length || 0}条)
                  </Text>
                  <Text style={styles.memoryHint}>
                    AI续写时自动记录，用于生成长期记忆
                  </Text>
                  
                  {(editingChar.shortTermMemory || []).map((memory, index) => (
                    <View key={index} style={styles.shortTermItem}>
                      <Text style={styles.shortTermText}>{memory}</Text>
                    </View>
                  ))}
                  
                  {(!editingChar.shortTermMemory || editingChar.shortTermMemory.length === 0) && (
                    <Text style={styles.noShortTermText}>暂无短期经历</Text>
                  )}
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setExperienceModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveExperience}
                >
                  <Text style={styles.saveBtnText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: Spacing.xs,
  },
  backBtnText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 50,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  section: {
    padding: Spacing.md,
  },
  supportingSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: Spacing.sm,
  },
  charCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  charHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  charLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  charName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  charMeta: {
    alignItems: 'flex-end',
  },
  charMetaText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  memoryStats: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
  },
  memoryStat: {
    flex: 1,
  },
  memoryStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  memoryStatValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  experienceButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: BorderRadius.sm,
  },
  experienceButtonText: {
    fontSize: 13,
    color: '#007AFF',
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  settingTitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  emptyHint: {
    fontSize: 13,
    color: '#C7C7CC',
    marginTop: 4,
  },
  // 弹窗样式
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeBtn: {
    fontSize: 20,
    color: '#8E8E93',
    padding: Spacing.xs,
  },
  modalBody: {
    flex: 1,
    padding: Spacing.md,
  },
  memorySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  memorySectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  memoryHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: Spacing.sm,
  },
  memoryItem: {
    marginBottom: Spacing.sm,
  },
  memoryInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: 14,
    color: '#1A1A1A',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  deleteBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  deleteBtnText: {
    fontSize: 13,
    color: '#FF3B30',
  },
  addMemoryBtn: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: BorderRadius.sm,
    borderStyle: 'dashed',
  },
  addMemoryBtnText: {
    fontSize: 14,
    color: '#007AFF',
  },
  shortTermItem: {
    paddingVertical: Spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  shortTermText: {
    fontSize: 13,
    color: '#3C3C43',
  },
  noShortTermText: {
    fontSize: 13,
    color: '#C7C7CC',
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: BorderRadius.sm,
  },
  cancelBtnText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: BorderRadius.sm,
  },
  saveBtnText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
