import { StyleSheet } from 'react-native';
import { Spacing, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 400,
    },
    loadingText: {
      marginTop: Spacing.lg,
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
    characterCard: {
      backgroundColor: '#FFFFFF',
      padding: Spacing.xl,
    },
    nameSection: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    characterName: {
      fontSize: 36,
      fontWeight: '900',
      letterSpacing: 2,
    },
    nameDivider: {
      width: 80,
      height: 2,
      backgroundColor: '#C8102E',
      marginTop: Spacing.md,
    },
    infoSection: {
      marginBottom: Spacing.lg,
    },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    fieldIcon: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    fieldContent: {
      flex: 1,
    },
    fieldLabel: {
      marginBottom: 2,
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: '#E5E5E5',
      marginVertical: Spacing.lg,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    sectionTitleText: {
      marginLeft: Spacing.sm,
    },
    descriptionText: {
      lineHeight: 26,
      color: '#4A4A4A',
    },
    relationItem: {
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E5E5E5',
    },
    addRelationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      marginTop: Spacing.md,
      borderWidth: 1,
      borderColor: '#C8102E',
      borderStyle: 'dashed',
    },
    addRelationText: {
      marginLeft: Spacing.sm,
    },
    // Family members section
    familyMembersSection: {
      marginTop: Spacing.xl,
      backgroundColor: '#FFFFFF',
      padding: Spacing.xl,
    },
    familyMembersHeader: {
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    familyMemberCard: {
      backgroundColor: '#FAFAFA',
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: '#E5E5E5',
    },
    familyMemberHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    familyMemberInfo: {
      marginBottom: Spacing.sm,
    },
    // Modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E5E5E5',
    },
    modalBody: {
      padding: Spacing.lg,
      maxHeight: 400,
    },
    modalLabel: {
      marginBottom: Spacing.md,
    },
    relationTypeButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E5E5E5',
    },
    backToTypesButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    characterSelectButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E5E5E5',
    },
    characterInfo: {
      flex: 1,
    },
    // Loading overlay
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingOverlayContent: {
      backgroundColor: '#FFFFFF',
      padding: Spacing['2xl'],
      borderRadius: 16,
      alignItems: 'center',
    },
    loadingOverlayText: {
      marginTop: Spacing.lg,
    },
  });
};
