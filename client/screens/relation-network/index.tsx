import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Character, RELATION_OPTIONS } from '@/utils/characterStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CENTER_SIZE = 120;
const NODE_SIZE = 80;
const MAX_NODES_PER_RING = 12;

interface RelationNode {
  id: string;
  character: Character | null;
  relation: string | null;
  relationTo: string | null;
  angle: number;
  radius: number;
}

interface FamilyMemberData {
  id: string;
  name: string;
  gender: string;
  age?: string;
  relation: string;
  relationTo?: string;
  occupation?: string;
  education?: string;
  height?: string;
  weight?: string;
  group?: string;
  position?: string;
  brief?: string;
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

  // 关系节点
  const [relationNodes, setRelationNodes] = useState<RelationNode[]>(() => {
    const nodes: RelationNode[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * 2 * Math.PI - Math.PI / 2;
      nodes.push({
        id: `node-${i}`,
        character: null,
        relation: null,
        relationTo: null,
        angle,
        radius: 140,
      });
    }
    return nodes;
  });

  // 可用家庭成员数据（从URL参数解析）
  const [familyMembersData, setFamilyMembersData] = useState<FamilyMemberData[]>([]);

  useEffect(() => {
    if (params.familyMembersData) {
      try {
        const parsed = JSON.parse(params.familyMembersData);
        if (Array.isArray(parsed)) {
          // 为每个家庭成员生成唯一ID
          const membersWithIds = parsed.map((member, index) => ({
            ...member,
            id: member.id || `family-member-${index}-${Date.now()}`,
          }));
          setFamilyMembersData(membersWithIds);
        }
      } catch (e) {
        console.error('Failed to parse familyMembersData:', e);
      }
    }
  }, [params.familyMembersData]);

  // 已选择的角色ID
  const selectedCharacterIds = useMemo(() => {
    return relationNodes
      .filter(n => n.character)
      .map(n => n.character!.id);
  }, [relationNodes]);

  // 当前编辑的节点索引
  const [editingNodeIndex, setEditingNodeIndex] = useState<number | null>(null);

  // 角色选择弹窗
  const [showCharacterModal, setShowCharacterModal] = useState(false);

