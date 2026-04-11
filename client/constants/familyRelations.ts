// 亲属关系数据

export interface FamilyRelation {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'any';
  generation: number; // 辈分差，0表示同辈，1表示上一辈，-1表示下一辈
  category: 'direct' | 'collateral' | 'inlaw' | 'colleague' | 'social' | 'hostile' | 'hatred'; // 直系、旁系、姻亲、同事、社交、敌对、仇恨
  subCategory?: string; // 子分类名称
  reverseRelation?: Record<string, string>; // 反向关系映射
}

// 关系分类
export const RELATION_CATEGORIES = {
  direct: {
    name: '直系亲属',
    description: '有直接血缘关系的亲属',
    order: 1,
  },
  collateral: {
    name: '旁系亲属',
    description: '有间接血缘关系的亲属',
    order: 2,
  },
  inlaw: {
    name: '姻亲关系',
    description: '因婚姻关系而形成的亲属',
    order: 3,
  },
  colleague: {
    name: '同事关系',
    description: '工作场所中的关系',
    order: 4,
  },
  social: {
    name: '生活关系',
    description: '日常生活中的社交关系',
    order: 5,
  },
  hostile: {
    name: '敌对关系',
    description: '对立或冲突的关系',
    order: 6,
  },
  hatred: {
    name: '仇恨关系',
    description: '深层次的仇恨关系',
    order: 7,
  },
};

// 关系子分类
export const RELATION_SUB_CATEGORIES = {
  // 直系亲属子分类
  ancestors: { name: '长辈', order: 1 },
  descendants: { name: '晚辈', order: 2 },
  
  // 旁系亲属子分类
  siblings: { name: '兄弟姐妹', order: 1 },
  cousins: { name: '堂表兄弟姐妹', order: 2 },
  unclesAunts: { name: '叔伯姑舅姨', order: 3 },
  nephewsNieces: { name: '侄甥辈', order: 4 },
  
  // 姻亲子分类
  spouseSide: { name: '配偶方', order: 1 },
  siblingsSpouse: { name: '兄弟姐妹配偶', order: 2 },
  spouseSiblings: { name: '配偶兄弟姐妹', order: 3 },
  inLawSiblings: { name: '姑嫂妯娌连襟', order: 4 },

  // 同事关系子分类
  superior: { name: '上级', order: 1 },
  subordinate: { name: '下级', order: 2 },
  peer: { name: '平级', order: 3 },
  partner: { name: '合作伙伴', order: 4 },

  // 生活关系子分类
  friend: { name: '好友', order: 1 },
  bestFriend: { name: '知己', order: 2 },
  neighbor: { name: '邻里', order: 3 },

  // 敌对关系子分类
  antagonist: { name: '反派', order: 1 },
  bully: { name: '霸凌', order: 2 },
  rival: { name: '竞争对手', order: 3 },

  // 仇恨关系子分类
  enemy: { name: '仇人', order: 1 },
  nemesis: { name: '宿敌', order: 2 },
  bloodFeud: { name: '血仇', order: 3 },
};

