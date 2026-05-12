import { StyleSheet, Platform } from 'react-native';
import { Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    
    // 导航栏
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
      backgroundColor: theme.backgroundDefault,
    },
    navTitle: {
      flex: 1,
      textAlign: 'center',
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.backgroundTertiary,
    },
    placeholder: {
      width: 40,
    },
    
    // 当前状态卡片
    statusCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-around',
      ...Platform.select({
        ios: {
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    statusItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    
    // 分组标题
    sectionHeader: {
      marginTop: 24,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textMuted,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    
    // 设置卡片
    settingCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 12,
      ...Platform.select({
        ios: {
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    
    // 设置项
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    settingItemLast: {
      borderBottomWidth: 0,
    },
    settingItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.backgroundTertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    settingTextContainer: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.textPrimary,
    },
    settingDescription: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    settingValue: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    
    // 开关
    toggleSwitch: {
      width: 50,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.backgroundTertiary,
      padding: 2,
      justifyContent: 'center',
    },
    toggleSwitchActive: {
      backgroundColor: theme.primary,
    },
    toggleKnob: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 2,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    toggleKnobActive: {
      transform: [{ translateX: 22 }],
    },
    
    // 主题选择
    themeOptions: {
      padding: 16,
    },
    themeOptionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    themeOption: {
      width: '48%',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: theme.backgroundTertiary,
      alignItems: 'center',
    },
    themeOptionActive: {
      borderColor: theme.primary,
      backgroundColor: theme.backgroundDefault,
    },
    themeOptionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    themeOptionLight: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    themeOptionDark: {
      backgroundColor: '#1C1C1E',
    },
    themeOptionEyeCare: {
      backgroundColor: '#F5F0E6',
    },
    themeOptionSystem: {
      experimental_backgroundImage: 'linear-gradient(135deg, #FFFFFF 50%, #1C1C1E 50%)',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    themeOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    themeOptionTextActive: {
      color: theme.primary,
    },
    themeOptionDesc: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 4,
      textAlign: 'center',
    },
    
    // 背景选择
    backgroundGrid: {
      padding: 16,
    },
    backgroundRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    backgroundItem: {
      width: '31%',
      aspectRatio: 3 / 4,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
      position: 'relative',
    },
    backgroundItemActive: {
      borderColor: theme.primary,
    },
    backgroundItemImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    backgroundItemDefault: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.backgroundTertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backgroundItemOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 8,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backgroundItemName: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    backgroundCheckmark: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    // 关于信息
    aboutCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      marginTop: 24,
      ...Platform.select({
        ios: {
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    aboutLogo: {
      width: 60,
      height: 60,
      borderRadius: 16,
      marginBottom: 12,
    },
    aboutTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    aboutVersion: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 4,
    },
    aboutDesc: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 20,
    },
    
    // 预览区域
    previewSection: {
      marginTop: 24,
    },
    previewCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: 16,
      padding: 20,
      ...Platform.select({
        ios: {
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    previewText: {
      fontSize: 15,
      color: theme.textPrimary,
      lineHeight: 24,
    },
    previewHighlight: {
      color: theme.primary,
      fontWeight: '600',
    },
    
    // 选中指示器
    selectedIndicator: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    // 保存提示卡片
    saveHintCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.backgroundDefault,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.success,
    },
    
    // 返回按钮
    goBackButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 16,
      marginBottom: 8,
    },
    goBackButtonText: {
      marginLeft: 4,
    },
    
    // 自定义背景上传按钮
    customBackgroundButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 12,
      paddingVertical: 14,
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
    },
    customBackgroundText: {
      fontWeight: '500',
    },
    
    // 自定义背景预览
    customBackgroundPreview: {
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.backgroundDefault,
    },
    customBackgroundImage: {
      width: '100%',
      height: 100,
      borderRadius: 12,
    },
    customBackgroundInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      backgroundColor: theme.backgroundTertiary,
    },
    removeBackgroundButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      padding: 6,
      borderRadius: 6,
      backgroundColor: theme.backgroundDefault,
    },

    // 背景透明度调节
    opacityContainer: {
      padding: 16,
    },
    opacityInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    opacityLabel: {
      fontSize: 15,
      fontWeight: '500',
    },
    opacityValue: {
      fontSize: 16,
      fontWeight: '600',
    },
    opacitySlider: {
      width: '100%',
      height: 40,
    },
    opacityHint: {
      fontSize: 11,
      marginTop: 8,
      textAlign: 'center',
    },
  });
