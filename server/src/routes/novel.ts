import express, { type Request, type Response } from 'express';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

const router = express.Router();

/**
 * POST /api/v1/novel/generate
 * 生成小说（流式输出）
 * Body: { theme: string, characters?: string, plot?: string }
 */
router.post('/generate', async (req: Request, res: Response) => {
  const { theme, characters, plot } = req.body;

  if (!theme) {
    return res.status(400).json({ error: '缺少小说主题参数' });
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
  res.setHeader('Connection', 'keep-alive');

  try {
    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);

    // 初始化 LLM 客户端
    const config = new Config({
  apiKey: process.env.ARK_API_KEY,
  baseUrl: process.env.ARK_BASE_URL,
});
    const client = new LLMClient(config, customHeaders);

    // 构建提示词
    const systemPrompt = `你是一位专业的小说作家，擅长以第三人称旁观者视角进行叙述。
你的叙述风格客观、细腻，善于描绘场景和人物心理活动。
你创作的小说情节紧凑、人物鲜明、细节生动。`;

    const userPrompt = `请以第三人称旁观者视角创作一部小说。

主题：${theme}
${characters ? `主要角色：${characters}` : ''}
${plot ? `情节走向：${plot}` : ''}

要求：
1. 以第三人称叙述，保持客观旁观者视角
2. 情节要有起承转合
3. 人物性格要鲜明
4. 环境描写要生动
5. 文字优美流畅

请直接开始创作小说内容：`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    // 使用流式生成
    const stream = client.stream(messages, {
      model: process.env.ARK_MODEL || 'ep-20260411122808-27xnp',
      temperature: 0.9,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        const content = chunk.content.toString();
        // 发送 SSE 事件
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // 发送结束标记
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Novel generation error:', error);
    res.write(`data: ${JSON.stringify({ error: '生成失败，请重试' })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/v1/novel/check-conflict
 * 检测续写走向与角色设定的冲突
 * Body: { 
 *   continueDirection: string, 
 *   characters: array, 
 *   existingContent?: string,
 *   previousChapters?: Array<{ title: string; content: string }>
 * }
 */
router.post('/check-conflict', async (req: Request, res: Response) => {
  const { continueDirection, characters, existingContent, previousChapters } = req.body;

  if (!continueDirection || !characters || characters.length === 0) {
    return res.json({ hasConflict: false });
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config({
  apiKey: process.env.ARK_API_KEY,
  baseUrl: process.env.ARK_BASE_URL,
});
    const client = new LLMClient(config, customHeaders);

    // 构建角色信息
    const charactersInfo = characters.map((c: any) => {
      let info = `- ${c.name}：${c.occupation || '身份未知'}，${c.age || '?'}岁`;
      if (c.education) info += `，学历：${c.education}`;
      if (c.personality) info += `，性格：${c.personality.substring(0, 50)}`;
      return info;
    }).join('\n');

    // 构建章节上下文
    let chaptersContext = '';
    if (previousChapters && previousChapters.length > 0) {
      const recentChapters = previousChapters.slice(-3); // 最近3章
      chaptersContext = '\n\n【之前章节内容摘要】\n' + recentChapters.map((ch: any, index: number) => {
        const chapterNum = previousChapters.length - recentChapters.length + index + 1;
        return `【${ch.title || `第${chapterNum}章`}】\n${ch.content?.substring(0, 600)}${ch.content?.length > 600 ? '...' : ''}`;
      }).join('\n\n');
    }

    const systemPrompt = `你是一位专业的小说剧情审核员，负责检测用户的续写走向是否与已有的角色设定或故事上下文产生冲突。

你需要特别关注以下类型的冲突：

1. **学历与知识冲突**：
   - 初中学历角色说出大学级别的知识或专业术语
   - 低学历角色进行复杂的理论分析
   - 高学历角色表现得什么都不懂

2. **性格与行为冲突**：
   - 内向角色突然变得非常外向活泼
   - 谨慎角色做出鲁莽冲动的行为
   - 理性角色做出感性冲动的决定

3. **职业与能力冲突**：
   - 普通职业角色展现出专家级别的专业技能
   - 专业人士表现得不够专业

4. **年龄与行为冲突**：
   - 年轻角色表现出过于老成的行为
   - 老年角色表现出年轻人的行为模式

5. **上下文一致性冲突（重要！）**：
   - **地点不一致**：角色上一章在北京，下一章突然出现在黑龙江（没有合理的移动描述）
   - **状态不一致**：角色上一章受伤严重，下一章完好如初（没有经过治疗或时间恢复）
   - **时间线冲突**：时间线混乱，出现前后矛盾的时间描述
   - **事件遗忘**：之前发生的重要事件被忽略，角色行为与之前的经历不符
   - **物品/道具状态**：上一章用掉的东西下一章又出现了，或者损坏的物品突然恢复

请仔细分析用户提供的续写走向和之前章节内容，判断是否存在上述冲突。`;

    const userPrompt = `请检测以下续写走向是否与角色设定或故事上下文产生冲突：

【角色设定】
${charactersInfo}
${chaptersContext}

【当前章节内容】
${existingContent ? existingContent.substring(0, 800) + '...' : '暂无'}

【用户续写走向】
${continueDirection}

请分析：
1. 是否存在角色设定冲突？
2. 是否存在上下文一致性冲突？（地点、状态、时间线、事件记忆等）
3. 如果存在冲突，是哪个角色？什么类型的冲突？具体的冲突点是什么？
4. 是否可以通过创建临时角色来解决？如果可以，建议创建什么样的临时角色？

请以JSON格式返回结果：
{
  "hasConflict": true/false,
  "conflicts": [
    {
      "characterName": "角色名",
      "conflictType": "冲突类型（学历冲突/性格冲突/职业冲突/年龄冲突/地点不一致/状态不一致/时间线冲突/事件遗忘）",
      "description": "具体冲突描述",
      "reason": "为什么这是冲突"
    }
  ],
  "suggestion": {
    "canCreateTempCharacter": true/false,
    "tempCharacterSuggestion": {
      "name": "建议的临时角色名",
      "role": "角色定位（如：专家、路人、同事等）",
      "reason": "为什么创建这个角色能解决冲突",
      "suggestedDialogue": "建议这个临时角色说的话或做的事"
    }
  }
}

如果没有冲突，返回：
{
  "hasConflict": false
}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await client.invoke(messages, {
      model: process.env.ARK_MODEL || 'ep-20260411122808-27xnp',
      temperature: 0.3, // 较低的温度以确保一致性
    });

    // 解析返回的JSON
    try {
      const content = response.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        res.json(result);
      } else {
        res.json({ hasConflict: false });
      }
    } catch (parseError) {
      console.error('Failed to parse conflict check result:', parseError);
      res.json({ hasConflict: false });
    }
  } catch (error) {
    console.error('Conflict check error:', error);
    res.json({ hasConflict: false });
  }
});

/**
 * POST /api/v1/novel/extract-context
 * 提取故事上下文信息（地点、角色状态、时间线等）
 * Body: { content: string }
 */
router.post('/extract-context', async (req: Request, res: Response) => {
  const { content } = req.body;

  if (!content || content.trim().length < 50) {
    return res.json({ 
      success: false, 
      context: null,
      message: '内容太短，无法提取上下文'
    });
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config({
  apiKey: process.env.ARK_API_KEY,
  baseUrl: process.env.ARK_BASE_URL,
});
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是一位专业的小说内容分析助手，负责从小说内容中提取关键的上下文信息。
你需要准确识别和记录：
1. 每个角色的当前位置
2. 每个角色的当前状态（健康、受伤、疲劳等）
3. 故事的当前时间点
4. 已发生的重要事件
5. 角色之间的关系状态`;

    const userPrompt = `请分析以下小说内容，提取关键的上下文信息：

【小说内容】
${content.substring(0, 3000)}${content.length > 3000 ? '...(内容过长，已截断)' : ''}

请以JSON格式返回提取的上下文信息：
{
  "success": true,
  "context": {
    "currentTime": "故事当前时间点",
    "currentLocation": "故事当前主要地点",
    "characters": [
      {
        "name": "角色名",
        "location": "当前位置",
        "status": "当前状态（健康/受伤/疲劳/昏迷等）",
        "statusDetail": "状态详情（如受伤部位、严重程度）",
        "recentActions": ["最近做的重要事情"],
        "inventory": ["当前持有的重要物品"]
      }
    ],
    "importantEvents": [
      {
        "description": "事件描述",
        "participants": ["参与的角色"],
        "impact": "事件影响"
      }
    ],
    "environmentNotes": ["环境特点记录"],
    "timeNotes": ["时间线关键节点"]
  }
}

注意：
1. 只提取明确提到的信息，不要臆测
2. 如果某项信息没有明确提到，标记为"未知"或省略
3. 确保提取的信息准确，这对后续续写的一致性至关重要`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await client.invoke(messages, {
      model: process.env.ARK_MODEL || 'ep-20260411122808-27xnp',
      temperature: 0.2,
    });

    // 解析返回的JSON
    try {
      const responseContent = response.content;
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        res.json(result);
      } else {
        res.json({ success: false, context: null, message: '解析失败' });
      }
    } catch (parseError) {
      console.error('Failed to parse context extraction result:', parseError);
      res.json({ success: false, context: null, message: '解析失败' });
    }
  } catch (error) {
    console.error('Context extraction error:', error);
    res.json({ success: false, context: null, message: '提取失败' });
  }
});

/**
 * POST /api/v1/novel/enrich-temp-character
 * 丰满临时角色设定（根据新剧情自动更新）
 * Body: { 
 *   character: object, 
 *   newPlotContext: string,
 *   previousAppearances?: string[]
 * }
 */
router.post('/enrich-temp-character', async (req: Request, res: Response) => {
  const { character, newPlotContext, previousAppearances } = req.body;

  if (!character || !newPlotContext) {
    return res.status(400).json({ error: '缺少角色或剧情上下文' });
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config({
  apiKey: process.env.ARK_API_KEY,
  baseUrl: process.env.ARK_BASE_URL,
});
    const client = new LLMClient(config, customHeaders);

    const previousInfo = previousAppearances && previousAppearances.length > 0
      ? `\n【之前出场记录】\n${previousAppearances.join('\n')}`
      : '';

    const systemPrompt = `你是一位专业的小说角色设计师，负责根据剧情发展不断丰富临时角色的设定。
你的任务是根据新的剧情内容，为临时角色添加更多细节，使其形象更加丰满。`;

    const userPrompt = `请根据以下信息丰富临时角色的设定：

【当前角色设定】
- 姓名：${character.name}
- 性别：${character.gender || '未知'}
- 年龄：${character.age || '未知'}
- 职业：${character.occupation || '未知'}
- 性格：${character.personality || '未知'}
- 背景：${character.background || '未知'}
${previousInfo}

【新剧情内容】
${newPlotContext}

请根据新剧情，更新或补充角色设定。注意：
1. 保持与已有设定的一致性
2. 从剧情中提取角色的新特征、新经历
3. 记录角色在剧情中的重要行为

请返回更新后的角色设定（JSON格式）：
{
  "name": "角色名",
  "gender": "性别",
  "age": 年龄,
  "occupation": "职业",
  "education": "学历（如有线索可推断）",
  "personality": "更新后的性格特点",
  "appearance": "外貌描述",
  "background": "更新后的背景故事",
  "experience": "经历（记录在剧情中发生的事情）",
  "traits": ["从剧情中提取的人物特点"],
  "notableActions": ["在剧情中的重要行为"],
  "relationships": [{ "name": "关系人", "relation": "关系类型" }]
}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await client.invoke(messages, {
      model: process.env.ARK_MODEL || 'ep-20260411122808-27xnp',
      temperature: 0.7,
    });

    // 解析返回的JSON
    try {
      const content = response.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        res.json({ success: true, character: result });
      } else {
        res.json({ success: false, error: '解析失败' });
      }
    } catch (parseError) {
      console.error('Failed to parse enriched character:', parseError);
      res.json({ success: false, error: '解析失败' });
    }
  } catch (error) {
    console.error('Enrich temp character error:', error);
    res.status(500).json({ error: '丰富角色设定失败' });
  }
});

/**
 * POST /api/v1/novel/continue
 * 续写小说（SSE流式响应）
 * Body: { 
 *   prompt: string, 
 *   title: string, 
 *   themeType?: string, 
 *   maleCharacter?: object, 
 *   femaleCharacter?: object,
 *   previousChapters?: Array<{ title: string; content: string }> // 之前章节的内容
 *   worldSetting?: string  // 世界设定
 * }
 */
router.post('/continue', async (req: Request, res: Response) => {
  const { prompt, title, themeType, maleCharacter, femaleCharacter, previousChapters, worldSetting } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: '缺少续写提示参数' });
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
  res.setHeader('Connection', 'keep-alive');

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config({
  apiKey: process.env.ARK_API_KEY,
  baseUrl: process.env.ARK_BASE_URL,
});
    const client = new LLMClient(config, customHeaders);

    // 构建主要角色信息（详细信息）
    let charactersInfo = '';
    if (maleCharacter) {
      charactersInfo += `【男主角】\n`;
      charactersInfo += `姓名：${maleCharacter.name}\n`;
      charactersInfo += `性别：${maleCharacter.gender}\n`;
      charactersInfo += `年龄：${maleCharacter.age || '?'}岁\n`;
      charactersInfo += `身高：${maleCharacter.height || '未知'}\n`;
      charactersInfo += `学历：${maleCharacter.education || '未知'}\n`;
      charactersInfo += `职业：${maleCharacter.occupation || '未知'}\n`;
      if (maleCharacter.group) {
        charactersInfo += `所属团体：${maleCharacter.group}\n`;
      }
      if (maleCharacter.position) {
        charactersInfo += `职位：${maleCharacter.position}\n`;
      }
      if (maleCharacter.personality) {
        charactersInfo += `性格特点：${maleCharacter.personality}\n`;
      }
      if (maleCharacter.experience) {
        charactersInfo += `经历背景：${maleCharacter.experience}\n`;
      }
      if (maleCharacter.familyBackground) {
        charactersInfo += `家庭背景：${maleCharacter.familyBackground}\n`;
      }
      if (maleCharacter.appearance) {
        charactersInfo += `外貌特征：${maleCharacter.appearance}\n`;
      }
      if (maleCharacter.specialTraits) {
        charactersInfo += `特殊特征：${maleCharacter.specialTraits}\n`;
      }
      charactersInfo += '\n';
    }
    if (femaleCharacter) {
      charactersInfo += `【女主角】\n`;
      charactersInfo += `姓名：${femaleCharacter.name}\n`;
      charactersInfo += `性别：${femaleCharacter.gender}\n`;
      charactersInfo += `年龄：${femaleCharacter.age || '?'}岁\n`;
      charactersInfo += `身高：${femaleCharacter.height || '未知'}\n`;
      charactersInfo += `学历：${femaleCharacter.education || '未知'}\n`;
      charactersInfo += `职业：${femaleCharacter.occupation || '未知'}\n`;
      if (femaleCharacter.group) {
        charactersInfo += `所属团体：${femaleCharacter.group}\n`;
      }
      if (femaleCharacter.position) {
        charactersInfo += `职位：${femaleCharacter.position}\n`;
      }
      if (femaleCharacter.personality) {
        charactersInfo += `性格特点：${femaleCharacter.personality}\n`;
      }
      if (femaleCharacter.experience) {
        charactersInfo += `经历背景：${femaleCharacter.experience}\n`;
      }
      if (femaleCharacter.familyBackground) {
        charactersInfo += `家庭背景：${femaleCharacter.familyBackground}\n`;
      }
      if (femaleCharacter.appearance) {
        charactersInfo += `外貌特征：${femaleCharacter.appearance}\n`;
      }
      if (femaleCharacter.specialTraits) {
        charactersInfo += `特殊特征：${femaleCharacter.specialTraits}\n`;
      }
      charactersInfo += '\n';
    }

    // 构建上下文一致性提示
    let contextPrompt = '';
    if (previousChapters && previousChapters.length > 0) {
      const recentChapters = previousChapters.slice(-3); // 最近3章
      const contextSummary = recentChapters.map((ch: any, index: number) => {
        const chapterNum = previousChapters.length - recentChapters.length + index + 1;
        return `【${ch.title || `第${chapterNum}章`}】\n${ch.content?.substring(0, 800)}${ch.content?.length > 800 ? '...(内容过长，已截断)' : ''}`;
      }).join('\n\n');

      contextPrompt = `

【重要：上下文一致性检查】
以下是最近的章节内容，请仔细阅读并确保续写内容与之一致：

${contextSummary}

续写时必须遵守以下一致性规则：

1. **地点一致性**：
   - 角色的位置必须与上一章的结尾位置一致，或者有合理的移动描述
   - 如果角色在上一章在北京，下一章要在黑龙江，必须有旅途描写或时间跳跃说明
   - 不要让角色"瞬移"，位置变化需要合理的过渡

2. **状态一致性**：
   - 角色如果上一章受伤了，下一章必须保持受伤状态（除非有治疗或足够时间恢复）
   - 伤势严重程度要连贯，不能上一章重伤，下一章突然完好如初
   - 疲劳、疾病、情绪状态都要保持连贯

3. **时间线一致性**：
   - 时间推进要合理，不要出现时间倒流或时间混乱
   - 如果有多个角色同时进行的活动，时间线要对得上
   - 日期、季节、天气要保持连贯

4. **事件记忆一致性**：
   - 角色应该记住之前发生的重要事件
   - 不要让角色"忘记"自己说过的话、做过的事
   - 对其他角色的态度要基于之前的互动经历

5. **物品/道具一致性**：
   - 已经用掉、丢失、损坏的物品不能再次出现
   - 新获得的物品要有合理来源
   - 物品状态要保持一致（损坏就是损坏，不会自动恢复）

6. **人际关系一致性**：
   - 角色之间的关系变化要有过程，不能突然转变
   - 之前的好感/恶感应保持或渐进变化
   - 新认识的角色要有介绍，不能像老朋友一样出现`;
    }

    const systemPrompt = `你是一位专业的小说作家，擅长以第三人称旁观者视角进行叙述。
你的叙述风格客观、细腻，善于描绘场景和人物心理活动。
你创作的小说情节紧凑、人物鲜明、细节生动。
续写时要保持与已有内容的风格一致，注意情节连贯性。
${contextPrompt}

【绝对强制规则 - 最高优先级，不可违反】

1. **绝对必须使用设定的主角【不可违反】**：
   - ⚠️ 必须使用以下角色：${maleCharacter?.name || '无'}、${femaleCharacter?.name || '无'}
   - ⚠️ 绝对禁止自己创造新的主角替代用户设定的角色
   - ⚠️ 绝对禁止使用随机生成的角色信息
   - ⚠️ 续写内容中必须体现主角的姓名、性别、年龄、学历、职业、性格、外貌、背景等所有设定
   - 续写内容中必须体现主角所属团体、职位等设定
   - 每一个细节都必须与角色设定保持一致
   - 【强制检查】在输出续写内容之前，请务必检查是否使用了设定的主角姓名和特征
   - 如果内容中出现了新的角色，必须有合理的出场说明，不能凭空出现

2. 学历决定认知【必须严格遵守】：
   - 角色的学历直接决定了他们的知识水平、表达方式和分析能力
   - 低学历角色（小学/初中）说话简单直白，不会使用专业术语，不会进行复杂的分析和推理
   - 高学历角色（大本/硕士/博士）表达专业、有逻辑，善于分析问题，但也不会超出其专业范围
   - 绝对不能让初中学历的角色说出大学级别的知识
   - 绝对不能让低学历角色进行复杂的理论分析
   - 绝对不能让高学历角色表现得什么都不懂

3. 禁止学历违和【必须严格遵守】：
   - 角色的每一句话、每一个行为都必须与其学历相符
   - 角色说的话必须在其认知范围内
   - 角色做的事必须符合其能力水平
   - 角色的反应必须符合其性格和学历

4. 上下文一致性【极其重要！必须严格遵守】：
   - 地点必须连贯：角色不能突然从一个地方"瞬移"到另一个地方
   - 状态必须连贯：受伤的角色不能突然痊愈，疲劳的角色不能突然精神焕发
   - 时间必须连贯：时间推进要合理，不能出现时间混乱
   - 记忆必须连贯：角色要记得之前发生的事情，不能"失忆"
   - 物品必须连贯：用掉的东西不能再次出现，损坏的物品不能自动恢复
   - 人际关系必须连贯：角色之间的关系变化要有过程，不能突然转变

5. 禁止随意创作【必须严格遵守】：
   - 绝对禁止随意创造新的主角或重要角色
   - 如果必须引入新角色，必须有合理的出场说明和背景设定
   - 新角色的行为必须符合其背景和能力设定

【创作前的强制检查清单】
在输出续写内容之前，请务必检查以下问题：
□ 是否使用了设定的主角姓名？
□ 是否体现了主角的性格、学历、职业等设定？
□ 是否保持了与已有内容的风格一致？
□ 是否遵守了上下文一致性规则？
□ 是否避免了随意创作新角色？

只有以上所有问题都得到满足，才能输出续写内容。

【关于临时角色创建的强制规则】
1. 判断标准：
   - 如果续写提示词中包含【明确的角色姓名】（如"张伟"、"李娜"、有姓有名），则应该创建该角色
   - 如果续写提示词中只有【剧情描述】（如"攻城战"、"好朋友"、"遇到朋友聊天"），则不应该创建新角色
   - 角色姓名特征：有明显的姓氏+名字组合，或单名单姓的人名，不包含动词、名词短语或场景描述

2. 正确示例：
   - ✅ "和张三一起攻城" → 创建角色"张三"（有明确姓名）
   - ✅ "李四邀请王五喝茶" → 创建角色"李四"、"王五"（有明确姓名）
   - ❌ "开始攻城战" → 不创建角色（"攻城战"是剧情，不是角色名）
   - ❌ "遇到好朋友聊聊天" → 不创建角色（"好朋友"是身份描述，不是角色名）
   - ❌ "和朋友一起吃饭" → 不创建角色（"朋友"是身份描述，不是角色名）

3. 临时身份的正确处理方式：
   - 如果提示词是"遇到好朋友聊天"，应该为该朋友生成一个合理的姓名
   - 如果提示词是"攻城战"，应该描写攻城场景，不需要创建名为"攻城战"的角色
   - 所有新出现的角色都应该有合理的出场介绍

请严格遵守每个角色的设定，确保人物形象真实可信，故事发展逻辑连贯，绝对不要随意创造新的角色特征。`;

    // 在用户prompt的开头添加主角信息
    const fullPrompt = `【主要角色】
${charactersInfo || '暂无特定角色设定'}

${prompt}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: fullPrompt }
    ];

    // 使用流式生成
    const stream = client.stream(messages, {
      model: process.env.ARK_MODEL || 'ep-20260411122808-27xnp',
      temperature: 0.85,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        const content = chunk.content.toString();
        // 发送 SSE 事件
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // 发送完成信号
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Novel continuation error:', error);
    res.write(`data: ${JSON.stringify({ error: '续写失败，请重试' })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/v1/novel/script
 * 生成短剧剧本
 * Body: { prompt: string, title: string, chapterTitle: string }
 */
router.post('/script', async (req: Request, res: Response) => {
  const { prompt, title, chapterTitle } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: '缺少生成参数' });
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config({
  apiKey: process.env.ARK_API_KEY,
  baseUrl: process.env.ARK_BASE_URL,
});
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是一位资深的短剧编剧，拥有丰富的影视剧本创作经验。你擅长将小说内容改编为专业的短剧剧本，你的剧本具有以下特点：

【绝对强制规则】
1. 剧本格式必须严格按照以下结构：
   【场景】场景名称（时间、地点、光线、氛围）
   【人物】人物A、人物B
   【动作】（详细描述人物的动作、表情、情绪变化）
   人物A：（台词）
   人物B：（台词）
   【声音】（环境音、背景音乐、音效）
   【镜头】（推、拉、摇、移、特写、中景、全景）

2. 必须在剧本末尾添加【AI创作关键提示词】部分，包括：
   - 情绪基调
   - 视觉风格
   - 关键道具
   - 情节转折点
   - 下集预告线索

【场景描述强化】
3. 场景描述必须包含以下细节：
   - 物理空间：房间大小、布局、色彩风格、家具摆放
   - 环境元素：光线强度、色温、光源方向、阴影效果
   - 感官细节：温度、湿度、气味、声音的质感
   - 情绪暗示：通过环境细节暗示场景的情绪基调
   - 示例：【场景】豪华别墅客厅（夜晚、暖色灯光、奢华优雅）
     - 50平米的空间，欧式沙发，水晶吊灯投下柔和光晕
     - 窗外雷雨交加，雨点拍打玻璃的声响
     - 室内弥漫着淡淡的红酒香气，温度26°C，湿度适中
     - 整体氛围压抑而奢华，暗示即将发生的冲突

【人物塑造强化】
4. 人物描述必须包含以下细节：
   - 外貌特征：身高、体型、发型、衣着细节、配饰
   - 面部表情：眼神、嘴型、眉毛、面部微表情
   - 情绪状态：内心活动、外在表现、情绪变化过程
   - 动作细节：肢体语言、手势、行走姿态、坐姿
   - 示例：【人物】张伟（28岁、身高180cm、西装革履）
     - 白色衬衫领口微开，黑色西装外套搭在椅背上
     - 深邃的眼眸中带着疲惫，下巴紧绷，眉心微皱
     - 右手紧握钢笔，指节泛白，显示内心的紧张
     - 频繁调整袖口，显示出不安和急躁

【声音设计强化】
5. 声音描述必须包含以下细节：
   - 环境音：自然声音、机械声音、人声背景
   - 音效设计：关键动作的音效、情绪音效、转场音效
   - 背景音乐：音乐风格、节奏、音量、情绪色彩
   - 声音层次：主音、辅助音、背景音的平衡
   - 示例：【声音】
     - 环境音：窗外雷声滚滚，雨点拍打玻璃的清脆声响
     - 音效：钢笔敲击桌面的声音，椅子滑动的摩擦声
     - 背景音乐：低沉的大提琴独奏，营造压抑氛围
     - 声音层次：雷声作为背景，人声为主音，钢笔声为点缀

【镜头语言强化】
6. 镜头描述必须包含以下细节：
   - 镜头类型：推、拉、摇、移、跟、升降
   - 景别：特写、中景、全景、远景
   - 构图：三分法、对称构图、对角线构图
   - 运镜节奏：慢速、中速、快速、急促
   - 示例：【镜头】
     - 开场：全景镜头，从客厅缓缓推入
     - 中景：中景镜头，聚焦人物A和人物B的对峙
     - 特写：特写人物A的眼神，放大内心的纠结
     - 运镜节奏：缓慢而稳定，营造紧张感

【对话风格强化】
7. 对话设计必须符合以下要求：
   - 人物特色：每个人物有独特的说话方式、用词习惯
   - 情绪表达：通过语调、停顿、重复表达情绪
   - 信息密度：台词简洁有力，避免冗长
   - 潜台词：通过语言暗示人物的真实想法
   - 节奏控制：对话节奏符合短视频的快节奏特点

【AI创作关键提示词】
8. 剧本末尾必须包含以下关键提示词：
   【AI创作关键提示词】
   - 情绪基调：紧张、浪漫、悬疑、悲伤、欢乐等
   - 视觉风格：电影感、复古风、科幻感、温馨感等
   - 关键道具：红酒杯、钢笔、照片、戒指等
   - 情节转折点：人物关系变化、秘密揭露、冲突爆发
   - 下集预告线索：伏笔、未解之谜、即将到来的危机
   - 色彩倾向：冷色调、暖色调、对比色、单色调
   - 音乐风格：古典、流行、电子、民族音乐等
   - 镜头风格：手持、稳定器、航拍、水下镜头等

【输出格式示例】
【场景】豪华别墅客厅（夜晚、暖色灯光、奢华优雅）
   50平米的空间，欧式沙发，水晶吊灯投下柔和光晕。窗外雷雨交加，雨点拍打玻璃的声响。室内弥漫着淡淡的红酒香气，温度26°C，湿度适中。整体氛围压抑而奢华，暗示即将发生的冲突。

【人物】张伟（28岁、身高180cm、西装革履）、李娜（26岁、身高165cm、红色晚礼服）

【动作】
张伟站在落地窗前，背对着李娜。他深深吸了一口气，转身面向李娜，眼中带着复杂的情感。他的右手紧握着玻璃杯，指节泛白。
李娜坐在沙发上，双手紧紧握在一起，眼神不敢与张伟对视。她的呼吸急促，胸口剧烈起伏。

张伟：（低沉地）你知道我为什么来找你。
李娜：（颤抖）我...我不知道你说什么。

【声音】
环境音：窗外雷声滚滚，雨点拍打玻璃的清脆声响
音效：玻璃杯撞击桌面的声音，衣料摩擦声
背景音乐：低沉的大提琴独奏，营造压抑氛围

【镜头】
开场：全景镜头，从客厅缓缓推入
中景：中景镜头，聚焦张伟和李娜的对峙
特写：特写张伟的眼神，放大内心的纠结
运镜节奏：缓慢而稳定，营造紧张感

【AI创作关键提示词】
- 情绪基调：紧张压抑、情感冲突
- 视觉风格：电影感、奢华冷艳
- 关键道具：红酒杯、水晶吊灯、落地窗
- 情节转折点：真相即将揭露，关系面临考验
- 下集预告线索：张伟手中握有重要证据
- 色彩倾向：暖色调为主，冷色调对比
- 音乐风格：古典音乐，低沉压抑
- 镜头风格：稳定器拍摄，缓慢推拉`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: prompt }
    ];

    const response = await client.invoke(messages, {
      model: process.env.ARK_MODEL || 'ep-20260411122808-27xnp',
      temperature: 0.8,
    });

    res.json({ content: response.content });
  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({ error: '剧本生成失败，请重试' });
  }
});

/**
 * POST /api/v1/novel/prologue
 * 生成楔子（第零章）
 * Body: { 
 *   worldName: string, 
 *   eraBackground: string, 
 *   seasonSetting: string,
 *   protagonistDoing: string,
 *   region: string,
 *   cityLocation: string,
 *   title: string,
 *   maleCharacter?: object,
 *   femaleCharacter?: object
 * }
 */
router.post('/prologue', async (req: Request, res: Response) => {
  const { worldName, eraBackground, seasonSetting, protagonistDoing, region, cityLocation, title, maleCharacter, femaleCharacter } = req.body;

  if (!worldName) {
    return res.status(400).json({ error: '缺少世界名称参数' });
  }

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
  res.setHeader('Connection', 'keep-alive');

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config({
  apiKey: process.env.ARK_API_KEY,
  baseUrl: process.env.ARK_BASE_URL,
});
    const client = new LLMClient(config, customHeaders);

    // 先收集主角名称，以便在 systemPrompt 中使用
    let protagonistNames: string[] = [];
    if (maleCharacter) {
      const mc = maleCharacter as any;
      protagonistNames.push(mc.name || '未知');
    }
    if (femaleCharacter) {
      const fc = femaleCharacter as any;
      protagonistNames.push(fc.name || '未知');
    }

    const systemPrompt = `你是一位专业的小说作家，擅长以第三人称旁观者视角进行叙述。
你的叙述风格客观、细腻，善于描绘宏大的世界观和细腻的人物情感。
你创作的第一章能够引人入胜，让读者对故事产生强烈的阅读兴趣。

【核心创作原则 - 绝对必须遵守】

1. **绝对必须使用设定的主角【最高优先级】**：
   - ⚠️ 必须使用以下角色：${protagonistNames.join('、') || '无'}
   - ⚠️ 绝对禁止自己创造新的主角替代用户设定的角色
   - ⚠️ 绝对禁止使用随机生成的角色信息
   - 必须体现主角的姓名、性别、年龄、学历、职业、性格、外貌、背景等所有设定
   - 必须体现主角所属团体、职位等设定
   - 每一个细节都必须与角色设定保持一致
   - 【强制检查】在输出内容之前，请务必检查是否使用了设定的主角姓名和特征

2. 学历决定认知：
   - 角色的学历直接决定了他们的知识水平、表达方式和分析能力
   - 低学历角色说话简单直白，不会使用专业术语，不会进行复杂的分析和推理
   - 高学历角色表达专业、有逻辑，善于分析问题

3. 禁止学历违和：
   - 绝对不能让角色说出超出其学历认知范围的话
   - 角色的每一句话、每一个行为都必须与其学历相符

4. 角色行为一致性：
   - 角色的所有行为必须符合其性格、背景和能力设定
   - 不能做出与角色设定不符的行为或决策

5. 关于临时角色创建：
   - 本章节只需要引入已设定的主角（${protagonistNames.join('、') || '无'}）
   - 不要创建额外的配角或临时角色
   - 如需提及路人或其他角色，只需简单描述其身份（如"一个路人"、"服务员"），不需要命名
   - 绝对不要创建名为"路人"、"服务员"等的角色对象

请严格遵守每个角色的设定，确保人物形象真实可信，绝对不要随意创造新的角色特征。`;

    // 构建角色信息（强化版）
    let characterInfo = '';

    if (maleCharacter) {
      const mc = maleCharacter as any;
      characterInfo += `【男主角信息】
- 姓名：${mc.name || '未知'}
- 年龄：${mc.age || '未知'}岁
- 性别：${mc.gender || '男'}
- 学历：${mc.education || '未设定'}
- 职业：${mc.occupation || '未设定'}
- 所属团体：${mc.group || '未设定'}
- 职位：${mc.position || '未设定'}
- 性格：${mc.personality || '未设定'}
- 外貌特征：${mc.appearance || '未设定'}
- 背景故事：${mc.background || '未设定'}
- 能力/特长：${mc.ability || '未设定'}

`;
    }
    if (femaleCharacter) {
      const fc = femaleCharacter as any;
      characterInfo += `【女主角信息】
- 姓名：${fc.name || '未知'}
- 年龄：${fc.age || '未知'}岁
- 性别：${fc.gender || '女'}
- 学历：${fc.education || '未设定'}
- 职业：${fc.occupation || '未设定'}
- 所属团体：${fc.group || '未设定'}
- 职位：${fc.position || '未设定'}
- 性格：${fc.personality || '未设定'}
- 外貌特征：${fc.appearance || '未设定'}
- 背景故事：${fc.background || '未设定'}
- 能力/特长：${fc.ability || '未设定'}

`;
    }

    // 构建主角活动描述
    const protagonistActivity = protagonistDoing 
      ? `\n【主角初始状态】\n主角当前正在：${protagonistDoing}\n`
      : '';

    // 构建地域描述
    const regionDescriptions: Record<string, string> = {
      '东部': '东部沿海地区，经济发达，都市繁华，高楼林立，人流如织',
      '南部': '南部湿热之地，四季如夏，椰风海韵，热带风情浓郁',
      '西部': '西部荒凉辽阔，大漠孤烟，长河落日，苍茫壮美',
      '北部': '北部寒冷之地，冰天雪地，银装素裹，寒风凛冽',
      '中部': '中部腹地，山川秀美，人杰地灵，历史悠久'
    };

    const regionDesc = region ? `\n- 所处地域：${region}（${regionDescriptions[region] || '特征待定'}）` : '';
    const cityDesc = cityLocation ? `\n- 具体地点：${cityLocation}` : '';
    const locationDesc = (region || cityLocation) ? `\n【地理位置】${regionDesc}${cityDesc}` : '';

    const userPrompt = `请为小说《${title || '未命名'}》创作第一章。

【世界设定】
- 世界名称：${worldName}
- 年代背景：${eraBackground || '现代社会'}
- 季节情况：${seasonSetting || '春季'}
${locationDesc}
【主要角色】
${characterInfo || '暂无特定角色设定'}
${protagonistActivity}
【创作要求】
1. 开篇必须先介绍世界：描述${worldName}的宏大背景，包括它在宇宙/世界中的位置、存在的历史、独特的特征等。例如："在茫茫宇宙中，${worldName}......"

2. 年代背景融入：根据"${eraBackground || '现代社会'}"的设定，描述这个时代的特征。如果是现代社会，要展现繁华的都市景象；如果是古代，要描绘古典的建筑与风俗；如果是未来，要呈现科技的进步。

3. 季节氛围渲染：将"${seasonSetting || '春季'}"的氛围融入场景描写，让读者感受到季节的气息。

${region ? `4. 地域特色描写：故事发生在${region}地区，请根据该地域的特点（${regionDescriptions[region] || '独特的地理和人文特征'}）来描绘环境，让读者身临其境。${cityLocation ? `具体地点是${cityLocation}，请结合这个城市的特色来描写。` : ''}` : ''}

${region ? '5' : '4'}. 引入主角：在介绍完世界背景后，自然地带入主角的出场。${protagonistDoing ? `主角当前正在"${protagonistDoing}"，请将这个活动自然地融入故事开场，展现主角的状态和处境。` : '展现主角的初步形象和处境。'}

${region ? '6' : '5'}. 字数要求：500字以上。

${region ? '7' : '6'}. 风格要求：第三人称旁观者视角，客观叙述，细节生动。

请直接输出楔子内容，不需要标题和章节号：`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    // 使用流式生成
    const stream = client.stream(messages, {
      model: process.env.ARK_MODEL || 'ep-20260411122808-27xnp',
      temperature: 0.9,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        const content = chunk.content.toString();
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Prologue generation error:', error);
    res.write(`data: ${JSON.stringify({ error: '生成失败，请重试' })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/v1/novel/export-docx
 * 导出小说为Word文档（保留格式）
 * Body: { 
 *   title: string,
 *   chapters: Array<{ title: string; content: string; isPrologue?: boolean }>,
 *   author?: string
 * }
 */
router.post('/export-docx', async (req: Request, res: Response) => {
  const { title, chapters, author } = req.body;

  if (!title || !chapters || !Array.isArray(chapters)) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    // 动态导入docx库
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx');

    // 解析格式标记并创建带格式的TextRun
    const parseFormattedText = (text: string): InstanceType<typeof TextRun>[] => {
      const runs: InstanceType<typeof TextRun>[] = [];
      // 正则匹配各种格式标记
      const regex = /(\*\*.+?\*\*)|(\*.+?\*)|(__.+?__)|(~~.+?~~)|(==.+?==)|([^*_~=]+)/g;
      
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        const matchedText = match[0];
        
        if (match[1]) {
          // 加粗 **text**
          runs.push(new TextRun({
            text: matchedText.slice(2, -2),
            bold: true,
          }));
        } else if (match[2]) {
          // 斜体 *text*
          runs.push(new TextRun({
            text: matchedText.slice(1, -1),
            italics: true,
          }));
        } else if (match[3]) {
          // 下划线 __text__
          runs.push(new TextRun({
            text: matchedText.slice(2, -2),
            underline: {},
          }));
        } else if (match[4]) {
          // 删除线 ~~text~~
          runs.push(new TextRun({
            text: matchedText.slice(2, -2),
            strike: true,
          }));
        } else if (match[5]) {
          // 标记线 ==text==（使用高亮背景）
          runs.push(new TextRun({
            text: matchedText.slice(2, -2),
            highlight: 'yellow',
          }));
        } else if (match[6]) {
          // 普通文本
          runs.push(new TextRun({
            text: matchedText,
          }));
        }
      }
      
      return runs.length > 0 ? runs : [new TextRun({ text })];
    };

    // 构建文档内容
    const children: InstanceType<typeof Paragraph>[] = [];
    
    // 标题
    children.push(new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }));
    
    // 作者信息
    if (author) {
      children.push(new Paragraph({
        text: `作者：${author}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }));
    }
    
    // 分隔线
    children.push(new Paragraph({
      text: '═'.repeat(30),
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }));
    
    // 章节内容
    chapters.forEach((chapter: { title: string; content: string; isPrologue?: boolean }, index: number) => {
      const chapterTitle = chapter.isPrologue ? '楔子' : chapter.title;
      
      // 章节标题
      children.push(new Paragraph({
        text: chapterTitle,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }));
      
      // 章节内容（按段落分割）
      if (chapter.content) {
        const paragraphs = chapter.content.split('\n').filter((p: string) => p.trim());
        paragraphs.forEach((para: string) => {
          children.push(new Paragraph({
            children: parseFormattedText(para),
            spacing: { after: 120 },
            indent: { firstLine: 480 }, // 首行缩进两个字符
          }));
        });
      }
      
      // 章节结束空行
      children.push(new Paragraph({ text: '' }));
    });
    
    // 结尾信息
    children.push(new Paragraph({
      text: '═'.repeat(30),
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    }));
    children.push(new Paragraph({
      text: `创作时间: ${new Date().toLocaleDateString('zh-CN')}`,
      alignment: AlignmentType.CENTER,
    }));
    children.push(new Paragraph({
      text: '由"齐思秒说"生成',
      alignment: AlignmentType.CENTER,
    }));

    // 创建文档
    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });

    // 生成buffer
    const buffer = await Packer.toBuffer(doc);
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.docx"`);
    
    // 发送文件
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Export DOCX error:', error);
    res.status(500).json({ error: '导出Word文档失败' });
  }
});

/**
 * POST /api/v1/novel/export-script-docx
 * 导出剧本为Word文档（保留格式）
 * Body: { 
 *   title: string,
 *   chapterTitle: string,
 *   content: string
 * }
 */
router.post('/export-script-docx', async (req: Request, res: Response) => {
  const { title, chapterTitle, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx');

    // 解析剧本格式并创建带格式的段落
    const parseScriptContent = (text: string): InstanceType<typeof Paragraph>[] => {
      const paragraphs: InstanceType<typeof Paragraph>[] = [];
      const lines = text.split('\n');

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          // 空行
          paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }));
          continue;
        }

        // 场景标题 【场景】xxx 或 场景：xxx
        if (trimmedLine.startsWith('【场景】') || trimmedLine.startsWith('场景：') || trimmedLine.startsWith('场景:')) {
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine.replace(/^[【场景】|场景[：:]]/, '📍 场景：'),
                bold: true,
                size: 28,
                color: '2E4057',
              }),
            ],
            spacing: { before: 200, after: 100 },
            shading: { fill: 'E8F4F8' },
          }));
          continue;
        }

        // 时间设定 【时间】xxx
        if (trimmedLine.startsWith('【时间】') || trimmedLine.startsWith('时间：') || trimmedLine.startsWith('时间:')) {
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine.replace(/^[【时间】|时间[：:]]/, '🕐 时间：'),
                bold: true,
                size: 24,
                color: '4A5568',
              }),
            ],
            spacing: { after: 80 },
          }));
          continue;
        }

        // 人物设定 【人物】xxx
        if (trimmedLine.startsWith('【人物】') || trimmedLine.startsWith('人物：') || trimmedLine.startsWith('人物:')) {
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine.replace(/^[【人物】|人物[：:]]/, '👥 人物：'),
                bold: true,
                size: 24,
                color: '4A5568',
              }),
            ],
            spacing: { after: 80 },
          }));
          continue;
        }

        // 旁白 【旁白】xxx
        if (trimmedLine.startsWith('【旁白】') || trimmedLine.startsWith('旁白：') || trimmedLine.startsWith('旁白:')) {
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine.replace(/^[【旁白】|旁白[：:]]/, '🎙️ 旁白：'),
                italics: true,
                size: 24,
                color: '718096',
              }),
            ],
            spacing: { before: 150, after: 100 },
            indent: { left: 400 },
          }));
          continue;
        }

        // 画面描述 【画面】xxx
        if (trimmedLine.startsWith('【画面】') || trimmedLine.startsWith('画面：') || trimmedLine.startsWith('画面:')) {
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine.replace(/^[【画面】|画面[：:]]/, '🎬 画面：'),
                size: 24,
                color: '2D3748',
              }),
            ],
            spacing: { after: 80 },
            indent: { left: 200 },
          }));
          continue;
        }

        // 音效提示 【音效】xxx
        if (trimmedLine.startsWith('【音效】') || trimmedLine.startsWith('音效：') || trimmedLine.startsWith('音效:')) {
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine.replace(/^[【音效】|音效[：:]]/, '🔊 音效：'),
                bold: true,
                size: 22,
                color: 'D69E2E',
              }),
            ],
            spacing: { after: 80 },
            indent: { left: 200 },
          }));
          continue;
        }

        // 动作描述 （xxx）
        if (trimmedLine.startsWith('（') && trimmedLine.endsWith('）')) {
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                italics: true,
                size: 22,
                color: '805AD5',
              }),
            ],
            spacing: { after: 60 },
            indent: { left: 400 },
          }));
          continue;
        }

        // 对话格式：人物名：台词 或 人物名：台词
        const dialogueMatch = trimmedLine.match(/^([^：:]+)[：:](.+)$/);
        if (dialogueMatch && !trimmedLine.startsWith('【')) {
          const characterName = dialogueMatch[1].trim();
          const dialogue = dialogueMatch[2].trim();
          
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: characterName,
                bold: true,
                size: 26,
                color: 'C53030',
              }),
              new TextRun({
                text: '：',
                bold: true,
                size: 26,
              }),
              new TextRun({
                text: dialogue,
                size: 26,
              }),
            ],
            spacing: { before: 100, after: 80 },
            indent: { left: 300 },
          }));
          continue;
        }

        // 分隔线
        if (trimmedLine === '---' || trimmedLine === '——' || trimmedLine.match(/^[─—\-]{3,}$/)) {
          paragraphs.push(new Paragraph({
            text: '─'.repeat(40),
            alignment: AlignmentType.CENTER,
            spacing: { before: 150, after: 150 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E0' },
            },
          }));
          continue;
        }

        // 普通文本
        paragraphs.push(new Paragraph({
          text: trimmedLine,
          spacing: { after: 80 },
        }));
      }

      return paragraphs;
    };

    const children: InstanceType<typeof Paragraph>[] = [];
    
    // 标题
    children.push(new Paragraph({
      text: `《${title}》`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }));

    children.push(new Paragraph({
      text: '短剧剧本',
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: '短剧剧本',
          size: 32,
          color: '718096',
        }),
      ],
    }));
    
    if (chapterTitle) {
      children.push(new Paragraph({
        text: chapterTitle,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 12, color: 'C53030' },
        },
      }));
    }
    
    // 分隔线
    children.push(new Paragraph({
      text: '═'.repeat(50),
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }));
    
    // 剧本内容
    const scriptParagraphs = parseScriptContent(content);
    children.push(...scriptParagraphs);
    
    // 结尾信息
    children.push(new Paragraph({
      text: '═'.repeat(50),
      alignment: AlignmentType.CENTER,
      spacing: { before: 300 },
    }));
    children.push(new Paragraph({
      text: '由"齐思秒说"AI生成',
      alignment: AlignmentType.CENTER,
      spacing: { before: 100 },
      children: [
        new TextRun({
          text: '由"齐思秒说"AI生成',
          italics: true,
          size: 20,
          color: 'A0AEC0',
        }),
      ],
    }));

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    
    // 使用 ASCII 文件名避免 header 编码问题
    const asciiFilename = `script_${Date.now()}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    // 使用 filename* 参数支持 UTF-8 编码的文件名
    res.setHeader('Content-Disposition', `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(`${title}_剧本.docx`)}`);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Export script DOCX error:', error);
    res.status(500).json({ error: '导出剧本Word文档失败' });
  }
});

/**
 * POST /api/v1/novel/create-temp-character
 * 创建临时角色（AI自动识别未设定的角色）
 * Body: { name: string, novelId: string, context?: string }
 */
router.post('/create-temp-character', async (req: Request, res: Response) => {
  const { name, novelId, context } = req.body;

  if (!name || !novelId) {
    return res.status(400).json({ error: '缺少角色名称或小说ID' });
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config({
  apiKey: process.env.ARK_API_KEY,
  baseUrl: process.env.ARK_BASE_URL,
});
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是一位专业的小说角色设计师，擅长根据上下文创建合理的角色设定。
你需要为小说中提到的角色创建一个临时的、合理的角色档案。`;

    const userPrompt = `请为以下角色创建一个临时的角色档案：

角色名称：${name}
${context ? `相关上下文：${context}` : ''}

请返回以下JSON格式的角色设定（不要有任何多余的文字）：
{
  "name": "角色名",
  "gender": "性别（男/女）",
  "age": 年龄数字,
  "occupation": "职业或身份",
  "personality": "性格特点（50字以内）",
  "appearance": "外貌描述（50字以内）",
  "background": "简要背景故事（100字以内）"
}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await client.invoke(messages, {
      model: process.env.ARK_MODEL || 'ep-20260411122808-27xnp',
      temperature: 0.7,
    });

    // 解析AI返回的角色设定
    let characterData;
    try {
      // 尝试提取JSON部分
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        characterData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析角色设定');
      }
    } catch (parseError) {
      console.error('Failed to parse character data:', parseError);
      // 如果解析失败，创建一个基本的临时角色
      characterData = {
        name: name,
        gender: '未知',
        age: 25,
        occupation: '身份待定',
        personality: '性格随和',
        appearance: '外表普通',
        background: '背景不详'
      };
    }

    res.json({ 
      success: true, 
      character: {
        ...characterData,
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        novelId: novelId,
        roleType: 'temp',
        isTemporary: true,
        createdAt: Date.now()
      }
    });
  } catch (error) {
    console.error('Create temp character error:', error);
    res.status(500).json({ error: '创建临时角色失败' });
  }
});

/**
 * POST /api/v1/novel/analyze-characters
 * 分析文本中的角色名并匹配/创建角色
 * Body: { text: string, novelId: string, existingCharacters: array }
 */
router.post('/analyze-characters', async (req: Request, res: Response) => {
  const { text, novelId, existingCharacters } = req.body;

  if (!text || !novelId) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config({
  apiKey: process.env.ARK_API_KEY,
  baseUrl: process.env.ARK_BASE_URL,
});
    const client = new LLMClient(config, customHeaders);

    const existingNames = existingCharacters?.map((c: any) => c.name).join('、') || '无';

    const systemPrompt = `你是一位文本分析专家，擅长识别小说文本中的人物名字。`;
    const userPrompt = `请分析以下文本，提取出所有人物名字：

