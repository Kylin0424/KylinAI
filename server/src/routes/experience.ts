import { Router } from 'express';

const router = Router();

interface SummarizeRequest {
  characterName: string;
  experiences: string[];
  currentContent: string;
}

router.post('/summarize-experiences', async (req, res) => {
  try {
    const { characterName, experiences, currentContent }: SummarizeRequest = req.body;

    if (!characterName || !experiences || !currentContent) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 构建AI提示词
    const systemPrompt = `你是一个角色背景整合专家。你的任务是将多条角色经历整合成1-2条精炼的摘要。

【整合原则】
1. 将多条相关经历合并成1-2条精炼摘要
2. 保留关键事件和转折点
3. 去除重复和细节，保留核心信息
4. 每条摘要控制在50字以内
5. 只输出摘要，不要其他内容

【输出格式】
只输出一条简短摘要，例如：
"高中打架险些退学，被父亲送入部队，入伍第一天与连长发生冲突"

不要输出任何解释或说明文字。`;

    const userPrompt = `角色名称：${characterName}

近期经历（需要整合）：
${experiences.map((exp, i) => `${i + 1}. ${exp}`).join('\n')}

请将以上经历整合成1-2条精炼的摘要。`;

    // 调用AI整合
    const response = await fetch(process.env.LLM_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/bubble/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLM_API_KEY}`
      },
      body: JSON.stringify({
        model: 'doubao-seed-250828',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return res.status(500).json({ error: 'AI整合失败' });
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || null;

    res.json({ summary });
  } catch (error) {
    console.error('Error summarizing experiences:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
