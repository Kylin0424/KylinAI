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
    networkContainer: {
      gap: Spacing.md,
    },
    characterNode: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: Spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: '#C8102E',
    },
    maleNode: {
      borderLeftColor: '#3B82F6',
    },
    femaleNode: {
      borderLeftColor: '#EC4899',
    },
    nodeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    nodeName: {
      fontWeight: '700',
    },
    nodeGender: {
      fontSize: 12,
    },
    relationsSection: {
      marginTop: Spacing.sm,
    },
    relationsTitle: {
      marginBottom: Spacing.sm,
      fontWeight: '600',
    },
    relationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: 8,
      marginBottom: Spacing.xs,
    },
    relationType: {
      marginRight: Spacing.sm,
      fontWeight: '500',
    },
    relationArrow: {
      marginHorizontal: Spacing.xs,
    },
    targetName: {
      flex: 1,
    },
    noRelations: {
      fontStyle: 'italic',
      marginTop: Spacing.xs,
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.lg,
      marginTop: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 8,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    maleDot: {
      backgroundColor: '#3B82F6',
    },
    femaleDot: {
      backgroundColor: '#EC4899',
    },
  });
};
