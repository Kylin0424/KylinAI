import express, { type Request, type Response } from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import { LLMClient, Config, HeaderUtils, ImageGenerationClient } from 'coze-coding-dev-sdk';

const router = express.Router();

// 中文数字转阿拉伯数字
function chineseToNumber(str: string): number {
  const chineseNums: { [key: string]: number } = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
    '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
    '十': 10, '百': 100, '千': 1000, '万': 10000,
  };
  
  let result = 0;
  let temp = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const num = chineseNums[char];
    
    if (num === undefined) continue;
    
    if (num >= 10) {
      if (temp === 0) temp = 1;
      result += temp * num;
      temp = 0;
    } else {
      temp = num;
    }
  }
  
  return result + temp;
}

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 限制10MB
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = [
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const allowedExtensions = ['.txt', '.doc', '.docx'];
    
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，仅支持 TXT、DOC、DOCX'));
    }
  },
});

/**
 * 解析文件内容
 */
async function parseFileContent(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (ext === '.txt') {
    // TXT文件直接读取
    return buffer.toString('utf-8');
  } else if (ext === '.docx' || ext === '.doc') {
    // DOCX/DOC使用mammoth解析
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  
  throw new Error('不支持的文件格式');
}

/**
 * POST /api/v1/import/analyze
 * 上传并分析小说文件，识别角色
 * Body: FormData with file field
 */
router.post('/analyze', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传文件' });
  }

  try {
    // 解析文件内容
    const content = await parseFileContent(req.file.buffer, req.file.originalname);
    
    if (!content || content.trim().length < 100) {
      return res.status(400).json({ error: '文件内容过短，无法分析' });
    }

    console.log(`[Import] 文件内容长度: ${content.length} 字符`);

    // 提取小说标题（从文件名或内容中）
    const titleFromFilename = req.file.originalname.replace(/\.(txt|doc|docx)$/i, '');

    // 使用AI分析内容，识别角色
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    typescript
const config = new Config({
  apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
  baseUrl: process.env.COZE_INTEGRATION_BASE_URL || 'https://api.coze.cn',
});
    const client = new LLMClient(config, customHeaders);

    // 第一步：AI分析角色和主题（使用前10万字）
    const maxContentLength = 100000;
    const truncatedContent = content.length > maxContentLength 
      ? content.substring(0, maxContentLength)
      : content;

    const systemPrompt = `你是一位专业的小说分析师，擅长从文本中识别和分析角色。
你需要仔细阅读小说内容，识别出所有重要角色，并为他们生成详细的设定。

识别角色的标准：
1. 有名字的角色
2. 有台词或行动描述的角色
3. 对剧情有影响的角色

注意：
- 识别所有重要角色，不限制数量
- 主角和主要配角要详细分析
- 只出现一次的路人角色可以忽略
- 要从文本中推断角色的各种属性`;

    const userPrompt = `请分析以下小说内容，识别所有重要角色：

【小说内容】
${truncatedContent}

请识别所有重要角色，并返回以下JSON格式：

{
  "title": "从内容中推断的小说标题",
  "themeType": "小说类型（都市/玄幻/仙侠/历史/科幻/悬疑等）",
  "characters": [
    {
      "name": "角色姓名",
      "gender": "性别（男/女）",
      "age": "年龄（如25）",
      "height": "身高（如175cm）",
      "occupation": "职业",
      "education": "学历",
      "personality": "性格特点（50字以内）",
      "appearance": "外貌特征（50字以内）",
      "experience": "经历（50字以内）",
      "familyBackground": "家庭背景（30字以内）",
      "specialTraits": "特殊特质（30字以内）",
      "isProtagonist": true或false,
      "roleType": "主角或男主或女主或配角或反派",
      "relationships": [
        {
          "targetName": "关系对象角色名",
          "relationType": "关系类型",
          "description": "关系描述（20字以内）"
        }
      ]
    }
  ],
  "plotSummary": "剧情概要（100字以内）",
  "worldSetting": "世界观设定（50字以内）"
}

【重要提示】
1. 识别所有有台词或行动的重要角色，不限制数量
2. 字符串值中不要包含换行符、引号等特殊字符
3. 确保返回的是合法的JSON格式
4. 数组元素之间必须有逗号分隔

只返回JSON，不要有其他任何文字或markdown格式。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt }
    ];

    const response = await client.invoke(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.3,
    });

    // 解析返回的JSON
    let analysisResult;
    try {
      const responseContent = response.content;
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        
        try {
          analysisResult = JSON.parse(jsonStr);
        } catch (firstParseError) {
          console.log('First parse attempt failed, trying to fix JSON...');
          
          jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
          jsonStr = jsonStr.replace(/}\s*{/g, '},{');
          jsonStr = jsonStr.replace(/]\s*\[/g, '],[');
          
          try {
            analysisResult = JSON.parse(jsonStr);
          } catch (secondParseError) {
            console.log('Second parse attempt failed, trying partial parsing...');
            
            const titleMatch = jsonStr.match(/"title"\s*:\s*"([^"]*)"/);
            const themeTypeMatch = jsonStr.match(/"themeType"\s*:\s*"([^"]*)"/);
            const plotSummaryMatch = jsonStr.match(/"plotSummary"\s*:\s*"([^"]*)"/);
            const worldSettingMatch = jsonStr.match(/"worldSetting"\s*:\s*"([^"]*)"/);
            
            const charactersMatch = jsonStr.match(/"characters"\s*:\s*\[([\s\S]*?)\]\s*,?\s*"(plotSummary|worldSetting|chapters)"/);
            let characters: any[] = [];
            if (charactersMatch) {
              try {
                const charStr = '[' + charactersMatch[1] + ']';
                const fixedCharStr = charStr.replace(/}\s*{/g, '},{');
                characters = JSON.parse(fixedCharStr);
              } catch (e) {
                console.log('Failed to parse characters array:', e);
              }
            }
            
            analysisResult = {
              title: titleMatch ? titleMatch[1] : titleFromFilename,
              themeType: themeTypeMatch ? themeTypeMatch[1] : '都市',
              characters: characters,
              plotSummary: plotSummaryMatch ? plotSummaryMatch[1] : '',
              worldSetting: worldSettingMatch ? worldSettingMatch[1] : '',
            };
          }
        }
      } else {
        throw new Error('无法解析AI返回结果');
      }
    } catch (parseError) {
      console.error('Failed to parse analysis result:', parseError);
      return res.status(500).json({ error: '分析结果解析失败，请重试' });
    }

    // 第二步：AI分段识别章节
    console.log('[Import] 开始AI分段识别章节...');
    const allChapters: { originalTitle: string; order: number; startText: string }[] = [];
    
    // 每次处理5万字，有2万字重叠以避免章节被截断
    const segmentSize = 50000;
    const overlapSize = 20000;
    let segmentStart = 0;
    let segmentIndex = 0;
    
    while (segmentStart < content.length) {
      const segmentEnd = Math.min(segmentStart + segmentSize, content.length);
      const segmentContent = content.substring(segmentStart, segmentEnd);
      
      console.log(`[Import] 处理第 ${segmentIndex + 1} 段，位置 ${segmentStart}-${segmentEnd}`);
      
      // AI识别这一段中的章节
      const chapterPrompt = `请识别以下小说片段中的所有章节标题。

【小说片段】
${segmentContent}

请识别所有章节标题（如"第一章"、"第1章"、"第十章 重生"等），返回以下JSON格式：

{
  "chapters": [
    {
      "originalTitle": "原文章节标题完整内容",
      "order": 章节序号（数字）,
      "startText": "该章节开头的前50个字符（用于定位）"
    }
  ]
}

【重要提示】
1. 只识别"第X章"格式的章节标题
2. 不要遗漏任何章节
3. startText必须是章节标题后正文的前50个字符
4. 确保返回合法JSON

只返回JSON，不要有其他任何文字。`;

      try {
        const chapterResponse = await client.invoke([
          { role: 'user' as const, content: chapterPrompt }
        ], {
          model: 'doubao-seed-1-8-251228',
          temperature: 0.1,
        });

        const chapterJsonMatch = chapterResponse.content.match(/\{[\s\S]*\}/);
        if (chapterJsonMatch) {
          try {
            const chapterResult = JSON.parse(chapterJsonMatch[0]);
            if (chapterResult.chapters && Array.isArray(chapterResult.chapters)) {
              // 为每个章节添加全文位置偏移
              for (const ch of chapterResult.chapters) {
                // 使用startText在全文中定位
                if (ch.startText && ch.startText.length >= 10) {
                  const fullPos = content.indexOf(ch.startText);
                  if (fullPos !== -1) {
                    // 检查是否已经识别过这个章节
                    const exists = allChapters.some(c => c.order === ch.order);
                    if (!exists) {
                      allChapters.push({
                        originalTitle: ch.originalTitle,
                        order: ch.order,
                        startText: ch.startText,
                      });
                      console.log(`[Import] 识别到章节: ${ch.originalTitle}`);
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.log(`[Import] 第 ${segmentIndex + 1} 段章节解析失败:`, e);
          }
        }
      } catch (e) {
        console.log(`[Import] 第 ${segmentIndex + 1} 段AI调用失败:`, e);
      }

      segmentStart = segmentEnd - overlapSize;
      if (segmentStart <= segmentEnd - segmentSize) {
        segmentStart = segmentEnd; // 避免无限循环
      }
      segmentIndex++;
      
      // 如果已经处理到文件末尾，退出
      if (segmentEnd >= content.length) break;
    }

    console.log(`[Import] AI共识别到 ${allChapters.length} 个章节`);

    // 按章节序号排序
    allChapters.sort((a, b) => a.order - b.order);

    // 返回分析结果
    res.json({
      success: true,
      title: analysisResult.title || titleFromFilename,
      themeType: analysisResult.themeType || '都市',
      characters: analysisResult.characters || [],
      chapters: allChapters,
      plotSummary: analysisResult.plotSummary || '',
      worldSetting: analysisResult.worldSetting || '',
      contentLength: content.length,
      filename: req.file.originalname,
      originalContent: content,
    });

  } catch (error) {
    console.error('Import analysis error:', error);
    if (error instanceof Error) {
      if (error.message.includes('不支持的文件格式')) {
        return res.status(400).json({ error: error.message });
      }
    }
    res.status(500).json({ error: '分析失败，请重试' });
  }
});

/**
 * POST /api/v1/import/generate-avatars
 * 为识别出的角色批量生成头像
 * Body: { characters: array }
 */
router.post('/generate-avatars', async (req: Request, res: Response) => {
  const { characters } = req.body;

  if (!characters || !Array.isArray(characters) || characters.length === 0) {
    return res.status(400).json({ error: '缺少角色数据' });
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    typescript
const config = new Config({
  apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
  baseUrl: process.env.COZE_INTEGRATION_BASE_URL || 'https://api.coze.cn',
});
    const imageClient = new ImageGenerationClient(config, customHeaders);

    const results: { name: string; avatarUrl?: string; error?: string }[] = [];

    // 逐个生成头像（避免并发过多）
    for (const character of characters.slice(0, 5)) { // 最多生成5个头像
      try {
        const prompt = `A realistic portrait photo of a ${character.gender === '男' ? 'male' : character.gender === '女' ? 'female' : 'person'} character.

Character details:
- Name: ${character.name}
- Age: ${character.age || '25'} years old
${character.height ? `- Height: ${character.height}` : ''}
${character.occupation ? `- Occupation: ${character.occupation}` : ''}

${character.appearance ? `Physical appearance: ${character.appearance}` : ''}

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
          results.push({
            name: character.name,
            avatarUrl: helper.imageUrls[0],
          });
        } else {
          results.push({
            name: character.name,
            error: '头像生成失败',
          });
        }
      } catch (charError) {
        console.error(`Avatar generation failed for ${character.name}:`, charError);
        results.push({
          name: character.name,
          error: '头像生成失败',
        });
      }
    }

    res.json({
      success: true,
      results,
    });

  } catch (error) {
    console.error('Avatar generation error:', error);
    res.status(500).json({ error: '头像生成失败' });
  }
});

