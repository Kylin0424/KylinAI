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
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Character, RELATION_OPTIONS } from '@/utils/characterStorage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NODE_SIZE = 60;
const CANVAS_HEIGHT = 400;

interface CharacterNode {
  id: string;
  name: string;
  gender: string;
  x: number;
  y: number;
  color: string;
}

interface Relation {
  id: string;
  fromId: string;
  toId: string;
  relationLabel: string;
  reverseLabel: string;
}

interface FamilyMemberData {
  id: string;
  name: string;
  gender: string;
  age?: string;
  relation?: string;
  relationTo?: string;
  occupation?: string;
  education?: string;
  height?: string;
  weight?: string;
  group?: string;
  position?: string;
  brief?: string;
}

// 生成随机位置
const generateRandomPosition = (existingNodes: CharacterNode[], canvasWidth: number, canvasHeight: number, avoidCenter: boolean = false) => {
  const padding = 40;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const minDistance = 80;
  
  let attempts = 0;
  while (attempts < 50) {
    const x = padding + Math.random() * (canvasWidth - padding * 2);
    const y = padding + Math.random() * (canvasHeight - padding * 2);
    
    // 避免中心区域（如果需要）
    if (avoidCenter) {
      const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distFromCenter < 80) {
        attempts++;
        continue;
      }
    }
    
    // 检查与现有节点的距离
    let tooClose = false;
    for (const node of existingNodes) {
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      if (dist < minDistance) {
        tooClose = true;
        break;
      }
    }
    
    if (!tooClose) {
      return { x, y };
    }
    attempts++;
  }
  
  // 如果找不到合适位置，返回随机位置
  return {
    x: padding + Math.random() * (canvasWidth - padding * 2),
    y: padding + Math.random() * (canvasHeight - padding * 2),
  };
};

// 颜色池
const COLORS = [
  '#6366F1', // 靛蓝
  '#8B5CF6', // 紫色
  '#EC4899', // 粉色
  '#F59E0B', // 琥珀
  '#10B981', // 翠绿
  '#3B82F6', // 蓝色
  '#EF4444', // 红色
  '#14B8A6', // 青色
  '#F97316', // 橙色
  '#84CC16', // 青柠
];

