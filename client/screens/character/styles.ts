import { StyleSheet } from 'react-native';
import { Spacing, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 6,
    },
    backText: {
      marginLeft: Spacing.xs,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing['2xl'],
    },
    header: {
      marginBottom: Spacing.md,
      alignItems: 'center',
    },
    decorativeLine: {
      width: 50,
      height: 2,
      backgroundColor: '#C8102E',
      marginBottom: Spacing.sm,
    },
    section: {
      marginBottom: Spacing.md,
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    labelIcon: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    sectionTitle: {
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 13,
      marginBottom: Spacing.sm,
    },
    inputGroup: {
      marginBottom: Spacing.xs,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      marginBottom: Spacing.xs,
    },
    inputLabel: {
      marginBottom: 2,
      fontSize: 11,
    },
    textInput: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 6,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      fontSize: 14,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 38,
    },
    inputWithSuffix: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 24,
    },
    textInputWithSuffix: {
      flex: 1,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      fontSize: 14,
      color: theme.textPrimary,
      minHeight: 24,
      borderWidth: 0,
      backgroundColor: 'transparent',
    },
    suffixText: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      fontSize: 12,
      lineHeight: 24,
      textAlignVertical: 'center',
    },
    occupationSelector: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 6,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    // 下拉选择器（通用）
    dropdownSelector: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 6,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 38,
    },
    // 学历分类区域
    educationCategorySection: {
      marginBottom: Spacing.sm,
    },
    educationCategoryLabel: {
      marginBottom: Spacing.xs,
      fontWeight: '600',
    },
    educationOptionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    educationOptionItem: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    educationOptionItemSelected: {
      backgroundColor: theme.backgroundDefault,
      borderColor: '#C8102E',
    },
    educationList: {
      marginTop: Spacing.sm,
    },
    // 自定义输入弹窗
    customInputModalContent: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: 16,
      padding: Spacing.lg,
      margin: Spacing.lg,
      maxWidth: 400,
      alignSelf: 'center',
    },
    customInputField: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 8,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: 16,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.border,
      marginTop: Spacing.md,
      marginBottom: Spacing.md,
    },
    customInputConfirmButton: {
      backgroundColor: '#C8102E',
      paddingVertical: Spacing.sm,
      borderRadius: 8,
      alignItems: 'center',
    },
    // 下拉选择器
    dropdown: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 6,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 40,
    },
    // 家庭背景区域
    familyBackgroundSection: {
      marginTop: Spacing.sm,
    },
    // 关系标签行
    relationLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.md,
      marginBottom: 2,
    },
    relationCountBadge: {
      backgroundColor: 'rgba(200, 16, 46, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    // 已选关系标签容器
    selectedRelationsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: Spacing.sm,
    },
    // 已选关系标签
    selectedRelationTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      paddingVertical: 6,
      paddingLeft: 12,
      paddingRight: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#C8102E',
    },
    // 移除关系按钮
    removeRelationBtn: {
      marginLeft: 4,
      padding: 2,
    },
    // 添加关系按钮
    addRelationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      borderColor: '#C8102E',
      borderStyle: 'dashed',
      borderRadius: 8,
      marginBottom: Spacing.sm,
    },
    // 已选满提示
    relationFullHint: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    // 成员人数列表项
    memberCountList: {
      marginTop: Spacing.sm,
    },
    memberCountItem: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    memberCountItemActive: {
      backgroundColor: theme.backgroundTertiary,
    },
    // 亲属关系列表项
    relationList: {
      marginTop: Spacing.sm,
    },
    relationItem: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    relationItemActive: {
      backgroundColor: 'rgba(200, 16, 46, 0.1)',
    },
    relationItemDisabled: {
      opacity: 0.5,
    },
    relationItemContent: {
      flex: 1,
    },
    familyOptionsRow: {
      flexDirection: 'row',
      gap: 4,
    },
    familyOptionTab: {
      flex: 1,
      paddingVertical: Spacing.xs,
      paddingHorizontal: 2,
      borderRadius: 4,
      backgroundColor: theme.backgroundTertiary,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    familyOptionTabActive: {
      backgroundColor: theme.backgroundDefault,
      borderColor: '#C8102E',
    },
    familyOptionText: {
      fontSize: 11,
    },
    familyOptionValue: {
      fontWeight: '600',
    },
    sliderSection: {
      marginBottom: Spacing.sm,
    },
    sliderSectionTitle: {
      marginBottom: Spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 11,
    },
    sliderGroup: {
      marginBottom: Spacing.sm,
    },
    sliderHeader: {
      marginBottom: 2,
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 1,
    },
    slider: {
      width: '100%',
      height: 32,
    },
    generateButton: {
      backgroundColor: '#1A1A1A',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    generateButtonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      marginLeft: Spacing.sm,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 13,
    },

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.backgroundRoot,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.xl,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    categoryTabs: {
      paddingVertical: Spacing.sm,
      maxHeight: 45,
    },
    categoryTab: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      marginRight: Spacing.xs,
      borderRadius: 12,
      backgroundColor: theme.backgroundTertiary,
    },
    categoryTabActive: {
      backgroundColor: theme.backgroundDefault,
      borderWidth: 1,
      borderColor: '#C8102E',
    },
    occupationList: {
      marginTop: Spacing.sm,
    },
    occupationListContent: {
      paddingBottom: Spacing.md,
    },
    occupationItem: {
      flex: 1,
      margin: 2,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 6,
      alignItems: 'center',
    },
    occupationItemSelected: {
      backgroundColor: theme.backgroundDefault,
      borderWidth: 1,
      borderColor: '#C8102E',
    },
    occupationCustomItem: {
      backgroundColor: 'rgba(200, 16, 46, 0.08)',
      borderWidth: 1,
      borderColor: '#C8102E',
      borderStyle: 'dashed',
    },
    // 性别输入组 - 预留4个汉字宽度（约64px）
    genderInputGroup: {
      width: 80,
      marginLeft: 25,
    },
    // 年龄输入组 - 预留3个汉字宽度（约48px），靠右对齐
    ageInputGroup: {
      width: 64,
      marginLeft: 'auto',
    },
    // 身高输入组 - 预留4个汉字宽度（约64px），高度缩小
    heightInputGroup: {
      width: 80,
    },
    // 体重输入组 - 预留4个汉字宽度（约64px），高度缩小
    weightInputGroup: {
      width: 80,
      marginLeft: 25,
    },
    // 缩小后的输入框高度
    compactInput: {
      minHeight: 24,
      paddingVertical: Spacing.xs - 2,
    },
    // 缩小后的带单位输入框高度
    compactInputWithSuffix: {
      minHeight: 24,
      paddingVertical: Spacing.xs - 2,
    },
    // 缩小后的单位文字
    compactSuffixText: {
      lineHeight: 24,
      paddingVertical: 0,
    },
    // 性别选择弹窗
    genderModalContent: {
      backgroundColor: theme.backgroundRoot,
      borderRadius: 16,
      padding: Spacing.md,
      margin: Spacing.lg,
      maxWidth: 320,
      alignSelf: 'center',
    },
    genderOptionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: Spacing.sm,
    },
    genderOptionItem: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'transparent',
      minWidth: 60,
      alignItems: 'center',
    },
    genderOptionItemSelected: {
      backgroundColor: theme.backgroundDefault,
      borderColor: '#C8102E',
    },
    genderOptionCustom: {
      backgroundColor: 'rgba(200, 16, 46, 0.08)',
      borderStyle: 'dashed',
      borderColor: '#C8102E',
    },
    // 性别选项（用于家庭成员设置）
    genderOptions: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    genderOption: {
      flex: 1,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'transparent',
      alignItems: 'center',
    },
    genderOptionSelected: {
      backgroundColor: theme.backgroundDefault,
      borderColor: '#C8102E',
    },
    // 家庭成员设置弹窗
    familyMemberModalContent: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      marginTop: 100,
      maxHeight: '80%',
    },
    familyMemberModalBody: {
      flex: 1,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    familyMemberModalFooter: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    formSection: {
      marginBottom: Spacing.md,
    },
    formLabel: {
      marginBottom: Spacing.xs,
    },
    inputField: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 8,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: 16,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    selectorButton: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 8,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 44,
    },
    modalButton: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    cancelButton: {
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    submitButton: {
      backgroundColor: '#C8102E',
    },
  });
};