// 所有亲属关系（完整版）
export const FAMILY_RELATIONS: FamilyRelation[] = [
  // ==================== 直系亲属 ====================
  // 直系长辈
  { 
    id: 'father', 
    name: '父亲', 
    gender: 'male', 
    generation: 1, 
    category: 'direct', 
    subCategory: 'ancestors',
    reverseRelation: { male: '儿子', female: '女儿' }
  },
  { 
    id: 'mother', 
    name: '母亲', 
    gender: 'female', 
    generation: 1, 
    category: 'direct', 
    subCategory: 'ancestors',
    reverseRelation: { male: '儿子', female: '女儿' }
  },
  { 
    id: 'grandfather', 
    name: '爷爷/祖父', 
    gender: 'male', 
    generation: 2, 
    category: 'direct', 
    subCategory: 'ancestors',
    reverseRelation: { male: '孙子', female: '孙女' }
  },
  { 
    id: 'grandmother', 
    name: '奶奶/祖母', 
    gender: 'female', 
    generation: 2, 
    category: 'direct', 
    subCategory: 'ancestors',
    reverseRelation: { male: '孙子', female: '孙女' }
  },
  { 
    id: 'maternal_grandfather', 
    name: '姥爷/外祖父', 
    gender: 'male', 
    generation: 2, 
    category: 'direct', 
    subCategory: 'ancestors',
    reverseRelation: { male: '外孙', female: '外孙女' }
  },
  { 
    id: 'maternal_grandmother', 
    name: '姥姥/外祖母', 
    gender: 'female', 
    generation: 2, 
    category: 'direct', 
    subCategory: 'ancestors',
    reverseRelation: { male: '外孙', female: '外孙女' }
  },
  
  // 直系晚辈
  { 
    id: 'son', 
    name: '儿子', 
    gender: 'male', 
    generation: -1, 
    category: 'direct', 
    subCategory: 'descendants',
    reverseRelation: { male: '父亲', female: '母亲' }
  },
  { 
    id: 'daughter', 
    name: '女儿', 
    gender: 'female', 
    generation: -1, 
    category: 'direct', 
    subCategory: 'descendants',
    reverseRelation: { male: '父亲', female: '母亲' }
  },
  { 
    id: 'grandson', 
    name: '孙子', 
    gender: 'male', 
    generation: -2, 
    category: 'direct', 
    subCategory: 'descendants',
    reverseRelation: { male: '爷爷', female: '奶奶' }
  },
  { 
    id: 'granddaughter', 
    name: '孙女', 
    gender: 'female', 
    generation: -2, 
    category: 'direct', 
    subCategory: 'descendants',
    reverseRelation: { male: '爷爷', female: '奶奶' }
  },
  { 
    id: 'maternal_grandson', 
    name: '外孙', 
    gender: 'male', 
    generation: -2, 
    category: 'direct', 
    subCategory: 'descendants',
    reverseRelation: { male: '姥爷', female: '姥姥' }
  },
  { 
    id: 'maternal_granddaughter', 
    name: '外孙女', 
    gender: 'female', 
    generation: -2, 
    category: 'direct', 
    subCategory: 'descendants',
    reverseRelation: { male: '姥爷', female: '姥姥' }
  },
  
  // ==================== 旁系亲属 ====================
  // 兄弟姐妹
  { 
    id: 'older_brother', 
    name: '哥哥', 
    gender: 'male', 
    generation: 0, 
    category: 'collateral', 
    subCategory: 'siblings',
    reverseRelation: { male: '弟弟', female: '妹妹' }
  },
  { 
    id: 'younger_brother', 
    name: '弟弟', 
    gender: 'male', 
    generation: 0, 
    category: 'collateral', 
    subCategory: 'siblings',
    reverseRelation: { male: '哥哥', female: '姐姐' }
  },
  { 
    id: 'older_sister', 
    name: '姐姐', 
    gender: 'female', 
    generation: 0, 
    category: 'collateral', 
    subCategory: 'siblings',
    reverseRelation: { male: '弟弟', female: '妹妹' }
  },
  { 
    id: 'younger_sister', 
    name: '妹妹', 
    gender: 'female', 
    generation: 0, 
    category: 'collateral', 
    subCategory: 'siblings',
    reverseRelation: { male: '哥哥', female: '姐姐' }
  },
  
  // 堂表兄弟姐妹
  { 
    id: 'older_cousin_paternal_male', 
    name: '堂哥', 
    gender: 'male', 
    generation: 0, 
    category: 'collateral', 
    subCategory: 'cousins',
    reverseRelation: { male: '堂弟', female: '堂妹' }
  },
  { 
    id: 'younger_cousin_paternal_male', 
    name: '堂弟', 
    gender: 'male', 
    generation: 0, 
    category: 'collateral', 
    subCategory: 'cousins',
    reverseRelation: { male: '堂哥', female: '堂姐' }
  },
  { 
    id: 'older_cousin_paternal_female', 
    name: '堂姐', 
    gender: 'female', 
    generation: 0, 
    category: 'collateral', 
    subCategory: 'cousins',
    reverseRelation: { male: '堂弟', female: '堂妹' }
  },
  { 
    id: 'younger_cousin_paternal_female', 
    name: '堂妹', 
    gender: 'female', 
    generation: 0, 
    category: 'collateral', 
    subCategory: 'cousins',
    reverseRelation: { male: '堂哥', female: '堂姐' }
  },
  { 
    id: 'older_cousin_maternal_male', 
    name: '表哥', 
    gender: 'male', 
    generation: 0, 
    category: 'collateral', 
    subCategory: 'cousins',
    reverseRelation: { male: '表弟', female: '表妹' }
  },
  { 
    id: 'younger_cousin_maternal_male', 
    name: '表弟', 
    gender: 'male', 
    generation: 0, 
    category: 'collateral', 
    subCategory: 'cousins',
    reverseRelation: { male: '表哥', female: '表姐' }
  },
  { 
    id: 'older_cousin_maternal_female', 
    name: '表姐', 
    gender: 'female', 
    generation: 0, 
    category: 'collateral', 
    subCategory: 'cousins',
    reverseRelation: { male: '表弟', female: '表妹' }
  },
  { 
    id: 'younger_cousin_maternal_female', 
    name: '表妹', 
    gender: 'female', 
    generation: 0, 
    category: 'collateral', 
    subCategory: 'cousins',
    reverseRelation: { male: '表哥', female: '表姐' }
  },
  
  // 叔伯姑舅姨
  { 
    id: 'uncle_paternal_older', 
    name: '伯父/伯伯', 
    gender: 'male', 
    generation: 1, 
    category: 'collateral', 
    subCategory: 'unclesAunts',
    reverseRelation: { male: '侄子', female: '侄女' }
  },
  { 
    id: 'uncle_paternal_younger', 
    name: '叔叔', 
    gender: 'male', 
    generation: 1, 
    category: 'collateral', 
    subCategory: 'unclesAunts',
    reverseRelation: { male: '侄子', female: '侄女' }
  },
  { 
    id: 'aunt_paternal', 
    name: '姑姑', 
    gender: 'female', 
    generation: 1, 
    category: 'collateral', 
    subCategory: 'unclesAunts',
    reverseRelation: { male: '侄子', female: '侄女' }
  },
  { 
    id: 'uncle_maternal', 
    name: '舅舅', 
    gender: 'male', 
    generation: 1, 
    category: 'collateral', 
    subCategory: 'unclesAunts',
    reverseRelation: { male: '外甥', female: '外甥女' }
  },
  { 
    id: 'aunt_maternal', 
    name: '姨妈', 
    gender: 'female', 
    generation: 1, 
    category: 'collateral', 
    subCategory: 'unclesAunts',
    reverseRelation: { male: '外甥', female: '外甥女' }
  },
  
  // 侄甥辈
  { 
    id: 'nephew_paternal', 
    name: '侄子', 
    gender: 'male', 
    generation: -1, 
    category: 'collateral', 
    subCategory: 'nephewsNieces',
    reverseRelation: { male: '伯伯/叔叔', female: '姑姑' }
  },
  { 
    id: 'niece_paternal', 
    name: '侄女', 
    gender: 'female', 
    generation: -1, 
    category: 'collateral', 
    subCategory: 'nephewsNieces',
    reverseRelation: { male: '伯伯/叔叔', female: '姑姑' }
  },
  { 
    id: 'nephew_maternal', 
    name: '外甥', 
    gender: 'male', 
    generation: -1, 
    category: 'collateral', 
    subCategory: 'nephewsNieces',
    reverseRelation: { male: '舅舅', female: '姨妈' }
  },
  { 
    id: 'niece_maternal', 
    name: '外甥女', 
    gender: 'female', 
    generation: -1, 
    category: 'collateral', 
    subCategory: 'nephewsNieces',
    reverseRelation: { male: '舅舅', female: '姨妈' }
  },
  
  // ==================== 姻亲关系 ====================
  // 配偶
  { 
    id: 'husband', 
    name: '丈夫', 
    gender: 'male', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'spouseSide',
    reverseRelation: { female: '妻子' }
  },
  { 
    id: 'wife', 
    name: '妻子', 
    gender: 'female', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'spouseSide',
    reverseRelation: { male: '丈夫' }
  },
  
  // 配偶父母
  { 
    id: 'father_in_law', 
    name: '公公/岳父', 
    gender: 'male', 
    generation: 1, 
    category: 'inlaw', 
    subCategory: 'spouseSide',
    reverseRelation: { male: '女婿', female: '儿媳' }
  },
  { 
    id: 'mother_in_law', 
    name: '婆婆/岳母', 
    gender: 'female', 
    generation: 1, 
    category: 'inlaw', 
    subCategory: 'spouseSide',
    reverseRelation: { male: '女婿', female: '儿媳' }
  },
  
  // 兄弟姐妹的配偶
  { 
    id: 'sister_in_law_wife', 
    name: '嫂子', 
    gender: 'female', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'siblingsSpouse',
    reverseRelation: { male: '小叔子/大伯子', female: '小姑子/大姑子' }
  },
  { 
    id: 'sister_in_law_husband', 
    name: '弟媳', 
    gender: 'female', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'siblingsSpouse',
    reverseRelation: { male: '大伯子/小叔子', female: '大姑子/小姑子' }
  },
  { 
    id: 'brother_in_law_wife', 
    name: '姐夫', 
    gender: 'male', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'siblingsSpouse',
    reverseRelation: { male: '内弟/内兄', female: '小姨子/大姨子' }
  },
  { 
    id: 'brother_in_law_husband', 
    name: '妹夫', 
    gender: 'male', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'siblingsSpouse',
    reverseRelation: { male: '内兄/内弟', female: '大姨子/小姨子' }
  },
  
  // 配偶的兄弟姐妹
  { 
    id: 'older_brother_in_law', 
    name: '大舅哥/内兄', 
    gender: 'male', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'spouseSiblings',
    reverseRelation: { male: '妹夫', female: '妹夫' }
  },
  { 
    id: 'younger_brother_in_law', 
    name: '小舅子/内弟', 
    gender: 'male', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'spouseSiblings',
    reverseRelation: { male: '姐夫', female: '姐夫' }
  },
  { 
    id: 'older_sister_in_law', 
    name: '大姨子', 
    gender: 'female', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'spouseSiblings',
    reverseRelation: { male: '妹夫', female: '妹夫' }
  },
  { 
    id: 'younger_sister_in_law', 
    name: '小姨子', 
    gender: 'female', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'spouseSiblings',
    reverseRelation: { male: '姐夫', female: '姐夫' }
  },
  { 
    id: 'older_brother_in_law_male', 
    name: '大伯子', 
    gender: 'male', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'spouseSiblings',
    reverseRelation: { male: '弟媳', female: '弟媳' }
  },
  { 
    id: 'younger_brother_in_law_male', 
    name: '小叔子', 
    gender: 'male', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'spouseSiblings',
    reverseRelation: { male: '嫂子', female: '嫂子' }
  },
  { 
    id: 'older_sister_in_law_female', 
    name: '大姑子', 
    gender: 'female', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'spouseSiblings',
    reverseRelation: { male: '弟媳', female: '弟媳' }
  },
  { 
    id: 'younger_sister_in_law_female', 
    name: '小姑子', 
    gender: 'female', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'spouseSiblings',
    reverseRelation: { male: '嫂子', female: '嫂子' }
  },
  
  // 姑嫂妯娌连襟
  { 
    id: 'sisters_in_law', 
    name: '妯娌', 
    gender: 'female', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'inLawSiblings',
    reverseRelation: { female: '妯娌' }
  },
  { 
    id: 'brothers_in_law', 
    name: '连襟', 
    gender: 'male', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'inLawSiblings',
    reverseRelation: { male: '连襟' }
  },
  { 
    id: 'sisters_in_law_female', 
    name: '姑嫂', 
    gender: 'female', 
    generation: 0, 
    category: 'inlaw', 
    subCategory: 'inLawSiblings',
    reverseRelation: { female: '姑嫂' }
  },
  
  // 子女配偶
  { 
    id: 'son_in_law', 
    name: '女婿', 
    gender: 'male', 
    generation: -1, 
    category: 'inlaw', 
    subCategory: 'spouseSide',
    reverseRelation: { male: '岳父', female: '岳母' }
  },
  { 
    id: 'daughter_in_law', 
    name: '儿媳', 
    gender: 'female', 
    generation: -1, 
    category: 'inlaw', 
    subCategory: 'spouseSide',
    reverseRelation: { male: '公公', female: '婆婆' }
  },
  
  // ==================== 同事关系 ====================
  // 上级
  { 
    id: 'boss', 
    name: '老板', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'superior',
    reverseRelation: { male: '员工', female: '员工' }
  },
  { 
    id: 'employer', 
    name: '雇主', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'superior',
    reverseRelation: { male: '雇员', female: '雇员' }
  },
  { 
    id: 'leader', 
    name: '领导', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'superior',
    reverseRelation: { male: '下属', female: '下属' }
  },
  { 
    id: 'manager', 
    name: '经理', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'superior',
    reverseRelation: { male: '下属', female: '下属' }
  },
  { 
    id: 'director', 
    name: '主管', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'superior',
    reverseRelation: { male: '下属', female: '下属' }
  },
  { 
    id: 'supervisor', 
    name: '上级', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'superior',
    reverseRelation: { male: '下级', female: '下级' }
  },
  
  // 下级
  { 
    id: 'employee', 
    name: '员工', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'subordinate',
    reverseRelation: { male: '老板', female: '老板' }
  },
  { 
    id: 'subordinate', 
    name: '下属', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'subordinate',
    reverseRelation: { male: '领导', female: '领导' }
  },
  { 
    id: 'junior', 
    name: '下级', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'subordinate',
    reverseRelation: { male: '上级', female: '上级' }
  },
  { 
    id: 'assistant', 
    name: '助手', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'subordinate',
    reverseRelation: { male: '主管', female: '主管' }
  },
  { 
    id: 'apprentice', 
    name: '学徒', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'subordinate',
    reverseRelation: { male: '师父', female: '师父' }
  },
  { 
    id: 'intern', 
    name: '实习生', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'subordinate',
    reverseRelation: { male: '导师', female: '导师' }
  },
  
  // 平级
  { 
    id: 'colleague', 
    name: '同事', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'peer',
    reverseRelation: { male: '同事', female: '同事' }
  },
  { 
    id: 'coworker', 
    name: '工友', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'peer',
    reverseRelation: { male: '工友', female: '工友' }
  },
  { 
    id: 'teammate', 
    name: '队友', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'peer',
    reverseRelation: { male: '队友', female: '队友' }
  },
  { 
    id: 'classmate', 
    name: '同学', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'peer',
    reverseRelation: { male: '同学', female: '同学' }
  },
  { 
    id: 'fellow_apprentice', 
    name: '师兄弟', 
    gender: 'male', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'peer',
    reverseRelation: { male: '师兄弟', female: '师姐妹' }
  },
  { 
    id: 'fellow_sister', 
    name: '师姐妹', 
    gender: 'female', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'peer',
    reverseRelation: { male: '师兄弟', female: '师姐妹' }
  },
  { 
    id: 'master', 
    name: '师父', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'superior',
    reverseRelation: { male: '徒弟', female: '徒弟' }
  },
  { 
    id: 'disciple', 
    name: '徒弟', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'subordinate',
    reverseRelation: { male: '师父', female: '师父' }
  },
  { 
    id: 'mentor', 
    name: '导师', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'superior',
    reverseRelation: { male: '学员', female: '学员' }
  },
  { 
    id: 'mentee', 
    name: '学员', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'subordinate',
    reverseRelation: { male: '导师', female: '导师' }
  },
  
  // 合作伙伴
  { 
    id: 'business_partner', 
    name: '合作伙伴', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'partner',
    reverseRelation: { male: '合作伙伴', female: '合作伙伴' }
  },
  { 
    id: 'collaborator', 
    name: '协作者', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'partner',
    reverseRelation: { male: '协作者', female: '协作者' }
  },
  { 
    id: 'client', 
    name: '客户', 
    gender: 'any', 
    generation: 0, 
    category: 'colleague', 
    subCategory: 'partner',
    reverseRelation: { male: '服务者', female: '服务者' }
  },
  
  // ==================== 生活关系 ====================
  // 好友
  { 
    id: 'friend', 
    name: '朋友', 
    gender: 'any', 
    generation: 0, 
    category: 'social', 
    subCategory: 'friend',
    reverseRelation: { male: '朋友', female: '朋友' }
  },
  { 
    id: 'good_friend', 
    name: '好友', 
    gender: 'any', 
    generation: 0, 
    category: 'social', 
    subCategory: 'friend',
    reverseRelation: { male: '好友', female: '好友' }
  },
  { 
    id: 'close_friend', 
    name: '密友', 
    gender: 'any', 
    generation: 0, 
    category: 'social', 
    subCategory: 'friend',
    reverseRelation: { male: '密友', female: '密友' }
  },
  { 
    id: 'childhood_friend', 
    name: '发小', 
    gender: 'any', 
    generation: 0, 
    category: 'social', 
    subCategory: 'friend',
    reverseRelation: { male: '发小', female: '发小' }
  },
  
  // 知己
  { 
    id: 'best_friend', 
    name: '死党', 
    gender: 'any', 
    generation: 0, 
    category: 'social', 
    subCategory: 'bestFriend',
    reverseRelation: { male: '死党', female: '死党' }
  },
  { 
    id: 'confidant', 
    name: '知己', 
    gender: 'any', 
    generation: 0, 
    category: 'social', 
    subCategory: 'bestFriend',
    reverseRelation: { male: '知己', female: '知己' }
  },
  { 
    id: 'soulmate', 
    name: '知音', 
    gender: 'any', 
    generation: 0, 
    category: 'social', 
    subCategory: 'bestFriend',
    reverseRelation: { male: '知音', female: '知音' }
  },
  { 
    id: 'bestie', 
    name: '闺蜜', 
    gender: 'female', 
    generation: 0, 
    category: 'social', 
    subCategory: 'bestFriend',
    reverseRelation: { male: '闺蜜', female: '闺蜜' }
  },
  { 
    id: 'buddy', 
    name: '兄弟', 
    gender: 'male', 
    generation: 0, 
    category: 'social', 
    subCategory: 'bestFriend',
    reverseRelation: { male: '兄弟', female: '姐妹' }
  },
  { 
    id: 'sister_friend', 
    name: '姐妹', 
    gender: 'female', 
    generation: 0, 
    category: 'social', 
    subCategory: 'bestFriend',
    reverseRelation: { male: '兄弟', female: '姐妹' }
  },
  { 
    id: 'iron_buddy', 
    name: '铁哥们', 
    gender: 'male', 
    generation: 0, 
    category: 'social', 
    subCategory: 'bestFriend',
    reverseRelation: { male: '铁哥们', female: '铁哥们' }
  },
  
  // 邻里
  { 
    id: 'neighbor', 
    name: '邻居', 
    gender: 'any', 
    generation: 0, 
    category: 'social', 
    subCategory: 'neighbor',
    reverseRelation: { male: '邻居', female: '邻居' }
  },
  { 
    id: 'landlord', 
    name: '房东', 
    gender: 'any', 
    generation: 0, 
    category: 'social', 
    subCategory: 'neighbor',
    reverseRelation: { male: '房客', female: '房客' }
  },
  { 
    id: 'tenant', 
    name: '房客', 
    gender: 'any', 
    generation: 0, 
    category: 'social', 
    subCategory: 'neighbor',
    reverseRelation: { male: '房东', female: '房东' }
  },
  { 
    id: 'roommate', 
    name: '室友', 
    gender: 'any', 
    generation: 0, 
    category: 'social', 
    subCategory: 'neighbor',
    reverseRelation: { male: '室友', female: '室友' }
  },
  { 
    id: 'fellow_villager', 
    name: '老乡', 
    gender: 'any', 
    generation: 0, 
    category: 'social', 
    subCategory: 'neighbor',
    reverseRelation: { male: '老乡', female: '老乡' }
  },
  
  // ==================== 敌对关系 ====================
  // 反派
  { 
    id: 'antagonist', 
    name: '反派', 
    gender: 'any', 
    generation: 0, 
    category: 'hostile', 
    subCategory: 'antagonist',
    reverseRelation: { male: '主角', female: '主角' }
  },
  { 
    id: 'villain', 
    name: '恶棍', 
    gender: 'any', 
    generation: 0, 
    category: 'hostile', 
    subCategory: 'antagonist',
    reverseRelation: { male: '正义者', female: '正义者' }
  },
  { 
    id: 'opponent', 
    name: '对手', 
    gender: 'any', 
    generation: 0, 
    category: 'hostile', 
    subCategory: 'antagonist',
    reverseRelation: { male: '对手', female: '对手' }
  },
  { 
    id: 'adversary', 
    name: '敌手', 
    gender: 'any', 
    generation: 0, 
    category: 'hostile', 
    subCategory: 'antagonist',
    reverseRelation: { male: '敌手', female: '敌手' }
  },
  
  // 霸凌
  { 
    id: 'bully', 
    name: '霸凌者', 
    gender: 'any', 
    generation: 0, 
    category: 'hostile', 
    subCategory: 'bully',
    reverseRelation: { male: '受害者', female: '受害者' }
  },
  { 
    id: 'victim', 
    name: '受害者', 
    gender: 'any', 
    generation: 0, 
    category: 'hostile', 
    subCategory: 'bully',
    reverseRelation: { male: '霸凌者', female: '霸凌者' }
  },
  { 
    id: 'harasser', 
    name: '骚扰者', 
    gender: 'any', 
    generation: 0, 
    category: 'hostile', 
    subCategory: 'bully',
    reverseRelation: { male: '被骚扰者', female: '被骚扰者' }
  },
  { 
    id: 'abuser', 
    name: '施暴者', 
    gender: 'any', 
    generation: 0, 
    category: 'hostile', 
    subCategory: 'bully',
    reverseRelation: { male: '受害者', female: '受害者' }
  },
  
  // 竞争对手
  { 
    id: 'competitor', 
    name: '竞争者', 
    gender: 'any', 
    generation: 0, 
    category: 'hostile', 
    subCategory: 'rival',
    reverseRelation: { male: '竞争者', female: '竞争者' }
  },
  { 
    id: 'rival', 
    name: '竞争对象', 
    gender: 'any', 
    generation: 0, 
    category: 'hostile', 
    subCategory: 'rival',
    reverseRelation: { male: '竞争对象', female: '竞争对象' }
  },
  { 
    id: 'love_rival', 
    name: '情敌', 
    gender: 'any', 
    generation: 0, 
    category: 'hostile', 
    subCategory: 'rival',
    reverseRelation: { male: '情敌', female: '情敌' }
  },
  { 
    id: 'political_rival', 
    name: '政敌', 
    gender: 'any', 
    generation: 0, 
    category: 'hostile', 
    subCategory: 'rival',
    reverseRelation: { male: '政敌', female: '政敌' }
  },
  
  // ==================== 仇恨关系 ====================
  // 仇人
  { 
    id: 'enemy', 
    name: '仇人', 
    gender: 'any', 
    generation: 0, 
    category: 'hatred', 
    subCategory: 'enemy',
    reverseRelation: { male: '仇人', female: '仇人' }
  },
  { 
    id: 'personal_enemy', 
    name: '私敌', 
    gender: 'any', 
    generation: 0, 
    category: 'hatred', 
    subCategory: 'enemy',
    reverseRelation: { male: '私敌', female: '私敌' }
  },
  { 
    id: 'foe', 
    name: '对头', 
    gender: 'any', 
    generation: 0, 
    category: 'hatred', 
    subCategory: 'enemy',
    reverseRelation: { male: '对头', female: '对头' }
  },
  { 
    id: 'oppressor', 
    name: '压迫者', 
    gender: 'any', 
    generation: 0, 
    category: 'hatred', 
    subCategory: 'enemy',
    reverseRelation: { male: '被压迫者', female: '被压迫者' }
  },
  
  // 宿敌
  { 
    id: 'nemesis', 
    name: '宿敌', 
    gender: 'any', 
    generation: 0, 
    category: 'hatred', 
    subCategory: 'nemesis',
    reverseRelation: { male: '宿敌', female: '宿敌' }
  },
  { 
    id: 'archenemy', 
    name: '死敌', 
    gender: 'any', 
    generation: 0, 
    category: 'hatred', 
    subCategory: 'nemesis',
    reverseRelation: { male: '死敌', female: '死敌' }
  },
  { 
    id: 'mortal_enemy', 
    name: '不共戴天之敌', 
    gender: 'any', 
    generation: 0, 
    category: 'hatred', 
    subCategory: 'nemesis',
    reverseRelation: { male: '不共戴天之敌', female: '不共戴天之敌' }
  },
  { 
    id: 'longtime_foe', 
    name: '老对头', 
    gender: 'any', 
    generation: 0, 
    category: 'hatred', 
    subCategory: 'nemesis',
    reverseRelation: { male: '老对头', female: '老对头' }
  },
  
  // 血仇
  { 
    id: 'blood_feud', 
    name: '血仇', 
    gender: 'any', 
    generation: 0, 
    category: 'hatred', 
    subCategory: 'bloodFeud',
    reverseRelation: { male: '血仇', female: '血仇' }
  },
  { 
    id: 'family_enemy', 
    name: '世仇', 
    gender: 'any', 
    generation: 0, 
    category: 'hatred', 
    subCategory: 'bloodFeud',
    reverseRelation: { male: '世仇', female: '世仇' }
  },
  { 
    id: 'killer', 
    name: '仇人（杀亲）', 
    gender: 'any', 
    generation: 0, 
    category: 'hatred', 
    subCategory: 'bloodFeud',
    reverseRelation: { male: '仇人', female: '仇人' }
  },
  { 
    id: 'traitor', 
    name: '叛徒', 
    gender: 'any', 
    generation: 0, 
    category: 'hatred', 
    subCategory: 'bloodFeud',
    reverseRelation: { male: '叛徒', female: '叛徒' }
  },
  { 
    id: 'betrayer', 
    name: '背叛者', 
    gender: 'any', 
    generation: 0, 
    category: 'hatred', 
    subCategory: 'bloodFeud',
    reverseRelation: { male: '背叛者', female: '背叛者' }
  },
];

