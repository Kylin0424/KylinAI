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
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Character, RELATION_OPTIONS, RelationOption } from '@/utils/characterStorage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NODE_SIZE = 70;
const CANVAS_HEIGHT = 450;
const ARROW_SIZE = 12;

interface CharacterNode {
  id: string;
  name: string;
  gender: string;
  x: number;
  y: number;
  color: string;
  dragging?: boolean;
}

interface Relation {
  id: string;
  fromId: string;  // 后点击的角色（箭头起点）
  toId: string;    // 先点击的角色（箭头终点）
  relationLabel: string;   // from是to的什么（fromLabel）
  reverseLabel: string;    // to是from的什么（toLabel）
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

// 鲜艳的颜色池（适合深色背景）
const COLORS = [
  '#60A5FA', // 蓝色
  '#F472B6', // 粉色
  '#34D399', // 绿色
  '#FBBF24', // 黄色
  '#A78BFA', // 紫色
  '#FB923C', // 橙色
  '#2DD4BF', // 青色
  '#F87171', // 红色
  '#4ADE80', // 亮绿
  '#C084FC', // 淡紫
];

// 生成随机位置
const generateRandomPosition = (existingNodes: CharacterNode[], canvasWidth: number, canvasHeight: number, avoidCenter: boolean = false) => {
  const padding = 50;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const minDistance = 100;
  
  let attempts = 0;
  while (attempts < 50) {
    const x = padding + Math.random() * (canvasWidth - padding * 2);
    const y = padding + Math.random() * (canvasHeight - padding * 2);
    
    if (avoidCenter) {
      const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distFromCenter < 100) {
        attempts++;
        continue;
      }
    }
    
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
  
  return {
    x: padding + Math.random() * (canvasWidth - padding * 2),
    y: padding + Math.random() * (canvasHeight - padding * 2),
  };
};

// 根据性别过滤关系选项
const getFilteredRelationOptions = (fromGender: string, toGender: string): RelationOption[] => {
  return RELATION_OPTIONS.filter(option => {
    // 如果有性别限制，根据目标性别过滤
    if (option.genderLimit) {
      // genderLimit 表示该关系要求的目标性别
      if (toGender === '男' && option.genderLimit !== 'male') return false;
      if (toGender === '女' && option.genderLimit !== 'female') return false;
    }
    return true;
  });
};

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
      color: '#22D3EE', // 青色主角
    };
  }, [params.mainCharacterName, params.mainCharacterGender, params.protagonistId]);

  // 家庭成员数据
  const [familyMembersData, setFamilyMembersData] = useState<FamilyMemberData[]>([]);

  // 角色节点列表（可拖动）
  const [characterNodes, setCharacterNodes] = useState<CharacterNode[]>([]);

  // 关系列表
  const [relations, setRelations] = useState<Relation[]>([]);

  // 拖动状态
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

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

  // 创建节点的拖动处理器
  const createPanResponder = useCallback((node: CharacterNode, isProtagonist: boolean = false) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        setDraggingNodeId(node.id);
        dragOffsetRef.current = { x: 0, y: 0 };
      },
      onPanResponderMove: (evt, gestureState) => {
        if (draggingNodeId !== node.id) return;
        
        const canvasWidth = SCREEN_WIDTH - 32;
        const padding = NODE_SIZE / 2;
        
        let newX = node.x + gestureState.dx - dragOffsetRef.current.x;
        let newY = node.y + gestureState.dy - dragOffsetRef.current.y;
        
        // 限制在画布范围内
        newX = Math.max(padding, Math.min(canvasWidth - padding, newX));
        newY = Math.max(padding, Math.min(CANVAS_HEIGHT - padding, newY));
        
        dragOffsetRef.current = { x: gestureState.dx, y: gestureState.dy };
        
        if (isProtagonist) {
          protagonistNode.x = newX;
          protagonistNode.y = newY;
          setCharacterNodes([...characterNodes]);
        } else {
          setCharacterNodes(prevNodes => 
            prevNodes.map(n => n.id === node.id ? { ...n, x: newX, y: newY } : n)
          );
        }
      },
      onPanResponderRelease: () => {
        setDraggingNodeId(null);
        dragOffsetRef.current = { x: 0, y: 0 };
      },
    });
  }, [draggingNodeId, protagonistNode, characterNodes]);

  // 当前选中的节点
  const [selectedNode, setSelectedNode] = useState<CharacterNode | null>(null);
  const [targetNode, setTargetNode] = useState<CharacterNode | null>(null);

  // 弹窗状态
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [showSelectTargetModal, setShowSelectTargetModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailNode, setDetailNode] = useState<CharacterNode | null>(null);

  // 根据目标性别过滤关系选项
  const filteredRelationOptions = useMemo(() => {
    if (!selectedNode || !targetNode) return [];
    return getFilteredRelationOptions(selectedNode.gender, targetNode.gender);
  }, [selectedNode, targetNode]);

  // 点击节点
  const handleSelectNode = useCallback((node: CharacterNode) => {
    if (draggingNodeId) return; // 正在拖动时不响应点击
    
    if (node.id === protagonistNode.id) {
      setDetailNode(node);
      setShowDetailModal(true);
    } else {
      setSelectedNode(node);
      setDetailNode(node);
      setShowDetailModal(true);
    }
  }, [draggingNodeId, protagonistNode]);

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

  // 确认关系 - 箭头从 selectedNode 指向 targetNode
  const handleConfirmRelation = useCallback((relationLabel: string, reverseLabel: string) => {
    if (!selectedNode || !targetNode) return;

    // 创建新关系：fromId是后点击的（selectedNode），toId是先点击的（targetNode）
    // 意思是：selectedNode 是 targetNode 的 relationLabel
    const newRelation: Relation = {
      id: `relation-${Date.now()}-${Math.random()}`,
      fromId: selectedNode.id,  // 箭头起点
      toId: targetNode.id,      // 箭头终点
      relationLabel,   // from是to的什么
      reverseLabel,   // to是from的什么
    };
    setRelations(prev => [...prev, newRelation]);

    setShowRelationModal(false);
    setSelectedNode(null);
    setTargetNode(null);
    Alert.alert('提示', `已设置：${selectedNode.name} 是 ${newRelation.relationLabel} 的 ${targetNode.name}`);
  }, [selectedNode, targetNode]);

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
    router.back();
  }, [protagonistNode, relations, characterNodes, router]);

  // 渲染带箭头的连线
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
      const angle = Math.atan2(dy, dx);

      // 计算标签位置（在线的中间偏后）
      const labelOffset = 0.6; // 在线的前60%位置
      const labelX = fromNode.x + dx * labelOffset;
      const labelY = fromNode.y + dy * labelOffset;

      return (
        <View key={relation.id} style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* 连线 */}
          <View
            style={[
              styles.line,
              {
                width: length - ARROW_SIZE,
                left: fromNode.x,
                top: fromNode.y,
                transform: [{ rotate: `${angle * 180 / Math.PI}deg` }],
              },
            ]}
          />
          {/* 箭头 */}
          <View
            style={[
              styles.arrow,
              {
                left: fromNode.x + (length - ARROW_SIZE) * Math.cos(angle) - ARROW_SIZE / 2,
                top: fromNode.y + (length - ARROW_SIZE) * Math.sin(angle) - ARROW_SIZE / 2,
                transform: [{ rotate: `${angle * 180 / Math.PI + 90}deg` }],
              },
            ]}
          />
          {/* 关系标签 */}
          <TouchableOpacity
            style={[
              styles.lineLabel,
              { left: labelX - 35, top: labelY - 12 },
            ]}
            onPress={() => handleDeleteRelation(relation)}
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

  // 创建主角的拖动处理器
  const protagonistPanResponder = useMemo(() => createPanResponder(protagonistNode, true), [protagonistNode, createPanResponder]);

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
            拖动头像自由放置，点击设置关系，线上的文字表示起点角色是终点角色的什么
          </Text>

          {/* 关系网络画布 - 深色背景 */}
          <View style={styles.canvas}>
            {/* 连线层 */}
            {renderLines()}

            {/* 主角节点 - 可拖动 */}
            <View
              {...protagonistPanResponder.panHandlers}
              style={[
                styles.node,
                styles.protagonistNode,
                {
                  left: protagonistNode.x - NODE_SIZE / 2,
                  top: protagonistNode.y - NODE_SIZE / 2,
                  backgroundColor: protagonistNode.color,
                },
              ]}
            >
              <TouchableOpacity 
                style={styles.nodeTouchable}
                onPress={() => handleSelectNode(protagonistNode)}
              >
                <Text style={styles.nodeName} numberOfLines={1}>
                  {protagonistNode.name}
                </Text>
                <Text style={styles.nodeRole}>主角</Text>
              </TouchableOpacity>
            </View>

            {/* 角色节点 - 可拖动 */}
            {characterNodes.map(node => {
              const panResponder = createPanResponder(node);
              return (
                <View
                  key={node.id}
                  {...panResponder.panHandlers}
                  style={[
                    styles.node,
                    {
                      left: node.x - NODE_SIZE / 2,
                      top: node.y - NODE_SIZE / 2,
                      backgroundColor: node.color,
                    },
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.nodeTouchable}
                    onPress={() => handleSelectNode(node)}
                  >
                    <Text style={styles.nodeName} numberOfLines={1}>
                      {node.name}
                    </Text>
                    <Text style={styles.nodeGender}>
                      {node.gender === '男' ? '♂' : '♀'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
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
                        {' → '}
                        <Text style={styles.relationLabel}>{relation.relationLabel}</Text>
                        {' → '}
                        <Text style={styles.highlight}>{toNode.name}</Text>
                      </Text>
                      <Text style={styles.relationDesc}>
                        （{toNode.name} 的 {relation.relationLabel} / {fromNode.name} 的 {relation.reverseLabel}）
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
                        {isFrom ? '→ ' : '← '}
                        {isFrom ? rel.relationLabel : rel.reverseLabel} {otherNode.name}
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

        {/* 选择关系类型弹窗 - 根据目标性别过滤 */}
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
              <Text style={styles.genderHint}>
                （{targetNode?.name} 的性别：{targetNode?.gender}）
              </Text>
              <ScrollView style={styles.relationScrollView}>
                {filteredRelationOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.relationOption}
                    onPress={() => handleConfirmRelation(option.label, option.reverseLabel || option.label)}
                  >
                    <View style={styles.relationOptionContent}>
                      <Text style={styles.relationOptionText}>{option.label}</Text>
                      <Text style={styles.relationOptionReverse}>
                        ↔ {option.reverseLabel}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {filteredRelationOptions.length === 0 && (
                  <Text style={styles.noOptionText}>
                    暂无可用关系类型
                  </Text>
                )}
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
      backgroundColor: '#0F172A', // 深蓝黑色背景
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#334155',
    },
    backBtn: {
      fontSize: 18,
      color: '#38BDF8', // 亮蓝色
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#F8FAFC', // 白色
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 120,
    },
    desc: {
      fontSize: 14,
      color: '#94A3B8', // 灰色
      textAlign: 'center',
      paddingVertical: 16,
    },
    canvas: {
      height: CANVAS_HEIGHT,
      marginHorizontal: 16,
      backgroundColor: '#1E293B', // 深灰蓝色画布
      borderRadius: 16,
      position: 'relative',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#334155',
    },
    node: {
      position: 'absolute',
      width: NODE_SIZE,
      height: NODE_SIZE,
      borderRadius: NODE_SIZE / 2,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
    nodeTouchable: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    protagonistNode: {
      borderWidth: 3,
      borderColor: '#FFFFFF',
    },
    nodeName: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    nodeRole: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.9)',
    },
    nodeGender: {
      fontSize: 10,
      color: '#FFFFFF',
    },
    line: {
      position: 'absolute',
      height: 3,
      backgroundColor: '#38BDF8', // 亮蓝色连线
      transformOrigin: 'left center',
    },
    arrow: {
      position: 'absolute',
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: ARROW_SIZE / 2,
      borderRightWidth: ARROW_SIZE / 2,
      borderTopWidth: ARROW_SIZE,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: '#38BDF8',
    },
    lineLabel: {
      position: 'absolute',
      backgroundColor: '#0F172A',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#38BDF8',
    },
    lineLabelText: {
      fontSize: 12,
      color: '#38BDF8',
      fontWeight: 'bold',
    },
    relationList: {
      marginHorizontal: 16,
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#F8FAFC',
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 14,
      color: '#64748B',
      textAlign: 'center',
      paddingVertical: 20,
    },
    relationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#1E293B',
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#334155',
    },
    relationInfo: {
      flex: 1,
    },
    relationItemText: {
      fontSize: 14,
      color: '#F8FAFC',
    },
    highlight: {
      fontWeight: 'bold',
      color: '#38BDF8',
    },
    relationLabel: {
      color: '#F472B6', // 粉色
      fontWeight: 'bold',
    },
    relationDesc: {
      fontSize: 12,
      color: '#64748B',
      marginTop: 4,
    },
    relationTo: {
      color: '#94A3B8',
      fontSize: 12,
    },
    deleteBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#EF4444' + '30',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#EF4444',
    },
    deleteBtnText: {
      color: '#EF4444',
      fontSize: 12,
    },
    completeBtn: {
      position: 'absolute',
      bottom: 30,
      left: 16,
      right: 16,
      backgroundColor: '#6366F1', // 紫色按钮
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    completeBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: SCREEN_WIDTH - 32,
      maxHeight: SCREEN_HEIGHT * 0.7,
      backgroundColor: '#1E293B',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: '#334155',
    },
    detailModal: {
      width: SCREEN_WIDTH - 64,
      backgroundColor: '#1E293B',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: '#334155',
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
      color: '#F8FAFC',
    },
    closeBtn: {
      fontSize: 24,
      color: '#64748B',
      padding: 4,
    },
    backButton: {
      fontSize: 16,
      color: '#38BDF8',
    },
    detailContent: {
      paddingVertical: 8,
    },
    detailLabel: {
      fontSize: 14,
      color: '#F8FAFC',
      marginBottom: 8,
    },
    noRelationText: {
      fontSize: 14,
      color: '#64748B',
      fontStyle: 'italic',
    },
    relationText: {
      fontSize: 14,
      color: '#38BDF8',
      marginBottom: 6,
    },
    actionButtons: {
      marginTop: 16,
      gap: 12,
    },
    actionBtn: {
      backgroundColor: '#6366F1',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    actionBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
    },
    selectHint: {
      fontSize: 14,
      color: '#94A3B8',
      marginBottom: 8,
    },
    genderHint: {
      fontSize: 12,
      color: '#64748B',
      marginBottom: 12,
    },
    targetItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#334155',
    },
    targetAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    targetAvatarText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    targetName: {
      flex: 1,
      fontSize: 16,
      color: '#F8FAFC',
    },
    targetGender: {
      fontSize: 14,
      color: '#64748B',
    },
    relationScrollView: {
      maxHeight: 400,
    },
    relationOption: {
      backgroundColor: '#334155',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#475569',
    },
    relationOptionContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    relationOptionText: {
      fontSize: 16,
      color: '#F8FAFC',
      fontWeight: 'bold',
    },
    relationOptionHint: {
      fontSize: 12,
      color: '#64748B',
      marginTop: 2,
    },
    relationOptionReverse: {
      fontSize: 14,
      color: '#94A3B8',
    },
    noOptionText: {
      fontSize: 14,
      color: '#64748B',
      textAlign: 'center',
      paddingVertical: 20,
    },
  });
};
