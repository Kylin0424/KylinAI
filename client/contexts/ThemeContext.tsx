import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

// 主题模式类型
export type ThemeMode = 'light' | 'dark' | 'eye-care' | 'follow-system';

// 主题模式存储键
const THEME_MODE_STORAGE_KEY = '@theme_mode';

// 背景图片存储键
const BACKGROUND_STORAGE_KEY = '@global_background';

// 内置背景图片定义
export interface BuiltInBackground {
  id: string;
  name: string;
  description: string;
  // 使用 unsplash 的免费图片
  url: string;
  thumbnail: string;
}

export const BUILT_IN_BACKGROUNDS: BuiltInBackground[] = [
  {
    id: 'none',
    name: '默认背景',
    description: '使用系统主题颜色',
    url: '',
    thumbnail: '',
  },
  {
    id: 'paper',
    name: '羊皮纸',
    description: '温暖的纸张质感，适合长时间阅读',
    url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=1080&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200&q=80',
  },
  {
    id: 'wood',
    name: '木质纹理',
    description: '自然的木质纹理，营造舒适氛围',
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1080&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80',
  },
  {
    id: 'library',
    name: '书房',
    description: '安静的书房氛围，专注创作',
    url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1080&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=200&q=80',
  },
  {
    id: 'nature',
    name: '自然风光',
    description: '清新的自然景色，放松身心',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1080&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200&q=80',
  },
  {
    id: 'night-sky',
    name: '星空',
    description: '深邃的星空，适合夜间创作',
    url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1080&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=200&q=80',
  },
  {
    id: 'coffee',
    name: '咖啡时光',
    description: '温馨的咖啡馆氛围',
    url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1080&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=200&q=80',
  },
];

interface ThemeContextType {
  // 当前主题模式
  themeMode: ThemeMode;
  // 设置主题模式
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  // 当前主题颜色
  theme: Theme;
  // 是否为深色主题（用于状态栏等）
  isDark: boolean;
  // 是否为护眼模式
  isEyeCare: boolean;
  // 当前背景图片
  backgroundUrl: string | null;
  // 设置背景图片
  setBackgroundUrl: (url: string | null) => Promise<void>;
  // 内置背景列表
  builtInBackgrounds: BuiltInBackground[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('follow-system');
  const [backgroundUrl, setBackgroundUrlState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 从存储加载主题设置
  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        const [savedMode, savedBackground] = await Promise.all([
          AsyncStorage.getItem(THEME_MODE_STORAGE_KEY),
          AsyncStorage.getItem(BACKGROUND_STORAGE_KEY),
        ]);
        
        if (savedMode) {
          setThemeModeState(savedMode as ThemeMode);
        }
        if (savedBackground) {
          setBackgroundUrlState(savedBackground);
        }
      } catch (error) {
        console.error('Failed to load theme settings:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadThemeSettings();
  }, []);

  // 设置主题模式
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  // 设置背景图片
  const setBackgroundUrl = async (url: string | null) => {
    try {
      if (url) {
        await AsyncStorage.setItem(BACKGROUND_STORAGE_KEY, url);
      } else {
        await AsyncStorage.removeItem(BACKGROUND_STORAGE_KEY);
      }
      setBackgroundUrlState(url);
    } catch (error) {
      console.error('Failed to save background:', error);
    }
  };

  // 计算当前主题
  const { theme, isDark, isEyeCare } = useMemo(() => {
    let currentTheme: Theme;
    let dark = false;
    let eyeCare = false;

    switch (themeMode) {
      case 'light':
        currentTheme = Colors.light;
        dark = false;
        eyeCare = false;
        break;
      case 'dark':
        currentTheme = Colors.dark;
        dark = true;
        eyeCare = false;
        break;
      case 'eye-care':
        currentTheme = Colors.eyeCare;
        dark = false;
        eyeCare = true;
        break;
      case 'follow-system':
      default:
        // 跟随系统
        if (systemColorScheme === 'dark') {
          currentTheme = Colors.dark;
          dark = true;
        } else {
          currentTheme = Colors.light;
          dark = false;
        }
        eyeCare = false;
        break;
    }

    return { theme: currentTheme, isDark: dark, isEyeCare: eyeCare };
  }, [themeMode, systemColorScheme]);

  const value = useMemo(() => ({
    themeMode,
    setThemeMode,
    theme,
    isDark,
    isEyeCare,
    backgroundUrl,
    setBackgroundUrl,
    builtInBackgrounds: BUILT_IN_BACKGROUNDS,
  }), [themeMode, theme, isDark, isEyeCare, backgroundUrl]);

  // 等待初始化完成
  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
