import express, { type Request, type Response } from 'express';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

const router = express.Router();

/**
 * POST /api/v1/search/synonyms
 * 获取关键词的近义词
 * Body: { keyword: string }
 */
router.post('/synonyms', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword || typeof keyword !== 'string') {
      return res.status(400).json({ error: '关键词不能为空' });
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);

    // 初始化 LLM 客户端
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建提示词
    const systemPrompt = `你是一个中文近义词词典助手。当用户提供一个词语时，你需要返回该词语的近义词或同义词列表。
规则：
1. 只返回常见的、意思相近的词语
2. 词语之间用逗号分隔
3. 不要返回任何解释或多余内容
4. 只返回词语列表`;

    const userPrompt = `请为"${keyword}"提供近义词，只返回词语列表，用逗号分隔：`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    // 使用非流式生成
    const response = await client.invoke(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.3,
    });

    const content = response.content || '';

    // 解析响应
    const synonyms = content
      .split(/[,，、\s]+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && s !== keyword);

    // 去重
    const uniqueSynonyms = [...new Set(synonyms)].slice(0, 10);

    res.json({ 
      keyword,
      synonyms: uniqueSynonyms 
    });
  } catch (error) {
    console.error('Synonym search error:', error);
    res.status(500).json({ error: '获取近义词失败' });
  }
});

export default router;
