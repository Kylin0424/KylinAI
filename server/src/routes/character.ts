import express, { type Request, type Response } from 'express';
import { LLMClient, Config, HeaderUtils, ImageGenerationClient } from 'coze-coding-dev-sdk';

const router = express.Router();

// 关系类型到性别和年龄推断的映射
const RELATION_INFERENCE: Record<string, {
  gender: string;
  ageOffset: [number, number];
  description: string;
}> = {
  '父亲': { gender: '男', ageOffset: [20, 35], description: '主角的父亲' },
  '母亲': { gender: '女', ageOffset: [18, 30], description: '主角的母亲' },
  '祖父': { gender: '男', ageOffset: [40, 55], description: '主角的祖父' },
  '祖母': { gender: '女', ageOffset: [38, 50], description: '主角的祖母' },
  '外祖父': { gender: '男', ageOffset: [40, 55], description: '主角的外祖父' },
  '外祖母': { gender: '女', ageOffset: [38, 50], description: '主角的外祖母' },
  '哥哥': { gender: '男', ageOffset: [1, 10], description: '主角的哥哥' },
  '弟弟': { gender: '男', ageOffset: [-10, -1], description: '主角的弟弟' },
  '姐姐': { gender: '女', ageOffset: [1, 10], description: '主角的姐姐' },
  '妹妹': { gender: '女', ageOffset: [-10, -1], description: '主角的妹妹' },
  '配偶': { gender: '任意', ageOffset: [-5, 5], description: '主角的配偶' },
  '丈夫': { gender: '男', ageOffset: [-5, 5], description: '主角的丈夫' },
  '妻子': { gender: '女', ageOffset: [-5, 5], description: '主角的妻子' },
  '儿子': { gender: '男', ageOffset: [-30, -15], description: '主角的儿子' },
  '女儿': { gender: '女', ageOffset: [-30, -15], description: '主角的女儿' },
  '伯父': { gender: '男', ageOffset: [15, 30], description: '主角的伯父' },
  '叔叔': { gender: '男', ageOffset: [15, 25], description: '主角的叔叔' },
  '姑妈': { gender: '女', ageOffset: [15, 30], description: '主角的姑妈' },
  '舅舅': { gender: '男', ageOffset: [15, 30], description: '主角的舅舅' },
  '姨妈': { gender: '女', ageOffset: [15, 30], description: '主角的姨妈' },
  '侄子': { gender: '男', ageOffset: [-20, -5], description: '主角的侄子' },
  '侄女': { gender: '女', ageOffset: [-20, -5], description: '主角的侄女' },
  '堂兄弟': { gender: '男', ageOffset: [-5, 5], description: '主角的堂兄弟' },
  '堂姐妹': { gender: '女', ageOffset: [-5, 5], description: '主角的堂姐妹' },
  '表兄弟': { gender: '男', ageOffset: [-5, 5], description: '主角的表兄弟' },
  '表姐妹': { gender: '女', ageOffset: [-5, 5], description: '主角的表姐妹' },
  '岳父': { gender: '男', ageOffset: [20, 35], description: '主角的岳父' },
  '岳母': { gender: '女', ageOffset: [18, 30], description: '主角的岳母' },
  '公公': { gender: '男', ageOffset: [20, 35], description: '主角的公公' },
  '婆婆': { gender: '女', ageOffset: [18, 30], description: '主角的婆婆' },
};

/**
 * POST /api/v1/character/generate
 * 根据滑块值和基本信息生成角色（支持宗族系统多角色生成）
 */
