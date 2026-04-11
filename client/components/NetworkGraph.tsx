import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { RelationNetworkNode } from '@/utils/characterStorage';

interface Character {
  id: string;
  name: string;
  gender: string;
  avatarUrl?: string;
}

interface Relation {
  sourceId: string;
  targetId: string;
  relationType: string;
}

interface NetworkGraphProps {
  network: RelationNetworkNode[];
  width: number;
  height: number;
  onNodePress?: (characterId: string) => void;
}

// 使用简单的圆形布局算法
const calculatePositions = (
  characters: Character[],
  width: number,
  height: number
): Map<string, { x: number; y: number }> => {
  const positions = new Map<string, { x: number; y: number }>();
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;
  
  if (characters.length === 0) return positions;
  
  if (characters.length === 1) {
    positions.set(characters[0].id, { x: centerX, y: centerY });
    return positions;
  }
  
  // 圆形布局
  characters.forEach((char, index) => {
    const angle = (2 * Math.PI * index) / characters.length - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    positions.set(char.id, { x, y });
  });
  
  return positions;
};

// 从网络数据提取角色和关系
const extractData = (network: RelationNetworkNode[]) => {
  const charactersMap = new Map<string, Character>();
  const relations: Relation[] = [];
  const addedRelations = new Set<string>();
  
  network.forEach(node => {
    charactersMap.set(node.characterId, {
      id: node.characterId,
      name: node.characterName,
      gender: node.characterGender,
    });
    
    node.relations.forEach(rel => {
      // 确保目标角色也在映射中
      if (!charactersMap.has(rel.targetId)) {
        charactersMap.set(rel.targetId, {
          id: rel.targetId,
          name: rel.targetName,
          gender: rel.targetGender,
        });
      }
      
      // 避免重复添加关系（A->B 和 B->A 只保留一个）
      const relationKey = [node.characterId, rel.targetId].sort().join('-');
      if (!addedRelations.has(relationKey)) {
        relations.push({
          sourceId: node.characterId,
          targetId: rel.targetId,
          relationType: rel.relationType,
        });
        addedRelations.add(relationKey);
      }
    });
  });
  
  return {
    characters: Array.from(charactersMap.values()),
    relations,
  };
};

const NODE_RADIUS = 30;
const AVATAR_SIZE = NODE_RADIUS * 2;

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  network,
  width,
  height,
  onNodePress,
}) => {
  const { characters, relations } = useMemo(() => extractData(network), [network]);
  const positions = useMemo(
    () => calculatePositions(characters, width, height),
    [characters, width, height]
  );
  
  const getGenderColor = (gender: string) => {
    if (gender === '男') return '#3B82F6';
    if (gender === '女') return '#EC4899';
    return '#C8102E';
  };
  
  const renderNode = useCallback(
    (char: Character) => {
      const pos = positions.get(char.id);
      if (!pos) return null;
      
      const color = getGenderColor(char.gender);
      const displayName = char.name.length > 4 ? char.name.slice(0, 4) + '...' : char.name;
      
      return (
        <TouchableOpacity
          key={char.id}
          style={[
            styles.node,
            { left: pos.x - NODE_RADIUS, top: pos.y - NODE_RADIUS },
          ]}
          onPress={() => onNodePress?.(char.id)}
          activeOpacity={0.8}
        >
          <View style={[styles.avatarContainer, { borderColor: color }]}>
            {char.avatarUrl ? (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{char.name[0]}</Text>
              </View>
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: color + '20' }]}>
                <Text style={[styles.avatarText, { color }]}>{char.name[0]}</Text>
              </View>
            )}
          </View>
          <Text style={styles.nodeName} numberOfLines={1}>
            {displayName}
          </Text>
        </TouchableOpacity>
      );
    },
    [positions, onNodePress]
  );
  
  const renderEdge = useCallback(
    (relation: Relation, index: number) => {
      const sourcePos = positions.get(relation.sourceId);
      const targetPos = positions.get(relation.targetId);
      
      if (!sourcePos || !targetPos) return null;
      
      const midX = (sourcePos.x + targetPos.x) / 2;
      const midY = (sourcePos.y + targetPos.y) / 2;
      
      // 计算连线角度
      const angle = Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x);
      
      // 调整起点和终点，使连线不穿过节点中心
      const offsetX = Math.cos(angle) * NODE_RADIUS;
      const offsetY = Math.sin(angle) * NODE_RADIUS;
      
      const x1 = sourcePos.x + offsetX;
      const y1 = sourcePos.y + offsetY;
      const x2 = targetPos.x - offsetX;
      const y2 = targetPos.y - offsetY;
      
      // 关系类型缩写
      const relationShort = relation.relationType.length > 4 
        ? relation.relationType.slice(0, 4) 
        : relation.relationType;
      
      return (
        <React.Fragment key={`edge-${index}`}>
          {/* 连线 */}
          <Line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#C8102E"
            strokeWidth="2"
            strokeDasharray="4,4"
            opacity="0.6"
          />
          {/* 关系标签背景 */}
          <Circle
            cx={midX}
            cy={midY}
            r="14"
            fill="#FFFFFF"
            stroke="#C8102E"
            strokeWidth="1"
          />
          {/* 关系标签 */}
          <SvgText
            x={midX}
            y={midY + 4}
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill="#C8102E"
          >
            {relationShort}
          </SvgText>
        </React.Fragment>
      );
    },
    [positions]
  );
  
  if (characters.length === 0) {
    return (
      <View style={[styles.emptyContainer, { width, height }]}>
        <Feather name="users" size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>暂无角色数据</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { width, height }]}>
      {/* SVG 层：绘制连线 */}
      <Svg width={width} height={height} style={styles.svgLayer}>
        <Defs>
          <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#C8102E" stopOpacity="0.3" />
            <Stop offset="50%" stopColor="#C8102E" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#C8102E" stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        {relations.map((rel, idx) => renderEdge(rel, idx))}
      </Svg>
      
      {/* 节点层：渲染角色头像 */}
      {characters.map(char => renderNode(char))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
  },
  svgLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  node: {
    position: 'absolute',
    alignItems: 'center',
    width: AVATAR_SIZE,
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: NODE_RADIUS,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: NODE_RADIUS - 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#C8102E',
  },
  nodeName: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
});
