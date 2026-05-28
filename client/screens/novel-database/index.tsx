import React, { useState, useCallback, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';
import { Novel, getAllNovels, getNovelById, updateNovelCharacter, deleteNovel } from '@/utils/novelStorage';
import { Character, getAllCharacters, saveCharacter } from '@/utils/characterStorage';

export default function NovelDatabaseScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ novelId?: string }>();
  
  const [allNovels, setAllNovels] = useState<Novel[]>([]);
  const [currentNovel, setCurrentNovel] = useState<Novel | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [experienceModalVisible, setExperienceModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'characters' | 'settings' | 'plot'>('characters');

  // 加载指定小说
  const loadNovel = useCallback(async (novelId: string) => {
    const novel = await getNovelById(novelId);
    if (novel) {
      setCurrentNovel(novel);
      // 从小说对象中获取角色数据
      const novelChars: Character[] = [];
      if (novel.maleCharacterData) novelChars.push(novel.maleCharacterData);
      if (novel.femaleCharacterData) novelChars.push(novel.femaleCharacterData);
      if (novel.sideCharacters) novelChars.push(...novel.sideCharacters);
      setCharacters(novelChars);
    }
  }, []);

  // 加载所有小说
  const loadAllNovels = useCallback(async () => {
    const novels = await getAllNovels();
    setAllNovels(novels);
    setCurrentNovel(null);
    setCharacters([]);
  }, []);

  // 如果有传入的 novelId，加载对应小说
  useEffect(() => {
    if (params.novelId) {
      loadNovel(params.novelId);
    } else {
      // 没有传入 novelId，加载所有小说列表
      loadAllNovels();
    }
  }, [params.novelId, loadNovel, loadAllNovels]);

  // 选择小说
  const handleSelectNovel = (novel: Novel) => {
    router.push('/novel-database', { novelId: novel.id });
  };

  // 删除小说
  const handleDeleteNovel = useCallback(async (novel: Novel, e: any) => {
    e?.stopPropagation?.();
    await deleteNovel(novel.id);
    await loadAllNovels();
  }, [loadAllNovels]);

  // 返回上一页
  const handleBack = () => {
    router.back();
  };

  // 更新角色社会经历
  const handleSaveExperience = useCallback(() => {
    if (!editingChar || !currentNovel) return;
    
    // 更新小说中的角色数据
    updateNovelCharacter(currentNovel.id, editingChar);
    
    // 更新本地状态
    setCharacters((prev) =>
      prev.map((c) => (c.id === editingChar.id ? editingChar : c))
    );
    
    setExperienceModalVisible(false);
  }, [editingChar, currentNovel]);

  // 添加社会经历
  const handleAddExperience = useCallback((char: Character) => {
    setEditingChar({
      ...char,
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
    const newMemory = (editingChar.longTermMemory || []).filter((_: string, i: number) => i !== index);
    setEditingChar({ ...editingChar, longTermMemory: newMemory });
  }, [editingChar]);

  // 添加新记忆
  const handleAddLongTermMemory = useCallback(() => {
    if (!editingChar) return;
    const newMemory = [...(editingChar.longTermMemory || []), ''];
    setEditingChar({ ...editingChar, longTermMemory: newMemory });
  }, [editingChar]);

  // 渲染小说卡片
  const renderNovelCard = (novel: Novel) => {
    const hasCharacters = (novel.maleCharacterData || novel.femaleCharacterData || (novel.sideCharacters && novel.sideCharacters.length > 0));
    
    return (
      <TouchableOpacity
        key={novel.id}
        style={styles.novelCard}
        onPress={() => handleSelectNovel(novel)}
      >
        <View style={styles.novelIcon}>
          <Text style={styles.novelIconText}>📖</Text>
        </View>
        <View style={styles.novelInfo}>
          <Text style={styles.novelTitle}>{novel.title}</Text>
          <Text style={styles.novelMeta}>
            {hasCharacters ? '✅ 已绑定角色' : '⏳ 未绑定角色'}
            {(novel.worldName || novel.eraBackground) ? ' | 📝 世界设定' : ''}
            {novel.chapters && novel.chapters.length > 0 ? ` | 📄 ${novel.chapters.length}章节` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteNovelBtn}
          onPress={(e) => handleDeleteNovel(novel, e)}
        >
          <Text style={styles.deleteNovelBtnText}>删除</Text>
        </TouchableOpacity>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  // 渲染角色卡片
  const renderCharacterCard = (char: Character, label: string) => (
    <View key={char.id} style={styles.charCard}>
      <View style={styles.charHeader}>
        <Text style={styles.charLabel}>{label}</Text>
        <TouchableOpacity onPress={() => setSelectedChar(char)}>
          <Text style={styles.viewDetail}>查看详情</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.charName}>{char.name}</Text>
      <Text style={styles.charRole}>{char.age}岁 | {char.occupation}</Text>
      
      {/* 短期记忆预览 */}
      {char.shortTermMemory && char.shortTermMemory.length > 0 && (
        <View style={styles.memorySection}>
          <Text style={styles.memoryTitle}>近期经历 ({char.shortTermMemory.length}条)</Text>
        </View>
      )}
      
      {/* 长期记忆预览 */}
      {char.longTermMemory && char.longTermMemory.length > 0 && (
        <View style={styles.memorySection}>
          <Text style={styles.memoryTitle}>重要记忆 ({char.longTermMemory.length}条)</Text>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.addMemoryBtn}
        onPress={() => handleAddExperience(char)}
      >
        <Text style={styles.addMemoryText}>+ 添加/查看记忆</Text>
      </TouchableOpacity>
    </View>
  );

  // 提取男性主角和女性主角
  const maleLead = characters.find((c: Character) => c.roleType === 'male_lead');
  const femaleLead = characters.find((c: Character) => c.roleType === 'female_lead');
  const supportingChars = characters.filter(
    (c: Character) => !['male_lead', 'female_lead'].includes(c.roleType || '')
  );

  // 渲染小说列表视图
  const renderNovelList = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>小说数据库</Text>
        <View style={styles.placeholder} />
      </View>
      
      {allNovels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>暂无小说</Text>
          <Text style={styles.emptySubtext}>在首页创建小说后，可以在这里查看和管理小说数据</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <Text style={styles.sectionTitle}>全部小说 ({allNovels.length})</Text>
          {allNovels.map(renderNovelCard)}
        </ScrollView>
      )}
    </View>
  );

  // 渲染小说详情视图
  const renderNovelDetail = () => {
    if (!currentNovel) return null;
    
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ 返回小说列表</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{currentNovel.name}</Text>
          <View style={styles.placeholder} />
        </View>
        
        {/* 标签切换 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'characters' && styles.activeTab]}
            onPress={() => setActiveTab('characters')}
          >
            <Text style={[styles.tabText, activeTab === 'characters' && styles.activeTabText]}>
              角色 ({characters.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
              世界设定
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'plot' && styles.activeTab]}
            onPress={() => setActiveTab('plot')}
          >
            <Text style={[styles.tabText, activeTab === 'plot' && styles.activeTabText]}>
              剧情概要
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView}>
          {activeTab === 'characters' && (
            <>
              {/* 主角 */}
              {maleLead && renderCharacterCard(maleLead, '男主角')}
              {femaleLead && renderCharacterCard(femaleLead, '女主角')}
              
              {/* 配角 */}
              {supportingChars.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>配角 ({supportingChars.length})</Text>
                  {supportingChars.map((char) => {
                    const label = char.isTemporary ? `[临时] ${char.name}` : char.name;
                    return renderCharacterCard(char, label);
                  })}
                </>
              )}
              
              {characters.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>👤</Text>
                  <Text style={styles.emptyText}>暂无角色</Text>
                  <Text style={styles.emptySubtext}>在创作页面绑定角色后，这里将显示角色信息</Text>
                </View>
              )}
            </>
          )}
          
          {activeTab === 'settings' && (
            <View style={styles.contentSection}>
              {currentNovel.worldName || currentNovel.eraBackground || currentNovel.region ? (
                <View>
                  {currentNovel.worldName && (
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>世界名称</Text>
                      <Text style={styles.settingValue}>{currentNovel.worldName}</Text>
                    </View>
                  )}
                  {currentNovel.eraBackground && (
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>年代背景</Text>
                      <Text style={styles.settingValue}>{currentNovel.eraBackground}</Text>
                    </View>
                  )}
                  {currentNovel.seasonSetting && (
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>季节设定</Text>
                      <Text style={styles.settingValue}>{currentNovel.seasonSetting}</Text>
                    </View>
                  )}
                  {currentNovel.region && (
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>地区</Text>
                      <Text style={styles.settingValue}>{currentNovel.region}</Text>
                    </View>
                  )}
                  {currentNovel.cityLocation && (
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>城市位置</Text>
                      <Text style={styles.settingValue}>{currentNovel.cityLocation}</Text>
                    </View>
                  )}

                  {currentNovel.worldSettings && (
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>详细设定</Text>
                      <Text style={styles.settingValue}>{currentNovel.worldSettings}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🌍</Text>
                  <Text style={styles.emptyText}>暂无世界设定</Text>
                  <Text style={styles.emptySubtext}>在创作页面设置世界背景后，这里将显示设定内容</Text>
                </View>
              )}
            </View>
          )}
          
          {activeTab === 'plot' && (
            <View style={styles.contentSection}>
              {currentNovel.plotSummary ? (
                <Text style={styles.contentText}>{currentNovel.plotSummary}</Text>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📝</Text>
                  <Text style={styles.emptyText}>暂无剧情概要</Text>
                  <Text style={styles.emptySubtext}>开始创作后，剧情概要将自动生成</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
        
        {/* 角色详情弹窗 */}
        <Modal
          visible={!!selectedChar}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedChar(null)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.detailModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedChar?.name}</Text>
                <TouchableOpacity onPress={() => setSelectedChar(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                {selectedChar && (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>基本信息</Text>
                      <Text style={styles.detailText}>
                        年龄: {selectedChar.age}岁{'\n'}
                        职业: {selectedChar.occupation}{'\n'}
                        性别: {selectedChar.gender === 'male' ? '男' : '女'}
                      </Text>
                    </View>
                    
                    {selectedChar.personality && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>性格特点</Text>
                        <Text style={styles.detailText}>{selectedChar.personality}</Text>
                      </View>
                    )}
                    
                    {selectedChar.background && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>背景故事</Text>
                        <Text style={styles.detailText}>{selectedChar.background}</Text>
                      </View>
                    )}
                    
                    {selectedChar.appearance && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>外貌特征</Text>
                        <Text style={styles.detailText}>{selectedChar.appearance}</Text>
                      </View>
                    )}
                    
                    {selectedChar.shortTermMemory && selectedChar.shortTermMemory.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>近期经历</Text>
                        {selectedChar.shortTermMemory.map((exp, idx) => (
                          <Text key={idx} style={styles.memoryItem}>• {exp}</Text>
                        ))}
                      </View>
                    )}
                    
                    {selectedChar.longTermMemory && selectedChar.longTermMemory.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>重要记忆</Text>
                        {selectedChar.longTermMemory.map((mem, idx) => (
                          <Text key={idx} style={styles.memoryItem}>• {mem}</Text>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
        
        {/* 编辑记忆弹窗 */}
        <Modal
          visible={experienceModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setExperienceModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.experienceModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingChar?.name} - 角色记忆
                </Text>
                <TouchableOpacity onPress={() => setExperienceModalVisible(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                <Text style={styles.memorySectionTitle}>
                  重要记忆（由AI定期总结）
                </Text>
                
                {(editingChar?.longTermMemory || []).map((mem, idx) => (
                  <View key={idx} style={styles.memoryRow}>
                    <TextInput
                      style={styles.memoryInput}
                      value={mem}
                      onChangeText={(text) => handleUpdateLongTermMemory(idx, text)}
                      placeholder="输入记忆内容..."
                      multiline
                    />
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteLongTermMemory(idx)}
                    >
                      <Text style={styles.deleteBtnText}>删除</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={handleAddLongTermMemory}
                >
                  <Text style={styles.addBtnText}>+ 添加新记忆</Text>
                </TouchableOpacity>
              </ScrollView>
              
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveExperience}
              >
                <Text style={styles.saveBtnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  };

  // 根据是否有当前小说决定渲染哪个视图
  return currentNovel ? renderNovelDetail() : renderNovelList();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backBtn: {
    padding: Spacing.xs,
  },
  backBtnText: {
    fontSize: 16,
    color: '#4F46E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  novelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deleteNovelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
    marginRight: 8,
  },
  deleteNovelBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  novelIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F0F0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  novelIconText: {
    fontSize: 24,
  },
  novelInfo: {
    flex: 1,
  },
  novelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  novelMeta: {
    fontSize: 12,
    color: '#999',
  },
  arrow: {
    fontSize: 24,
    color: '#CCC',
  },
  charCard: {
    backgroundColor: '#fff',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  charHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  charLabel: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
  },
  viewDetail: {
    fontSize: 12,
    color: '#666',
  },
  charName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  charRole: {
    fontSize: 13,
    color: '#999',
    marginBottom: Spacing.sm,
  },
  memorySection: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  memoryTitle: {
    fontSize: 12,
    color: '#666',
  },
  addMemoryBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.sm,
  },
  addMemoryText: {
    fontSize: 13,
    color: '#4F46E5',
  },
  contentSection: {
    backgroundColor: '#fff',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  contentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  settingRow: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: Spacing.xs,
  },
  settingValue: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  experienceModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeBtn: {
    fontSize: 20,
    color: '#999',
    padding: Spacing.xs,
  },
  modalContent: {
    padding: Spacing.md,
    maxHeight: 400,
  },
  detailSection: {
    marginBottom: Spacing.lg,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: Spacing.xs,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  memoryItem: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  memorySectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: Spacing.md,
  },
  memoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  memoryInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginRight: Spacing.sm,
  },
  deleteBtn: {
    padding: Spacing.sm,
  },
  deleteBtnText: {
    fontSize: 13,
    color: '#F43F5E',
  },
  addBtn: {
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  addBtnText: {
    fontSize: 14,
    color: '#4F46E5',
  },
  saveBtn: {
    margin: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#4F46E5',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