router.post('/generate', async (req: Request, res: Response) => {
  const {
    sliders,
    name,
    gender,
    age,
    height,
    occupation,
    education,
    memberCount,
    familyRelation,
    familyBackground,
    socialExperience,
    familyMembersData // 新增：用户手动设置的家庭成员数据
  } = req.body;

  if (!sliders || typeof sliders !== 'object') {
    return res.status(400).json({ error: '缺少滑块参数' });
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config({
  apiKey: process.env.OPENAI_API_KEY,
  baseUrl: process.env.OPENAI_BASE_URL,
  modelBaseUrl: process.env.OPENAI_MODEL_BASE_URL,
});
    const client = new LLMClient(config, customHeaders);

    // 解析滑块值
    const introversion = sliders.introversion || 50;
    const rational = sliders.rational || 50;
    const conservative = sliders.conservative || 50;
    const optimistic = sliders.optimistic || 50;
    const intelligence = sliders.intelligence || 50;
    const courage = sliders.courage || 50;
    const charisma = sliders.charisma || 50;
    const luck = sliders.luck || 50;
    const socialStatus = sliders.socialStatus || 50;
    const wealth = sliders.wealth || 50;

    // 构建提示词
    const systemPrompt = `你是一位专业的人物设定师，擅长根据给定的性格特征参数创造鲜活的角色。
你需要生成一个完整的角色档案，包括基本信息和详细的背景故事。
请确保角色的各项特征与给定的参数相符。`;

    const basicInfo = name ? `【用户已确定的基本信息 - 必须严格遵守】
- 姓名：${name}（必须使用这个姓名，不能更改）
- 性别：${gender || '未设定'}（如果已设定，必须遵守）
- 年龄：${age || '未设定'}岁（如果已设定，必须使用这个年龄）
- 身高：${height || '未设定'}（如果已设定，必须使用这个身高）
- 职业：${occupation || '未设定'}（如果已设定，必须使用这个职业）
- 学历：${education || '未设定'}（如果已设定，必须使用这个学历）
- 家庭背景：${familyBackground || '未设定'}（如果已设定，必须保持一致）
- 社会经历：${socialExperience || '未设定'}（如果已设定，必须保持一致）

【特别警告】
- 绝对不能更改用户已确定的姓名
- 绝对不能更改用户已确定的性别、年龄、身高
- 绝对不能更改用户已确定的职业、学历
- 对于未设定的项目，请根据滑块参数推断合理的值` : '';

    const userPrompt = `请根据以下参数生成一个小说角色的完整设定。

${basicInfo}

【性格参数】
性格倾向：${introversion < 30 ? '非常内向' : introversion < 50 ? '较内向' : introversion < 70 ? '较外向' : '非常外向'}（内向-外向：${introversion}%）
思维方式：${rational < 30 ? '非常感性' : rational < 50 ? '偏感性' : rational < 70 ? '偏理性' : '非常理性'}（感性-理性：${rational}%）
生活态度：${conservative < 30 ? '非常保守' : conservative < 50 ? '较保守' : conservative < 70 ? '较开放' : '非常开放'}（保守-开放：${conservative}%）
心态倾向：${optimistic < 30 ? '非常悲观' : optimistic < 50 ? '偏悲观' : optimistic < 70 ? '偏乐观' : '非常乐观'}（悲观-乐观：${optimistic}%）

【能力参数】
智慧程度：${intelligence < 30 ? '单纯朴实' : intelligence < 50 ? '一般' : intelligence < 70 ? '聪明' : '睿智过人'}（${intelligence}%）
勇气指数：${courage < 30 ? '非常谨慎' : courage < 50 ? '较谨慎' : courage < 70 ? '较勇敢' : '非常勇敢'}（${courage}%）
魅力值：${charisma < 30 ? '平凡' : charisma < 50 ? '一般' : charisma < 70 ? '有魅力' : '非常迷人'}（${charisma}%）
运气值：${luck < 30 ? '倒霉' : luck < 50 ? '一般' : luck < 70 ? '较幸运' : '非常幸运'}（${luck}%）

【社会参数】
社会地位：${socialStatus < 30 ? '底层' : socialStatus < 50 ? '中下层' : socialStatus < 70 ? '中产阶级' : '上流社会'}（${socialStatus}%）
财富程度：${wealth < 30 ? '贫困' : wealth < 50 ? '普通' : wealth < 70 ? '富裕' : '非常富有'}（${wealth}%）

【生成要求 - 必须严格遵守】
请生成一个包含以下信息的角色档案（以JSON格式返回）：
1. name: 姓名（${name ? '必须使用：' + name : '请创造一个合适的中文姓名'}${name ? '，不能更改' : ''}）
2. gender: 性别（${gender ? '必须使用：' + gender : '男/女'}${gender ? '，不能更改' : ''}）
3. age: 年龄（${age ? '必须使用：' + age : '具体数字，根据设定推断'}${age ? '，不能更改' : ''}）
4. height: 身高（${height ? '必须使用：' + height : '根据性别推断合理身高'}${height ? '，不能更改' : ''}）
5. occupation: 职业（${occupation ? '必须使用：' + occupation : '根据角色特征推断合适的职业'}${occupation ? '，不能更改' : ''}）
6. education: 学历（${education ? '必须使用：' + education : '根据职业和社会地位推断合理学历'}${education ? '，不能更改' : ''}）
7. personality: 性格特点（100-200字，要符合给定的性格参数，同时要考虑学历对表达方式的影响）
8. experience: 人生经历（150-250字，要体现智慧、勇气、运气等参数）
9. familyBackground: 家庭背景（${familyBackground ? '保持一致：' + familyBackground : '100-200字，要符合社会地位和财富参数'}）
10. appearance: 外貌特征（80-150字）
11. specialTraits: 特殊特质或技能（50-100字，如有）

请只返回JSON，不要有其他文字。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await client.invoke(messages, {
      model: process.env.ARK_MODEL || 'ep-20260411122808-27xnp',
      temperature: 0.8,
    });

    // 解析返回的JSON
    let characterData;
    try {
      const content = response.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        characterData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse character JSON:', parseError);
      characterData = {
        name: name || '李明',
        gender: gender || '男',
        age: parseInt(age) || 28,
        height: height || '175cm',
        occupation: '软件工程师',
        education: education || '大本',
        personality: '性格内向沉稳，做事认真负责。',
        experience: '大学毕业后进入一家科技公司工作。',
        familyBackground: '出身普通家庭，父母都是教师。',
        appearance: '身材中等，戴眼镜，给人一种斯文的感觉。',
        specialTraits: '擅长编程，对技术有独特的见解。'
      };
    }

    // 如果需要生成宗族成员
    const familyMembers: any[] = [];
    const memberCountNum = parseInt(memberCount) || 0;

    // 获取家庭背景
    const familyBg = familyBackground || characterData.familyBackground || '';

    // 检查是否有用户手动设置的家庭成员数据（前端传的是JSON字符串，需要解析）
let parsedFamilyMembersData = null;
if (familyMembersData && typeof familyMembersData === 'string') {
  try {
    parsedFamilyMembersData = JSON.parse(familyMembersData);
  } catch (e) {
    console.error('Failed to parse familyMembersData:', e);
  }
} else if (Array.isArray(familyMembersData)) {
  parsedFamilyMembersData = familyMembersData;
}
const hasCustomFamilyMembers = parsedFamilyMembersData && Array.isArray(parsedFamilyMembersData) && parsedFamilyMembersData.length > 0;

    // 优先使用用户手动设置的家庭成员数据
  if (hasCustomFamilyMembers) {
    // 使用用户手动设置的家庭成员数据
        for (const memberData of parsedFamilyMembersData) {
          try {
            // 为每个家庭成员生成详细描述（性格、经历、外貌等）
            const memberPrompt = `请根据以下基本信息，生成一个家庭成员角色的详细档案。

【基本信息】
姓名：${memberData.name}
性别：${memberData.gender}
年龄：${memberData.age}岁
身高：${memberData.height}
体重：${memberData.weight}
职业：${memberData.occupation}
学历：${memberData.education}
与主角的关系：${memberData.relation}

【主角信息】
姓名：${characterData.name}
性别：${characterData.gender}
年龄：${characterData.age}岁
职业：${characterData.occupation}
家庭背景：${familyBg}

【生成要求 - 必须严格遵守】
请生成一个包含以下信息的家庭成员档案（以JSON格式返回）：
1. name: 姓名（必须是：${memberData.name}，不能更改）
2. gender: 性别（必须是：${memberData.gender}，不能更改）
3. age: 年龄（必须是：${memberData.age}，不能更改）
4. height: 身高（必须是：${memberData.height}，不能更改）
5. occupation: 职业（必须是：${memberData.occupation}，不能更改）
6. education: 学历（根据职业推断合理学历，考虑年龄）
7. personality: 性格特点（80-150字，根据年龄、职业、学历推断）
8. experience: 人生经历（100-200字，要体现与主角的互动）
9. familyBackground: 家庭背景（与主角一致）
10. appearance: 外貌特征（50-100字）
11. relationToProtagonist: 与主角的关系（${memberData.relation}）

请只返回JSON，不要有其他文字。`;

            const memberResponse = await client.invoke([
              { role: 'system' as const, content: '你是一位专业的人物设定师，擅长生成家庭成员角色的详细档案。必须严格遵守所有基本信息约束。' },
              { role: 'user' as const, content: memberPrompt }
            ], {
              model: process.env.ARK_MODEL || 'ep-20260411122808-27xnp',
              temperature: 0.7,
            });

            const memberContent = memberResponse.content;
            const memberJsonMatch = memberContent.match(/\{[\s\S]*\}/);
            if (memberJsonMatch) {
              const memberFullData = JSON.parse(memberJsonMatch[0]);
              familyMembers.push(memberFullData);
            }
          } catch (memberError) {
            console.error('Failed to generate family member detail:', memberError);
            // 如果生成失败，使用基本信息创建一个简单的记录
            familyMembers.push({
              name: memberData.name,
              gender: memberData.gender,
              age: memberData.age,
              height: memberData.height,
              occupation: memberData.occupation,
              education: memberData.education,
              personality: '待完善',
              experience: '待完善',
              familyBackground: familyBg,
              appearance: '待完善',
              relationToProtagonist: memberData.relation,
            });
          }
        }
      } else if (familyRelation) {
        // 原有逻辑：使用AI生成家庭成员
        // 解析关系列表（格式如："父亲、母亲" 或 "父亲,母亲"）
        const relations = familyRelation.split(/[、,，]/).map((r: string) => r.trim()).filter((r: string) => r);

        // 获取姓氏
        const surname = characterData.name?.charAt(0) || '李';
        const protagonistAge = parseInt(characterData.age) || 25;

        // 为每个关系生成对应的家庭成员
        for (let i = 0; i < relations.length && i < 10; i++) {
          const relationName = relations[i];
          const inference = RELATION_INFERENCE[relationName] || {
            gender: '任意',
            ageOffset: [-10, 10],
            description: `主角的${relationName}`
          };

          // 计算年龄范围
          const [minOffset, maxOffset] = inference.ageOffset;
          const minAge = Math.max(1, protagonistAge + minOffset);
          const maxAge = Math.max(minAge + 1, protagonistAge + maxOffset);

          // 确定性别
          let memberGender = inference.gender;
          if (memberGender === '任意') {
            memberGender = Math.random() > 0.5 ? '男' : '女';
          }

          const memberPrompt = `请根据以下主角信息，生成一个家庭成员角色。

【主角信息】
姓名：${characterData.name}
性别：${characterData.gender}
年龄：${characterData.age}岁
职业：${characterData.occupation}
家庭背景：${familyBg}
社会地位：${socialStatus < 30 ? '底层' : socialStatus < 50 ? '中下层' : socialStatus < 70 ? '中产阶级' : '上流社会'}
财富程度：${wealth < 30 ? '贫困' : wealth < 50 ? '普通' : wealth < 70 ? '富裕' : '非常富有'}

【家庭成员要求 - 必须严格遵守】
- 与主角的关系：${relationName}
- 姓氏要求：${memberGender === '女' && ['配偶', '母亲', '祖母', '外祖母', '姑妈', '姨妈', '岳母', '婆婆'].includes(relationName) ? '可以是不同姓氏' : `必须姓${surname}`}
- 性别（强制）：必须为${memberGender}
- 年龄范围（强制）：必须在${minAge}-${maxAge}岁之间（具体数字，不能超出范围）
- 家庭背景：必须与主角的家庭背景保持一致

【特别警告】
- 绝对不能生成超出年龄范围的年龄
- 绝对不能使用与性别要求不符的性别
- 绝对不能使用与姓氏要求不符的姓氏

请生成一个包含以下信息的家庭成员档案（以JSON格式返回）：
1. name: 姓名
2. gender: 性别（必须是：${memberGender}）
3. age: 年龄（必须在${minAge}-${maxAge}岁之间）
4. height: 身高（根据性别推断合理身高）
5. occupation: 职业（要符合年龄和时代背景）
6. personality: 性格特点（80-150字，可以有独特性格）
7. experience: 人生经历（100-200字，要体现与主角的互动）
8. familyBackground: 家庭背景（与主角一致）
9. appearance: 外貌特征（50-100字）
10. relationToProtagonist: 与主角的关系（${relationName}）

请只返回JSON，不要有其他文字。`;

          try {
            const memberResponse = await client.invoke([
              { role: 'system' as const, content: '你是一位专业的人物设定师，擅长生成家庭成员角色。每个家庭成员都应该有独特的性格和经历。必须严格遵守性别、年龄、姓氏等所有约束条件。' },
              { role: 'user' as const, content: memberPrompt }
            ], {
              model: process.env.ARK_MODEL || 'ep-20260411122808-27xnp',
              temperature: 0.7, // 降低温度以提高准确性和遵守约束
            });

            const memberContent = memberResponse.content;
            const memberJsonMatch = memberContent.match(/\{[\s\S]*\}/);
            if (memberJsonMatch) {
              const memberData = JSON.parse(memberJsonMatch[0]);
              memberData.relationToProtagonist = relationName;
              familyMembers.push(memberData);
            }
          } catch (memberError) {
            console.error('Failed to generate family member:', memberError);
          }
        }
      }

    res.json({
      protagonist: characterData,
      familyMembers: familyMembers,
    });
  } catch (error) {
    console.error('Character generation error:', error);
    res.status(500).json({ error: '生成角色失败' });
  }
});

/**
 * POST /api/v1/character/generate-npc
 * 根据已有角色和关系类型生成NPC角色
 */
router.post('/generate-npc', async (req: Request, res: Response) => {
  const { baseCharacter, relationType } = req.body;

  if (!baseCharacter || !relationType) {
    return res.status(400).json({ error: '缺少基础角色或关系类型' });
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config({
  apiKey: process.env.OPENAI_API_KEY,
  baseUrl: process.env.OPENAI_BASE_URL,
  modelBaseUrl: process.env.OPENAI_MODEL_BASE_URL,
});
    const client = new LLMClient(config, customHeaders);

    const relationTypeMap: Record<string, string> = {
      'father': '父亲',
      'mother': '母亲',
      'child': '子女',
    };

    const relationLabel = relationTypeMap[relationType] || relationType;

    // 根据关系类型推断NPC的基本属性
    let inferredGender = '';
    let inferredAgeRange = '';
    let inferredWealth = '';

    if (relationType === 'father') {
      inferredGender = '男';
      inferredAgeRange = `${baseCharacter.age + 20}-${baseCharacter.age + 35}岁`;
      inferredWealth = baseCharacter.familyBackground.includes('富裕') ? '较富裕' : '普通';
    } else if (relationType === 'mother') {
      inferredGender = '女';
      inferredAgeRange = `${baseCharacter.age + 18}-${baseCharacter.age + 30}岁`;
      inferredWealth = baseCharacter.familyBackground.includes('富裕') ? '较富裕' : '普通';
    } else if (relationType === 'child') {
      inferredGender = Math.random() > 0.5 ? '男' : '女';
      inferredAgeRange = baseCharacter.age > 40 ? '15-25岁' : '5-15岁';
      inferredWealth = '普通';
    }

    const systemPrompt = `你是一位专业的人物设定师，现在需要根据已有角色生成其${relationLabel}角色。
生成的NPC角色应该：
1. 符合血缘/亲属关系的合理性（如年龄差距、性格遗传等）
2. 与原角色有合理的互动背景
3. 保持人物设定的一致性和真实感`;

    const userPrompt = `请根据以下基础角色信息，生成其${relationLabel}角色的完整设定：

【基础角色信息】
姓名：${baseCharacter.name}
性别：${baseCharacter.gender}
年龄：${baseCharacter.age}岁
身高：${baseCharacter.height}
职业：${baseCharacter.occupation}
性格特点：${baseCharacter.personality}
人生经历：${baseCharacter.experience}
家庭背景：${baseCharacter.familyBackground}

【${relationLabel}角色推断信息】
性别：${inferredGender}
年龄范围：${inferredAgeRange}
财富程度：${inferredWealth}

请生成一个包含以下信息的${relationLabel}角色档案（以JSON格式返回）：
1. name: 姓名（请创造一个合适的中文姓名，要考虑与${baseCharacter.name}的亲属关系）
2. gender: 性别（${inferredGender}）
3. age: 年龄（具体数字，要在${inferredAgeRange}范围内）
4. height: 身高（根据性别推断合理身高）
5. occupation: 职业（要符合年龄和时代背景）
6. personality: 性格特点（100-200字，可以与基础角色有一定的相似性或互补性）
7. experience: 人生经历（150-250字，要体现与基础角色的互动）
8. familyBackground: 家庭背景（100-200字，要与基础角色的家庭背景一致）
9. appearance: 外貌特征（80-150字，可以体现与基础角色的相似之处）
10. specialTraits: 特殊特质或技能（50-100字，如有）

请只返回JSON，不要有其他文字。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await client.invoke(messages, {
      model: process.env.ARK_MODEL || 'ep-20260411122808-27xnp',
      temperature: 0.8,
    });

    // 解析返回的JSON
    let npcData;
    try {
      const content = response.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        npcData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse NPC JSON:', parseError);
      npcData = {
        name: inferredGender === '男' ? '李建国' : '王秀芳',
        gender: inferredGender,
        age: relationType === 'child' ? 15 : baseCharacter.age + 25,
        height: inferredGender === '男' ? '175cm' : '160cm',
        occupation: relationType === 'child' ? '学生' : '退休教师',
        personality: '性格温和，待人真诚。',
        experience: '一生勤劳朴实，养育子女。',
        familyBackground: baseCharacter.familyBackground,
        appearance: inferredGender === '男' ? '身材中等，面容慈祥。' : '身材苗条，气质温和。',
        specialTraits: '善于照顾家人。'
      };
    }

    res.json(npcData);
  } catch (error) {
    console.error('NPC generation error:', error);
    res.status(500).json({ error: '生成NPC角色失败' });
  }
});

