import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Character, CharacterRelation, RELATION_OPTIONS, getAllCharacters } from '@/utils/characterStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CENTER_SIZE = 120;
const NODE_SIZE = 80;
const INITIAL_NODES = 6; // 初始显示6个位置
const MAX_NODES_PER_RING = 12; // 每圈最多12个节点

interface RelationNode {
  id: string;
  character: Character | null;
  relation: string | null;
  relationTo: string | null; // 对方对这个角色的称呼
  angle: number;
  radius: number; // 距离中心的半径
}

export default function RelationNetworkScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{
    mainCharacterName?: string;
    mainCharacterGender?: string;
    characterInfo?: string;
    familyMembersData?: string;
  }>();

  const { theme } = useThemeContext();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [protagonistId] = useState(() => `protagonist-${Date.now()}`);

  // 主角信息
  const protagonist = {
    id: protagonistId,
    name: params.mainCharacterName || '主角',
    gender: params.mainCharacterGender || '男',
  };

  // 关系节点（围绕主角）- 支持多圈布局
  const [relationNodes, setRelationNodes] = useState<RelationNode[]>(() => {
    const nodes: RelationNode[] = [];
    // 初始显示6个位置，分两圈排列
    const firstRingCount = Math.min(INITIAL_NODES, MAX_NODES_PER_RING);
    for (let i = 0; i < firstRingCount; i++) {
      const angle = (i / firstRingCount) * 2 * Math.PI - Math.PI / 2;
      nodes.push({
        id: `node-${i}`,
        character: null,
        relation: null,
        relationTo: null,
        angle,
        radius: 140, // 第一圈距离
      });
    }
    return nodes;
  });

  // 解析 familyMembersData 获取可用角色列表
  const [availableFamilyMembers, setAvailableFamilyMembers] = useState<any[]>([]);

  useEffect(() => {
    if (params.familyMembersData) {
      try {
        const parsed = JSON.parse(params.familyMembersData);
        if (Array.isArray(parsed)) {
          setAvailableFamilyMembers(parsed);
        }
      } catch (e) {
        console.error('Failed to parse familyMembersData:', e);
      }
    }
  }, [params.familyMembersData]);

  // 添加更多节点
  const handleAddMoreNodes = useCallback(() => {
    setRelationNodes(prev => {
      const filledCount = prev.filter(n => !n.character).length;
      // 如果有空位，先用空位
      if (filledCount > 0) {
        return prev;
      }
      // 需要添加新节点
      const lastRingCount = prev.filter(n => n.radius === prev[0]?.radius).length;
      const currentRadius = prev[0]?.radius || 140;
      
      if (lastRingCount >= MAX_NODES_PER_RING) {
        // 需要开新的一圈
        const newRadius = currentRadius + 80;
        const newAngle = -Math.PI / 2;
        return [...prev, {
          id: `node-${Date.now()}`,
          character: null,
          relation: null,
          relationTo: null,
          angle: newAngle,
          radius: newRadius,
        }];
      } else {
        // 在当前圈添加
        const newAngle = ((lastRingCount + 1) / MAX_NODES_PER_RING) * 2 * Math.PI - Math.PI / 2;
        return [...prev, {
          id: `node-${Date.now()}`,
          character: null,
          relation: null,
          relationTo: null,
          angle: newAngle,
          radius: currentRadius,
        }];
      }
    });
  }, []);

  // 已选择的角色ID（用于过滤）
  const selectedCharacterIds = useMemo(() => {
    return relationNodes
      .filter(n => n.character)
      .map(n => n.character!.id);
  }, [relationNodes]);

  // 可选择的角色列表
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);

  // 当前编辑的节点索引
  const [editingNodeIndex, setEditingNodeIndex] = useState<number | null>(null);

  // 角色选择弹窗
  const [showCharacterModal, setShowCharacterModal] = useState(false);

  // 关系选择弹窗
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // 打开角色选择弹窗 - 使用从URL参数传递的角色数据
  const handleOpenCharacterSelect = useCallback((nodeIndex: number) => {
    // 过滤掉已选择的角色和主角自己
    const available = availableFamilyMembers.filter(
      c => !selectedCharacterIds.includes(c.id) && c.id !== protagonist.id
    );
    setAvailableCharacters(available);
    setEditingNodeIndex(nodeIndex);
    setShowCharacterModal(true);
  }, [availableFamilyMembers, selectedCharacterIds, protagonist.id]);

  // 选择角色
  const handleSelectCharacter = useCallback((character: Character) => {
    setSelectedCharacter(character);
    setShowCharacterModal(false);
    setShowRelationModal(true);
  }, []);

  // 确认关系
  const handleConfirmRelation = useCallback((relation: string, relationTo: string) => {
    if (editingNodeIndex === null || !selectedCharacter) return;

    setRelationNodes(prev => {
      const updated = [...prev];
      updated[editingNodeIndex] = {
        ...updated[editingNodeIndex],
        character: selectedCharacter,
        relation,
        relationTo,
      };
      return updated;
    });

    setShowRelationModal(false);
    setSelectedCharacter(null);
    setEditingNodeIndex(null);
  }, [editingNodeIndex, selectedCharacter]);

  // 移除关系
  const handleRemoveRelation = useCallback((nodeIndex: number) => {
    setRelationNodes(prev => {
      const updated = [...prev];
      updated[nodeIndex] = {
        ...updated[nodeIndex],
        character: null,
        relation: null,
        relationTo: null,
      };
      return updated;
    });
  }, []);

  // 完成设置
  const handleComplete = useCallback(() => {
    // 构建关系数据
    const relations = relationNodes
      .filter(n => n.character && n.relation)
      .map(n => ({
        targetId: n.character!.id,
        relation: n.relation!,
        relationTo: n.relationTo,
      }));

    // 返回上一页，传递关系数据
    router.back();
    // 注意：这里需要通过某种方式传递数据回去
    // 可以通过URL参数传递
  }, [relationNodes, router]);

  // 计算节点位置
  const getNodePosition = useCallback((angle: number, radius: number = 140) => {
    const size = NODE_SIZE;
    return {
      left: SCREEN_WIDTH / 2 + Math.cos(angle) * radius - size / 2,
      top: 250 + Math.sin(angle) * radius - size / 2,
    };
  }, []);

  // 获取关系标签（从主角角度）
  const getRelationLabelText = useCallback((node: RelationNode) => {
    if (!node.relation || !node.character) return '';
    // 根据主角性别选择合适的称呼
    if (protagonist.gender === '男') {
      return node.relation;
    } else {
      // 女性视角
      const femaleRelation = RELATION_OPTIONS.find(r => r.value === node.relation);
      return femaleRelation?.femaleLabel || node.relation;
    }
  }, [protagonist.gender]);

  // 获取反向关系标签（对方对主角的称呼）
  const getReverseRelationLabel = useCallback((node: RelationNode) => {
    if (!node.relationTo || !node.character) return '';
    return `(${node.relationTo})`;
  }, []);

  return (
    <Screen>
      <View style={styles.container}>
        {/* 顶部标题 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ 返回</Text>
          </TouchableOpacity>
          <Text style={styles.title}>设置关系网络</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* 说明文字 */}
          <Text style={styles.desc}>
            点击周围的空位添加关系角色，然后设置他们与主角的关系
          </Text>

          {/* 关系网络图 */}
          <View style={styles.networkContainer}>
            {/* 中心主角 */}
            <View style={[styles.centerNode, getNodePosition(0, 0)]}>
              <Text style={styles.protagonistName}>{protagonist.name}</Text>
              <Text style={styles.protagonistLabel}>主角</Text>
            </View>

            {/* 关系节点 */}
            {relationNodes.map((node, index) => {
              const position = getNodePosition(node.angle, node.radius);
              
              if (node.character) {
                // 已添加的角色节点
                return (
                  <TouchableOpacity
                    key={node.id}
                    style={[styles.relationNode, styles.filledNode, position]}
                    onPress={() => setEditingNodeIndex(index)}
                  >
                    <Text style={styles.nodeName} numberOfLines={1}>
                      {node.character.name}
                    </Text>
                    <Text style={styles.nodeRelation}>
                      {getRelationLabelText(node)}
                    </Text>
                    <Text style={styles.nodeRelationTo}>
                      {getReverseRelationLabel(node)}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveRelation(index)}
                    >
                      <Text style={styles.removeBtnText}>×</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              } else {
                // 空位节点
                return (
                  <TouchableOpacity
                    key={node.id}
                    style={[styles.relationNode, styles.emptyNode, position]}
                    onPress={() => handleOpenCharacterSelect(index)}
                  >
                    <Text style={styles.plusIcon}>+</Text>
                    <Text style={styles.addText}>添加关系</Text>
                  </TouchableOpacity>
                );
              }
            })}

            {/* 连接线（简化版，只画到已填充的节点） */}
            {relationNodes
              .filter(n => n.character)
              .map((node, index) => {
                const startAngle = Math.PI / 2;
                const endAngle = node.angle + Math.PI / 2;
                const midAngle = (startAngle + endAngle) / 2;
                return (
                  <View
                    key={`line-${index}`}
                    style={[
                      styles.connectionLine,
                      {
                        left: SCREEN_WIDTH / 2 + Math.cos(midAngle) * 70 - 20,
                        top: 250 + Math.sin(midAngle) * 70 - 1,
                        transform: [{ rotate: `${midAngle + Math.PI / 2}rad` }],
                      },
                    ]}
                  />
                );
              })}
          </View>

          {/* 添加更多关系按钮 */}
          <TouchableOpacity style={styles.addMoreBtn} onPress={handleAddMoreNodes}>
            <Text style={styles.addMoreBtnText}>+ 添加更多关系</Text>
          </TouchableOpacity>

          {/* 已设置的关系列表 */}
          <View style={styles.relationList}>
            <Text style={styles.sectionTitle}>已设置的关系</Text>
            {relationNodes.filter(n => n.character).length === 0 ? (
              <Text style={styles.emptyText}>暂未设置任何关系</Text>
            ) : (
              relationNodes
                .filter(n => n.character)
                .map(node => (
                  <View key={node.id} style={styles.relationItem}>
                    <Text style={styles.relationItemText}>
                      {protagonist.name}
                      <Text style={styles.relationHighlight}>【{getRelationLabelText(node)}】</Text>
                      {node.character!.name}
                      <Text style={styles.relationTo}>（{node.relationTo}）</Text>
                    </Text>
                  </View>
                ))
            )}
          </View>
        </ScrollView>

        {/* 完成按钮 */}
        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
          <Text style={styles.completeBtnText}>完成设置</Text>
        </TouchableOpacity>

        {/* 角色选择弹窗 */}
        <Modal visible={showCharacterModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowCharacterModal(false)} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← 返回</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>选择角色</Text>
                <TouchableOpacity onPress={() => setShowCharacterModal(false)}>
                  <Text style={styles.closeBtn}>×</Text>
                </TouchableOpacity>
              </View>
              {availableCharacters.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>没有可选择的角色</Text>
                  <Text style={styles.emptyHint}>请先在角色生成页面添加家庭成员</Text>
                  <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => setShowCharacterModal(false)}
                  >
                    <Text style={styles.backButtonText}>返回上一页</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={availableCharacters}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.characterItem}
                      onPress={() => handleSelectCharacter(item)}
                    >
                      <Text style={styles.characterName}>{item.name}</Text>
                      <Text style={styles.characterGender}>
                        {item.gender === '男' ? '男' : '女'}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* 关系选择弹窗 */}
        <Modal visible={showRelationModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  设置与{selectedCharacter?.name}的关系
                </Text>
                <TouchableOpacity onPress={() => setShowRelationModal(false)}>
                  <Text style={styles.closeBtn}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView>
                <Text style={styles.relationHint}>
                  请选择 {protagonist.name} 对 {selectedCharacter?.name} 的称呼：
                </Text>
                {RELATION_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.relationOption}
                    onPress={() => {
                      handleConfirmRelation(option.value, option.reverseLabel || option.label);
                    }}
                  >
                    <Text style={styles.relationOptionText}>{option.label}</Text>
                    {option.femaleLabel && (
                      <Text style={styles.relationOptionFemale}>
                        （女：{option.femaleLabel}）
                      </Text>
                    )}
                    <Text style={styles.relationOptionReverse}>
                      {'<->'} {option.reverseLabel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: {
    fontSize: 18,
    color: theme.primary,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: theme.backgroundTertiary,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  desc: {
    textAlign: 'center',
    color: theme.textSecondary,
    fontSize: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  networkContainer: {
    position: 'relative',
    height: 500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerNode: {
    position: 'absolute',
    width: CENTER_SIZE,
    height: CENTER_SIZE,
    borderRadius: CENTER_SIZE / 2,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  protagonistName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  protagonistLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  relationNode: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  emptyNode: {
    backgroundColor: theme.backgroundTertiary,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  filledNode: {
    backgroundColor: theme.backgroundTertiary,
    borderWidth: 2,
    borderColor: theme.primary,
  },
  plusIcon: {
    fontSize: 24,
    color: theme.textSecondary,
  },
  addText: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  nodeName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.text,
  },
  nodeRelation: {
    fontSize: 10,
    color: theme.primary,
    marginTop: 2,
  },
  nodeRelationTo: {
    fontSize: 9,
    color: theme.textSecondary,
  },
  removeBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  connectionLine: {
    position: 'absolute',
    width: 2,
    height: 60,
    backgroundColor: theme.border,
  },
  addMoreBtn: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.primary,
    borderStyle: 'dashed',
    marginTop: 16,
  },
  addMoreBtnText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  relationList: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.textSecondary,
    fontSize: 14,
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyHint: {
    textAlign: 'center',
    color: theme.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  relationItem: {
    backgroundColor: theme.backgroundTertiary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  relationItemText: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 22,
  },
  relationHighlight: {
    color: theme.primary,
    fontWeight: 'bold',
  },
  relationTo: {
    color: theme.textSecondary,
  },
  completeBtn: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    height: 50,
    backgroundColor: theme.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  closeBtn: {
    fontSize: 28,
    color: theme.textSecondary,
  },
  characterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  characterName: {
    fontSize: 16,
    color: theme.text,
  },
  characterGender: {
    fontSize: 18,
    color: theme.textSecondary,
  },
  relationHint: {
    padding: 16,
    fontSize: 14,
    color: theme.textSecondary,
  },
  relationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  relationOptionText: {
    fontSize: 16,
    color: theme.text,
    flex: 1,
  },
  relationOptionFemale: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 8,
  },
  relationOptionReverse: {
    fontSize: 14,
    color: theme.primary,
  },
});