// 按分类获取关系列表
export const getRelationsByCategory = (): Record<string, { name: string; relations: FamilyRelation[] }> => {
  const result: Record<string, { name: string; relations: FamilyRelation[] }> = {};
  
  FAMILY_RELATIONS.forEach(relation => {
    const categoryKey = relation.category;
    if (!result[categoryKey]) {
      result[categoryKey] = {
        name: RELATION_CATEGORIES[categoryKey].name,
        relations: [],
      };
    }
    result[categoryKey].relations.push(relation);
  });
  
  // 按 order 排序
  const sortedResult: Record<string, { name: string; relations: FamilyRelation[] }> = {};
  Object.keys(result)
    .sort((a, b) => RELATION_CATEGORIES[a as keyof typeof RELATION_CATEGORIES].order - RELATION_CATEGORIES[b as keyof typeof RELATION_CATEGORIES].order)
    .forEach(key => {
      sortedResult[key] = result[key];
    });
  
  return sortedResult;
};

// 按子分类获取关系列表
export const getRelationsBySubCategory = (): Record<string, { categoryName: string; subCategoryName: string; relations: FamilyRelation[] }> => {
  const result: Record<string, { categoryName: string; subCategoryName: string; relations: FamilyRelation[] }> = {};
  
  FAMILY_RELATIONS.forEach(relation => {
    const key = `${relation.category}_${relation.subCategory}`;
    if (!result[key]) {
      result[key] = {
        categoryName: RELATION_CATEGORIES[relation.category].name,
        subCategoryName: relation.subCategory ? RELATION_SUB_CATEGORIES[relation.subCategory as keyof typeof RELATION_SUB_CATEGORIES]?.name || '' : '',
        relations: [],
      };
    }
    result[key].relations.push(relation);
  });
  
  return result;
};

