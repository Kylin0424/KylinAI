// 学历选项数据

export interface EducationOption {
  id: string;
  name: string;
  category: 'custom' | 'earth';
  subCategory?: string;
}

// 学历等级（用于判断知识水平）
export type EducationLevel = 
  | 'illiterate'      // 文盲
  | 'primary'         // 小学
  | 'junior'          // 初中
  | 'high'            // 高中/职高/中专
  | 'college'         // 专科
  | 'undergraduate'   // 大本
  | 'master'          // 硕士
  | 'doctor'          // 博士
  | 'custom';         // 自定义

// 学历到等级的映射
export const EDUCATION_LEVEL_MAP: Record<string, EducationLevel> = {
  '小学': 'primary',
  '初中': 'junior',
  '高中': 'high',
  '职高': 'high',
  '中专': 'high',
  '高职': 'college',
  '大专': 'college',
  '高技': 'college',
  '大本': 'undergraduate',
  '硕士研究生': 'master',
  '博士研究生': 'doctor',
};

// 学历对应的知识水平和行为约束
export interface EducationConstraints {
  level: EducationLevel;
  knowledgeLevel: string;      // 知识水平描述
  vocabularyLevel: string;      // 词汇水平
  analysisAbility: string;      // 分析能力
  expressionStyle: string;      // 表达风格
  behaviorConstraints: string;  // 行为约束
  forbiddenBehaviors: string[]; // 禁止行为
}

// 学历约束配置
export const EDUCATION_CONSTRAINTS: Record<EducationLevel, EducationConstraints> = {
  illiterate: {
    level: 'illiterate',
    knowledgeLevel: '几乎不识字，没有系统接受过教育',
    vocabularyLevel: '词汇量极为有限，只能说简单日常用语',
    analysisAbility: '几乎没有分析能力，遇到问题主要靠本能和经验',
    expressionStyle: '说话直白、简短，不会用复杂句式，有时会说粗话',
    behaviorConstraints: '行为简单直接，不会有复杂的思考和计划，遇事容易冲动',
    forbiddenBehaviors: [
      '使用书面语言或专业术语',
      '进行复杂推理或分析',
      '引用书籍、理论或数据',
      '表现出超越常识的见识',
    ],
  },
  primary: {
    level: 'primary',
    knowledgeLevel: '具备基本的读写能力，了解基本常识',
    vocabularyLevel: '能使用简单的日常词汇，偶尔会用错词',
    analysisAbility: '只能进行简单的因果推理，不会深入思考',
    expressionStyle: '说话简单直白，喜欢用口语，不会引经据典',
    behaviorConstraints: '做事凭直觉，容易轻信他人，对复杂情况缺乏判断力',
    forbiddenBehaviors: [
      '使用复杂的专业术语',
      '进行深入的理论分析',
      '讨论学术话题',
      '表现出超出小学水平的知识储备',
    ],
  },
  junior: {
    level: 'junior',
    knowledgeLevel: '掌握初中程度的各科知识，有基本的科学常识',
    vocabularyLevel: '词汇量中等，能表达较完整的想法，但表达不够精准',
    analysisAbility: '能进行基本的逻辑推理，对事物有初步的分析能力',
    expressionStyle: '说话较为流利，但不会用太复杂的词汇，有时表达不够准确',
    behaviorConstraints: '能理解一般的事物原理，但对复杂问题缺乏深入见解，容易片面判断',
    forbiddenBehaviors: [
      '使用大学级别的专业术语',
      '进行复杂的理论分析',
      '引用学术论文或研究数据',
      '表现出超越初中水平的知识深度',
    ],
  },
  high: {
    level: 'high',
    knowledgeLevel: '具备高中程度的综合知识，有一定的文化素养',
    vocabularyLevel: '词汇量较好，能用较丰富的词汇表达想法',
    analysisAbility: '有较强的逻辑思维能力，能对问题进行较深入的分析',
    expressionStyle: '表达清晰有条理，能使用一些书面语，但不会过于学术化',
    behaviorConstraints: '能独立思考和判断，对事物有自己的见解，但缺乏专业深度',
    forbiddenBehaviors: [
      '使用专业领域的深层术语',
      '进行研究生级别的学术分析',
      '表现出某一专业领域的深入研究',
    ],
  },
  college: {
    level: 'college',
    knowledgeLevel: '掌握专科领域的专业技能，有一定的实践能力',
    vocabularyLevel: '在自己熟悉的领域有专业词汇，其他领域词汇一般',
    analysisAbility: '在专业领域能进行较好的分析，其他领域能力有限',
    expressionStyle: '表达较为专业，在专业领域说话有底气，其他方面较普通',
    behaviorConstraints: '有自己的专业特长，但知识面不够宽，对非专业领域了解有限',
    forbiddenBehaviors: [
      '在非专业领域表现出专家水平',
      '进行跨学科的深度分析',
      '使用超出专业范围的高深术语',
    ],
  },
  undergraduate: {
    level: 'undergraduate',
    knowledgeLevel: '具备大学本科程度的综合知识，有较好的理论基础和知识面',
    vocabularyLevel: '词汇丰富，能准确表达复杂想法，会用书面语和专业词汇',
    analysisAbility: '有较强的分析和推理能力，能从多角度思考问题',
    expressionStyle: '表达清晰、有条理，能使用较正式的语言，有一定的文化气息',
    behaviorConstraints: '能理性分析问题，有独立的判断能力，知识面较广但不精深',
    forbiddenBehaviors: [
      '表现出研究生级别的学术研究能力',
      '在专业领域做出开创性的理论贡献',
      '使用过于前沿的学术术语',
    ],
  },
  master: {
    level: 'master',
    knowledgeLevel: '具备硕士研究生程度的专业知识，有研究能力和学术素养',
    vocabularyLevel: '词汇精准，能熟练使用专业术语，表达严谨',
    analysisAbility: '有很强的分析能力，能深入研究问题，进行批判性思考',
    expressionStyle: '表达专业、严谨，有逻辑性，善于论证和阐述观点',
    behaviorConstraints: '做事有计划有条理，善于研究和分析，有学术思维',
    forbiddenBehaviors: [
      '表现出博士级别的开创性研究能力',
      '做出颠覆性的学术发现',
    ],
  },
  doctor: {
    level: 'doctor',
    knowledgeLevel: '具备博士研究生程度的专业知识，是某一领域的专家',
    vocabularyLevel: '专业词汇极为丰富精准，表达深刻而准确',
    analysisAbility: '具有极强的分析能力，能进行开创性研究，有独到见解',
    expressionStyle: '表达专业、深刻、有洞见，能深入浅出地阐述复杂问题',
    behaviorConstraints: '有深厚的专业素养，能解决复杂问题，是领域内的权威',
    forbiddenBehaviors: [],
  },
  custom: {
    level: 'custom',
    knowledgeLevel: '知识水平由其背景设定决定',
    vocabularyLevel: '表达风格与其背景相符',
    analysisAbility: '分析能力与其经历和能力相匹配',
    expressionStyle: '说话风格符合其身份和背景设定',
    behaviorConstraints: '行为应符合其完整的人物设定',
    forbiddenBehaviors: [],
  },
};

