import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  Text,
  Dimensions,
  Animated,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { FloatingBall } from '@/components/FloatingBall';
import { NetworkGraph } from '@/components/NetworkGraph';
import { createStyles } from './styles';
import {
  RelationNetworkNode,
  getRelationNetwork,
} from '@/utils/characterStorage';
import { Novel, getWritingNovels } from '@/utils/novelStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRAPH_HEIGHT = 400;

export default function RelationNetworkScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [novels, setNovels] = useState<Novel[]>([]);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [network, setNetwork] = useState<RelationNetworkNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNovelPicker, setShowNovelPicker] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<RelationNetworkNode | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    setIsLoading(true);
    const writingNovels = await getWritingNovels();
    setNovels(writingNovels);
    if (writingNovels.length > 0 && !selectedNovel) {
      const firstNovel = writingNovels[0];
      setSelectedNovel(firstNovel);
      const networkData = await getRelationNetwork(firstNovel.id);
      setNetwork(networkData);
    } else if (selectedNovel) {
      const networkData = await getRelationNetwork(selectedNovel.id);
      setNetwork(networkData);
    }
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // 动画显示
  useEffect(() => {
    if (!isLoading && network.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, network]);

  const handleSelectNovel = async (novel: Novel) => {
    setSelectedNovel(novel);
    setShowNovelPicker(false);
    setSelectedCharacter(null);
    const networkData = await getRelationNetwork(novel.id);
    setNetwork(networkData);
  };

  const handleNodePress = useCallback((characterId: string) => {
    const node = network.find(n => n.characterId === characterId);
    if (node) {
      setSelectedCharacter(node);
    }
  }, [network]);

  const getGenderColor = (gender: string) => {
    if (gender === '男') return '#3B82F6';
    if (gender === '女') return '#EC4899';
    return '#C8102E';
  };

  const graphWidth = SCREEN_WIDTH - 32; // 减去水平padding

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      {/* Header with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
          <ThemedText variant="small" color={theme.textPrimary} style={styles.backText}>
            返回
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.decorativeLine} />
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
            关系网络
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.subtitle}>
            查看小说中角色之间的关系
          </ThemedText>
        </View>

        {/* 小说选择器 */}
        {novels.length > 0 && (
          <View style={styles.novelSelector}>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.novelSelectorLabel}>
              选择小说
            </ThemedText>
            <TouchableOpacity 
              style={styles.novelSelectorRow}
              onPress={() => setShowNovelPicker(!showNovelPicker)}
            >
              <ThemedText variant="body" color={theme.textPrimary} style={styles.novelSelectorValue}>
                {selectedNovel?.title || '请选择小说'}
              </ThemedText>
              <Feather 
                name={showNovelPicker ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={theme.textMuted} 
              />
            </TouchableOpacity>
            {showNovelPicker && (
              <View style={{ marginTop: 8 }}>
                {novels.map(novel => (
                  <TouchableOpacity
                    key={novel.id}
                    style={{
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                    }}
                    onPress={() => handleSelectNovel(novel)}
                  >
                    <ThemedText 
                      variant="body" 
                      color={selectedNovel?.id === novel.id ? '#C8102E' : theme.textPrimary}
                    >
                      {novel.title}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ThemedText variant="body" color={theme.textMuted}>
              加载中...
            </ThemedText>
          </View>
        ) : novels.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="book-open" size={48} color={theme.textMuted} />
            <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
              暂无正在创作的小说
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>
              创建小说后即可查看角色关系网络
            </ThemedText>
          </View>
        ) : network.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="git-branch" size={48} color={theme.textMuted} />
            <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
              暂无角色关系数据
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>
              在创作过程中添加角色关系后即可查看
            </ThemedText>
          </View>
        ) : (
          <>
            {/* 图例 */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.maleDot]} />
                <ThemedText variant="caption" color={theme.textSecondary}>男性角色</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.femaleDot]} />
                <ThemedText variant="caption" color={theme.textSecondary}>女性角色</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.relationDot]} />
                <ThemedText variant="caption" color={theme.textSecondary}>关系连线</ThemedText>
              </View>
            </View>

            {/* 关系网络图 */}
            <Animated.View style={[styles.graphWrapper, { opacity: fadeAnim }]}>
              <NetworkGraph
                network={network}
                width={graphWidth}
                height={GRAPH_HEIGHT}
                onNodePress={handleNodePress}
              />
            </Animated.View>

            {/* 提示 */}
            <View style={styles.tipContainer}>
              <Feather name="info" size={14} color={theme.textMuted} />
              <ThemedText variant="caption" color={theme.textMuted} style={styles.tipText}>
                点击角色节点查看详细信息
              </ThemedText>
            </View>

            {/* 选中角色的详细信息 */}
            {selectedCharacter && (
              <View style={styles.characterDetail}>
                <View style={styles.detailHeader}>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setSelectedCharacter(null)}
                  >
                    <Feather name="x" size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.detailContent}>
                  <View style={styles.characterInfo}>
                    <View style={[styles.characterAvatar, { borderColor: getGenderColor(selectedCharacter.characterGender) }]}>
                      <Text style={[styles.avatarText, { color: getGenderColor(selectedCharacter.characterGender) }]}>
                        {selectedCharacter.characterName[0]}
                      </Text>
                    </View>
                    <View style={styles.characterMeta}>
                      <ThemedText variant="h3" color={theme.textPrimary}>
                        {selectedCharacter.characterName}
                      </ThemedText>
                      <ThemedText variant="caption" color={getGenderColor(selectedCharacter.characterGender)}>
                        {selectedCharacter.characterGender}
                      </ThemedText>
                    </View>
                  </View>
                  
                  {selectedCharacter.relations.length > 0 ? (
                    <View style={styles.relationsList}>
                      <ThemedText variant="small" color={theme.textMuted} style={styles.relationsTitle}>
                        关系列表
                      </ThemedText>
                      {selectedCharacter.relations.map((relation, index) => (
                        <View key={index} style={styles.relationItem}>
                          <View style={styles.relationType}>
                            <Text style={styles.relationTypeText}>{relation.relationType}</Text>
                          </View>
                          <Feather 
                            name="arrow-right" 
                            size={14} 
                            color={theme.textMuted} 
                          />
                          <ThemedText variant="body" color={theme.textPrimary}>
                            {relation.targetName}
                          </ThemedText>
                          <ThemedText 
                            variant="caption" 
                            color={getGenderColor(relation.targetGender)}
                            style={styles.targetGender}
                          >
                            {relation.targetGender}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noRelations}>
                      <ThemedText variant="small" color={theme.textMuted}>
                        暂无关系数据
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* 角色列表（简化版） */}
            <View style={styles.characterList}>
              <ThemedText variant="small" color={theme.textMuted} style={styles.listTitle}>
                角色列表 ({network.length})
              </ThemedText>
              <View style={styles.characterGrid}>
                {network.map(node => (
                  <TouchableOpacity
                    key={node.characterId}
                    style={[
                      styles.characterCard,
                      selectedCharacter?.characterId === node.characterId && styles.characterCardActive,
                    ]}
                    onPress={() => setSelectedCharacter(node)}
                  >
                    <View style={[styles.miniAvatar, { borderColor: getGenderColor(node.characterGender) }]}>
                      <Text style={[styles.miniAvatarText, { color: getGenderColor(node.characterGender) }]}>
                        {node.characterName[0]}
                      </Text>
                    </View>
                    <ThemedText variant="caption" color={theme.textPrimary} numberOfLines={1}>
                      {node.characterName}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {node.relations.length} 关系
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <FloatingBall />
    </Screen>
  );
}
