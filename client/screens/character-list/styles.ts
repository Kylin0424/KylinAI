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
    topRightButtons: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    networkButton: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
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
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 12,
      padding: 4,
      marginBottom: Spacing.lg,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: 8,
      gap: Spacing.xs,
    },
    tabActive: {
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    tabText: {
      fontWeight: '500',
    },
    tabBadge: {
      backgroundColor: theme.backgroundTertiary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 24,
      alignItems: 'center',
    },
    tabBadgeActive: {
      backgroundColor: 'rgba(200, 16, 46, 0.1)',
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
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1A1A1A',
      paddingHorizontal: Spacing['2xl'],
      paddingVertical: Spacing.lg,
      marginTop: Spacing.xl,
    },
    createButtonText: {
      marginLeft: Spacing.md,
    },
    characterList: {
      gap: Spacing.md,
    },
    characterCard: {
      backgroundColor: '#FFFFFF',
      padding: Spacing.lg,
      borderRadius: 8,
    },
    temporaryCharacterCard: {
      backgroundColor: '#FFF9F0',
      borderLeftWidth: 3,
      borderLeftColor: '#FF9500',
    },
    characterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    characterMain: {
      flex: 1,
    },
    deleteButton: {
      padding: Spacing.sm,
    },
    relationsContainer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: '#E5E5E5',
      paddingTop: Spacing.md,
      marginBottom: Spacing.md,
    },
    relationsTitle: {
      marginBottom: Spacing.sm,
    },
    relationsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    relationTag: {
      backgroundColor: theme.backgroundTertiary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: 4,
    },
    viewDetailButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: '#E5E5E5',
      paddingTop: Spacing.md,
    },
    lockedCharacterCard: {
      backgroundColor: '#F5F5F5',
      opacity: 0.8,
    },
    characterNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flexWrap: 'wrap',
    },
    lockedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(200, 16, 46, 0.1)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 4,
    },
    lockedText: {
      fontSize: 11,
    },
    temporaryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 149, 0, 0.1)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 4,
    },
    temporaryText: {
      fontSize: 11,
    },
    lockedInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs,
      gap: 4,
    },
    lockedNovelName: {
      fontStyle: 'italic',
    },
  });
};