// 获取反向关系
export const getReverseRelation = (relationName: string, targetGender: 'male' | 'female'): string => {
  const relation = FAMILY_RELATIONS.find(r => r.name === relationName || r.id === relationName);
  if (relation?.reverseRelation) {
    return relation.reverseRelation[targetGender] || relation.reverseRelation['male'] || relation.reverseRelation['female'] || '亲属';
  }
  return '亲属';
};

// 根据关系ID获取关系信息
export const getRelationById = (id: string): FamilyRelation | undefined => {
  return FAMILY_RELATIONS.find(r => r.id === id);
};

// 根据关系名称获取关系信息
export const getRelationByName = (name: string): FamilyRelation | undefined => {
  return FAMILY_RELATIONS.find(r => r.name === name);
};

// 常用家庭关系（按优先级排序，用于小家庭）
const COMMON_FAMILY_RELATIONS = [
  // 核心家庭成员
  { id: 'father', name: '父亲', category: 'direct' },
  { id: 'mother', name: '母亲', category: 'direct' },
  { id: 'husband', name: '丈夫', category: 'inlaw' },
  { id: 'wife', name: '妻子', category: 'inlaw' },
  { id: 'son', name: '儿子', category: 'direct' },
  { id: 'daughter', name: '女儿', category: 'direct' },
  // 同辈
  { id: 'older_brother', name: '哥哥', category: 'collateral' },
  { id: 'younger_brother', name: '弟弟', category: 'collateral' },
  { id: 'older_sister', name: '姐姐', category: 'collateral' },
  { id: 'younger_sister', name: '妹妹', category: 'collateral' },
  // 祖辈
  { id: 'grandfather', name: '爷爷/祖父', category: 'direct' },
  { id: 'grandmother', name: '奶奶/祖母', category: 'direct' },
  { id: 'maternal_grandfather', name: '姥爷/外祖父', category: 'direct' },
  { id: 'maternal_grandmother', name: '姥姥/外祖母', category: 'direct' },
  // 父辈旁系
  { id: 'uncle_paternal_older', name: '伯父/伯伯', category: 'collateral' },
  { id: 'uncle_paternal_younger', name: '叔叔', category: 'collateral' },
  { id: 'aunt_paternal', name: '姑姑', category: 'collateral' },
  { id: 'uncle_maternal', name: '舅舅', category: 'collateral' },
  { id: 'aunt_maternal', name: '姨妈', category: 'collateral' },
  // 晚辈
  { id: 'nephew_paternal', name: '侄子', category: 'collateral' },
  { id: 'niece_paternal', name: '侄女', category: 'collateral' },
  { id: 'nephew_maternal', name: '外甥', category: 'collateral' },
  { id: 'niece_maternal', name: '外甥女', category: 'collateral' },
  { id: 'grandson', name: '孙子', category: 'direct' },
  { id: 'granddaughter', name: '孙女', category: 'direct' },
  // 姻亲
  { id: 'father_in_law', name: '公公/岳父', category: 'inlaw' },
  { id: 'mother_in_law', name: '婆婆/岳母', category: 'inlaw' },
  // 配偶兄弟姐妹
  { id: 'older_brother_in_law', name: '大舅哥', category: 'inlaw' },
  { id: 'younger_brother_in_law', name: '小舅子', category: 'inlaw' },
  { id: 'older_sister_in_law', name: '大姨子', category: 'inlaw' },
  { id: 'younger_sister_in_law', name: '小姨子', category: 'inlaw' },
  { id: 'older_brother_in_law_male', name: '大伯子', category: 'inlaw' },
  { id: 'younger_brother_in_law_male', name: '小叔子', category: 'inlaw' },
  { id: 'older_sister_in_law_female', name: '大姑子', category: 'inlaw' },
  { id: 'younger_sister_in_law_female', name: '小姑子', category: 'inlaw' },
  // 兄弟姐妹配偶
  { id: 'sister_in_law_wife', name: '嫂子', category: 'inlaw' },
  { id: 'sister_in_law_husband', name: '弟媳', category: 'inlaw' },
  { id: 'brother_in_law_wife', name: '姐夫', category: 'inlaw' },
  { id: 'brother_in_law_husband', name: '妹夫', category: 'inlaw' },
  // 妯娌连襟
  { id: 'sisters_in_law', name: '妯娌', category: 'inlaw' },
  { id: 'brothers_in_law', name: '连襟', category: 'inlaw' },
  // 其他
  { id: 'older_cousin_paternal_male', name: '堂哥', category: 'collateral' },
  { id: 'younger_cousin_paternal_male', name: '堂弟', category: 'collateral' },
  { id: 'older_cousin_paternal_female', name: '堂姐', category: 'collateral' },
  { id: 'younger_cousin_paternal_female', name: '堂妹', category: 'collateral' },
  { id: 'older_cousin_maternal_male', name: '表哥', category: 'collateral' },
  { id: 'younger_cousin_maternal_male', name: '表弟', category: 'collateral' },
  { id: 'older_cousin_maternal_female', name: '表姐', category: 'collateral' },
  { id: 'younger_cousin_maternal_female', name: '表妹', category: 'collateral' },
  // 子女配偶
  { id: 'son_in_law', name: '女婿', category: 'inlaw' },
  { id: 'daughter_in_law', name: '儿媳', category: 'inlaw' },
];