/**
 * POST /api/v1/character/generate-avatar
 * 根据角色信息生成写实头像
 */
router.post('/generate-avatar', async (req: Request, res: Response) => {
  const { name, gender, age, height, weight, occupation, appearance, personality } = req.body;

  if (!name) {
    return res.status(400).json({ error: '缺少角色姓名' });
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config({
  apiKey: process.env.OPENAI_API_KEY,
  baseUrl: process.env.OPENAI_BASE_URL,
  modelBaseUrl: process.env.OPENAI_MODEL_BASE_URL,
});
    const imageClient = new ImageGenerationClient(config, customHeaders);

    // 构建头像生成提示词
    // 使用更具体的写实风格描述
    const prompt = `A realistic portrait photo of a ${gender === '男' ? 'male' : gender === '女' ? 'female' : 'person'} character.

Character details:
- Name: ${name}
- Age: ${age || '25'} years old
- Height: ${height || '170cm'}
${weight ? `- Weight: ${weight}` : ''}
- Occupation: ${occupation || 'professional'}

${appearance ? `Physical appearance: ${appearance}` : ''}

${personality ? `Personality hints (subtly reflected in expression): ${personality.substring(0, 100)}` : ''}

Style requirements:
- Photorealistic portrait
- Studio lighting, soft and natural
- Neutral background (light gray or beige)
- Head and shoulders composition
- Looking at camera with a natural expression
- High quality, detailed facial features
- Professional photography style
- No text, watermarks, or borders`;

    const response = await imageClient.generate({
      prompt,
      size: '2K',
      watermark: false,
    });

    const helper = imageClient.getResponseHelper(response);

    if (helper.success && helper.imageUrls.length > 0) {
      res.json({ 
        success: true, 
        avatarUrl: helper.imageUrls[0] 
      });
    } else {
      console.error('Avatar generation failed:', helper.errorMessages);
      res.status(500).json({ 
        success: false, 
        error: '头像生成失败',
        details: helper.errorMessages 
      });
    }
  } catch (error) {
    console.error('Avatar generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: '生成头像时发生错误' 
    });
  }
});

export default router;
