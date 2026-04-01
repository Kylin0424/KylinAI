import { useThemeContext } from '@/contexts/ThemeContext';

/**
 * 获取当前主题的 Hook
 * 从 ThemeContext 获取主题信息，支持跟随系统、固定白天/黑夜、护眼模式
 * 
 * @returns {Object} 包含 theme 和 isDark 的对象
 * - theme: 当前主题颜色配置
 * - isDark: 是否为深色主题
 */
function useTheme() {
  const { theme, isDark } = useThemeContext();
  
  return {
    theme,
    isDark,
  };
}

export {
  useTheme,
}
