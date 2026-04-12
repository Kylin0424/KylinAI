import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { FloatingBall } from '@/components/FloatingBall';
import { Spacing } from '@/constants/theme';
import { createStyles } from './styles';
import { OCCUPATION_CATEGORIES, OCCUPATION_CUSTOM_OPTION } from '@/constants/occupations';
import { FAMILY_RELATIONS, generateMemberCountOptions, getAllRelationsFlat, getRelationsBySubCategory } from '@/constants/familyRelations';
import { EDUCATION_OPTIONS, getEducationByCategory } from '@/constants/education';

// 生成成员人数选项
const MEMBER_COUNT_OPTIONS = generateMemberCountOptions();

// 性别选项
const GENDER_OPTIONS = ['男', '女', '男娘', '扶她', '人妖', '手动输入'];
const GENDER_CUSTOM_OPTION = '手动输入';

interface SliderConfig {
  key: string;
  label: string;
  minLabel: string;
  maxLabel: string;
  value: number;
}

export default function CharacterScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [isGenerating, setIsGenerating] = useState(false);

  // 手动输入的基本信息
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [customGender, setCustomGender] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [groupInput, setGroupInput] = useState('');
  const [positionInput, setPositionInput] = useState('');
  const [occupation, setOccupation] = useState('');
  const [customOccupation, setCustomOccupation] = useState('');
  const [education, setEducation] = useState('');
  const [customEducation, setCustomEducation] = useState('');

  // 家庭背景
  const [memberCount, setMemberCount] = useState<number>(3);
  const [selectedRelations, setSelectedRelations] = useState<string[]>([]); // 已选的关系列表
  const [familyMembersBrief, setFamilyMembersBrief] = useState(''); // 家庭成员简述
  const [familyBackground, setFamilyBackground] = useState('');
  const [socialExperience, setSocialExperience] = useState('');

  // 家庭成员设置流程
  const [showFamilyMemberSetupModal, setShowFamilyMemberSetupModal] = useState(false); // 是否显示家庭成员设置弹窗
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0); // 当前正在设置的家庭成员索引
  const [currentRelationType, setCurrentRelationType] = useState(''); // 当前正在设置的关系类型
  const [stagedFamilyMembers, setStagedFamilyMembers] = useState<any[]>([]); // 已暂存的家庭成员信息

  // 当前家庭成员设置的基本信息
  const [memberName, setMemberName] = useState('');
  const [memberGender, setMemberGender] = useState('');
  const [memberAge, setMemberAge] = useState('');
  const [memberHeight, setMemberHeight] = useState('');
  const [memberWeight, setMemberWeight] = useState('');
  const [memberOccupation, setMemberOccupation] = useState('');
  const [memberEducation, setMemberEducation] = useState('');
  const [memberEducationCustom, setMemberEducationCustom] = useState('');
  const [showMemberEducationModal, setShowMemberEducationModal] = useState(false);

  // 最多可选的关系数 = 家庭成员人数 - 1（减去自己）
  const maxRelations = memberCount - 1;
  
  // 还能选择多少个关系
  const remainingSlots = maxRelations - selectedRelations.length;
  
  // 所有可用的关系列表
  const allRelations = useMemo(() => {
    return getAllRelationsFlat();
  }, []);
  
  // 添加关系
  const handleAddRelation = (relation: string) => {
    if (selectedRelations.length < maxRelations && !selectedRelations.includes(relation)) {
      setSelectedRelations([...selectedRelations, relation]);
    }
    setShowRelationModal(false);
  };
  
  // 移除关系
  const handleRemoveRelation = (relation: string) => {
    setSelectedRelations(selectedRelations.filter(r => r !== relation));
  };

  // 职业选择弹窗
  const [showOccupationModal, setShowOccupationModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCustomOccupationInput, setShowCustomOccupationInput] = useState(false);

  // 性别选择弹窗
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showCustomGenderInput, setShowCustomGenderInput] = useState(false);

  // 学历选择弹窗
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showCustomEducationInput, setShowCustomEducationInput] = useState(false);

  // 家庭成员弹窗
  const [showMemberCountModal, setShowMemberCountModal] = useState(false);
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [selectedRelationCategory, setSelectedRelationCategory] = useState<string | null>(null);
  const [showMemberOccupationModal, setShowMemberOccupationModal] = useState(false);
  const [memberCustomOccupation, setMemberCustomOccupation] = useState('');
  const [showMemberCustomOccupationInput, setShowMemberCustomOccupationInput] = useState(false);
  const [showMemberCustomEducationInput, setShowMemberCustomEducationInput] = useState(false);
  // 关系分类列表
  const relationCategories = useMemo(() => {
    const categories = new Set<string>();
    allRelations.forEach(r => categories.add(r.category));
    return Array.from(categories);
  }, [allRelations]);

  // 过滤后的关系列表
  const filteredRelations = useMemo(() => {
    if (!selectedRelationCategory) return allRelations;
    return allRelations.filter(r => r.category === selectedRelationCategory);
  }, [allRelations, selectedRelationCategory]);

  // 滑块配置
  const [sliders, setSliders] = useState<SliderConfig[]>([
    // 性格维度
    { key: 'introversion', label: '性格倾向', minLabel: '内向', maxLabel: '外向', value: 50 },
    { key: 'rational', label: '思维方式', minLabel: '感性', maxLabel: '理性', value: 50 },
    { key: 'conservative', label: '生活态度', minLabel: '保守', maxLabel: '开放', value: 50 },
    { key: 'optimistic', label: '心态倾向', minLabel: '悲观', maxLabel: '乐观', value: 50 },
    // 能力维度
    { key: 'intelligence', label: '智慧程度', minLabel: '单纯', maxLabel: '睿智', value: 50 },
    { key: 'courage', label: '勇气指数', minLabel: '谨慎', maxLabel: '勇敢', value: 50 },
    { key: 'charisma', label: '魅力值', minLabel: '平凡', maxLabel: '迷人', value: 50 },
    { key: 'luck', label: '运气值', minLabel: '倒霉', maxLabel: '幸运', value: 50 },
    // 背景维度
    { key: 'socialStatus', label: '社会地位', minLabel: '底层', maxLabel: '上层', value: 50 },
    { key: 'wealth', label: '财富程度', minLabel: '贫困', maxLabel: '富裕', value: 50 },
  ]);

  const updateSlider = (key: string, value: number) => {
    setSliders(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleGenerate = () => {
    if (!name.trim()) {
      return;
    }

    // 如果有需要设置的家庭成员，先弹出设置弹窗
    if (selectedRelations.length > 0) {
      setCurrentMemberIndex(0);
      setCurrentRelationType(selectedRelations[0]);
      setStagedFamilyMembers([]);
      setShowFamilyMemberSetupModal(true);
      return;
    }

    // 如果没有家庭成员，直接生成
    proceedToGeneration();
  };

  const proceedToGeneration = () => {
    setIsGenerating(true);

    // 将滑块值和基本信息转换为参数
    const sliderValues: Record<string, number> = {};
    sliders.forEach(s => {
      sliderValues[s.key] = s.value;
    });

    // 处理性别
    const finalGender = gender === GENDER_CUSTOM_OPTION ? customGender.trim() || '未设定' : gender.trim() || '未设定';

    // 处理体重，添加单位
    const finalWeight = weightInput.trim() ? `${weightInput.trim()}kg` : '未设定';

    // 处理团体信息，加入社会经历
    let finalSocialExperience = socialExperience.trim();
    if (groupInput.trim()) {
      if (finalSocialExperience) {
        finalSocialExperience = `所属团体：${groupInput.trim()}。${finalSocialExperience}`;
      } else {
        finalSocialExperience = `所属团体：${groupInput.trim()}`;
      }
    }

    // 处理职位信息
    if (positionInput.trim()) {
      if (finalSocialExperience) {
        finalSocialExperience += ` 职位：${positionInput.trim()}`;
      } else {
        finalSocialExperience = `职位：${positionInput.trim()}`;
      }
    }

    if (!finalSocialExperience) {
      finalSocialExperience = '未设定';
    }

    // 将已暂存的家庭成员信息转换为字符串
    const familyMembersData = stagedFamilyMembers.map(member => ({
      relation: member.relation,
      name: member.name,
      gender: member.gender,
      age: member.age,
      height: member.height,
      weight: member.weight,
      occupation: member.occupation,
      education: member.education,
    }));

    router.push('/character-result', {
      sliders: JSON.stringify(sliderValues),
      name: name.trim(),
      gender: finalGender,
      age: ageInput.trim() || '25',
      height: heightInput.trim() ? `${heightInput.trim()}cm` : '170cm',
      weight: finalWeight,
      group: groupInput.trim() || '未设定',
      position: positionInput.trim() || '未设定',
      occupation: occupation === OCCUPATION_CUSTOM_OPTION ? customOccupation.trim() || '未设定' : occupation.trim() || '未设定',
      education: education === '手动输入' ? customEducation.trim() || '未设定' : education.trim() || '未设定',
      memberCount: memberCount.toString(),
      familyRelation: selectedRelations.join('、') || '未设定',
      familyMembersBrief: familyMembersBrief.trim() || '未设定',
      familyBackground: familyBackground.trim() || '未设定',
      socialExperience: finalSocialExperience,
      familyMembersData: JSON.stringify(familyMembersData), // 传递已设置的家庭成员数据
    });

    setIsGenerating(false);
  };

  const handleSaveFamilyMember = () => {
    // 验证必填字段
    if (!memberName.trim()) {
      alert('请输入姓名');
      return;
    }
    if (!memberGender) {
      alert('请选择性别');
      return;
    }
    if (!memberAge.trim()) {
      alert('请输入年龄');
      return;
    }
    if (!memberHeight.trim()) {
      alert('请输入身高');
      return;
    }
    if (!memberWeight.trim()) {
      alert('请输入体重');
      return;
    }
    if (!memberOccupation) {
      alert('请选择职业');
      return;
    }
    if (!memberEducation) {
      alert('请选择学历');
      return;
    }

    // 保存当前家庭成员信息
    const member = {
      relation: currentRelationType,
      name: memberName.trim(),
      gender: memberGender,
      age: memberAge.trim(),
      height: `${memberHeight.trim()}cm`,
      weight: `${memberWeight.trim()}kg`,
      occupation: memberOccupation,
      education: memberEducation === '手动输入' ? memberEducationCustom.trim() || '未设定' : memberEducation,
    };

    const updatedMembers = [...stagedFamilyMembers, member];
    setStagedFamilyMembers(updatedMembers);

    // 检查是否还有下一个家庭成员需要设置
    if (currentMemberIndex < selectedRelations.length - 1) {
      // 有下一个，清空当前表单，设置下一个关系
      setCurrentMemberIndex(currentMemberIndex + 1);
      setCurrentRelationType(selectedRelations[currentMemberIndex + 1]);
      setMemberName('');
      setMemberGender('');
      setMemberAge('');
      setMemberHeight('');
      setMemberWeight('');
      setMemberOccupation('');
      setMemberEducation('');
      setMemberEducationCustom('');
    } else {
      // 没有下一个了，关闭弹窗，继续生成
      setShowFamilyMemberSetupModal(false);
      proceedToGeneration();
    }
  };

  const handleCancelFamilyMemberSetup = () => {
    setShowFamilyMemberSetupModal(false);
  };

  const handleSelectOccupation = (occ: string) => {
    if (occ === OCCUPATION_CUSTOM_OPTION) {
      setOccupation(occ);
      setShowCustomOccupationInput(true);
    } else {
      setOccupation(occ);
      setCustomOccupation('');
      setShowCustomOccupationInput(false);
    }
    setShowOccupationModal(false);
  };

  const handleConfirmCustomOccupation = () => {
  setOccupation(customOccupation.trim() || '未设定');
  setShowCustomOccupationInput(false);
};
  
      // 家庭成员职业选择
  const handleSelectMemberOccupation = (occ: string) => {
    if (occ === OCCUPATION_CUSTOM_OPTION) {
      setMemberOccupation(occ);
      setShowMemberCustomOccupationInput(true);
    } else {
      setMemberOccupation(occ);
      setMemberCustomOccupation('');
    }
    setShowMemberOccupationModal(false);
  };
  const handleConfirmMemberCustomOccupation = () => {
    setMemberOccupation(memberCustomOccupation.trim() || '未设定');
    setShowMemberCustomOccupationInput(false);
  };

  const handleSelectEducation = (edu: string) => {
    if (edu === '手动输入') {
      setEducation(edu);
      setShowCustomEducationInput(true);
    } else {
      setEducation(edu);
      setCustomEducation('');
      setShowCustomEducationInput(false);
    }
    setShowEducationModal(false);
  };

  const handleConfirmCustomEducation = () => {
    setEducation(customEducation.trim() || '未设定');
    setShowCustomEducationInput(false);
  };

  const handleSelectGender = (g: string) => {
    if (g === GENDER_CUSTOM_OPTION) {
      setGender(g);
      setShowCustomGenderInput(true);
    } else {
      setGender(g);
      setCustomGender('');
      setShowCustomGenderInput(false);
    }
    setShowGenderModal(false);
  };

  const handleConfirmCustomGender = () => {
    setGender(customGender.trim() || '未设定');
    setShowCustomGenderInput(false);
  };

  const renderSlider = (slider: SliderConfig) => (
    <View key={slider.key} style={styles.sliderGroup}>
      <View style={styles.sliderHeader}>
        <ThemedText variant="smallMedium" color={theme.textPrimary}>
          {slider.label}
        </ThemedText>
        <View style={styles.sliderLabels}>
          <ThemedText variant="caption" color={theme.textMuted}>
            {slider.minLabel}
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted}>
            {slider.maxLabel}
          </ThemedText>
        </View>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        value={slider.value}
        onValueChange={(value) => updateSlider(slider.key, value)}
        minimumTrackTintColor="#C8102E"
        maximumTrackTintColor={theme.border}
        thumbTintColor="#C8102E"
      />
    </View>
  );

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      {/* Header with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/home')}>
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
          <ThemedText variant="small" color={theme.textPrimary} style={styles.backText}>
            返回首页
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <ThemedView level="root" style={styles.header}>
          <View style={styles.decorativeLine} />
          <ThemedText variant="h2" color={theme.textPrimary}>
            角色生成器
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted}>
            调整参数，创造独特角色
          </ThemedText>
        </ThemedView>

        {/* Basic Info Section */}
        <ThemedView level="root" style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.labelIcon}>
              <Feather name="user" size={16} color={theme.textPrimary} />
            </View>
            <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitle}>
              基本信息
            </ThemedText>
          </View>

          {/* 第一行：姓名、性别、年龄 */}
          <View style={styles.inputRow}>
            {/* 姓名 - 缩小五分之一 */}
            <View style={[styles.inputGroup, { flex: 0.8 }]}>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.inputLabel}>
                姓名 *
              </ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="请输入角色姓名"
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
            {/* 性别 - 下拉选择 */}
            <View style={[styles.inputGroup, styles.genderInputGroup]}>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.inputLabel}>
                性别
              </ThemedText>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setShowGenderModal(true)}
              >
                <ThemedText
                  variant="smallMedium"
                  color={gender ? theme.textPrimary : theme.textMuted}
                  numberOfLines={1}
                >
                  {gender === GENDER_CUSTOM_OPTION && customGender ? customGender : gender || '选择'}
                </ThemedText>
                <Feather name="chevron-down" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            {/* 年龄 - 预留3个汉字位置 */}
            <View style={[styles.inputGroup, styles.ageInputGroup]}>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.inputLabel}>
                年龄
              </ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="25"
                placeholderTextColor={theme.textMuted}
                value={ageInput.replace(/[^0-9]/g, '')}
                onChangeText={(text) => setAgeInput(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>

          {/* 第二行：身高、体重、学历 */}
          <View style={[styles.inputRow, { alignItems: 'flex-end' }]}>
            {/* 身高 - 预留4个汉字位置 */}
            <View style={[styles.inputGroup, styles.heightInputGroup]}>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.inputLabel}>
                身高
              </ThemedText>
              <View style={[styles.inputWithSuffix, styles.compactInputWithSuffix]}>
                <TextInput
                  style={[styles.textInputWithSuffix, styles.compactInput]}
                  placeholder="170"
                  placeholderTextColor={theme.textMuted}
                  value={heightInput.replace(/[^0-9]/g, '')}
                  onChangeText={(text) => setHeightInput(text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <ThemedText variant="caption" color={theme.textMuted} style={[styles.suffixText, styles.compactSuffixText]}>cm</ThemedText>
              </View>
            </View>
            {/* 体重 - 预留4个汉字位置 */}
            <View style={[styles.inputGroup, styles.weightInputGroup]}>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.inputLabel}>
                体重
              </ThemedText>
              <View style={[styles.inputWithSuffix, styles.compactInputWithSuffix]}>
                <TextInput
                  style={[styles.textInputWithSuffix, styles.compactInput]}
                  placeholder="60"
                  placeholderTextColor={theme.textMuted}
                  value={weightInput.replace(/[^0-9]/g, '')}
                  onChangeText={(text) => setWeightInput(text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <ThemedText variant="caption" color={theme.textMuted} style={[styles.suffixText, styles.compactSuffixText]}>kg</ThemedText>
              </View>
            </View>
            {/* 学历 Selection - 右侧 */}
            <View style={[styles.inputGroup, { flex: 0.8, marginLeft: 'auto' }]}>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.inputLabel}>
                学历
              </ThemedText>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setShowEducationModal(true)}
              >
                <ThemedText
                  variant="smallMedium"
                  color={education ? theme.textPrimary : theme.textMuted}
                  numberOfLines={1}
                >
                  {education === '手动输入' && customEducation ? customEducation : education || '选择学历...'}
                </ThemedText>
                <Feather name="chevron-down" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 第三行：团体、职位、职业 */}
          <View style={styles.inputRow}>
            {/* 团体 - 左侧 */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.inputLabel}>
                团体
              </ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="军团/教派"
                placeholderTextColor={theme.textMuted}
                value={groupInput}
                onChangeText={setGroupInput}
              />
            </View>
            {/* 职位 - 中间 */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.inputLabel}>
                职位
              </ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="如：队长、长老"
                placeholderTextColor={theme.textMuted}
                value={positionInput}
                onChangeText={setPositionInput}
              />
            </View>
            {/* 职业 - 右侧 */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.inputLabel}>
                职业
              </ThemedText>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setShowOccupationModal(true)}
              >
                <ThemedText
                  variant="smallMedium"
                  color={occupation ? theme.textPrimary : theme.textMuted}
                  numberOfLines={1}
                >
                  {occupation || '选择...'}
                </ThemedText>
                <Feather name="chevron-down" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Family Background Section */}
          <View style={styles.familyBackgroundSection}>
            {/* 成员人数下拉 */}
            <ThemedText variant="caption" color={theme.textMuted} style={styles.inputLabel}>
              家庭成员人数
            </ThemedText>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowMemberCountModal(true)}
            >
              <ThemedText variant="body" color={theme.textPrimary}>
                {memberCount}人
              </ThemedText>
              <Feather name="chevron-down" size={20} color={theme.textMuted} />
            </TouchableOpacity>

            {/* 与我的关系 - 多选 */}
            <View style={styles.relationLabelRow}>
              <ThemedText variant="caption" color={theme.textMuted}>
                与我的关系
              </ThemedText>
              <View style={styles.relationCountBadge}>
                <ThemedText variant="caption" color="#C8102E">
                  已选{selectedRelations.length}/{maxRelations}个
                </ThemedText>
              </View>
            </View>
            
            {/* 已选关系标签列表 */}
            {selectedRelations.length > 0 && (
              <View style={styles.selectedRelationsContainer}>
                {selectedRelations.map((relation, index) => (
                  <View key={index} style={styles.selectedRelationTag}>
                    <ThemedText variant="small" color={theme.textPrimary}>
                      {relation}
                    </ThemedText>
                    <TouchableOpacity 
                      onPress={() => handleRemoveRelation(relation)}
                      style={styles.removeRelationBtn}
                    >
                      <Feather name="x" size={14} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            {/* 添加关系按钮 */}
            {remainingSlots > 0 && (
              <TouchableOpacity
                style={styles.addRelationButton}
                onPress={() => setShowRelationModal(true)}
              >
                <Feather name="plus" size={16} color="#C8102E" />
                <ThemedText variant="small" color="#C8102E" style={{ marginLeft: 4 }}>
                  {selectedRelations.length === 0 
                    ? `添加关系（还可选${remainingSlots}个）` 
                    : `继续添加（还可选${remainingSlots}个）`
                  }
                </ThemedText>
              </TouchableOpacity>
            )}
            
            {/* 已选满提示 */}
            {remainingSlots === 0 && selectedRelations.length > 0 && (
              <View style={styles.relationFullHint}>
                <Feather name="check-circle" size={14} color="#22C55E" />
                <ThemedText variant="caption" color="#22C55E" style={{ marginLeft: 4 }}>
                  已选满{maxRelations}个关系
                </ThemedText>
              </View>
            )}

            {/* 家庭成员简述 */}
            <ThemedText variant="caption" color={theme.textMuted} style={[styles.inputLabel, { marginTop: Spacing.md }]}>
              家庭成员简述
            </ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="简要描述家庭成员信息（如：父亲是医生，母亲是教师等）"
              placeholderTextColor={theme.textMuted}
              value={familyMembersBrief}
              onChangeText={setFamilyMembersBrief}
              multiline
              numberOfLines={2}
            />

            {/* 家庭背景输入 */}
            <ThemedText variant="caption" color={theme.textMuted} style={[styles.inputLabel, { marginTop: Spacing.md }]}>
              家庭背景
            </ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="描述家庭的经济状况、社会地位等"
              placeholderTextColor={theme.textMuted}
              value={familyBackground}
              onChangeText={setFamilyBackground}
              multiline
              numberOfLines={3}
            />

            {/* 社会经历输入 */}
            <ThemedText variant="caption" color={theme.textMuted} style={[styles.inputLabel, { marginTop: Spacing.md }]}>
              社会经历
            </ThemedText>
            <TextInput
              style={styles.textInput}
              placeholder="描述重要的成长经历、教育背景等"
              placeholderTextColor={theme.textMuted}
              value={socialExperience}
              onChangeText={setSocialExperience}
              multiline
              numberOfLines={3}
            />
          </View>
        </ThemedView>

        {/* Sliders Section */}
        <ThemedView level="root" style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.labelIcon}>
              <Feather name="sliders" size={16} color={theme.textPrimary} />
            </View>
            <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitle}>
              性格与背景
            </ThemedText>
          </View>

          {/* Personality Sliders */}
          <View style={styles.sliderSection}>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.sliderSectionTitle}>
              性格维度
            </ThemedText>
            {sliders.slice(0, 4).map(renderSlider)}
          </View>

          {/* Ability Sliders */}
          <View style={styles.sliderSection}>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.sliderSectionTitle}>
              能力维度
            </ThemedText>
            {sliders.slice(4, 8).map(renderSlider)}
          </View>

          {/* Background Sliders */}
          <View style={styles.sliderSection}>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.sliderSectionTitle}>
              背景维度
            </ThemedText>
            {sliders.slice(8).map(renderSlider)}
          </View>
        </ThemedView>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, (!name.trim() || isGenerating) && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={!name.trim() || isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color={theme.buttonPrimaryText} />
          ) : (
            <>
              <Feather name="user-plus" size={20} color={theme.buttonPrimaryText} />
              <ThemedText variant="smallMedium" color={theme.buttonPrimaryText} style={styles.buttonText}>
                生成角色
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Occupation Selection Modal */}
      <Modal
        visible={showOccupationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOccupationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                选择职业
              </ThemedText>
              <TouchableOpacity onPress={() => setShowOccupationModal(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Category Tabs */}
            <View style={{ maxHeight: 50 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
                <TouchableOpacity
                  style={[styles.categoryTab, !selectedCategory && styles.categoryTabActive]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <ThemedText
                    variant="small"
                    color={!selectedCategory ? '#C8102E' : theme.textMuted}
                  >
                    全部
                  </ThemedText>
                </TouchableOpacity>
                {OCCUPATION_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.name}
                    style={[styles.categoryTab, selectedCategory === cat.name && styles.categoryTabActive]}
                    onPress={() => setSelectedCategory(cat.name)}
                  >
                    <ThemedText
                      variant="small"
                      color={selectedCategory === cat.name ? '#C8102E' : theme.textMuted}
                    >
                      {cat.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Occupation List */}
            <FlatList
              data={
                selectedCategory
                  ? OCCUPATION_CATEGORIES.find(c => c.name === selectedCategory)?.occupations || []
                  : [OCCUPATION_CUSTOM_OPTION, ...OCCUPATION_CATEGORIES.flatMap(c => c.occupations)]
              }
              keyExtractor={(item, index) => `${item}-${index}`}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.occupationItem,
                    occupation === item && styles.occupationItemSelected,
                    item === OCCUPATION_CUSTOM_OPTION && styles.occupationCustomItem,
                  ]}
                  onPress={() => handleSelectOccupation(item)}
                >
                  <ThemedText
                    variant="small"
                    color={occupation === item ? '#C8102E' : theme.textPrimary}
                    numberOfLines={1}
                  >
                    {item}
                  </ThemedText>
                </TouchableOpacity>
              )}
              style={styles.occupationList}
              contentContainerStyle={styles.occupationListContent}
            />
          </View>
        </View>
      </Modal>

      {/* Custom Occupation Input Modal */}
      <Modal
        visible={showCustomOccupationInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomOccupationInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customInputModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                手动输入职业
              </ThemedText>
              <TouchableOpacity onPress={() => setShowCustomOccupationInput(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.customInputField}
              placeholder="请输入职业（如：异世界勇者、亡灵法师等）"
              placeholderTextColor={theme.textMuted}
              value={customOccupation}
              onChangeText={setCustomOccupation}
              autoFocus
            />
            <TouchableOpacity
              style={styles.customInputConfirmButton}
              onPress={handleConfirmCustomOccupation}
            >
              <ThemedText variant="smallMedium" color="#FFFFFF">确认</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Education Selection Modal */}
      <Modal
        visible={showEducationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEducationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                选择学历
              </ThemedText>
              <TouchableOpacity onPress={() => setShowEducationModal(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {/* 学历分类列表 */}
            <FlatList
              data={Object.entries(getEducationByCategory())}
              keyExtractor={([categoryKey]) => categoryKey}
              renderItem={({ item: [categoryKey, category] }) => (
                <View style={styles.educationCategorySection}>
                  <ThemedText variant="caption" color={theme.textMuted} style={styles.educationCategoryLabel}>
                    {category.name}
                  </ThemedText>
                  <View style={styles.educationOptionsGrid}>
                    {category.options.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.educationOptionItem,
                          education === option.name && styles.educationOptionItemSelected,
                        ]}
                        onPress={() => handleSelectEducation(option.name)}
                      >
                        <ThemedText
                          variant="small"
                          color={education === option.name ? '#C8102E' : theme.textPrimary}
                        >
                          {option.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              style={styles.educationList}
            />
          </View>
        </View>
      </Modal>

      {/* Custom Education Input Modal */}
      <Modal
        visible={showCustomEducationInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomEducationInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customInputModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                手动输入学历
              </ThemedText>
              <TouchableOpacity onPress={() => setShowCustomEducationInput(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.customInputField}
              placeholder="请输入学历（如：修仙学院、魔法学校等）"
              placeholderTextColor={theme.textMuted}
              value={customEducation}
              onChangeText={setCustomEducation}
              autoFocus
            />
            <TouchableOpacity
              style={styles.customInputConfirmButton}
              onPress={handleConfirmCustomEducation}
            >
              <ThemedText variant="smallMedium" color="#FFFFFF">确认</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.genderModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                选择性别
              </ThemedText>
              <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.genderOptionsContainer}>
              {GENDER_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderOptionItem,
                    gender === g && styles.genderOptionItemSelected,
                    g === GENDER_CUSTOM_OPTION && styles.genderOptionCustom,
                  ]}
                  onPress={() => handleSelectGender(g)}
                >
                  <ThemedText
                    variant="small"
                    color={gender === g ? '#C8102E' : theme.textPrimary}
                  >
                    {g}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Gender Input Modal */}
      <Modal
        visible={showCustomGenderInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomGenderInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customInputModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                手动输入性别
              </ThemedText>
              <TouchableOpacity onPress={() => setShowCustomGenderInput(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.customInputField}
              placeholder="请输入性别（如：无性别、双性等）"
              placeholderTextColor={theme.textMuted}
              value={customGender}
              onChangeText={setCustomGender}
              autoFocus
            />
            <TouchableOpacity
              style={styles.customInputConfirmButton}
              onPress={handleConfirmCustomGender}
            >
              <ThemedText variant="smallMedium" color="#FFFFFF">确认</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Member Count Selection Modal */}
      <Modal
        visible={showMemberCountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMemberCountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                选择家庭成员人数
              </ThemedText>
              <TouchableOpacity onPress={() => setShowMemberCountModal(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={MEMBER_COUNT_OPTIONS}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.memberCountItem,
                    memberCount === item.value && styles.memberCountItemActive,
                  ]}
                  onPress={() => {
                    // 如果新的人数小于已选关系数，截断已选关系
                    const newMemberCount = item.value;
                    const newMaxRelations = newMemberCount - 1;
                    if (selectedRelations.length > newMaxRelations) {
                      setSelectedRelations(selectedRelations.slice(0, newMaxRelations));
                    }
                    setMemberCount(newMemberCount);
                    setShowMemberCountModal(false);
                  }}
                >
                  <ThemedText
                    variant="body"
                    color={memberCount === item.value ? '#C8102E' : theme.textPrimary}
                  >
                    {item.label}
                  </ThemedText>
                </TouchableOpacity>
              )}
              style={styles.memberCountList}
            />
          </View>
        </View>
      </Modal>

      {/* Family Relation Selection Modal */}
      <Modal
        visible={showRelationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRelationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  选择关系
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  已选{selectedRelations.length}/{maxRelations}个，还可选{remainingSlots}个
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => {
                setShowRelationModal(false);
                setSelectedRelationCategory(null);
              }}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* 关系分类筛选 */}
            <View style={{ maxHeight: 50 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
                <TouchableOpacity
                  style={[styles.categoryTab, !selectedRelationCategory && styles.categoryTabActive]}
                  onPress={() => setSelectedRelationCategory(null)}
                >
                  <ThemedText
                    variant="small"
                    color={!selectedRelationCategory ? '#C8102E' : theme.textMuted}
                  >
                    全部
                  </ThemedText>
                </TouchableOpacity>
                {relationCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryTab, selectedRelationCategory === category && styles.categoryTabActive]}
                    onPress={() => setSelectedRelationCategory(category)}
                  >
                    <ThemedText
                      variant="small"
                      color={selectedRelationCategory === category ? '#C8102E' : theme.textMuted}
                    >
                      {category}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <FlatList
              data={filteredRelations}
              keyExtractor={(item, index) => `${item.category}-${item.relation}-${index}`}
              renderItem={({ item }) => {
                const isSelected = selectedRelations.includes(item.relation);
                const isDisabled = isSelected || remainingSlots <= 0;
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.relationItem,
                      isSelected && styles.relationItemActive,
                      isDisabled && !isSelected && styles.relationItemDisabled,
                    ]}
                    onPress={() => !isDisabled && handleAddRelation(item.relation)}
                    disabled={isDisabled && !isSelected}
                  >
                    <View style={styles.relationItemContent}>
                      <ThemedText
                        variant="body"
                        color={isSelected ? '#C8102E' : isDisabled ? theme.textMuted : theme.textPrimary}
                      >
                        {item.relation}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {item.category}
                      </ThemedText>
                    </View>
                    {isSelected && (
                      <Feather name="check" size={18} color="#C8102E" />
                    )}
                  </TouchableOpacity>
                );
              }}
              style={styles.relationList}
            />
          </View>
        </View>
      </Modal>

      {/* Family Member Setup Modal */}
      <Modal
        visible={showFamilyMemberSetupModal}
        transparent
        animationType="slide"
        onRequestClose={handleCancelFamilyMemberSetup}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.familyMemberModalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <ThemedText variant="h3" color={theme.textPrimary}>
                    设置家庭成员
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {currentRelationType} ({currentMemberIndex + 1}/{selectedRelations.length})
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={handleCancelFamilyMemberSetup}>
                  <Feather name="x" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.familyMemberModalBody}>
                {/* 姓名 */}
                <View style={styles.formSection}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.formLabel}>
                    姓名 *
                  </ThemedText>
                  <TextInput
                    style={styles.inputField}
                    placeholder="请输入姓名"
                    placeholderTextColor={theme.textMuted}
                    value={memberName}
                    onChangeText={setMemberName}
                  />
                </View>

                {/* 性别 */}
                <View style={styles.formSection}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.formLabel}>
                    性别 *
                  </ThemedText>
                  <View style={styles.genderOptions}>
                    {['男', '女'].map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.genderOption,
                          memberGender === g && styles.genderOptionSelected,
                        ]}
                        onPress={() => setMemberGender(g)}
                      >
                        <ThemedText
                          variant="small"
                          color={memberGender === g ? '#C8102E' : theme.textPrimary}
                        >
                          {g}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 年龄 */}
                <View style={styles.formSection}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.formLabel}>
                    年龄 *
                  </ThemedText>
                  <TextInput
                    style={styles.inputField}
                    placeholder="请输入年龄"
                    placeholderTextColor={theme.textMuted}
                    value={memberAge}
                    onChangeText={setMemberAge}
                    keyboardType="number-pad"
                  />
                </View>

                {/* 身高 */}
                <View style={styles.formSection}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.formLabel}>
                    身高 *
                  </ThemedText>
                  <TextInput
                    style={styles.inputField}
                    placeholder="请输入身高（cm）"
                    placeholderTextColor={theme.textMuted}
                    value={memberHeight}
                    onChangeText={setMemberHeight}
                    keyboardType="number-pad"
                  />
                </View>

                {/* 体重 */}
                <View style={styles.formSection}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.formLabel}>
                    体重 *
                  </ThemedText>
                  <TextInput
                    style={styles.inputField}
                    placeholder="请输入体重（kg）"
                    placeholderTextColor={theme.textMuted}
                    value={memberWeight}
                    onChangeText={setMemberWeight}
                    keyboardType="number-pad"
                  />
                </View>

                {/* 职业 */}
                <View style={styles.formSection}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.formLabel}>
                    职业 *
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={() => setShowMemberOccupationModal(true)}
                  >
                    <ThemedText
                      variant="small"
                      color={memberOccupation ? theme.textPrimary : theme.textMuted}
                    >
                      {memberOccupation || '请选择职业'}
                    </ThemedText>
                    <Feather name="chevron-right" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* 学历 */}
                <View style={styles.formSection}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.formLabel}>
                    学历 *
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={() => setShowMemberEducationModal(true)}
                  >
                    <ThemedText
                      variant="small"
                      color={memberEducation ? theme.textPrimary : theme.textMuted}
                    >
                      {memberEducation || '请选择学历'}
                    </ThemedText>
                    <Feather name="chevron-right" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.familyMemberModalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancelFamilyMemberSetup}
                >
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>取消</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSaveFamilyMember}
                >
                  <ThemedText variant="smallMedium" color="#FFFFFF">
                    {currentMemberIndex === selectedRelations.length - 1 ? '完成并生成' : '下一个'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Family Member Education Modal */}
      <Modal
        visible={showMemberEducationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMemberEducationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                选择学历
              </ThemedText>
              <TouchableOpacity onPress={() => setShowMemberEducationModal(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={Object.entries(getEducationByCategory())}
              keyExtractor={([categoryKey]) => categoryKey}
              renderItem={({ item: [categoryKey, category] }) => (
                <View style={styles.educationCategorySection}>
                  <ThemedText variant="caption" color={theme.textMuted} style={styles.educationCategoryLabel}>
                    {category.name}
                  </ThemedText>
                  <View style={styles.educationOptionsGrid}>
                    {category.options.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.educationOptionItem,
                          memberEducation === option.name && styles.educationOptionItemSelected,
                        ]}
                        onPress={() => {
                          if (option.name === '手动输入') {
                            setMemberEducation(option.name);
                            setShowMemberCustomEducationInput(true);
                          } else {
                            setMemberEducation(option.name);
                          }
                          setShowMemberEducationModal(false);
                        }}
                      >
                        <ThemedText
                          variant="small"
                          color={memberEducation === option.name ? '#C8102E' : theme.textPrimary}
                        >
                          {option.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              style={styles.educationList}
            />
          </View>
        </View>
      </Modal>

            {/* 家庭成员职业选择 Modal */}
      <Modal
        visible={showMemberOccupationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMemberOccupationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                选择职业
              </ThemedText>
              <TouchableOpacity onPress={() => setShowMemberOccupationModal(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Category Tabs */}
            <View style={{ maxHeight: 50 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
                <TouchableOpacity
                  style={[styles.categoryTab, !selectedCategory && styles.categoryTabActive]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <ThemedText
                    variant="small"
                    color={!selectedCategory ? '#C8102E' : theme.textMuted}
                  >
                    全部
                  </ThemedText>
                </TouchableOpacity>
                {OCCUPATION_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.name}
                    style={[styles.categoryTab, selectedCategory === cat.name && styles.categoryTabActive]}
                    onPress={() => setSelectedCategory(cat.name)}
                  >
                    <ThemedText
                      variant="small"
                      color={selectedCategory === cat.name ? '#C8102E' : theme.textMuted}
                    >
                      {cat.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Occupation List */}
            <FlatList
              data={
                selectedCategory
                  ? OCCUPATION_CATEGORIES.find(c => c.name === selectedCategory)?.occupations || []
                  : [OCCUPATION_CUSTOM_OPTION, ...OCCUPATION_CATEGORIES.flatMap(c => c.occupations)]
              }
              keyExtractor={(item, index) => `${item}-${index}`}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.occupationItem,
                    memberOccupation === item && styles.occupationItemSelected,
                    item === OCCUPATION_CUSTOM_OPTION && styles.occupationCustomItem,
                  ]}
                  onPress={() => handleSelectMemberOccupation(item)}
                >
                  <ThemedText
                    variant="small"
                    color={memberOccupation === item ? '#C8102E' : theme.textPrimary}
                    numberOfLines={1}
                  >
                    {item}
                  </ThemedText>
                </TouchableOpacity>
              )}
              style={styles.occupationList}
              contentContainerStyle={styles.occupationListContent}
            />
          </View>
        </View>
      </Modal>

            {/* 家庭成员自定义职业输入 Modal */}
      <Modal
        visible={showMemberCustomOccupationInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMemberCustomOccupationInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customInputModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                手动输入职业
              </ThemedText>
              <TouchableOpacity onPress={() => setShowMemberCustomOccupationInput(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.customInputField}
              placeholder="请输入职业"
              placeholderTextColor={theme.textMuted}
              value={memberCustomOccupation}
              onChangeText={setMemberCustomOccupation}
              autoFocus
            />
            <TouchableOpacity
              style={styles.customInputConfirmButton}
              onPress={handleConfirmMemberCustomOccupation}
            >
              <ThemedText variant="smallMedium" color="#FFFFFF">确认</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

            {/* 家庭成员自定义职业输入 Modal */}
      <Modal
        visible={showMemberCustomOccupationInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMemberCustomOccupationInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customInputModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                手动输入职业
              </ThemedText>
              <TouchableOpacity onPress={() => setShowMemberCustomOccupationInput(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.customInputField}
              placeholder="请输入职业"
              placeholderTextColor={theme.textMuted}
              value={memberCustomOccupation}
              onChangeText={setMemberCustomOccupation}
              autoFocus
            />
            <TouchableOpacity
              style={styles.customInputConfirmButton}
              onPress={handleConfirmMemberCustomOccupation}
            >
              <ThemedText variant="smallMedium" color="#FFFFFF">确认</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 家庭成员自定义学历输入 Modal */}
      <Modal
        visible={showMemberCustomEducationInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMemberCustomEducationInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customInputModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                手动输入学历
              </ThemedText>
              <TouchableOpacity onPress={() => setShowMemberCustomEducationInput(false)}>
                <Feather name="x" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.customInputField}
              placeholder="请输入学历"
              placeholderTextColor={theme.textMuted}
              value={memberEducationCustom}
              onChangeText={setMemberEducationCustom}
              autoFocus
            />
            <TouchableOpacity
              style={styles.customInputConfirmButton}
              onPress={() => {
                setMemberEducation(memberEducationCustom.trim() || '未设定');
                setShowMemberCustomEducationInput(false);
              }}
            >
              <ThemedText variant="smallMedium" color="#FFFFFF">确认</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <FloatingBall />
    </Screen>
  );
}
