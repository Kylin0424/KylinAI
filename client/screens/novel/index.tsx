import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ScrollView,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSafeSearchParams } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
// @ts-ignore
import RNSSE from 'react-native-sse';

// 开发环境使用本地地址
const EXPO_PUBLIC_BACKEND_BASE_URL = 'http://localhost:9091';

export default function NovelScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const params = useSafeSearchParams<{
    theme: string;
    characters: string;
    plot: string;
  }>();

  const [novelContent, setNovelContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sseRef = useRef<RNSSE | null>(null);

  useEffect(() => {
    // 先检查参数，如果缺失则标记错误并返回
    if (!params.theme) {
      // 使用 setTimeout 避免在 effect 中同步调用 setState
      setTimeout(() => {
        setError('缺少小说主题参数');
        setIsGenerating(false);
      }, 0);
      return;
    }

    // 使用 SSE 流式生成小说
    const url = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/novel/generate`;
    
    const sse = new RNSSE(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        theme: params.theme,
        characters: params.characters || '',
        plot: params.plot || '',
      }),
    });

    sseRef.current = sse;

    sse.addEventListener('message', (event) => {
      if (event.data === '[DONE]') {
        setIsGenerating(false);
        sse.close();
        return;
      }

      try {
        const data = JSON.parse(event.data || '{}');
        if (data.content) {
          setNovelContent((prev) => prev + data.content);
        }
      } catch (e) {
        console.error('Failed to parse SSE data:', e);
      }
    });

    sse.addEventListener('error', (event) => {
      console.error('SSE error:', event);
      setError('生成过程中出现错误，请重试');
      setIsGenerating(false);
      sse.close();
    });

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [params.theme, params.characters, params.plot]);

  const handleRetry = () => {
    setNovelContent('');
    setError(null);
    setIsGenerating(true);
    // 重新触发 useEffect
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <ThemedView level="root" style={styles.header}>
          <View style={styles.decorativeLine} />
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
            {params.theme || '小说创作'}
          </ThemedText>
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Feather name="users" size={12} color="#C8102E" />
              <ThemedText variant="caption" color={theme.textMuted} style={styles.metaText}>
                {params.characters || '未设定角色'}
              </ThemedText>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Feather name="edit-3" size={12} color="#C8102E" />
              <ThemedText variant="caption" color={theme.textMuted} style={styles.metaText}>
                {params.plot || '自由发挥'}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Content */}
        <View style={styles.contentContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={48} color="#C8102E" />
              <ThemedText variant="body" color={theme.textSecondary} style={styles.errorText}>
                {error}
              </ThemedText>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>
                  重试
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ThemedText variant="body" color={theme.textPrimary} style={styles.novelText}>
                {novelContent}
              </ThemedText>
              {isGenerating && (
                <View style={styles.generatingIndicator}>
                  <ActivityIndicator size="small" color="#C8102E" />
                  <ThemedText variant="caption" color={theme.textMuted} style={styles.generatingText}>
                    创作中...
                  </ThemedText>
                </View>
              )}
            </>
          )}
        </View>

        {/* Footer Divider */}
        {!isGenerating && !error && novelContent && (
          <View style={styles.footerDivider}>
            <View style={styles.footerLine} />
            <Feather name="feather" size={16} color="#C8102E" />
            <View style={styles.footerLine} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
