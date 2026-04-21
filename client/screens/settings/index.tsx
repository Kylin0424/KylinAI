import React, { useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useThemeContext, ThemeMode, BuiltInBackground } from '@/contexts/ThemeContext';
import { createStyles } from './styles';

// 自定义背景存储键（与ThemeContext中的保持一致）
const CUSTOM_BACKGROUND_STORAGE_KEY = '@custom_background';

export default function SettingsScreen() {
  const router = useSafeRouter();
  const {
    themeMode,
    setThemeMode,
    theme,
    isDark,
    isEyeCare,
    backgroundUrl,
    setBackgroundUrl,
    backgroundOpacity,
    setBackgroundOpacity,
    builtInBackgrounds,
  } = useThemeContext();

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);

  // 获取当前主题名称
  const getCurrentThemeName = () => {
    switch (themeMode) {
      case 'light': return '白天模式';
      case 'dark': return '黑夜模式';
      case 'eye-care': return '护眼模式';
      case 'follow-system': return '跟随系统';
      default: return '跟随系统';
    }
  };

  // 获取当前背景名称
  const getCurrentBackgroundName = () => {
    if (!backgroundUrl) return '默认背景';
    const bg = builtInBackgrounds.find(b => b.url === backgroundUrl);
    return bg?.name || '自定义背景';
  };

  // 主题选项
  const themeOptions: Array<{
    mode: ThemeMode;
    icon: React.ReactNode;
    title: string;
    description: string;
    previewStyle: any;
  }> = [
    {
      mode: 'light',
      icon: <Feather name="sun" size={18} color={themeMode === 'light' ? '#F59E0B' : '#6B7280'} />,
      title: '白天模式',
      description: '明亮清新的界面',
      previewStyle: styles.themeOptionLight,
    },
    {
      mode: 'dark',
      icon: <Feather name="moon" size={18} color={themeMode === 'dark' ? '#818CF8' : '#6B7280'} />,
      title: '黑夜模式',
      description: '保护眼睛，适合夜间',
      previewStyle: styles.themeOptionDark,
    },
    {
      mode: 'eye-care',
      icon: <Feather name="eye" size={18} color={themeMode === 'eye-care' ? '#B8860B' : '#6B7280'} />,
      title: '护眼模式',
      description: '暖色调，减少蓝光',
      previewStyle: styles.themeOptionEyeCare,
    },
    {
      mode: 'follow-system',
      icon: <Feather name="smartphone" size={18} color={themeMode === 'follow-system' ? theme.primary : '#6B7280'} />,
      title: '跟随系统',
      description: '自动适应系统设置',
      previewStyle: styles.themeOptionSystem,
    },
  ];

  // 处理主题选择
  const handleThemeSelect = async (mode: ThemeMode) => {
    setIsSaving(true);
    await setThemeMode(mode);
    setTimeout(() => setIsSaving(false), 300);
  };

  // 处理背景选择
  const handleBackgroundSelect = async (bg: BuiltInBackground) => {
    setIsSaving(true);
    if (bg.id === 'none') {
      await setBackgroundUrl(null);
    } else {
      await setBackgroundUrl(bg.url);
    }
    setTimeout(() => setIsSaving(false), 300);
  };

  // 选择自定义背景图片
  const handlePickCustomBackground = async () => {
    try {
      // 请求相册权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限提示', '需要相册权限才能选择背景图片', [
          { text: '取消', style: 'cancel' },
        ]);
        return;
      }

      setIsUploading(true);

      // 打开图片选择器
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      const selectedAsset = result.assets[0];
      if (selectedAsset && selectedAsset.uri) {
        // 直接使用本地URI作为背景
        await setBackgroundUrl(selectedAsset.uri);
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 300);
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('错误', '选择图片失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 返回主页
  const handleGoBack = () => {
    router.back();
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      {/* 导航栏 */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Feather name="chevron-left" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.navTitle}>
          设置
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* 当前状态提示 */}
        <View style={styles.statusCard}>
          <View style={styles.statusItem}>
            <Feather name="sun" size={16} color={theme.primary} />
            <ThemedText variant="small" color={theme.textSecondary}>
              当前主题：{getCurrentThemeName()}
            </ThemedText>
          </View>
          <View style={styles.statusItem}>
            <Feather name="image" size={16} color={theme.primary} />
            <ThemedText variant="small" color={theme.textSecondary}>
              当前背景：{getCurrentBackgroundName()}
            </ThemedText>
          </View>
        </View>

        {/* 主题模式设置 */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.sectionTitle}>
            主题模式
          </ThemedText>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.themeOptions}>
            <View style={styles.themeOptionRow}>
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.mode}
                  style={[
                    styles.themeOption,
                    themeMode === option.mode && styles.themeOptionActive,
                  ]}
                  onPress={() => handleThemeSelect(option.mode)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.themeOptionIcon, option.previewStyle]}>
                    {option.icon}
                  </View>
                  <ThemedText
                    variant="small"
                    color={themeMode === option.mode ? theme.primary : theme.textPrimary}
                    style={styles.themeOptionText}
                  >
                    {option.title}
                  </ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted} style={styles.themeOptionDesc}>
                    {option.description}
                  </ThemedText>
                  {themeMode === option.mode && (
                    <View style={styles.selectedIndicator}>
                      <Feather name="check" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 全局背景设置 */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.sectionTitle}>
            全局背景
          </ThemedText>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.backgroundGrid}>
            <View style={styles.backgroundRow}>
              {builtInBackgrounds.map((bg) => {
                const isSelected = (bg.id === 'none' && !backgroundUrl) || backgroundUrl === bg.url;
                return (
                  <TouchableOpacity
                    key={bg.id}
                    style={[
                      styles.backgroundItem,
                      isSelected && styles.backgroundItemActive,
                    ]}
                    onPress={() => handleBackgroundSelect(bg)}
                    activeOpacity={0.8}
                  >
                    {bg.id === 'none' ? (
                      <View style={styles.backgroundItemDefault}>
                        <Feather name="square" size={24} color={theme.textMuted} />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: bg.thumbnail }}
                        style={styles.backgroundItemImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.backgroundItemOverlay}>
                      <ThemedText variant="tiny" color="#FFFFFF" style={styles.backgroundItemName}>
                        {bg.name}
                      </ThemedText>
                    </View>
                    {isSelected && (
                      <View style={styles.backgroundCheckmark}>
                        <Feather name="check" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 自定义背景上传按钮 */}
          <TouchableOpacity
            style={styles.customBackgroundButton}
            onPress={handlePickCustomBackground}
            disabled={isUploading}
            activeOpacity={0.7}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <Feather name="upload" size={18} color={theme.primary} />
                <ThemedText variant="small" color={theme.primary} style={styles.customBackgroundText}>
                  从相册选择自定义背景
                </ThemedText>
              </>
            )}
          </TouchableOpacity>

          {/* 自定义背景预览 */}
          {backgroundUrl && !builtInBackgrounds.find(b => b.url === backgroundUrl) && (
            <View style={styles.customBackgroundPreview}>
              <Image
                source={{ uri: backgroundUrl }}
                style={styles.customBackgroundImage}
                resizeMode="cover"
              />
              <View style={styles.customBackgroundInfo}>
                <ThemedText variant="small" color={theme.textPrimary}>
                  当前使用：自定义背景
                </ThemedText>
                <TouchableOpacity
                  style={styles.removeBackgroundButton}
                  onPress={() => handleBackgroundSelect({ id: 'none', name: '默认背景', description: '', url: '', thumbnail: '' })}
                >
                  <Feather name="x" size={14} color={theme.error} />
                  <ThemedText variant="caption" color={theme.error}>移除</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 背景透明度调节 */}
        {backgroundUrl && (
          <View style={styles.sectionHeader}>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.sectionTitle}>
              背景透明度
            </ThemedText>
          </View>
        )}

        {backgroundUrl && (
          <View style={styles.settingCard}>
            <View style={styles.opacityContainer}>
              <View style={styles.opacityInfo}>
                <ThemedText variant="small" color={theme.textPrimary} style={styles.opacityLabel}>
                  调节背景清晰度
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.opacityValue}>
                  {(1 - backgroundOpacity * 100).toFixed(0)}%
                </ThemedText>
              </View>
              <Slider
                style={styles.opacitySlider}
                minimumValue={0}
                maximumValue={1}
                step={0.05}
                value={backgroundOpacity}
                onValueChange={setBackgroundOpacity}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.textMuted}
                thumbTintColor={theme.primary}
              />
              <ThemedText variant="tiny" color={theme.textMuted} style={styles.opacityHint}>
                向左滑动更清晰，向右滑动内容更易读
              </ThemedText>
            </View>
          </View>
        )}

        {/* 预览区域 */}
        <View style={styles.previewSection}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.sectionTitle}>
              效果预览
            </ThemedText>
          </View>
          <View style={styles.previewCard}>
            <ThemedText variant="small" color={theme.textPrimary} style={styles.previewText}>
              这是一段预览文字，展示当前主题的显示效果。
              {'\n\n'}
              <ThemedText variant="smallMedium" color={theme.primary}>
                主要文字使用主题主色强调
              </ThemedText>
              {'\n'}
              背景色、文字颜色都会根据您选择的主题模式自动调整。
              {isEyeCare && '\n\n护眼模式已开启，使用暖色调保护您的眼睛。'}
            </ThemedText>
          </View>
        </View>

        {/* 保存提示 */}
        <View style={styles.saveHintCard}>
          <Feather name="check-circle" size={16} color={theme.success} />
          <ThemedText variant="small" color={theme.textSecondary}>
            设置已自动保存并应用
          </ThemedText>
        </View>

        {/* 返回按钮 */}
        <TouchableOpacity style={styles.goBackButton} onPress={handleGoBack}>
          <Feather name="arrow-left" size={18} color={theme.buttonPrimaryText} />
          <ThemedText variant="smallMedium" color={theme.buttonPrimaryText} style={styles.goBackButtonText}>
            返回主页
          </ThemedText>
        </TouchableOpacity>

        {/* 关于 */}
        <View style={styles.aboutCard}>
          <Image
            source={require('@/assets/logo.png')}
            style={styles.aboutLogo}
            resizeMode="contain"
          />
          <ThemedText variant="bodyMedium" color={theme.textPrimary} style={styles.aboutTitle}>
            齐思秒说
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.aboutVersion}>
            版本 1.0.0
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.aboutDesc}>
            AI驱动的第三人称叙事小说创作工具{'\n'}
            让创作变得简单有趣
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
