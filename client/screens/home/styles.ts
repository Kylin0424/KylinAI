import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.xs,
      paddingTop: Spacing.sm,  // 进一步减小顶部间距
      paddingBottom: Spacing.md,
    },
    header: {
      marginTop: Spacing.lg,  // 进一步减小顶部margin
      marginBottom: Spacing.xs,
      alignItems: 'center',
    },
    logo: {
      width: 50,  // 进一步缩小logo
      height: 50,
      marginBottom: 2,
    },
    title: {
      fontSize: 22,  // 进一步缩小标题
      fontWeight: '900',
      letterSpacing: -0.5,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 2,
      textTransform: 'uppercase',
      letterSpacing: 2,
      fontSize: 10,
    },
    section: {
      marginBottom: 2,  // 减小section间距
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,  // 减小底部间距
    },
    sectionTitle: {
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 10,  // 缩小字体
    },
    titleSection: {
      marginBottom: 2,  // 减小section间距
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,  // 减小底部间距
    },
    labelIconSmall: {
      width: 20,
      height: 20,
      borderRadius: 4,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.xs,
    },
    labelText: {
      fontWeight: '600',
      letterSpacing: 0.5,
      fontSize: 12,
    },
    titleInput: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 6,
      paddingHorizontal: Spacing.xs,  // 减小padding
      paddingVertical: 2,  // 减小padding
      fontSize: 13,  // 缩小字体
      color: theme.textPrimary,
    },

    // 角色选择并排布局
    characterRow: {
      flexDirection: 'row',
      gap: 2,  // 减小间距
    },
    characterColumn: {
      flex: 1,
    },
    genderTab: {
      paddingVertical: 2,  // 减小padding
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
      backgroundColor: theme.backgroundTertiary,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },
    genderTabActive: {
      borderBottomColor: '#C8102E',
      backgroundColor: theme.backgroundDefault,
    },
    characterPreview: {
      backgroundColor: theme.backgroundTertiary,
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
      padding: 2,  // 减小padding
      minHeight: 36,  // 减小最小高度
    },
    previewCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: 4,
      padding: 2,  // 减小padding
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    previewActions: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    previewActionBtn: {
      padding: 1,
    },
    emptyPreview: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 28,  // 减小最小高度
      gap: 2,
    },

    // 小说主题选择
    themeSelector: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 6,
      paddingHorizontal: Spacing.xs,  // 减小padding
      paddingVertical: 2,  // 减小padding
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    // 章节目录
    chapterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 4,
      padding: Spacing.xs,
      marginBottom: 2,
    },
    chapterNumber: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.backgroundDefault,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.xs,
      borderWidth: 1,
      borderColor: '#C8102E',
    },
    chapterInput: {
      flex: 1,
      fontSize: 13,
      color: theme.textPrimary,
      paddingVertical: 1,
    },
    addChapterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    addChapterInput: {
      flex: 1,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 4,
      paddingHorizontal: Spacing.xs,
      paddingVertical: Spacing.xs,
      fontSize: 12,
      color: theme.textPrimary,
      marginRight: 2,
    },
    addChapterButton: {
      width: 32,
      height: 32,
      borderRadius: 4,
      backgroundColor: theme.backgroundDefault,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#C8102E',
    },

    // 按钮样式
    generateButton: {
      backgroundColor: '#1A1A1A',
      paddingVertical: Spacing.xs,  // 减小padding
      paddingHorizontal: Spacing.lg,
      borderRadius: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 2,
    },
    generateButtonDisabled: {
      opacity: 0.6,
    },
    actionButtons: {
      marginBottom: Spacing.xs,  // 减小margin
    },
    characterButton: {
      backgroundColor: 'transparent',
      paddingVertical: Spacing.xs,  // 减小padding
      paddingHorizontal: Spacing.lg,
      borderRadius: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 2,
      borderWidth: 1,
      borderColor: '#C8102E',
    },
    characterLibraryButton: {
      backgroundColor: 'transparent',
      paddingVertical: Spacing.xs,  // 减小padding
      paddingHorizontal: Spacing.lg,
      borderRadius: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    buttonText: {
      marginLeft: Spacing.xs,
      fontWeight: '600',
      letterSpacing: 0.5,
      fontSize: 12,  // 缩小字体
    },

    // 正在写作的小说 - 紧凑但完整显示
    novelItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundDefault,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 6,
      marginBottom: 4,
    },
    novelInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    novelTitleText: {
      fontSize: 14,
      flex: 1,
    },
    importedBadge: {
      backgroundColor: '#F59E0B',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 6,
    },
    importedBadgeText: {
      fontSize: 10,
      fontWeight: '500',
    },
    novelDeleteButton: {
      padding: 4,
    },

    // 滑动操作按钮 - 完整显示
    swipeActionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
    },
    swipeAction: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 36,
      height: 36,
      borderRadius: 8,
    },
    exportAction: {
      backgroundColor: '#0EA5E9',
    },
    scriptAction: {
      backgroundColor: '#8B5CF6',
    },
    deleteAction: {
      backgroundColor: '#EF4444',
    },

    // 续写按钮
    novelContinueButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 1,
      gap: 1,
    },

    // 弹窗样式
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.backgroundRoot,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingHorizontal: Spacing.sm,
      paddingBottom: Spacing.lg,
      maxHeight: '60%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    characterList: {
      marginTop: Spacing.xs,
    },
    characterOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    characterOptionInfo: {
      flex: 1,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: Spacing.xs,
      gap: 2,
    },
    themeOption: {
      width: '48%',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 6,
      padding: Spacing.xs,
      marginBottom: 2,
    },
    themeOptionSelected: {
      backgroundColor: theme.backgroundDefault,
      borderWidth: 1,
      borderColor: '#C8102E',
    },

    // 空状态
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing.lg,
    },
    createCharacterButton: {
      marginTop: Spacing.xs,
      paddingVertical: 2,
      paddingHorizontal: Spacing.sm,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#C8102E',
    },

    // 功能入口同行
    actionButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,  // 减小margin
      gap: 2,  // 减小gap
    },
    smallActionButton: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      paddingVertical: 2,  // 减小padding
      gap: 2,
    },
    generatorButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 2,  // 减小padding
      paddingHorizontal: Spacing.xs,  // 减小padding
      gap: 2,
    },
    draftBadge: {
      position: 'absolute',
      top: 0,
      right: 8,
      backgroundColor: '#C8102E',
      width: 14,
      height: 14,
      borderRadius: 7,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // 删除确认弹窗
    deleteModalContent: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: 10,
      padding: Spacing.md,
      marginHorizontal: Spacing.lg,
      alignItems: 'center',
    },
    deleteOptions: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    deleteOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: 6,
      backgroundColor: theme.backgroundTertiary,
      gap: Spacing.xs,
    },
    deleteOptionActive: {
      backgroundColor: theme.backgroundDefault,
      borderWidth: 1,
      borderColor: '#C8102E',
    },
    radioOuter: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#C8102E',
    },
    deleteModalActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    deleteCancelButton: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      borderRadius: 4,
      backgroundColor: theme.backgroundTertiary,
    },
    deleteConfirmButton: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      borderRadius: 4,
      backgroundColor: '#EF4444',
    },

    // 剧本生成弹窗
    chapterSelectList: {
      maxHeight: 150,
    },
    chapterSelectItem: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: 4,
      marginBottom: 2,
      backgroundColor: theme.backgroundTertiary,
    },
    chapterSelectItemActive: {
      backgroundColor: theme.backgroundDefault,
      borderWidth: 1,
      borderColor: '#C8102E',
    },
    scriptGenerateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#8B5CF6',
      paddingVertical: Spacing.sm,
      borderRadius: 6,
      marginTop: Spacing.sm,
    },
    scriptGenerateButtonDisabled: {
      opacity: 0.6,
    },

    // 草稿箱
    draftList: {
      marginTop: Spacing.xs,
    },
    draftItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    draftInfo: {
      flex: 1,
    },
    draftActions: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    draftRestoreBtn: {
      padding: Spacing.xs,
    },
    draftDeleteBtn: {
      padding: Spacing.xs,
    },

    // 提示
    tipsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xs,
    },
    tipLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: '#E5E5E5',
    },
    tipText: {
      marginHorizontal: Spacing.xs,
      fontStyle: 'italic',
      fontSize: 10,
    },

    // 设置按钮
    settingsButton: {
      position: 'absolute',
      top: Spacing.xl,  // 增加顶部间距，避免遮挡logo
      right: Spacing.md,
      zIndex: 100,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.backgroundDefault,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    // 设置弹窗
    settingsModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    settingsModalContent: {
      backgroundColor: theme.backgroundRoot,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.xl,
      paddingTop: Spacing.md,
    },
    settingsModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    settingsSection: {
      gap: Spacing.sm,
    },
    settingsItem: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 12,
      padding: Spacing.sm,
    },
    settingsItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    settingsOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
    },
    settingsOption: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: 6,
      backgroundColor: theme.backgroundDefault,
    },
    settingsOptionActive: {
      borderWidth: 1,
      borderColor: '#C8102E',
    },
    toggleSwitch: {
      width: 44,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.border,
      padding: 2,
      justifyContent: 'center',
    },
    toggleSwitchActive: {
      backgroundColor: '#C8102E',
    },
    toggleKnob: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
    },
    toggleKnobActive: {
      alignSelf: 'flex-end',
    },
    settingsCloseButton: {
      backgroundColor: '#C8102E',
      paddingVertical: Spacing.md,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: Spacing.md,
    },

    // 世界背景设定弹窗
    worldSettingModalContent: {
      backgroundColor: theme.backgroundRoot,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.xl,
      maxHeight: '80%',
    },
    worldSettingHint: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 8,
      padding: Spacing.sm,
      marginTop: Spacing.sm,
      gap: Spacing.xs,
    },
    hintText: {
      flex: 1,
      lineHeight: 18,
    },
    worldSettingForm: {
      marginTop: Spacing.md,
      maxHeight: 350,
    },
    worldSettingField: {
      marginBottom: Spacing.md,
    },
    fieldLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
      gap: Spacing.xs,
    },
    worldSettingInput: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 8,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      fontSize: 14,
      color: theme.textPrimary,
    },
    protagonistInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    fieldHint: {
      marginTop: Spacing.xs,
      fontStyle: 'italic',
    },
    quickSelectRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    quickSelectTag: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: 16,
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    quickSelectTagActive: {
      backgroundColor: theme.backgroundDefault,
      borderColor: '#C8102E',
    },
    // 地域选择选项卡
    regionTabContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    regionTab: {
      flex: 1,
      minWidth: '18%',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      borderRadius: 12,
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    regionTabActive: {
      backgroundColor: theme.backgroundDefault,
      borderColor: '#C8102E',
    },
    regionTabText: {
      marginTop: 4,
      fontWeight: '600',
    },
    regionTabDesc: {
      fontSize: 9,
      marginTop: 2,
    },
    // 城市输入
    cityInputContainer: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    cityInput: {
      flex: 1,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 8,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      fontSize: 14,
      color: theme.textPrimary,
      textAlign: 'center',
    },
    cityInputWithSuffix: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 8,
      paddingHorizontal: Spacing.sm,
    },
    cityInputWithSuffixInput: {
      flex: 1,
      paddingVertical: Spacing.sm,
      fontSize: 14,
      color: theme.textPrimary,
      textAlign: 'center',
    },
    cityPreview: {
      marginTop: Spacing.xs,
      fontStyle: 'italic',
    },
    worldSettingConfirmButton: {
      backgroundColor: '#C8102E',
      paddingVertical: Spacing.md,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    // 导出格式选择
    exportOptions: {
      width: '100%',
    },
    exportOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      borderRadius: 8,
      backgroundColor: theme.backgroundTertiary,
      marginBottom: Spacing.sm,
      gap: Spacing.sm,
    },
    exportOptionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.backgroundDefault,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exportOptionContent: {
      flex: 1,
    },

    // 配角相关样式
    sideCharacterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 12,
      padding: Spacing.xs,
      minHeight: 48,
    },
    selectedSideChars: {
      flex: 1,
      flexDirection: 'row',
    },
    sideCharChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundDefault,
      borderRadius: 16,
      paddingVertical: 4,
      paddingHorizontal: 10,
      marginRight: 6,
    },
    removeBtn: {
      marginLeft: 4,
      padding: 2,
    },
    clearAllBtn: {
      padding: 6,
      justifyContent: 'center',
    },
    addSideCharBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundDefault,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    addSideCharText: {
      marginLeft: 4,
    },
    emptyCharacterList: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    characterItem: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 12,
      padding: Spacing.sm,
      marginBottom: Spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
    },
    characterInfo: {
      flex: 1,
    },
    characterNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    characterItemSelected: {
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 1,
      borderColor: '#C8102E',
    },
    selectedCount: {
      alignItems: 'center',
      paddingVertical: Spacing.xs,
    },
    confirmSideCharButton: {
      backgroundColor: '#C8102E',
      paddingVertical: Spacing.sm,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    confirmSideCharButtonDisabled: {
      opacity: 0.5,
    },
  });
};
