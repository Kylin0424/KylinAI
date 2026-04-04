import { StyleSheet } from 'react-native';
import { Spacing, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 8,
    },
    backText: {
      marginLeft: Spacing.sm,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    header: {
      marginBottom: Spacing.lg,
      alignItems: 'center',
    },
    decorativeLine: {
      width: 60,
      height: 2,
      backgroundColor: '#C8102E',
      marginBottom: Spacing.lg,
    },
    title: {
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.5,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: Spacing.sm,
    },
    novelSelector: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 12,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    novelSelectorLabel: {
      marginBottom: Spacing.sm,
    },
    novelSelectorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    novelSelectorValue: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 400,
    },
    emptyText: {
      marginTop: Spacing.lg,
    },

    // 图例
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.lg,
      marginBottom: Spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    maleDot: {
      backgroundColor: '#3B82F6',
    },
    femaleDot: {
      backgroundColor: '#EC4899',
    },
    relationDot: {
      backgroundColor: '#C8102E',
    },

    // 网络图
    graphWrapper: {
      marginBottom: Spacing.md,
      borderRadius: 16,
      overflow: 'hidden',
    },

    // 提示
    tipContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    tipText: {
      fontStyle: 'italic',
    },

    // 角色详情卡片
    characterDetail: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      marginBottom: Spacing.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
    },
    detailHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: Spacing.sm,
    },
    closeButton: {
      padding: Spacing.xs,
    },
    detailContent: {
      padding: Spacing.md,
      paddingTop: 0,
    },
    characterInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    characterAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 3,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
    },
    avatarText: {
      fontSize: 24,
      fontWeight: '700',
    },
    characterMeta: {
      flex: 1,
    },
    relationsList: {
      marginTop: Spacing.sm,
    },
    relationsTitle: {
      marginBottom: Spacing.sm,
    },
    relationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    relationType: {
      backgroundColor: '#C8102E' + '15',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
    },
    relationTypeText: {
      fontSize: 12,
      color: '#C8102E',
      fontWeight: '500',
    },
    targetGender: {
      marginLeft: 'auto',
    },
    noRelations: {
      alignItems: 'center',
      paddingVertical: Spacing.lg,
    },

    // 角色列表
    characterList: {
      marginBottom: Spacing.lg,
    },
    listTitle: {
      marginBottom: Spacing.md,
    },
    characterGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    characterCard: {
      width: '31%',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: Spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    characterCardActive: {
      borderColor: '#C8102E',
      backgroundColor: '#FEF2F2',
    },
    miniAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xs,
      backgroundColor: '#F9FAFB',
    },
    miniAvatarText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });
};
