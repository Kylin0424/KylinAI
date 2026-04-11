import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/theme';

export const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.backgroundRoot,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
    },
    backText: {
      marginLeft: Spacing.xs,
    },
    scrollContent: {
      padding: Spacing.md,
      paddingBottom: Spacing["2xl"],
    },
    header: {
      marginBottom: Spacing.lg,
    },
    decorativeLine: {
      width: 40,
      height: 3,
      backgroundColor: '#C8102E',
      marginBottom: Spacing.sm,
    },
    title: {
      marginBottom: Spacing.xs,
    },

    // 上传区域
    uploadSection: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: Spacing.xl,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.border,
      borderStyle: 'dashed',
      marginBottom: Spacing.lg,
    },
    uploadIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.backgroundRoot,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    uploadText: {
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    uploadHint: {
      textAlign: 'center',
    },
    supportedFormats: {
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: theme.backgroundRoot,
      borderRadius: 8,
    },

    // 进度区域
    progressSection: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      alignItems: 'center',
    },
    progressIconContainer: {
      marginBottom: Spacing.md,
    },
    progressTitle: {
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: Spacing.sm,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#C8102E',
      borderRadius: 4,
    },
    progressText: {
      textAlign: 'center',
    },

    // 结果区域
    resultSection: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    novelTitle: {
      marginBottom: Spacing.xs,
    },
    novelMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    metaTag: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      backgroundColor: theme.backgroundRoot,
      borderRadius: 4,
    },

    // 角色列表
    characterList: {
      marginTop: Spacing.md,
    },
    characterCard: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: 8,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.border,
    },
    characterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    characterAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#C8102E',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    characterAvatarText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    characterInfo: {
      flex: 1,
    },
    characterName: {
      fontWeight: '600',
    },
    characterRole: {
      marginTop: 2,
    },
    characterDetails: {
      marginTop: Spacing.sm,
    },
    characterDetailRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    characterDetailLabel: {
      width: 60,
    },
    characterDetailValue: {
      flex: 1,
    },
    protagonistBadge: {
      backgroundColor: '#C8102E',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: Spacing.sm,
    },
    protagonistBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
    },

    // 关系网络
    relationsSection: {
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    relationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    relationArrow: {
      marginHorizontal: Spacing.sm,
    },

    // 底部按钮
    bottomActions: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    confirmButton: {
      flex: 2,
      paddingVertical: Spacing.md,
      borderRadius: 8,
      backgroundColor: '#C8102E',
      alignItems: 'center',
    },
    confirmButtonDisabled: {
      backgroundColor: theme.border,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // 错误状态
    errorContainer: {
      alignItems: 'center',
      padding: Spacing.xl,
    },
    errorText: {
      textAlign: 'center',
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
    },
    retryButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: '#C8102E',
      borderRadius: 8,
    },

    // 空状态
    emptyContainer: {
      alignItems: 'center',
      padding: Spacing["2xl"],
    },
    emptyText: {
      textAlign: 'center',
      marginTop: Spacing.md,
    },

    // Modal 样式
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    modalContent: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: 16,
      padding: Spacing.xl,
      width: '100%',
      maxWidth: 320,
      alignItems: 'center',
      // 添加阴影确保可见性
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    modalIcon: {
      marginBottom: Spacing.md,
    },
    modalTitle: {
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    modalMessage: {
      textAlign: 'center',
      marginBottom: Spacing.lg,
      lineHeight: 24,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: Spacing.md,
      width: '100%',
    },
    modalPrimaryButton: {
      flex: 1,
      backgroundColor: '#C8102E',
      paddingVertical: Spacing.md,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalSecondaryButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      backgroundColor: theme.surface,
    },
  });
