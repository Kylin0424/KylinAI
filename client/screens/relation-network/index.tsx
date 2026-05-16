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
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Character, RELATION_OPTIONS, RelationOption } from '@/utils/characterStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NODE_SIZE = 70;
const CANVAS_HEIGHT = 450;
const ARROW_SIZE = 16;
const LINE_OFFSET = 15; // 双向关系线的偏移量

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
  fromId: string;  // 箭头起点
  toId: string;    // 箭头终点
  relationLabel: string;   // from对to的称呼
  reverseLabel: string;    // to对from的称呼
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
    if (option.genderLimit) {
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

  // 主角节点位置 - 使用 ref 来支持实时更新
  const protagonistPosRef = useRef({ x: SCREEN_WIDTH / 2, y: CANVAS_HEIGHT / 2 });

  // 主角节点
  const protagonistNode = useMemo<CharacterNode>(() => {
    const protagonistId = params.protagonistId || `protagonist-${Date.now()}`;
    const pos = protagonistPosRef.current;
    return {
      id: protagonistId,
      name: params.mainCharacterName || '主角',
      gender: params.mainCharacterGender || '男',
      x: pos.x,
      y: pos.y,
      color: '#22D3EE', // 青色主角
    };
  }, [params.mainCharacterName, params.mainCharacterGender, params.protagonistId]);

  // 家庭成员数据
  const [familyMembersData, setFamilyMembersData] = useState<FamilyMemberData[]>([]);

  // 角色节点列表（可拖动）- 每个节点有自己的位置 ref
  const [characterNodes, setCharacterNodes] = useState<CharacterNode[]>([]);
  const nodePositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  // 关系列表
  const [relations, setRelations] = useState<Relation[]>([]);

  // 拖动状态
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

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
            nodePositionsRef.current[member.id || `family-member-${index}`] = pos;
            nodes.push({
              id: member.id || `family-member-${index}`,
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
  const createPanResponder = useCallback((nodeId: string, isProtagonist: boolean = false) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDraggingNodeId(nodeId);
        dragStartRef.current = null;
      },
      onPanResponderMove: (evt, gestureState) => {
        const canvasWidth = SCREEN_WIDTH - 32;
        const padding = NODE_SIZE / 2;
        
        // 获取当前位置
        let currentX: number, currentY: number;
        if (isProtagonist) {
          currentX = protagonistPosRef.current.x;
          currentY = protagonistPosRef.current.y;
        } else {
          currentX = nodePositionsRef.current[nodeId]?.x || 0;
          currentY = nodePositionsRef.current[nodeId]?.y || 0;
        }
        
        // 累积移动
        let newX = currentX + gestureState.dx;
        let newY = currentY + gestureState.dy;
        
        // 限制在画布范围内
        newX = Math.max(padding, Math.min(canvasWidth - padding, newX));
        newY = Math.max(padding, Math.min(CANVAS_HEIGHT - padding, newY));
        
        // 更新位置
        if (isProtagonist) {
          protagonistPosRef.current = { x: newX, y: newY };
          // 强制更新以触发重新渲染
          setCharacterNodes([...characterNodes]);
        } else {
          nodePositionsRef.current[nodeId] = { x: newX, y: newY };
          setCharacterNodes(prevNodes => 
            prevNodes.map(n => n.id === nodeId ? { ...n, x: newX, y: newY } : n)
          );
        }
      },
      onPanResponderRelease: () => {
        setDraggingNodeId(null);
        dragStartRef.current = null;
      },
    });
  }, [characterNodes]);

  // 当前选中的节点
  const [selectedNode, setSelectedNode] = useState<CharacterNode | null>(null);
  const [targetNode, setTargetNode] = useState<CharacterNode | null>(null);

  // 弹窗状态
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [showSelectTargetModal, setShowSelectTargetModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailNode, setDetailNode] = useState<CharacterNode | null>(null);

  // 当前选择的关系类型（用于切换）
  const [currentRelationOption, setCurrentRelationOption] = useState<{ label: string; reverseLabel: string } | null>(null);
  // 是否切换了方向（用于显示）
  // 根据目标性别过滤关系选项
  const filteredRelationOptions = useMemo(() => {
    if (!selectedNode || !targetNode) return [];
    // 主体（selectedNode）固定，关系人（targetNode）的性别决定可用的称呼
    // 关系人是 targetNode，所以显示的是：targetNode 对 selectedNode 的称呼
    // 例如：胡洪歧（男）先点击，陈同丽（女）后点击
    // 陈同丽对胡洪歧的称呼是"丈夫"
    // 所以用关系人(targetNode)的性别来筛选可用的称呼选项
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
    // 重置选择状态
    setCurrentRelationOption(null);
    setIsDirectionSwitched(false);
    setShowRelationModal(true);
  }, [selectedNode]);

  // 选择关系
  // isReverse=true 表示设置 selectedNode 对 targetNode 的反向称呼（从右侧点击）
  const handleSelectRelation = useCallback((option: { label: string; reverseLabel: string }, isReverse: boolean = false) => {
    // 如果 isReverse=true，表示用户点击了右侧的反向关系
    // 需要交换 label 和 reverseLabel，因为 selectedNode 对 targetNode 的称呼就是 reverseLabel
    if (isReverse) {
      setCurrentRelationOption({
        ...option,
        label: option.reverseLabel,
        reverseLabel: option.label
      });
    } else {
      setCurrentRelationOption(option);
    }
  }, []);

  // 确认关系 - 箭头从先点击的指向后点击的
  // 逻辑：selectedNode（先点击的）是想设置关系的人，点击后选择 targetNode（后点击的）作为关系对象
  // selectedNode（先点击）是主体，targetNode（后点击）是对主体的称呼者
  // 例如：胡洪歧（男）先点击，陈同丽（女）后点击
  // 用户选择"丈夫"，表示：陈同丽对胡洪歧的称呼是"丈夫"
  // 箭头：陈同丽（from）→ 胡洪歧（to），显示"丈夫"
  const handleConfirmRelation = useCallback(() => {
    if (!selectedNode || !targetNode || !currentRelationOption) return;

    let fromId: string, toId: string, fromLabel: string, toLabel: string;
    
    // 固定：from是先点击的，to是后点击的
    // 如果切换了方向，则反向显示
    if (isDirectionSwitched) {
      // 反向：from是后点击的，to是先点击的
      fromId = targetNode.id;
      toId = selectedNode.id;
      fromLabel = currentRelationOption.label; // 后点击的对先点击的称呼
      toLabel = currentRelationOption.reverseLabel; // 先点击的对后点击的称呼
    } else {
      // 正向：from是先点击的，to是后点击的
      fromId = selectedNode.id;
      toId = targetNode.id;
      fromLabel = currentRelationOption.reverseLabel; // 先点击的对后点击的称呼
      toLabel = currentRelationOption.label; // 后点击的对先点击的称呼
    }

    // 检查是否已存在相同的关系
    const existingRelation = relations.find(
      r => r.fromId === fromId && r.toId === toId
    );

    if (existingRelation) {
      Alert.alert('提示', '这条关系已存在，请先删除后再设置');
      return;
    }

    const newRelation: Relation = {
      id: `relation-${Date.now()}-${Math.random()}`,
      fromId,
      toId,
      relationLabel: fromLabel,
      reverseLabel: toLabel,
    };
    setRelations(prev => [...prev, newRelation]);

    setShowRelationModal(false);
    setSelectedNode(null);
    setTargetNode(null);
    setCurrentRelationOption(null);
    setIsDirectionSwitched(false);
    
    const fromName = fromId === protagonistNode.id ? protagonistNode.name :
      characterNodes.find(n => n.id === fromId)?.name || '';
    const toName = toId === protagonistNode.id ? protagonistNode.name :
      characterNodes.find(n => n.id === toId)?.name || '';
    Alert.alert('提示', `已设置：${fromName} → ${fromLabel} → ${toName}`);
  }, [selectedNode, targetNode, currentRelationOption, isDirectionSwitched, relations, protagonistNode, characterNodes]);

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
      familyMembers: familyMembersData,
    };

    console.log('Relation network completed:', resultData);
    
    // 返回上一页，传递数据
    router.back();
  }, [protagonistNode, relations, characterNodes, familyMembersData, router]);

  // 渲染带箭头的连线
  const renderLines = useMemo(() => {
    return () => {
      return relations.map((relation, index) => {
        // 获取实际位置（优先使用 ref 中的位置）
        let fromPos = { x: 0, y: 0 }, toPos = { x: 0, y: 0 };
        
        if (relation.fromId === protagonistNode.id) {
          fromPos = protagonistPosRef.current;
        } else {
          fromPos = nodePositionsRef.current[relation.fromId] || 
            characterNodes.find(n => n.id === relation.fromId) || { x: 0, y: 0 };
        }
        
        if (relation.toId === protagonistNode.id) {
          toPos = protagonistPosRef.current;
        } else {
          toPos = nodePositionsRef.current[relation.toId] ||
            characterNodes.find(n => n.id === relation.toId) || { x: 0, y: 0 };
        }

        if (fromPos.x === 0 && fromPos.y === 0) return null;
        if (toPos.x === 0 && toPos.y === 0) return null;

        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // 检测是否为双向关系（检查是否有反向关系）
        const hasReverseRelation = relations.some(
          r => r.fromId === relation.toId && r.toId === relation.fromId
        );
        
        // 如果是双向关系，添加垂直偏移
        let offsetX = 0, offsetY = 0;
        if (hasReverseRelation) {
          const perpendicularAngle = angle + Math.PI / 2;
          // 根据关系索引决定偏移方向（上下交替）
          const offsetDirection = index % 2 === 0 ? 1 : -1;
          offsetX = Math.cos(perpendicularAngle) * LINE_OFFSET * offsetDirection;
          offsetY = Math.sin(perpendicularAngle) * LINE_OFFSET * offsetDirection;
        }

        // 计算标签位置（在线的中间）
        const labelOffset = 0.5;
        const labelX = fromPos.x + dx * labelOffset + offsetX;
        const labelY = fromPos.y + dy * labelOffset + offsetY;

        // 计算箭头的终点（靠近目标节点）
        const arrowDistance = NODE_SIZE / 2 + 5; // 停在节点边缘外
        const arrowEndX = toPos.x - Math.cos(angle) * arrowDistance;
        const arrowEndY = toPos.y - Math.sin(angle) * arrowDistance;
        
        // 计算箭头的起点（从源节点边缘开始）
        const arrowStartX = fromPos.x + Math.cos(angle) * (NODE_SIZE / 2 + 5);
        const arrowStartY = fromPos.y + Math.sin(angle) * (NODE_SIZE / 2 + 5);
        
        const actualLength = Math.sqrt(
          Math.pow(arrowEndX - arrowStartX, 2) + 
          Math.pow(arrowEndY - arrowStartY, 2)
        );

        return (
          <View key={relation.id} style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* 连线 */}
            <View
              style={[
                styles.line,
                {
                  width: actualLength,
                  left: arrowStartX + offsetX / 2,
                  top: arrowStartY + offsetY / 2,
                  transform: [{ rotate: `${angle * 180 / Math.PI}deg` }],
                },
              ]}
            />
            {/* 箭头 */}
            <View
              style={[
                styles.arrow,
                {
                  left: arrowEndX - ARROW_SIZE / 2 + offsetX,
                  top: arrowEndY - ARROW_SIZE / 2 + offsetY,
                  transform: [{ rotate: `${angle * 180 / Math.PI + 90}deg` }],
                },
              ]}
            />
            {/* 关系标签 */}
            <View
              style={[
                styles.lineLabel,
                { left: labelX - 35, top: labelY - 12 },
              ]}
            >
              <Text style={styles.lineLabelText}>{relation.relationLabel}</Text>
            </View>
          </View>
        );
      });
    };
  }, [relations, protagonistNode, characterNodes, styles]);

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
  const protagonistPanResponder = useMemo(() => createPanResponder(protagonistNode.id, true), [protagonistNode, createPanResponder]);

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
            拖动头像自由放置，点击头像设置关系，箭头从先点击的角色指向后点击的角色
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
                  left: protagonistPosRef.current.x - NODE_SIZE / 2,
                  top: protagonistPosRef.current.y - NODE_SIZE / 2,
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
              const pos = nodePositionsRef.current[node.id] || { x: node.x, y: node.y };
              const panResponder = createPanResponder(node.id);
              return (
                <View
                  key={node.id}
                  {...panResponder.panHandlers}
                  style={[
                    styles.node,
                    {
                      left: pos.x - NODE_SIZE / 2,
                      top: pos.y - NODE_SIZE / 2,
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
                        （{toNode.name} 的 {relation.reverseLabel}）
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
                  <Text style={styles.closeBtn}>✕</Text>
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
                  <Text style={styles.closeBtn}>✕</Text>
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
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {/* 显示设置关系 */}
              <Text style={styles.selectHint}>
                {selectedNode?.name} → ? → {targetNode?.name}
              </Text>
              
              {/* 提示用户正在为哪个关系人设置称呼 */}
              <Text style={styles.genderHint}>
                请选择{targetNode?.gender === '男' ? '他' : '她'}对{selectedNode?.name}的称呼
              </Text>

              <ScrollView style={styles.relationScrollView}>
                {filteredRelationOptions.map(option => (
                  <View key={option.value} style={styles.relationRow}>
                    {/* 左侧：正常关系 - 点击设置 targetNode 对 selectedNode 的称呼 */}
                    <TouchableOpacity
                      style={styles.relationSideButton}
                      onPress={() => handleSelectRelation(option, false)}
                    >
                      <Text style={styles.relationSideText}>{option.label}</Text>
                    </TouchableOpacity>
                    
                    {/* 右侧：反向关系 - 点击设置 selectedNode 对 targetNode 的称呼 */}
                    <TouchableOpacity
                      style={styles.relationSideButton}
                      onPress={() => handleSelectRelation(option, true)}
                    >
                      <Text style={styles.relationSideText}>{option.reverseLabel}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {filteredRelationOptions.length === 0 && (
                  <Text style={styles.noOptionText}>
                    暂无可用关系类型
                  </Text>
                )}
              </ScrollView>
              
              {/* 确认按钮 */}
              {currentRelationOption && (
                <TouchableOpacity
                  style={styles.confirmRelationButton}
                  onPress={handleConfirmRelation}
                >
                  <Text style={styles.confirmRelationButtonText}>
                    确认设置 {selectedNode?.name} → {currentRelationOption.label} → {targetNode?.name}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}

// 创建样式
const createStyles = (theme: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0F172A', // 深色背景
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#1E293B',
      borderBottomWidth: 1,
      borderBottomColor: '#334155',
    },
    backBtn: {
      fontSize: 18,
      color: '#38BDF8',
      fontWeight: '600',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#F8FAFC',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    desc: {
      textAlign: 'center',
      color: '#94A3B8',
      fontSize: 13,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    canvas: {
      marginHorizontal: 16,
      height: CANVAS_HEIGHT,
      backgroundColor: '#1E293B',
      borderRadius: 16,
      borderWidth: 2,
      borderColor: '#334155',
      overflow: 'hidden',
      position: 'relative',
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
      shadowColor: '#22D3EE',
      shadowOpacity: 0.6,
    },
    nodeName: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    nodeRole: {
      fontSize: 9,
      color: 'rgba(255,255,255,0.9)',
    },
    nodeGender: {
      fontSize: 10,
      color: '#FFFFFF',
    },
    line: {
      position: 'absolute',
      height: 4,
      backgroundColor: '#38BDF8',
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
      color: '#38BDF8',
      fontWeight: 'bold',
    },
    relationLabel: {
      color: '#F472B6',
      fontWeight: 'bold',
    },
    relationDesc: {
      fontSize: 12,
      color: '#94A3B8',
      marginTop: 4,
    },
    deleteBtn: {
      backgroundColor: '#7F1D1D',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    deleteBtnText: {
      color: '#FCA5A5',
      fontSize: 12,
      fontWeight: '600',
    },
    completeBtn: {
      position: 'absolute',
      bottom: 30,
      left: 16,
      right: 16,
      backgroundColor: '#38BDF8',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    completeBtnText: {
      color: '#0F172A',
      fontSize: 16,
      fontWeight: 'bold',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    detailModal: {
      backgroundColor: '#1E293B',
      borderRadius: 16,
      padding: 20,
      width: SCREEN_WIDTH - 40,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#F8FAFC',
    },
    closeBtn: {
      fontSize: 24,
      color: '#64748B',
      padding: 4,
    },
    detailContent: {
      marginTop: 8,
    },
    detailLabel: {
      fontSize: 14,
      color: '#94A3B8',
      marginBottom: 8,
    },
    noRelationText: {
      fontSize: 14,
      color: '#64748B',
      fontStyle: 'italic',
      marginBottom: 16,
    },
    relationText: {
      fontSize: 14,
      color: '#38BDF8',
      marginBottom: 6,
    },
    actionButtons: {
      marginTop: 20,
      gap: 12,
    },
    actionBtn: {
      backgroundColor: '#334155',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
    },
    actionBtnText: {
      color: '#F8FAFC',
      fontSize: 15,
      fontWeight: '600',
    },
    modalContent: {
      backgroundColor: '#1E293B',
      borderRadius: 16,
      padding: 20,
      width: SCREEN_WIDTH - 32,
      maxHeight: '80%',
    },
    backButton: {
      fontSize: 16,
      color: '#38BDF8',
      fontWeight: '600',
    },
    selectHint: {
      fontSize: 16,
      color: '#F8FAFC',
      fontWeight: '600',
      textAlign: 'center',
      marginVertical: 16,
    },
    toggleDirectionBtn: {
      backgroundColor: '#334155',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#38BDF8',
    },
    toggleDirectionBtnText: {
      color: '#38BDF8',
      fontSize: 14,
      textAlign: 'center',
    },
    genderHint: {
      fontSize: 12,
      color: '#94A3B8',
      textAlign: 'center',
      marginBottom: 16,
    },
    relationScrollView: {
      maxHeight: 300,
    },
    relationOption: {
      backgroundColor: '#334155',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#475569',
    },
    relationOptionContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    relationOptionText: {
      color: '#F8FAFC',
      fontSize: 16,
      fontWeight: '600',
    },
    relationOptionReverse: {
      color: '#94A3B8',
      fontSize: 14,
    },
    noOptionText: {
      color: '#64748B',
      fontSize: 14,
      textAlign: 'center',
      paddingVertical: 20,
    },
    targetItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#334155',
      padding: 12,
      borderRadius: 10,
      marginBottom: 10,
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
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    targetName: {
      flex: 1,
      color: '#F8FAFC',
      fontSize: 16,
      fontWeight: '600',
    },
    targetGender: {
      color: '#94A3B8',
      fontSize: 14,
      marginLeft: 8,
    },
    // 已选择关系容器的样式
    selectedRelationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#334155',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    // 切换按钮样式
    switchButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#38BDF8',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    switchButtonText: {
      fontSize: 20,
      color: '#0F172A',
      fontWeight: 'bold',
    },
    // 当前选择关系框
    currentRelationBox: {
      flex: 1,
      backgroundColor: '#0F172A',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    currentRelationLabel: {
      fontSize: 18,
      color: '#38BDF8',
      fontWeight: 'bold',
    },
    // 反向关系框
    reverseRelationBox: {
      backgroundColor: 'rgba(56, 189, 248, 0.1)',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginLeft: 8,
    },
    reverseRelationLabel: {
      fontSize: 14,
      color: '#94A3B8',
    },
    // 确认按钮
    confirmButton: {
      backgroundColor: '#10B981',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginLeft: 12,
    },
    confirmButtonText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    // 已选中的关系选项
    relationOptionSelected: {
      backgroundColor: 'rgba(56, 189, 248, 0.2)',
      borderColor: '#38BDF8',
      borderWidth: 2,
    },
  });
};