// 根据学历名称获取学历等级
export const getEducationLevel = (educationName: string): EducationLevel => {
  if (!educationName) return 'junior'; // 默认初中水平
  if (educationName === '手动输入') return 'custom';
  
  // 直接匹配
  if (EDUCATION_LEVEL_MAP[educationName]) {
    return EDUCATION_LEVEL_MAP[educationName];
  }
  
  // 模糊匹配
  const lowerName = educationName.toLowerCase();
  if (lowerName.includes('博士')) return 'doctor';
  if (lowerName.includes('硕士') || lowerName.includes('研究生')) return 'master';
  if (lowerName.includes('大本') || lowerName.includes('本科') || lowerName.includes('大学')) return 'undergraduate';
  if (lowerName.includes('高职') || lowerName.includes('大专') || lowerName.includes('专科')) return 'college';
  if (lowerName.includes('高中') || lowerName.includes('职高') || lowerName.includes('中专')) return 'high';
  if (lowerName.includes('初中')) return 'junior';
  if (lowerName.includes('小学')) return 'primary';
  
  return 'custom';
};

// 根据学历获取约束描述（用于AI prompt）
export const getEducationConstraintsPrompt = (educationName: string): string => {
  const level = getEducationLevel(educationName);
  const constraints = EDUCATION_CONSTRAINTS[level];
  
  if (level === 'custom') {
    return `学历：${educationName}（自定义学历，知识水平需根据角色背景设定合理推断）`;
  }
  
  let prompt = `学历：${educationName}
知识水平：${constraints.knowledgeLevel}
词汇水平：${constraints.vocabularyLevel}
分析能力：${constraints.analysisAbility}
表达风格：${constraints.expressionStyle}
行为特点：${constraints.behaviorConstraints}`;

  if (constraints.forbiddenBehaviors.length > 0) {
    prompt += `\n禁止行为：${constraints.forbiddenBehaviors.join('；')}`;
  }
  
  return prompt;
};

