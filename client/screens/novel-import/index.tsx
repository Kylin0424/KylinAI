import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { createStyles } from './styles';
import {
  Character,
  saveCharacter,
  generateId,
  addRelationToNetwork,
} from '@/utils/characterStorage';
import {
  Novel,
  createNovel,
  saveNovel,
  addChapter,
  updateChapter,
} from '@/utils/novelStorage';
import { createFormDataFile } from '@/utils';

// 临时使用线上地址测试
// 使用相对路径，通过Metro代理到后端
const API_BASE_URL = '/api/v1';

// 使用技巧列表
const TIPS_DATA = [
  '💡 导入后可以继续AI续写，延续原作风格',
  '✨ AI会自动识别角色性格、外貌和关系网络',
  '📝 支持 TXT、DOC、DOCX 三种格式',
  '🎭 角色关系网络会自动生成，方便续写参考',
  '📚 章节超过5000字会自动分割，保持段落完整',
  '🔄 导入的小说会标记"转载续写"，尊重原作者',
  '👤 主角和配角会被自动识别并分类',
  '📖 世界观设定会被提取，确保续写一致性',
  '⚡ 大文件可能需要1-3分钟，请耐心等待',
  '🎨 角色头像可后续在角色库中生成',
  '📱 支持导出TXT和Word文档',
  '🔍 可以随时查看角色详情和关系',
];

// 章节分割：完全依赖AI识别，不再做长度分割
function splitContentByChapters(
  content: string, 
  aiChapters: { originalTitle: string; order: number; summary: string; startText?: string }[]
): { title: string; content: string; order: number }[] {
  console.log('[splitContentByChapters] AI识别章节数:', aiChapters?.length || 0);
  
  // 如果完全没有AI章节信息，返回整个内容作为一章
  if (!aiChapters || aiChapters.length === 0) {
    console.log('[splitContentByChapters] 无AI章节信息，返回整个内容');
    return [{
      title: '第一章',
      content: content.trim(),
      order: 1,
    }];
  }
  
  // 定位所有AI识别的章节位置
  const chapterMarkers: { title: string; index: number; order: number }[] = [];
  
  for (const aiChapter of aiChapters) {
    let foundIndex = -1;
    
    // 方法1：用startText定位
    if (aiChapter.startText && aiChapter.startText.length >= 10) {
      const searchText = aiChapter.startText.trim();
      foundIndex = content.indexOf(searchText);
    }
    
    // 方法2：用原标题定位
    if (foundIndex === -1) {
      const titlePattern = aiChapter.originalTitle.trim();
      if (titlePattern.length >= 4) {
        foundIndex = content.indexOf(titlePattern);
      }
    }
    
    if (foundIndex !== -1) {
      // 检查是否已经标记过相近位置（避免重复）
      const isDuplicate = chapterMarkers.some(m => Math.abs(m.index - foundIndex) < 100);
      if (!isDuplicate) {
        chapterMarkers.push({
          title: aiChapter.originalTitle,
          index: foundIndex,
          order: aiChapter.order,
        });
        console.log(`[splitContentByChapters] 定位成功: 章节${aiChapter.order} "${aiChapter.originalTitle}" at ${foundIndex}`);
      }
    } else {
      console.log(`[splitContentByChapters] 定位失败: 章节${aiChapter.order} "${aiChapter.originalTitle}"`);
    }
  }
  
  // 按位置排序
  chapterMarkers.sort((a, b) => a.index - b.index);
  
  // 如果一个都没定位到，返回整个内容作为一章
  if (chapterMarkers.length === 0) {
    console.log('[splitContentByChapters] 所有章节均未定位成功，返回整个内容');
    return [{
      title: '第一章',
      content: content.trim(),
      order: 1,
    }];
  }
  
  // 按AI识别的位置分割
  const chapters: { title: string; content: string; order: number }[] = [];
  
  for (let i = 0; i < chapterMarkers.length; i++) {
    const marker = chapterMarkers[i];
    const nextMarker = chapterMarkers[i + 1];
    
    const startIndex = marker.index;
    const endIndex = nextMarker ? nextMarker.index : content.length;
    const chapterContent = content.substring(startIndex, endIndex).trim();
    
    if (chapterContent.length >= 50) {
      chapters.push({
        title: marker.title,
        content: chapterContent,
        order: marker.order,
      });
    }
  }
  
  // 处理开头未识别的内容（如果有）
  if (chapterMarkers[0].index > 50) {
    const firstContent = content.substring(0, chapterMarkers[0].index).trim();
    if (firstContent.length >= 100) {
      chapters.unshift({
        title: '第一章',
        content: firstContent,
        order: 0,
      });
    }
  }
  
  // 按order排序并重新编号
  chapters.sort((a, b) => a.order - b.order);
  const finalChapters = chapters.map((ch, index) => ({
    ...ch,
    order: index + 1,
  }));
  
  console.log('[splitContentByChapters] 最终章节数:', finalChapters.length);
  finalChapters.forEach((ch, i) => {
    console.log(`[splitContentByChapters] 章节${i + 1}: ${ch.title}, ${ch.content.length}字`);
  });
  
  return finalChapters;
}