// 成员人数选项（1-99）
export const generateMemberCountOptions = () => {
  return Array.from({ length: 99 }, (_, i) => ({
    label: `${i + 1}人`,
    value: i + 1,
  }));
};

/**
 * 根据家庭成员人数获取可选的关系列表
 */
export const getRelationsByMemberCount = (memberCount: number): { relation: string; category: string }[] => {
  const relationCount = Math.max(1, memberCount - 1);
  
  const categoryNames: Record<string, string> = {
    direct: '直系亲属',
    collateral: '旁系亲属',
    inlaw: '姻亲',
    colleague: '同事关系',
    social: '生活关系',
    hostile: '敌对关系',
    hatred: '仇恨关系',
  };
  
  return COMMON_FAMILY_RELATIONS.slice(0, relationCount).map(r => ({
    relation: r.name,
    category: categoryNames[r.category] || '其他',
  }));
};

// 扁平化亲属关系，供下拉选择使用（全部关系）
export const getAllRelationsFlat = (): { relation: string; category: string; subCategory?: string }[] => {
  const categoryNames: Record<string, string> = {
    direct: '直系亲属',
    collateral: '旁系亲属',
    inlaw: '姻亲',
    colleague: '同事关系',
    social: '生活关系',
    hostile: '敌对关系',
    hatred: '仇恨关系',
  };
  
  return FAMILY_RELATIONS.map(r => ({
    relation: r.name,
    category: categoryNames[r.category] || '其他',
    subCategory: r.subCategory,
  }));
};