// 学历分类
export const EDUCATION_CATEGORIES = {
  custom: {
    name: '自定义',
    description: '适用于异世界等特殊设定',
    order: 0,
  },
  primary: {
    name: '小学',
    description: '小学教育',
    order: 1,
  },
  junior: {
    name: '初中',
    description: '初中教育',
    order: 2,
  },
  high: {
    name: '高中',
    description: '高中教育',
    order: 3,
  },
  college: {
    name: '专科',
    description: '专科教育',
    order: 4,
  },
  undergraduate: {
    name: '大本',
    description: '大学本科教育',
    order: 5,
  },
  master: {
    name: '硕士研究生',
    description: '硕士研究生教育',
    order: 6,
  },
  doctor: {
    name: '博士研究生',
    description: '博士研究生教育',
    order: 7,
  },
};

// 所有学历选项
export const EDUCATION_OPTIONS: EducationOption[] = [
  // 自定义（手动输入）- 最上面
  {
    id: 'custom',
    name: '手动输入',
    category: 'custom',
    subCategory: 'custom',
  },

  // 小学
  {
    id: 'primary',
    name: '小学',
    category: 'earth',
    subCategory: 'primary',
  },

  // 初中
  {
    id: 'junior_middle',
    name: '初中',
    category: 'earth',
    subCategory: 'junior',
  },

  // 高中
  {
    id: 'high_school',
    name: '高中',
    category: 'earth',
    subCategory: 'high',
  },
  {
    id: 'vocational_high',
    name: '职高',
    category: 'earth',
    subCategory: 'high',
  },
  {
    id: 'technical_secondary',
    name: '中专',
    category: 'earth',
    subCategory: 'high',
  },

  // 专科
  {
    id: 'higher_vocational',
    name: '高职',
    category: 'earth',
    subCategory: 'college',
  },
  {
    id: 'junior_college',
    name: '大专',
    category: 'earth',
    subCategory: 'college',
  },
  {
    id: 'high_tech',
    name: '高技',
    category: 'earth',
    subCategory: 'college',
  },

  // 大本（大学/本科）
  {
    id: 'undergraduate',
    name: '大本',
    category: 'earth',
    subCategory: 'undergraduate',
  },

  // 硕士研究生
  {
    id: 'master',
    name: '硕士研究生',
    category: 'earth',
    subCategory: 'master',
  },

  // 博士研究生
  {
    id: 'doctor',
    name: '博士研究生',
    category: 'earth',
    subCategory: 'doctor',
  },
];

// 按分类获取学历列表
export const getEducationByCategory = (): Record<string, { name: string; options: EducationOption[] }> => {
  const result: Record<string, { name: string; options: EducationOption[] }> = {};

  // 添加自定义选项（最前面）
  result['custom'] = {
    name: '自定义',
    options: EDUCATION_OPTIONS.filter(e => e.category === 'custom'),
  };

  // 地球学历按层级组织
  const earthOptions = EDUCATION_OPTIONS.filter(e => e.category === 'earth');

  // 按子分类分组
  const subCategoryMap: Record<string, EducationOption[]> = {};
  earthOptions.forEach(option => {
    const subCat = option.subCategory || 'other';
    if (!subCategoryMap[subCat]) {
      subCategoryMap[subCat] = [];
    }
    subCategoryMap[subCat].push(option);
  });

  // 按顺序添加
  const subCategoryOrder = ['primary', 'junior', 'high', 'college', 'undergraduate', 'master', 'doctor'];
  subCategoryOrder.forEach(subCat => {
    if (subCategoryMap[subCat] && subCategoryMap[subCat].length > 0) {
      result[subCat] = {
        name: EDUCATION_CATEGORIES[subCat as keyof typeof EDUCATION_CATEGORIES]?.name || subCat,
        options: subCategoryMap[subCat],
      };
    }
  });

  return result;
};

// 获取所有学历选项（扁平化）
export const getAllEducationFlat = (): { id: string; name: string; category: string }[] => {
  return EDUCATION_OPTIONS.map(e => ({
    id: e.id,
    name: e.name,
    category: e.category === 'custom' ? '自定义' : '地球学历',
  }));
};