  // 关系选择弹窗
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // 添加更多节点
  const handleAddMoreNodes = useCallback(() => {
    setRelationNodes(prev => {
      const emptyNodes = prev.filter(n => !n.character);
      // 如果有空位，应该让用户点击空位，所以不添加新节点
      if (emptyNodes.length > 0) {
        Alert.alert('提示', '请先点击空位添加关系');
        return prev;
      }

      const lastRingCount = prev.filter(n => n.radius === prev[0]?.radius).length;
      const currentRadius = prev[0]?.radius || 140;
      
      if (lastRingCount >= MAX_NODES_PER_RING) {
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

  // 打开角色选择弹窗
  const handleOpenCharacterSelect = useCallback((nodeIndex: number) => {
    // 过滤掉已选择的角色
    const available = familyMembersData.filter(
      c => !selectedCharacterIds.includes(c.id) && c.id !== protagonist.id
    );
    
    if (available.length === 0) {
      Alert.alert('提示', '所有角色都已添加，请点击"添加更多关系"按钮');
      return;
    }

    setEditingNodeIndex(nodeIndex);
    setShowCharacterModal(true);
  }, [familyMembersData, selectedCharacterIds, protagonist.id]);

  // 选择角色
  const handleSelectCharacter = useCallback((member: FamilyMemberData) => {
    // 创建角色对象
    const character: Character = {
      id: member.id,
      name: member.name,
      gender: member.gender,
    };
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

  // 完成设置 - 返回上一页并传递数据
  const handleComplete = useCallback(() => {
    // 构建关系数据
    const relations = relationNodes
      .filter(n => n.character && n.relation)
      .map(n => ({
        targetId: n.character!.id,
        targetName: n.character!.name,
        relation: n.relation!,
        relationTo: n.relationTo,
      }));

    if (relations.length === 0) {
      Alert.alert('提示', '请至少设置一个关系');
      return;
    }

    // 将数据传递给上一个页面
    router.back();
    
    // 延迟发送数据，确保页面已返回
    setTimeout(() => {
      // 使用 Alert 来确认设置完成
      Alert.alert(
        '关系设置完成', 
        `已设置 ${relations.length} 个关系`,
        [{ text: '确定' }]
      );
    }, 100);
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
    return node.relation;
  }, []);

  // 获取反向关系标签
  const getReverseRelationLabel = useCallback((node: RelationNode) => {
    if (!node.relationTo || !node.character) return '';
    return node.relationTo;
  }, []);

  // 可选择的角色列表
  const availableCharacters = familyMembersData.filter(
    c => !selectedCharacterIds.includes(c.id) && c.id !== protagonist.id
  );

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
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveRelation(index)}
                    >
                      <Text style={styles.removeBtnText}>x</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              } else {
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
                      {' '}
                      <Text style={styles.relationHighlight}>{getRelationLabelText(node)}</Text>
                      {' '}
                      {node.character!.name}
                      {' '}
                      <Text style={styles.relationTo}>({getReverseRelationLabel(node)})</Text>
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
                  <Text style={styles.backButtonText}>返回</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>选择角色</Text>
                <TouchableOpacity onPress={() => setShowCharacterModal(false)}>
                  <Text style={styles.closeBtn}>x</Text>
                </TouchableOpacity>
              </View>
              {availableCharacters.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>没有可选择的角色</Text>
                  <Text style={styles.emptyHint}>所有角色都已添加完成</Text>
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
                  <Text style={styles.closeBtn}>x</Text>
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

const createStyles = (theme: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backBtn: {
      fontSize: 18,
      color: theme.primary,
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
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    networkContainer: {
      height: 500,
      position: 'relative',
    },
    centerNode: {
      position: 'absolute',
      width: CENTER_SIZE,
      height: CENTER_SIZE,
      borderRadius: CENTER_SIZE / 2,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
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
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyNode: {
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 2,
      borderColor: theme.primary,
      borderStyle: 'dashed',
    },
    filledNode: {
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    plusIcon: {
      fontSize: 28,
      color: theme.primary,
      fontWeight: '300',
    },
    addText: {
      fontSize: 11,
      color: theme.primary,
      marginTop: 2,
    },
    nodeName: {
      fontSize: 13,
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
    },
    nodeRelation: {
      fontSize: 10,
      color: theme.textSecondary,
      marginTop: 2,
    },
    nodeRelationTo: {
      fontSize: 9,
      color: theme.textMuted,
    },
    removeBtn: {
      position: 'absolute',
      top: -5,
      right: -5,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.error || '#ff4444',
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeBtnText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    addMoreBtn: {
      marginHorizontal: 20,
      marginTop: 20,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: 8,
      alignItems: 'center',
    },
    addMoreBtnText: {
      fontSize: 15,
      color: theme.primary,
    },
    relationList: {
      marginTop: 20,
      marginHorizontal: 20,
      padding: 16,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 12,
    },
    relationItem: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
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
    emptyText: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
      paddingVertical: 12,
    },
    emptyHint: {
      fontSize: 12,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: 4,
    },
    completeBtn: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      paddingVertical: 14,
      backgroundColor: theme.primary,
      borderRadius: 12,
      alignItems: 'center',
    },
    completeBtnText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
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
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
    },
    backButton: {
      padding: 8,
    },
    backButtonText: {
      fontSize: 15,
      color: theme.primary,
    },
    closeBtn: {
      fontSize: 28,
      color: theme.textMuted,
      padding: 4,
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
    characterItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    characterName: {
      fontSize: 16,
      color: theme.text,
    },
    characterGender: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    relationHint: {
      fontSize: 14,
      color: theme.textSecondary,
      padding: 16,
    },
    relationOption: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    relationOptionText: {
      fontSize: 16,
      color: theme.text,
    },
    relationOptionFemale: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    relationOptionReverse: {
      fontSize: 12,
      color: theme.primary,
      marginTop: 2,
    },
  });
};
