import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing['5xl'],
    },
    header: {
      marginBottom: Spacing.xl,
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
    metaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      marginLeft: Spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    metaDivider: {
      width: 1,
      height: 12,
      backgroundColor: '#E5E5E5',
      marginHorizontal: Spacing.md,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: '#E5E5E5',
      marginBottom: Spacing.xl,
    },
    contentContainer: {
      minHeight: 400,
    },
    novelText: {
      fontSize: 17,
      lineHeight: 30,
      color: '#1A1A1A',
    },
    generatingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.lg,
      justifyContent: 'center',
    },
    generatingText: {
      marginLeft: Spacing.sm,
      fontStyle: 'italic',
    },
    errorContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 400,
    },
    errorText: {
      marginTop: Spacing.lg,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: '#1A1A1A',
      paddingHorizontal: Spacing['2xl'],
      paddingVertical: Spacing.md,
      marginTop: Spacing.xl,
    },
    footerDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing['3xl'],
    },
    footerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: '#E5E5E5',
    },
  });
};