export default function RelationNetworkScreen() {
  const router = useSafeRouter();
  const params = useSafeSearchParams<{
    mainCharacterName?: string;
    mainCharacterGender?: string;
    familyMembersData?: string;
    protagonistId?: string;
  }>();

  const { theme } = useThemeContext();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // 主角节点
  const protagonistNode = useMemo<CharacterNode>(() => {
    const protagonistId = params.protagonistId || `protagonist-${Date.now()}`;
    return {
      id: protagonistId,
      name: params.mainCharacterName || '主角',
      gender: params.mainCharacterGender || '男',
      x: SCREEN_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      color: theme.primary,
    };
  }, [params.mainCharacterName, params.mainCharacterGender, params.protagonistId, theme.primary]);

  // 家庭成员数据
  const [familyMembersData, setFamilyMembersData] = useState<FamilyMemberData[]>([]);

  // 角色节点列表
  const [characterNodes, setCharacterNodes] = useState<CharacterNode[]>([]);

  // 关系列表
  const [relations, setRelations] = useState<Relation[]>([]);

  // 已选择的角色ID
  const selectedCharacterIds = useMemo(() => {
    return characterNodes.map(n => n.id);
  }, [characterNodes]);

  // 解析家庭成员数据
  useEffect(() => {
    if (params.familyMembersData) {
      try {
        const parsed = JSON.parse(params.familyMembersData);
        if (Array.isArray(parsed)) {
          const membersWithIds = parsed.map((member, index) => ({
            ...member,
            id: member.id || `family-member-${index}-${Date.now()}`,
          }));
          setFamilyMembersData(membersWithIds);

          // 生成节点位置
          const canvasWidth = SCREEN_WIDTH - 32;
          const nodes: CharacterNode[] = [];
          membersWithIds.forEach((member, index) => {
            const pos = generateRandomPosition(nodes, canvasWidth, CANVAS_HEIGHT, true);
            nodes.push({
              id: member.id,
              name: member.name,
              gender: member.gender,
              x: pos.x,
              y: pos.y,
              color: COLORS[index % COLORS.length],
            });
          });
          setCharacterNodes(nodes);
        }
      } catch (e) {
        console.error('Failed to parse familyMembersData:', e);
      }
    }
  }, [params.familyMembersData]);

  // 当前选中的节点（用于设置关系）
  const [selectedNode, setSelectedNode] = useState<CharacterNode | null>(null);
  const [targetNode, setTargetNode] = useState<CharacterNode | null>(null);

  // 弹窗状态
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [showSelectTargetModal, setShowSelectTargetModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailNode, setDetailNode] = useState<CharacterNode | null>(null);

  // 选择一个节点来设置关系
  const handleSelectNode = useCallback((node: CharacterNode) => {
    if (node.id === protagonistNode.id) {
      // 点击的是主角，显示详情
      setDetailNode(node);
      setShowDetailModal(true);
    } else {
      // 点击的是其他角色，显示选项
      setSelectedNode(node);
      setDetailNode(node);
      setShowDetailModal(true);
    }
  }, [protagonistNode]);

  // 设置与主角的关系
  const handleSetRelationWithProtagonist = useCallback(() => {
    if (!selectedNode) return;
    setTargetNode(protagonistNode);
    setShowDetailModal(false);
    setShowRelationModal(true);
  }, [selectedNode, protagonistNode]);

  // 设置与其他角色的关系
  const handleSetRelationWithOther = useCallback(() => {
    if (!selectedNode) return;
    setShowDetailModal(false);
    setShowSelectTargetModal(true);
  }, [selectedNode]);

  // 选择目标角色
  const handleSelectTarget = useCallback((target: CharacterNode) => {
    if (!selectedNode || target.id === selectedNode.id) return;
    setTargetNode(target);
    setShowSelectTargetModal(false);
    setShowRelationModal(true);
  }, [selectedNode]);

  // 确认关系
  const handleConfirmRelation = useCallback((relationLabel: string, reverseLabel: string) => {
    if (!selectedNode || !targetNode) return;

    // 检查是否已存在关系
    const existingIndex = relations.findIndex(
      r => (r.fromId === selectedNode.id && r.toId === targetNode.id) ||
           (r.fromId === targetNode.id && r.toId === selectedNode.id)
    );

    if (existingIndex >= 0) {
      // 更新现有关系
      setRelations(prev => {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          relationLabel,
          reverseLabel,
        };
        return updated;
      });
    } else {
      // 添加新关系
      const newRelation: Relation = {
        id: `relation-${Date.now()}`,
        fromId: selectedNode.id,
        toId: targetNode.id,
        relationLabel,
        reverseLabel,
      };
      setRelations(prev => [...prev, newRelation]);
    }

    setShowRelationModal(false);
    setSelectedNode(null);
    setTargetNode(null);
    Alert.alert('提示', '关系设置成功');
  }, [selectedNode, targetNode, relations]);

  // 删除关系
  const handleDeleteRelation = useCallback((relation: Relation) => {
    Alert.alert(
      '删除关系',
      '确定要删除这条关系吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setRelations(prev => prev.filter(r => r.id !== relation.id));
          },
        },
      ]
    );
  }, []);

  // 完成设置
  const handleComplete = useCallback(() => {
    // 构建返回数据
    const resultData = {
      protagonistId: protagonistNode.id,
      protagonistName: protagonistNode.name,
      protagonistGender: protagonistNode.gender,
      relations: relations.map(r => {
        const fromNode = r.fromId === protagonistNode.id ? protagonistNode :
          characterNodes.find(n => n.id === r.fromId) || { id: r.fromId, name: '', gender: '' };
        const toNode = r.toId === protagonistNode.id ? protagonistNode :
          characterNodes.find(n => n.id === r.toId) || { id: r.toId, name: '', gender: '' };
        return {
          fromId: r.fromId,
          fromName: fromNode.name,
          fromGender: fromNode.gender,
          toId: r.toId,
          toName: toNode.name,
          toGender: toNode.gender,
          relationLabel: r.relationLabel,
          reverseLabel: r.reverseLabel,
        };
      }),
    };

    console.log('Relation network completed:', resultData);

    // 返回上一页
    router.back();
  }, [protagonistNode, relations, characterNodes, router]);

  // 绘制连线
  const renderLines = () => {
    return relations.map(relation => {
      const fromNode = relation.fromId === protagonistNode.id ? protagonistNode :
        characterNodes.find(n => n.id === relation.fromId);
      const toNode = relation.toId === protagonistNode.id ? protagonistNode :
        characterNodes.find(n => n.id === relation.toId);

      if (!fromNode || !toNode) return null;

      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      // 计算中点
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;

      return (
        <View key={relation.id} style={StyleSheet.absoluteFill}>
          {/* 连线 */}
          <View
            style={[
              styles.line,
              {
                width: length,
                left: fromNode.x,
                top: fromNode.y,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
          {/* 关系标签 */}
          <TouchableOpacity
            style={[
              styles.lineLabel,
              { left: midX - 30, top: midY - 10 },
            ]}
            onPress={() => {
              const rel = relations.find(r => r.id === relation.id);
              if (rel) handleDeleteRelation(rel);
            }}
          >
            <Text style={styles.lineLabelText}>{relation.relationLabel}</Text>
          </TouchableOpacity>
        </View>
      );
    });
  };

  // 获取某个角色的所有关系
  const getNodeRelations = useCallback((nodeId: string) => {
    return relations.filter(r => r.fromId === nodeId || r.toId === nodeId);
  }, [relations]);

  // 获取可选择的目标角色列表
  const availableTargets = useMemo(() => {
    if (!selectedNode) return [];
    const targets: CharacterNode[] = [protagonistNode];
    characterNodes.forEach(node => {
      if (node.id !== selectedNode.id) {
        targets.push(node);
      }
    });
    return targets;
  }, [selectedNode, protagonistNode, characterNodes]);

  return (
    <Screen>
      <View style={styles.container}>
        {/* 顶部标题 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ 返回</Text>
          </TouchableOpacity>
          <Text style={styles.title}>关系网络</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* 说明文字 */}
          <Text style={styles.desc}>
            点击头像查看详情，点击后可设置与其他角色的关系
          </Text>

          {/* 关系网络画布 */}
          <View style={styles.canvas}>
            {/* 连线层 */}
            {renderLines()}

            {/* 主角节点 */}
            <TouchableOpacity
              style={[
                styles.node,
                styles.protagonistNode,
                {
                  left: protagonistNode.x - NODE_SIZE / 2,
                  top: protagonistNode.y - NODE_SIZE / 2,
                  backgroundColor: protagonistNode.color,
                },
              ]}
              onPress={() => handleSelectNode(protagonistNode)}
            >
              <Text style={styles.nodeName} numberOfLines={1}>
                {protagonistNode.name}
              </Text>
              <Text style={styles.nodeRole}>主角</Text>
            </TouchableOpacity>

            {/* 角色节点 */}
            {characterNodes.map(node => (
              <TouchableOpacity
                key={node.id}
                style={[
                  styles.node,
                  {
                    left: node.x - NODE_SIZE / 2,
                    top: node.y - NODE_SIZE / 2,
                    backgroundColor: node.color,
                  },
                ]}
                onPress={() => handleSelectNode(node)}
              >
                <Text style={styles.nodeName} numberOfLines={1}>
                  {node.name}
                </Text>
                <Text style={styles.nodeGender}>
                  {node.gender === '男' ? '♂' : '♀'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 已设置的关系列表 */}
          <View style={styles.relationList}>
            <Text style={styles.sectionTitle}>已设置的关系 ({relations.length})</Text>
            {relations.length === 0 ? (
              <Text style={styles.emptyText}>暂未设置任何关系</Text>
            ) : (
              relations.map(relation => {
                const fromNode = relation.fromId === protagonistNode.id ? protagonistNode :
                  characterNodes.find(n => n.id === relation.fromId);
                const toNode = relation.toId === protagonistNode.id ? protagonistNode :
                  characterNodes.find(n => n.id === relation.toId);
                if (!fromNode || !toNode) return null;

                return (
                  <View key={relation.id} style={styles.relationItem}>
                    <View style={styles.relationInfo}>
                      <Text style={styles.relationItemText}>
                        <Text style={styles.highlight}>{fromNode.name}</Text>
                        {' 是 '}
                        <Text style={styles.highlight}>{toNode.name}</Text>
                        {' 的 '}
                        <Text style={styles.relationLabel}>{relation.relationLabel}</Text>
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteRelation(relation)}
                    >
                      <Text style={styles.deleteBtnText}>删除</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* 完成按钮 */}
        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
          <Text style={styles.completeBtnText}>完成设置</Text>
        </TouchableOpacity>

        {/* 角色详情弹窗 */}
        <Modal visible={showDetailModal} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDetailModal(false)}
          >
            <View style={styles.detailModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{detailNode?.name}</Text>
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <Text style={styles.closeBtn}>x</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>性别：{detailNode?.gender}</Text>

                {/* 该角色的关系 */}
                <Text style={styles.detailLabel}>关系：</Text>
                {getNodeRelations(detailNode?.id || '').length === 0 ? (
                  <Text style={styles.noRelationText}>暂无关系</Text>
                ) : (
                  getNodeRelations(detailNode?.id || '').map(rel => {
                    const isFrom = rel.fromId === detailNode?.id;
                    const otherId = isFrom ? rel.toId : rel.fromId;
                    const otherNode = otherId === protagonistNode.id ? protagonistNode :
                      characterNodes.find(n => n.id === otherId);
                    if (!otherNode) return null;

                    return (
                      <Text key={rel.id} style={styles.relationText}>
                        {isFrom ? rel.relationLabel : rel.reverseLabel} - {otherNode.name}
                      </Text>
                    );
                  })
                )}

                {/* 操作按钮 */}
                {detailNode && detailNode.id !== protagonistNode.id && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={handleSetRelationWithProtagonist}
                    >
                      <Text style={styles.actionBtnText}>与主角设置关系</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={handleSetRelationWithOther}
                    >
                      <Text style={styles.actionBtnText}>与其他角色设置关系</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 选择目标角色弹窗 */}
        <Modal visible={showSelectTargetModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowSelectTargetModal(false)}>
                  <Text style={styles.backButton}>‹ 返回</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>选择关系对象</Text>
                <TouchableOpacity onPress={() => setShowSelectTargetModal(false)}>
                  <Text style={styles.closeBtn}>x</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.selectHint}>
                选择与 {selectedNode?.name} 有关系的角色：
              </Text>
              <FlatList
                data={availableTargets}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.targetItem}
                    onPress={() => handleSelectTarget(item)}
                  >
                    <View style={[styles.targetAvatar, { backgroundColor: item.color }]}>
                      <Text style={styles.targetAvatarText}>
                        {item.name.charAt(0)}
                      </Text>
                    </View>
                    <Text style={styles.targetName}>{item.name}</Text>
                    <Text style={styles.targetGender}>
                      {item.gender === '男' ? '♂' : '♀'}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* 选择关系类型弹窗 */}
        <Modal visible={showRelationModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowRelationModal(false)}>
                  <Text style={styles.backButton}>‹ 返回</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>选择关系类型</Text>
                <TouchableOpacity onPress={() => setShowRelationModal(false)}>
                  <Text style={styles.closeBtn}>x</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.selectHint}>
                {selectedNode?.name} 是 {targetNode?.name} 的：
              </Text>
              <ScrollView style={styles.relationScrollView}>
                {RELATION_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.relationOption}
                    onPress={() => handleConfirmRelation(option.label, option.reverseLabel || option.label)}
                  >
                    <Text style={styles.relationOptionText}>{option.label}</Text>
                    {option.femaleLabel && (
                      <Text style={styles.relationOptionHint}>
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
    },
    canvas: {
      height: CANVAS_HEIGHT,
      marginHorizontal: 16,
      backgroundColor: theme.surface,
      borderRadius: 16,
      position: 'relative',
      overflow: 'hidden',
    },
    node: {
      position: 'absolute',
      width: NODE_SIZE,
      height: NODE_SIZE,
      borderRadius: NODE_SIZE / 2,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 4,
    },
    protagonistNode: {
      borderWidth: 3,
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    nodeName: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    nodeRole: {
      fontSize: 9,
      color: 'rgba(255,255,255,0.8)',
    },
    nodeGender: {
      fontSize: 10,
      color: '#FFFFFF',
    },
    line: {
      position: 'absolute',
      height: 1,
      backgroundColor: '#CBD5E1',
      borderStyle: 'dashed',
      transformOrigin: 'left center',
    },
    lineLabel: {
      position: 'absolute',
      backgroundColor: theme.surface,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    lineLabelText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    relationList: {
      marginHorizontal: 16,
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      paddingVertical: 20,
    },
    relationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
    },
    relationInfo: {
      flex: 1,
    },
    relationItemText: {
      fontSize: 14,
      color: theme.text,
    },
    highlight: {
      fontWeight: 'bold',
      color: theme.primary,
    },
    relationLabel: {
      color: theme.primary,
    },
    relationTo: {
      color: theme.textSecondary,
      fontSize: 12,
    },
    deleteBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.error + '20',
      borderRadius: 8,
    },
    deleteBtnText: {
      color: theme.error,
      fontSize: 12,
    },
    completeBtn: {
      position: 'absolute',
      bottom: 30,
      left: 16,
      right: 16,
      backgroundColor: theme.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    completeBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: SCREEN_WIDTH - 32,
      maxHeight: SCREEN_HEIGHT * 0.7,
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
    },
    detailModal: {
      width: SCREEN_WIDTH - 64,
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    closeBtn: {
      fontSize: 24,
      color: theme.textSecondary,
      padding: 4,
    },
    backButton: {
      fontSize: 16,
      color: theme.primary,
    },
    detailContent: {
      paddingVertical: 8,
    },
    detailLabel: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 8,
    },
    noRelationText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontStyle: 'italic',
      marginBottom: 16,
    },
    relationText: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 4,
    },
    actionButtons: {
      marginTop: 16,
      gap: 8,
    },
    actionBtn: {
      backgroundColor: theme.primary + '20',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    actionBtnText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    selectHint: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 12,
    },
    targetItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.background,
      borderRadius: 12,
      marginBottom: 8,
    },
    targetAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    targetAvatarText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    targetName: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      fontWeight: '500',
    },
    targetGender: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    relationScrollView: {
      maxHeight: SCREEN_HEIGHT * 0.5,
    },
    relationOption: {
      padding: 12,
      backgroundColor: theme.background,
      borderRadius: 8,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    relationOptionText: {
      fontSize: 16,
      color: theme.text,
      fontWeight: '500',
    },
    relationOptionHint: {
      fontSize: 12,
      color: theme.textSecondary,
      marginLeft: 4,
    },
    relationOptionReverse: {
      fontSize: 12,
      color: theme.primary,
      marginLeft: 'auto',
    },
  });
};
