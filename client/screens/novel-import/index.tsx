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
import { useThemeContext } from '@/contexts/ThemeContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useSafeRouter } from '@/hooks/useSafeRouter';
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

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';

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

  // 选择文件
  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setSelectedFile(file);
      
      // 自动开始上传分析
      handleUploadAndAnalyze(file);
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
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/import/analyze`, {
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

      // 跳转到预览页面进行手动章节标记
      router.push('/novel-preview', {
        filename: file.name,
        content: data.originalContent || '',
        characters: JSON.stringify(data.characters || []),
      });

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

  // 确认导入
  const handleConfirmImport = async () => {
    console.log('[Import] 开始导入流程');
    
    if (!analysisResult || analysisResult.characters.length === 0) {
      console.log('[Import] 没有可导入的角色');
      Alert.alert('提示', '没有可导入的角色');
      return;
    }

    setIsImporting(true);
    setImportProgress('正在创建小说...');
    console.log('[Import] 分析结果:', JSON.stringify(analysisResult, null, 2));

    try {
      // 1. 创建小说（标记为导入）
      console.log('[Import] 步骤1: 创建小说');
      const novel = await createNovel(
        analysisResult.title,
        analysisResult.themeType,
        analysisResult.themeType.toLowerCase(),
        undefined,
        undefined,
        true // 标记为导入小说
      );
      console.log('[Import] 小说创建成功:', novel.id, '(导入小说)');

      // 2. 保存所有角色
      console.log('[Import] 步骤2: 保存角色，共', analysisResult.characters.length, '个');
      const savedCharacters: Character[] = [];
      const characterIdMap: Record<string, string> = {}; // 原名 -> ID 映射

      for (let i = 0; i < analysisResult.characters.length; i++) {
        const char = analysisResult.characters[i];
        setImportProgress(`正在保存角色 ${i + 1}/${analysisResult.characters.length}: ${char.name}`);
        console.log(`[Import] 保存角色 ${i + 1}/${analysisResult.characters.length}:`, char.name);
        
        // 转换角色类型
        let roleType: 'male_lead' | 'female_lead' | 'npc' | undefined = undefined;
        if (char.roleType === '男主' || char.roleType === '主角') {
          roleType = 'male_lead';
        } else if (char.roleType === '女主') {
          roleType = 'female_lead';
        } else if (char.roleType === '配角' || char.roleType === '反派') {
          roleType = 'npc';
        }
        console.log('[Import] 角色类型映射:', char.roleType, '->', roleType);

        const newCharacter: Character = {
          id: generateId(),
          name: char.name,
          gender: char.gender || '未知',
          age: char.age || 25,
          height: char.height || '未知',
          occupation: char.occupation || '未知',
          education: char.education || '未知',
          personality: char.personality || '',
          experience: char.experience || '',
          familyBackground: char.familyBackground || '',
          appearance: char.appearance || '',
          specialTraits: char.specialTraits || '',
          avatarUrl: char.avatarUrl,
          novelId: novel.id, // 锁定到导入的小说
          roleType: roleType, // 设置角色类型
          isTemporary: false, // 导入的角色不是临时角色
          createdAt: Date.now(),
        };

        await saveCharacter(newCharacter);
        savedCharacters.push(newCharacter);
        characterIdMap[char.name] = newCharacter.id;
        console.log('[Import] 角色保存成功:', char.name, 'ID:', newCharacter.id);

        // 如果是主角，更新小说的主角ID
        if (roleType === 'male_lead') {
          novel.maleCharacterId = newCharacter.id;
        } else if (roleType === 'female_lead') {
          novel.femaleCharacterId = newCharacter.id;
        }
      }

      // 3. 保存角色关系到关系网络
      console.log('[Import] 步骤3: 保存关系网络');
      setImportProgress('正在构建关系网络...');
      let relationCount = 0;
      for (const char of analysisResult.characters) {
        if (char.relationships && char.relationships.length > 0) {
          const sourceId = characterIdMap[char.name];
          if (!sourceId) {
            console.log('[Import] 跳过角色:', char.name, '（未找到ID）');
            continue;
          }

          for (const rel of char.relationships) {
            const targetId = characterIdMap[rel.targetName];
            if (!targetId) {
              console.log('[Import] 跳过关系:', char.name, '->', rel.targetName, '（目标未找到）');
              continue;
            }

            console.log('[Import] 保存关系:', char.name, rel.relationType, rel.targetName);
            // 保存到关系网络
            await addRelationToNetwork(
              novel.id,
              sourceId,
              char.name,
              char.gender,
              targetId,
              rel.targetName,
              '', // 目标角色性别未知
              rel.relationType,
              undefined // 反向关系可选
            );
            relationCount++;
          }
        }
      }
      console.log('[Import] 关系网络保存完成，共', relationCount, '条关系');

      // 3.5 保存男女主角ID到小说
      if (novel.maleCharacterId || novel.femaleCharacterId) {
        console.log('[Import] 步骤3.5: 保存男女主角ID到小说');
        await saveNovel(novel);
        console.log('[Import] 男主角ID:', novel.maleCharacterId, '女主角ID:', novel.femaleCharacterId);
      }

      // 4. 解析并保存原文章节
      let savedChapterCount = 0;
      if (analysisResult.originalContent) {
        console.log('[Import] 步骤4: 解析原文章节结构');
        setImportProgress('正在解析章节结构...');
        
        // 使用AI识别的章节信息分割内容
        const parsedChapters = splitContentByChapters(
          analysisResult.originalContent, 
          analysisResult.chapters || []
        );
        console.log('[Import] 解析完成，共', parsedChapters.length, '个章节');
        
        // 过滤掉楔子（order为0或标题包含"楔子"/"序"/"前言"等关键词）
        const normalChapters = parsedChapters.filter(chapter => {
          const isPrologue = chapter.order === 0 || 
            /楔子|序[言章]?|前言|引子/.test(chapter.title);
          if (isPrologue) {
            console.log('[Import] 跳过楔子:', chapter.title);
          }
          return !isPrologue;
        });
        
        console.log('[Import] 过滤后章节数:', normalChapters.length);
        
        // 重新编号章节（从1开始）
        for (let i = 0; i < normalChapters.length; i++) {
          const chapter = normalChapters[i];
          setImportProgress(`正在保存章节 ${i + 1}/${normalChapters.length}: ${chapter.title}`);
          
          // 章节序号直接使用位置索引+1，所见即所得
          const chapterOrder = i + 1;
          
          console.log('[Import] 创建章节:', chapter.title, 'order:', chapterOrder);
          
          // 不再使用isPrologue参数
          const newChapter = await addChapter(novel.id, chapter.title, false, chapterOrder);
          
          // 在最后一章末尾添加作者更换声明
          let chapterContent = chapter.content;
          if (i === normalChapters.length - 1) {
            const authorNote = '\n\n---\n\n【本书作者已更换】\n尊敬的读者，原作品至此章节完结。后续内容将由新作者续写，风格可能有所变化，敬请理解。感谢您对原作者的尊重和对本续作的支持。';
            chapterContent = chapter.content + authorNote;
          }
          
          await updateChapter(novel.id, newChapter.id, {
            content: chapterContent,
          });
          console.log('[Import] 章节已保存:', chapter.title, '长度:', chapterContent.length);
          savedChapterCount++;
        }
      }

      console.log('[Import] 导入流程完成');
      setImportProgress('');
      setIsImporting(false);
      
      // 显示成功弹窗
      setSuccessModal({
        visible: true,
        title: '导入成功',
        characterCount: savedCharacters.length,
        chapterCount: savedChapterCount,
        novelId: novel.id,
        novelTitle: analysisResult.title,
      });

    } catch (err) {
      console.error('[Import] 导入失败:', err);
      console.error('[Import] 错误堆栈:', err instanceof Error ? err.stack : 'unknown');
      setImportProgress('');
      setIsImporting(false);
      
      // 使用弹窗显示错误
      if (Platform.OS === 'web') {
        window.alert(`导入失败: ${err instanceof Error ? err.message : '请重试'}`);
      } else {
        Alert.alert('错误', `导入失败: ${err instanceof Error ? err.message : '请重试'}`);
      }
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
                disabled={isImporting}
              >
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  重新选择
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, isImporting && styles.confirmButtonDisabled]} 
                onPress={handleConfirmImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    {importProgress ? (
                      <ThemedText variant="smallMedium" color="#FFFFFF" style={{ marginLeft: 8 }}>
                        {importProgress}
                      </ThemedText>
                    ) : null}
                  </View>
                ) : (
                  <ThemedText variant="smallMedium" color="#FFFFFF">
                    确认导入
                  </ThemedText>
                )}
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
