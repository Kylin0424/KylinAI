import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
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
const GENDER_OPTIONS = ['男', '女', '扶她', '人妖', '手动输入'];
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
  const [occupation, setOccupation] = useState('');
  const [customOccupation, setCustomOccupation] = useState('');
  const [education, setEducation] = useState('');
  const [customEducation, setCustomEducation] = useState('');

  // 家庭背景
  const [memberCount, setMemberCount] = useState<number>(3);
  const [selectedRelations, setSelectedRelations] = useState<string[]>([]); // 已选的关系列表
  const [familyBackground, setFamilyBackground] = useState('');
  const [socialExperience, setSocialExperience] = useState('');
  
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

    setIsGenerating(true);

    // 将滑块值和基本信息转换为参数
    const sliderValues: Record<string, number> = {};
    sliders.forEach(s => {
      sliderValues[s.key] = s.value;
    });

    // 处理性别
    const finalGender = gender === GENDER_CUSTOM_OPTION ? customGender.trim() || '未设定' : gender.trim() || '未设定';

    // 处理体重
    const finalWeight = weightInput.trim() || '未设定';

    // 处理团体信息，加入社会经历
    let finalSocialExperience = socialExperience.trim();
    if (groupInput.trim()) {
      if (finalSocialExperience) {
        finalSocialExperience = `所属团体：${groupInput.trim()}。${finalSocialExperience}`;
      } else {
        finalSocialExperience = `所属团体：${groupInput.trim()}`;
      }
    }
    if (!finalSocialExperience) {
      finalSocialExperience = '未设定';
    }

    router.push('/character-result', {
      sliders: JSON.stringify(sliderValues),
      name: name.trim(),
      gender: finalGender,
      age: ageInput.trim() || '25',
      height: heightInput.trim() || '170cm',
      weight: finalWeight,
      group: groupInput.trim() || '未设定',
      occupation: occupation === OCCUPATION_CUSTOM_OPTION ? customOccupation.trim() || '未设定' : occupation.trim() || '未设定',
      education: education === '手动输入' ? customEducation.trim() || '未设定' : education.trim() || '未设定',
      memberCount: memberCount.toString(),
      familyRelation: selectedRelations.join('、') || '未设定',
      familyBackground: familyBackground.trim() || '未设定',
      socialExperience: finalSocialExperience,
    });

    setIsGenerating(false);
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
    setShowCustomOccupationInput(false);
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
            {/* 姓名 - 占一半宽度 */}
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
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
                value={ageInput}
                onChangeText={setAgeInput}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* 第二行：身高、体重、团体 */}
          <View style={styles.inputRow}>
            {/* 身高 - 预留4个汉字位置 */}
            <View style={[styles.inputGroup, styles.heightInputGroup]}>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.inputLabel}>
                身高
              </ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="170cm"
                placeholderTextColor={theme.textMuted}
                value={heightInput}
                onChangeText={setHeightInput}
              />
            </View>
            {/* 体重 - 预留4个汉字位置 */}
            <View style={[styles.inputGroup, styles.weightInputGroup]}>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.inputLabel}>
                体重
              </ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="60kg"
                placeholderTextColor={theme.textMuted}
                value={weightInput}
                onChangeText={setWeightInput}
              />
            </View>
            {/* 团体 - 占剩余空间 */}
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <ThemedText variant="caption" color={theme.textMuted} style={styles.inputLabel}>
                团体
              </ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="军团/教派/公会/公司等"
                placeholderTextColor={theme.textMuted}
                value={groupInput}
                onChangeText={setGroupInput}
              />
            </View>
          </View>

          {/* Education and Occupation Row */}
          <View style={styles.inputRow}>
            {/* Education Selection - Left side, larger */}
            <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
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
            {/* Occupation Selection - Right side, smaller */}
            <View style={[styles.inputGroup, { flex: 0.8, marginLeft: 8 }]}>
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

      <FloatingBall />
    </Screen>
  );
}