文本：${text}

已知角色：${existingNames}

请返回JSON格式的结果，包含：
{
  "mentionedCharacters": ["名字1", "名字2", ...],
  "newCharacters": ["新角色1", "新角色2", ...]
}

注意：
1. 只返回JSON，不要有多余文字
2. 已知角色不需要出现在newCharacters中
3. 非人名不要包含在内（如地点、物品等）`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await client.invoke(messages, {
      model: process.env.ARK_MODEL || 'ep-20260411122808-27xnp',
      temperature: 0.3,
    });

    // 解析结果
    let result;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { mentionedCharacters: [], newCharacters: [] };
      }
    } catch {
      result = { mentionedCharacters: [], newCharacters: [] };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Analyze characters error:', error);
    res.status(500).json({ error: '分析角色失败' });
  }
});

/**
 * POST /api/v1/novel/identify-relations
 * AI识别角色关系
 * Body: { characterId: string, characterName: string, characterGender: string, novelId: string, novelTitle: string, context: string, existingCharacters: array }
 */
router.post('/identify-relations', async (req: Request, res: Response) => {
  const { characterId, characterName, characterGender, novelId, novelTitle, context, existingCharacters } = req.body;

  if (!characterId || !existingCharacters || existingCharacters.length === 0) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config({
  apiKey: process.env.ARK_API_KEY,
  baseUrl: process.env.ARK_BASE_URL,
});
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是一位专业的小说角色关系分析师，擅长根据角色信息和小说背景识别角色之间可能存在的关系。
你需要根据提供的角色信息，判断该角色与其他角色之间可能存在的关系。

关系类型包括：
- 直系亲属：父亲、母亲、儿子、女儿、爷爷、奶奶、姥爷、姥姥等
- 旁系亲属：哥哥、弟弟、姐姐、妹妹、堂兄弟、表兄弟、叔叔、伯伯、姑姑、舅舅、姨妈、侄子、侄女、外甥、外甥女等
- 姻亲关系：丈夫、妻子、公公、婆婆、岳父、岳母、大舅哥、小舅子、大姨子、小姨子、大伯子、小叔子、大姑子、小姑子、姐夫、妹夫、嫂子、弟媳、妯娌、连襟、女婿、儿媳等

重要规则：
1. 关系必须符合逻辑，例如：小姨子对姐夫应该称呼"姐夫"，不能称呼"哥"
2. 关系要有性别对应，男性角色不能是"嫂子"、"母亲"等女性关系
3. 根据角色的年龄差判断辈分关系
4. 返回的关系必须是标准称谓`;

    const userPrompt = `请分析以下角色与其他角色的关系：

当前角色信息：
- 姓名：${characterName}
- 性别：${characterGender}
- 上下文：${context}

小说标题：${novelTitle}

其他角色列表：
${existingCharacters.map((c: any) => `- ${c.name}（${c.gender}，${c.age}岁，${c.occupation}）`).join('\n')}

请返回JSON格式的结果，包含识别到的关系：
{
  "relations": [
    { "targetName": "角色名", "relationType": "关系类型" },
    ...
  ]
}

注意：
1. 只返回确定的关系，不确定的不要返回
2. 关系类型必须符合性别和辈分逻辑
3. 如果没有明显关系，返回空数组
4. 只返回JSON，不要有多余文字`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await client.invoke(messages, {
      model: process.env.ARK_MODEL || 'ep-20260411122808-27xnp',
      temperature: 0.3,
    });

    // 解析结果
    let result;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { relations: [] };
      }
    } catch {
      result = { relations: [] };
    }

    // 验证关系的性别正确性
    const validRelations = (result.relations || []).filter((rel: any) => {
      const targetChar = existingCharacters.find((c: any) => c.name === rel.targetName);
      if (!targetChar) return false;
      
      // 检查关系是否符合性别
      const maleOnlyRelations = ['父亲', '爷爷', '姥爷', '哥哥', '弟弟', '儿子', '孙子', '外孙', '伯伯', '叔叔', '舅舅', '堂哥', '堂弟', '表哥', '表弟', '丈夫', '公公', '岳父', '大舅哥', '小舅子', '大伯子', '小叔子', '姐夫', '妹夫', '连襟', '女婿', '侄子', '外甥'];
      const femaleOnlyRelations = ['母亲', '奶奶', '姥姥', '姐姐', '妹妹', '女儿', '孙女', '外孙女', '姑姑', '姨妈', '堂姐', '堂妹', '表姐', '表妹', '妻子', '婆婆', '岳母', '大姨子', '小姨子', '大姑子', '小姑子', '嫂子', '弟媳', '妯娌', '儿媳', '侄女', '外甥女'];
      
      if (targetChar.gender === '男' && femaleOnlyRelations.includes(rel.relationType)) return false;
      if (targetChar.gender === '女' && maleOnlyRelations.includes(rel.relationType)) return false;
      
      return true;
    });

    res.json({ success: true, relations: validRelations });
  } catch (error) {
    console.error('Identify relations error:', error);
    res.status(500).json({ error: '识别关系失败' });
  }
});

export default router;