interface IdentifiedCharacter {
  name: string;
  gender: string;
  age: number;
  height?: string;
  occupation?: string;
  education?: string;
  personality?: string;
  appearance?: string;
  experience?: string;
  familyBackground?: string;
  specialTraits?: string;
  isProtagonist: boolean;
  roleType: string;
  avatarUrl?: string;
  relationships: {
    targetName: string;
    relationType: string;
    description?: string;
  }[];
}

interface AnalysisResult {
  title: string;
  themeType: string;
  characters: IdentifiedCharacter[];
  chapters: {
    originalTitle: string;
    order: number;
    summary: string;
    startText?: string; // 章节开头文本，用于定位
  }[];
  plotSummary: string;
  worldSetting: string;
  contentLength: number;
  originalContent?: string; // 原始内容
}

type ImportStep = 'select' | 'uploading' | 'analyzing' | 'result' | 'error';

interface ImportSuccessData {
  visible: boolean;
  title: string;
  characterCount: number;
  chapterCount: number;
  novelId: string;
  novelTitle: string;
}

// 滚动提示组件
function ScrollingTips() {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const interval = setInterval(() => {
      // 淡出
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // 切换提示
        setCurrentTipIndex((prev) => (prev + 1) % TIPS_DATA.length);
        // 淡入
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);
    
    return () => clearInterval(interval);
  }, [fadeAnim]);
  
  return (
    <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', paddingHorizontal: 20 }}>
      <ThemedText variant="small" style={{ color: '#666', textAlign: 'center', lineHeight: 22 }}>
        {TIPS_DATA[currentTipIndex]}
      </ThemedText>
    </Animated.View>
  );
}