/**
 * POST /api/v1/import/extract-chapters
 * 从内容中提取章节
 * Body: { content: string }
 */
router.post('/extract-chapters', async (req: Request, res: Response) => {
  const { content } = req.body;

  if (!content || content.trim().length < 100) {
    return res.status(400).json({ error: '内容过短' });
  }

  try {
    // 使用正则表达式识别章节
    // 常见的章节格式：
    // 第一章 xxx / 第1章 xxx / 第一章：xxx / 第一章、xxx
    // 第一章 / 第1章 / 楔子 / 序章 / 尾声
    const chapterPatterns = [
      /第[零一二三四五六七八九十百千万0-9]+[章回节集部卷][：:\s]*(.*?)$/gm,
      /^[零一二三四五六七八九十]+[、.．]\s*(.*?)$/gm,
      /^楔子[：:\s]*(.*?)$/gm,
      /^序章[：:\s]*(.*?)$/gm,
      /^尾声[：:\s]*(.*?)$/gm,
    ];

    interface ChapterInfo {
      title: string;
      startIndex: number;
      endIndex: number;
    }

    const chapters: ChapterInfo[] = [];
    
    // 按行分析
    const lines = content.split('\n');
    let currentChapter: ChapterInfo | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检查是否是章节标题
      let isChapterTitle = false;
      let chapterTitle = '';

      for (const pattern of chapterPatterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(line);
        if (match) {
          isChapterTitle = true;
          chapterTitle = line;
          break;
        }
      }

      if (isChapterTitle) {
        // 保存上一章
        if (currentChapter) {
          currentChapter.endIndex = i - 1;
          chapters.push(currentChapter);
        }
        // 开始新章节
        currentChapter = {
          title: chapterTitle,
          startIndex: i + 1,
          endIndex: lines.length - 1,
        };
      }
    }

    // 保存最后一章
    if (currentChapter) {
      chapters.push(currentChapter);
    }

    // 提取章节内容
    const resultChapters = chapters.map((ch, index) => {
      const contentLines = lines.slice(ch.startIndex, ch.endIndex + 1);
      return {
        title: ch.title,
        content: contentLines.join('\n').trim(),
        wordCount: contentLines.join('').length,
      };
    });

    res.json({
      success: true,
      chapters: resultChapters,
      totalChapters: resultChapters.length,
    });

  } catch (error) {
    console.error('Chapter extraction error:', error);
    res.status(500).json({ error: '章节提取失败' });
  }
});

export default router;
