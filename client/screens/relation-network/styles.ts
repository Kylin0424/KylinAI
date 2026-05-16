import { StyleSheet } from 'react-native';
import { Spacing, Theme } from '@/constants/theme';

// 关系网络页面使用的样式定义
// 注: relation-network/index.tsx 中的 createStyles 定义了整个页面的样式

export const networkStyles = (theme: Theme) => {
  return StyleSheet.create({
    // 基础容器
    container: {
      flex: 1,
      backgroundColor: theme.backgroundDefault,
    },
    // 头部
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 8,
      alignItems: 'center',
    },
    backButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textPrimary,
    },
    // 滚动区域
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    desc: {
      textAlign: 'center',
      color: theme.textSecondary,
      fontSize: 14,
      paddingVertical: 16,
      paddingHorizontal: 24,
    },
    // 网络图
    networkContainer: {
      position: 'relative',
      height: 500,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerNode: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    protagonistName: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    protagonistLabel: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 12,
    },
    relationNode: {
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
    },
    emptyNode: {
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 2,
      borderColor: theme.border,
      borderStyle: 'dashed',
    },
    filledNode: {
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    plusIcon: {
      fontSize: 24,
      color: theme.textSecondary,
    },
    addText: {
      fontSize: 10,
      color: theme.textSecondary,
    },
    nodeName: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.textPrimary,
    },
    nodeRelation: {
      fontSize: 10,
      color: theme.primary,
      marginTop: 2,
    },
    nodeRelationTo: {
      fontSize: 9,
      color: theme.textSecondary,
    },
    // 移除按钮
    removeBtn: {
      position: 'absolute',
      top: -5,
      right: -5,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#ff4444',
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    // 连接线
    connectionLine: {
      position: 'absolute',
      width: 2,
      height: 60,
      backgroundColor: theme.border,
    },
    // 添加更多按钮
    addMoreBtn: {
      alignSelf: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: theme.primary,
      borderStyle: 'dashed',
      marginTop: 16,
    },
    addMoreBtnText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: 'bold',
    },
    // 关系列表
    relationList: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: 12,
    },
    emptyHint: {
      textAlign: 'center',
      color: theme.textSecondary,
      fontSize: 14,
      marginTop: 8,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.textSecondary,
      fontSize: 14,
      paddingVertical: 20,
    },
    relationItem: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    relationItemText: {
      fontSize: 14,
      color: theme.textPrimary,
      lineHeight: 22,
    },
    relationHighlight: {
      color: theme.primary,
      fontWeight: 'bold',
    },
    relationTo: {
      color: theme.textSecondary,
    },
    // 完成按钮
    completeBtn: {
      position: 'absolute',
      bottom: 20,
      left: 16,
      right: 16,
      height: 50,
      backgroundColor: theme.primary,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    completeBtnText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.backgroundDefault,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
      paddingBottom: 30,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textPrimary,
    },
    closeBtn: {
      fontSize: 28,
      color: theme.textSecondary,
    },
    characterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    characterName: {
      fontSize: 16,
      color: theme.textPrimary,
    },
    characterGender: {
      fontSize: 18,
      color: theme.textSecondary,
    },
    relationHint: {
      padding: 16,
      fontSize: 14,
      color: theme.textSecondary,
    },
    relationOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    relationOptionText: {
      fontSize: 16,
      color: theme.textPrimary,
      flex: 1,
    },
    relationOptionFemale: {
      fontSize: 14,
      color: theme.textSecondary,
      marginLeft: 8,
    },
    relationOptionReverse: {
      fontSize: 14,
      color: theme.primary,
    },
    // 已选择关系容器的样式
    selectedRelationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#334155',
      borderRadius: 12,
      padding: 12,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    // 切换按钮样式
    switchButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#38BDF8',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    switchButtonText: {
      fontSize: 20,
      color: '#0F172A',
      fontWeight: 'bold',
    },
    // 当前选择关系框
    currentRelationBox: {
      flex: 1,
      backgroundColor: '#0F172A',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    currentRelationLabel: {
      fontSize: 18,
      color: '#38BDF8',
      fontWeight: 'bold',
    },
    // 反向关系框
    reverseRelationBox: {
      backgroundColor: 'rgba(56, 189, 248, 0.1)',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginLeft: 8,
    },
    reverseRelationLabel: {
      fontSize: 14,
      color: '#94A3B8',
    },
    // 确认按钮
    confirmButton: {
      backgroundColor: '#10B981',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginLeft: 12,
    },
    confirmButtonText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    // 已选中的关系选项
    relationOptionSelected: {
      backgroundColor: 'rgba(56, 189, 248, 0.2)',
      borderColor: '#38BDF8',
      borderWidth: 2,
    },
  });
};
