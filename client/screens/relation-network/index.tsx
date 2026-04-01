import React, { useState, useMemo, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { FloatingBall } from '@/components/FloatingBall';
import { createStyles } from './styles';
import {
  RelationNetworkNode,
  getRelationNetwork,
} from '@/utils/characterStorage';
import { Novel, getWritingNovels } from '@/utils/novelStorage';

export default function RelationNetworkScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [novels, setNovels] = useState<Novel[]>([]);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [network, setNetwork] = useState<RelationNetworkNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNovelPicker, setShowNovelPicker] = useState(false);

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

  const handleSelectNovel = async (novel: Novel) => {
    setSelectedNovel(novel);
    setShowNovelPicker(false);
    const networkData = await getRelationNetwork(novel.id);
    setNetwork(networkData);
  };

  const getGenderStyle = (gender: string) => {
    if (gender === '男') return styles.maleNode;
    if (gender === '女') return styles.femaleNode;
    return null;
  };

  const getGenderColor = (gender: string) => {
    if (gender === '男') return '#3B82F6';
    if (gender === '女') return '#EC4899';
    return '#C8102E';
  };

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
            </View>

            {/* 关系网络节点 */}
            <View style={styles.networkContainer}>
              {network.map(node => (
                <View 
                  key={node.characterId} 
                  style={[styles.characterNode, getGenderStyle(node.characterGender)]}
                >
                  <View style={styles.nodeHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ThemedText variant="h3" color={theme.textPrimary} style={styles.nodeName}>
                        {node.characterName}
                      </ThemedText>
                      <ThemedText 
                        variant="caption" 
                        color={getGenderColor(node.characterGender)}
                        style={styles.nodeGender}
                      >
                        {node.characterGender}
                      </ThemedText>
                    </View>
                  </View>

                  {node.relations.length > 0 ? (
                    <View style={styles.relationsSection}>
                      <ThemedText variant="caption" color={theme.textMuted} style={styles.relationsTitle}>
                        关系 ({node.relations.length})
                      </ThemedText>
                      {node.relations.map((relation, index) => (
                        <View key={index} style={styles.relationItem}>
                          <ThemedText 
                            variant="small" 
                            color="#C8102E" 
                            style={styles.relationType}
                          >
                            {relation.relationType}
                          </ThemedText>
                          <Feather 
                            name="arrow-right" 
                            size={14} 
                            color={theme.textMuted} 
                            style={styles.relationArrow}
                          />
                          <ThemedText variant="small" color={theme.textPrimary} style={styles.targetName}>
                            {relation.targetName}
                          </ThemedText>
                          <ThemedText variant="caption" color={getGenderColor(relation.targetGender)}>
                            {relation.targetGender}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <ThemedText variant="caption" color={theme.textMuted} style={styles.noRelations}>
                      暂无关系
                    </ThemedText>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <FloatingBall />
    </Screen>
  );
}