// 实时状态指示器
function StatusIndicator({ step, progress, fileSize }: { step: ImportStep; progress: number; fileSize?: number }) {
  const [dots, setDots] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // 动态点点点动画
  useEffect(() => {
    if (step === 'uploading' || step === 'analyzing') {
      const interval = setInterval(() => {
        setDots((prev) => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [step]);
  
  // 计时器
  useEffect(() => {
    if (step === 'uploading' || step === 'analyzing') {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [step]);
  
  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 根据文件大小预估时间
  const getEstimatedTime = () => {
    // 文件大小单位：字节，转换为万字
    const wordCount = (fileSize || 100000) / 3; // 假设每个汉字3字节
    
    // 根据字数预估处理时间（每万字约需要1分钟）
    const estimatedMins = Math.ceil(wordCount / 10000);
    
    if (progress < 30) {
      if (estimatedMins <= 3) return '预计需要2-5分钟';
      if (estimatedMins <= 10) return '预计需要5-10分钟';
      return `预计需要${estimatedMins}-${estimatedMins + 5}分钟`;
    }
    if (progress < 60) {
      const remaining = Math.max(1, Math.ceil(estimatedMins * (100 - progress) / 100));
      return `预计还需${remaining}-${remaining + 2}分钟`;
    }
    if (progress < 90) return '即将完成，请稍候';
    return '马上就好';
  };
  
  if (step !== 'uploading' && step !== 'analyzing') return null;
  
  return (
    <View style={{ alignItems: 'center', marginTop: 16, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={{ 
          width: 8, 
          height: 8, 
          borderRadius: 4, 
          backgroundColor: '#4CAF50',
          marginRight: 6,
        }} />
        <ThemedText variant="caption" style={{ color: '#4CAF50' }}>
          后台正在处理中{dots}
        </ThemedText>
      </View>
      <ThemedText variant="caption" style={{ color: '#999' }}>
        已用时 {formatTime(elapsedTime)} · {getEstimatedTime()}
      </ThemedText>
    </View>
  );
}

export default function NovelImportScreen() {
  const { theme, isDark } = useThemeContext();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const params = useSafeSearchParams<{
    filename?: string;
    content?: string;
    chapters?: string;
    characters?: string;
    previewMode?: string;
  }>();

  const [step, setStep] = useState<ImportStep>('select');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState(''); // 详细进度文本
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string>('');
  const [successModal, setSuccessModal] = useState<ImportSuccessData>({
    visible: false,
    title: '',
    characterCount: 0,
    chapterCount: 0,
    novelId: '',
    novelTitle: '',
  });

  // 开始章节定位（跳转到novel-preview）
  const handleStartPreview = () => {
    if (!analysisResult || !selectedFile) {
      Alert.alert('提示', '分析结果或文件信息缺失');
      return;
    }

    router.push('/novel-preview', {
      filename: selectedFile.name,
      content: analysisResult.originalContent || '',
      characters: JSON.stringify(analysisResult.characters || []),
      title: analysisResult.title || selectedFile.name,
      themeType: analysisResult.themeType || '未分类',
    });
  };

  // 选择文件
  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setSelectedFile(file);

      // 读取文件内容
      if (file.mimeType === 'text/plain') {
        try {
          // 使用 expo-file-system 读取文本内容
          const content = await (FileSystem as any).readAsStringAsync(file.uri, {
            encoding: 'utf8',
          });

          // 跳转到文本编辑器页面
          router.push('/novel-text-editor', {
            fileContent: content,
            fileName: file.name,
          });
        } catch (readErr) {
          console.error('File read error:', readErr);
          Alert.alert('错误', '读取文件内容失败，请重试');
        }
      } else {
        Alert.alert('提示', '目前仅支持导入 .txt 格式的文本文件');
      }
    } catch (err) {
      console.error('File selection error:', err);
      Alert.alert('错误', '选择文件失败，请重试');
    }
  };

  // 上传并分析文件
  const handleUploadAndAnalyze = async (file: DocumentPicker.DocumentPickerAsset) => {
    setStep('uploading');
    setProgress(0);
    setProgressText('准备上传...');
    setError(null);

    // 创建 AbortController 用于超时控制（120秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 120000); // 120秒超时

    try {
      // 创建FormData上传文件
      setProgressText('正在读取文件...');
      setProgress(10);
      const formData = new FormData();
      const fileData = await createFormDataFile(file.uri, file.name, file.mimeType || 'text/plain');
      formData.append('file', fileData as any);

      setProgressText('正在上传文件...');
      setProgress(30);

      /**
       * 服务端文件：server/src/routes/import.ts
       * 接口：POST /api/v1/import/analyze
       * Body 参数：FormData with file field
       */
      const response = await fetch(`${API_BASE_URL}/import/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      setProgressText('AI正在分析角色和章节...');
      setProgress(60);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `上传失败(${response.status})`);
      }

      setProgressText('正在解析分析结果...');
      setProgress(80);

      const data = await response.json();

      setProgressText('分析完成');
      setProgress(100);
      setAnalysisResult(data);

      // 进入result步骤，显示角色信息
      setStep('result');

    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Upload/Analysis error:', err);

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('请求超时，请重试或上传更小的文件');
        } else {
          setError(err.message);
        }
      } else {
        setError('分析失败，请重试');
      }
      setStep('error');
    }
  };

  // 重试
  const handleRetry = () => {
    setStep('select');
    setError(null);
    setProgress(0);
    setAnalysisResult(null);
  };

  // 渲染角色卡片
  const renderCharacterCard = (char: IdentifiedCharacter, index: number) => {
    const firstChar = char.name?.charAt(0) || '?';
    
    return (
      <View key={index} style={styles.characterCard}>
        <View style={styles.characterHeader}>
          {char.avatarUrl ? (
            <Image source={{ uri: char.avatarUrl }} style={styles.characterAvatar} />
          ) : (
            <View style={styles.characterAvatar}>
              <ThemedText variant="h4" color="#FFFFFF" style={styles.characterAvatarText}>
                {firstChar}
              </ThemedText>
            </View>
          )}
          <View style={styles.characterInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ThemedText variant="label" color={theme.textPrimary} style={styles.characterName}>
                {char.name}
              </ThemedText>
              {char.isProtagonist && (
                <View style={styles.protagonistBadge}>
                  <ThemedText variant="caption" color="#FFFFFF" style={styles.protagonistBadgeText}>
                    主角
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.characterRole}>
              {char.roleType} · {char.occupation || '未知职业'}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.characterDetails}>
          <View style={styles.characterDetailRow}>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.characterDetailLabel}>
              性别
            </ThemedText>
            <ThemedText variant="caption" color={theme.textPrimary} style={styles.characterDetailValue}>
              {char.gender || '未知'}
            </ThemedText>
          </View>
          <View style={styles.characterDetailRow}>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.characterDetailLabel}>
              年龄
            </ThemedText>
            <ThemedText variant="caption" color={theme.textPrimary} style={styles.characterDetailValue}>
              {char.age ? `${char.age}岁` : '未知'}
            </ThemedText>
          </View>
          {char.personality && (
            <ThemedText variant="caption" color={theme.textSecondary} style={{ marginTop: 4 }}>
              {`${char.personality.substring(0, 80)}...`}
            </ThemedText>
          )}
        </View>

        {char.relationships && char.relationships.length > 0 && (
          <View style={styles.relationsSection}>
            <ThemedText variant="caption" color={theme.textMuted}>
              关系网络：
            </ThemedText>
            {char.relationships.slice(0, 3).map((rel, relIndex) => (
              <View key={relIndex} style={styles.relationItem}>
                <ThemedText variant="caption" color={theme.textPrimary}>
                  {char.name}
                </ThemedText>
                <Feather name="arrow-right" size={12} color={theme.textMuted} style={styles.relationArrow} />
                <ThemedText variant="caption" color={theme.textPrimary}>
                  {rel.relationType}
                </ThemedText>
                <Feather name="arrow-right" size={12} color={theme.textMuted} style={styles.relationArrow} />
                <ThemedText variant="caption" color={theme.textPrimary}>
                  {rel.targetName}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
          <ThemedText variant="small" color={theme.textPrimary} style={styles.backText}>
            返回
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <View style={styles.header}>
          <View style={styles.decorativeLine} />
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
            导入小说
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted}>
            上传小说文件，自动识别角色和关系网络
          </ThemedText>
        </View>

        {/* Step: Select File */}
        {step === 'select' && (
          <TouchableOpacity style={styles.uploadSection} onPress={handleSelectFile}>
            <View style={styles.uploadIcon}>
              <Feather name="upload-cloud" size={32} color="#C8102E" />
            </View>
            <ThemedText variant="body" color={theme.textPrimary} style={styles.uploadText}>
              点击选择小说文件
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.uploadHint}>
              支持 TXT、DOC、DOCX 格式
            </ThemedText>
            <View style={styles.supportedFormats}>
              <ThemedText variant="caption" color={theme.textMuted}>
                AI 将自动识别角色、性格、关系网络
              </ThemedText>
            </View>
          </TouchableOpacity>
        )}

        {/* Step: Uploading/Analyzing */}
        {(step === 'uploading') && (
          <View style={styles.progressSection}>
            <View style={styles.progressIconContainer}>
              <ActivityIndicator size="large" color="#C8102E" />
            </View>
            <ThemedText variant="label" color={theme.textPrimary} style={styles.progressTitle}>
              {progressText}
            </ThemedText>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.progressText}>
              {progress}%
            </ThemedText>
            {selectedFile && (
              <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: 8 }}>
                文件：{selectedFile.name}
              </ThemedText>
            )}
            
            {/* 实时状态指示器 */}
            <StatusIndicator step={step} progress={progress} fileSize={selectedFile?.size} />
            
            {/* 滚动提示 */}
            <View style={{ marginTop: 32, width: '100%' }}>
              <ScrollingTips />
            </View>
            
            {/* 温馨提示 */}
            <View style={{ 
              marginTop: 24, 
              padding: 16, 
              backgroundColor: '#FFF8E1', 
              borderRadius: 8,
              width: '100%',
            }}>
              <ThemedText variant="caption" style={{ color: '#F57C00', textAlign: 'center' }}>
                📌 温馨提示：AI正在分析小说内容，大文件可能需要1-3分钟，请勿离开页面
              </ThemedText>
            </View>
          </View>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#C8102E" />
            <ThemedText variant="body" color={theme.textSecondary} style={styles.errorText}>
              {error || '导入失败，请重试'}
            </ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <ThemedText variant="smallMedium" color="#FFFFFF">
                重新选择
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Step: Result */}
        {step === 'result' && analysisResult && (
          <View style={styles.resultSection}>
            {/* 小说信息 */}
            <View style={styles.resultHeader}>
              <View>
                <ThemedText variant="h3" color={theme.textPrimary} style={styles.novelTitle}>
                  《{analysisResult.title}》
                </ThemedText>
                <View style={styles.novelMeta}>
                  <View style={styles.metaTag}>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {analysisResult.themeType}
                    </ThemedText>
                  </View>
                  <View style={styles.metaTag}>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {analysisResult.characters.length} 个角色
                    </ThemedText>
                  </View>
                  <View style={styles.metaTag}>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {(analysisResult.contentLength / 1000).toFixed(1)}k 字
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* 剧情概要 */}
            {analysisResult.plotSummary && (
              <View style={{ marginBottom: 16 }}>
                <ThemedText variant="label" color={theme.textPrimary}>
                  剧情概要
                </ThemedText>
                <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: 4 }}>
                  {analysisResult.plotSummary}
                </ThemedText>
              </View>
            )}

            {/* 角色列表 */}
            <View style={styles.characterList}>
              <ThemedText variant="label" color={theme.textPrimary}>
                识别出的角色
              </ThemedText>
              {analysisResult.characters.map((char, index) => renderCharacterCard(char, index))}
            </View>

            {/* 底部操作按钮 */}
            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleRetry}
              >
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  重新选择
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleStartPreview}
              >
                <ThemedText variant="smallMedium" color="#FFFFFF">
                  开始章节定位
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 成功弹窗 */}
      <Modal
        visible={successModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Feather name="check-circle" size={48} color="#10B981" />
            </View>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.modalTitle}>
              导入成功
            </ThemedText>
            <ThemedText variant="body" color={theme.textSecondary} style={styles.modalMessage}>
              已导入小说《{successModal.novelTitle}》{'\n'}
              共识别 {successModal.characterCount} 个角色，{successModal.chapterCount} 个章节
            </ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalSecondaryButton}
                onPress={() => {
                  setSuccessModal(prev => ({ ...prev, visible: false }));
                  router.push('/home');
                }}
              >
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  返回首页
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalPrimaryButton}
                onPress={() => {
                  setSuccessModal(prev => ({ ...prev, visible: false }));
                  router.push('/novel-writing', { novelId: successModal.novelId });
                }}
              >
                <ThemedText variant="smallMedium" color="#FFFFFF">
                  开始创作
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
