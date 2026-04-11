import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    headerBackButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backText: {
      marginLeft: Spacing.xs,
    },
    editButton: {
      padding: Spacing.sm,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing['3xl'],
    },
    characterHeader: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    characterAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
      overflow: 'hidden',
    },
    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    characterName: {
      marginBottom: Spacing.xs,
    },
    metaInfo: {
      marginTop: Spacing.xs,
    },
    infoCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    infoItem: {
      flex: 1,
      alignItems: 'center',
    },
    infoItemFull: {
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.xs,
    },
    infoInput: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textPrimary,
      marginTop: Spacing.xs,
      textAlign: 'center',
    },
    lockedNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
      gap: Spacing.xs,
    },
    section: {
      marginBottom: Spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    labelIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.xs,
    },
    sectionTitle: {
      marginBottom: Spacing.sm,
    },
    contentCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    },
    nameInput: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
    textArea: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      fontSize: 14,
      lineHeight: 22,
      color: theme.textPrimary,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    editActions: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.xl,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    saveButton: {
      flex: 1,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      backgroundColor: '#C8102E',
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.lg,
      marginTop: Spacing.xl,
    },
    backButton: {
      marginTop: Spacing.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
    },
    // 关系网络样式
    relationList: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
    },
    relationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    relationInfo: {
      flex: 1,
    },
    removeRelationButton: {
      padding: Spacing.xs,
    },
    emptyRelationContainer: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      alignItems: 'center',
    },
    relationActions: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    addRelationButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: '#C8102E',
    },
    aiIdentifyButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: '#C8102E',
    },
    // Modal样式
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.backgroundRoot,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      padding: Spacing.lg,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    characterList: {
      marginBottom: Spacing.sm,
    },
    characterOption: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundDefault,
      marginRight: Spacing.sm,
      alignItems: 'center',
      minWidth: 80,
    },
    characterOptionSelected: {
      backgroundColor: '#C8102E',
    },
    relationTypeList: {
      maxHeight: 300,
    },
    relationCategorySection: {
      marginBottom: Spacing.md,
    },
    categoryLabel: {
      marginBottom: Spacing.xs,
    },
    relationTypeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    relationTypeOption: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundDefault,
      borderWidth: 1,
      borderColor: theme.border,
    },
    relationTypeOptionSelected: {
      backgroundColor: '#C8102E',
      borderColor: '#C8102E',
    },
    confirmButton: {
      backgroundColor: '#C8102E',
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.lg,
    },
    confirmButtonDisabled: {
      opacity: 0.5,
    },
  });
};