// 验证关系是否正确（避免错误关系）
export const validateRelation = (
  relationName: string,
  sourceGender: 'male' | 'female',
  targetGender: 'male' | 'female'
): { valid: boolean; suggestion?: string } => {
  const relation = FAMILY_RELATIONS.find(r => r.name === relationName || r.id === relationName);
  
  if (!relation) {
    return { valid: true }; // 自定义关系，不做验证
  }
  
  // 检查性别是否匹配
  if (relation.gender !== 'any' && relation.gender !== targetGender) {
    return {
      valid: false,
      suggestion: `"${relationName}"通常是${relation.gender === 'male' ? '男性' : '女性'}，请确认目标角色性别是否正确`,
    };
  }
  
  return { valid: true };
};

// 关系网络节点
export interface RelationNode {
  characterId: string;
  characterName: string;
  characterGender: 'male' | 'female';
  relations: {
    targetId: string;
    targetName: string;
    relationType: string;
    reverseRelation?: string;
  }[];
}

// 计算两个角色之间的关系（通过关系网络推导）
export const calculateRelationBetween = (
  relationNetwork: RelationNode[],
  sourceId: string,
  targetId: string,
  sourceGender: 'male' | 'female',
  targetGender: 'male' | 'female'
): string | null => {
  // 直接关系
  const sourceNode = relationNetwork.find(n => n.characterId === sourceId);
  if (sourceNode) {
    const directRelation = sourceNode.relations.find(r => r.targetId === targetId);
    if (directRelation) {
      return directRelation.relationType;
    }
  }
  
  // 通过关系网络推导（简化版：只处理一层关系传递）
  // TODO: 实现更复杂的关系推导逻辑
  
  return null;
};
