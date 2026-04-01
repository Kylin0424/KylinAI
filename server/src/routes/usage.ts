import express from 'express';

const router = express.Router();

// 支持的大模型配置
export const AI_MODELS = [
  {
    id: 'doubao-seed',
    name: '豆包大模型',
    provider: '字节跳动',
    dailyLimit: 500,
    description: '扣子基础版免费额度，每日500次',
    isFree: true,
  },
  {
    id: 'doubao-pro',
    name: '豆包Pro',
    provider: '字节跳动',
    dailyLimit: 100,
    description: '高级版本，每日100次免费体验',
    isFree: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: '深度求索',
    dailyLimit: 50,
    description: '每日50次免费体验',
    isFree: true,
  },
  {
    id: 'kimi',
    name: 'Kimi',
    provider: '月之暗面',
    dailyLimit: 50,
    description: '每日50次免费体验',
    isFree: true,
  },
  {
    id: 'qwen',
    name: '通义千问',
    provider: '阿里巴巴',
    dailyLimit: 50,
    description: '每日50次免费体验',
    isFree: true,
  },
];

// 模拟存储每日调用次数
const dailyUsage: Record<string, { 
  count: number; 
  date: string;
  modelId: string;
}> = {};

// 获取今日日期字符串
const getTodayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// 获取可用的大模型列表
router.get('/models', (req, res) => {
  res.json({
    success: true,
    data: AI_MODELS.map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      dailyLimit: model.dailyLimit,
      description: model.description,
      isFree: model.isFree,
    })),
  });
});

// 获取AI调用次数信息
router.get('/ai-calls', (req, res) => {
  const today = getTodayKey();
  const deviceId = req.headers['x-device-id'] as string || 'default';
  const modelId = req.query.modelId as string || 'doubao-seed';
  
  // 查找模型配置
  const model = AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0];
  
  const usageKey = `${deviceId}-${modelId}-${today}`;
  
  // 获取今日已调用次数
  const todayUsage = dailyUsage[usageKey] || { count: 0, date: today, modelId };
  
  // 如果是新的一天，重置计数
  if (todayUsage.date !== today) {
    todayUsage.count = 0;
    todayUsage.date = today;
  }
  
  const remainingCalls = Math.max(0, model.dailyLimit - todayUsage.count);
  
  res.json({
    success: true,
    data: {
      modelId: model.id,
      modelName: model.name,
      modelProvider: model.provider,
      todayCalls: todayUsage.count,
      dailyLimit: model.dailyLimit,
      remainingCalls,
      resetTime: '每日0点重置',
      description: model.description,
    }
  });
});

// 获取所有模型的调用次数统计
router.get('/ai-calls/all', (req, res) => {
  const today = getTodayKey();
  const deviceId = req.headers['x-device-id'] as string || 'default';
  
  const allUsage = AI_MODELS.map(model => {
    const usageKey = `${deviceId}-${model.id}-${today}`;
    const usage = dailyUsage[usageKey] || { count: 0, date: today };
    const count = usage.date === today ? usage.count : 0;
    
    return {
      modelId: model.id,
      modelName: model.name,
      modelProvider: model.provider,
      todayCalls: count,
      dailyLimit: model.dailyLimit,
      remainingCalls: Math.max(0, model.dailyLimit - count),
      description: model.description,
    };
  });
  
  res.json({
    success: true,
    data: allUsage,
  });
});

// 切换模型（保存用户选择）
router.post('/ai-calls/select-model', (req, res) => {
  const { modelId } = req.body;
  
  // 验证模型是否存在
  const model = AI_MODELS.find(m => m.id === modelId);
  if (!model) {
    return res.status(400).json({
      success: false,
      error: '无效的模型ID',
    });
  }
  
  res.json({
    success: true,
    data: {
      modelId: model.id,
      modelName: model.name,
    }
  });
});

// 增加调用次数（内部使用）
router.post('/ai-calls/increment', (req, res) => {
  const today = getTodayKey();
  const deviceId = req.headers['x-device-id'] as string || 'default';
  const { modelId = 'doubao-seed' } = req.body;
  
  const usageKey = `${deviceId}-${modelId}-${today}`;
  
  if (!dailyUsage[usageKey]) {
    dailyUsage[usageKey] = { count: 0, date: today, modelId };
  }
  
  dailyUsage[usageKey].count += 1;
  
  res.json({
    success: true,
    data: {
      todayCalls: dailyUsage[usageKey].count,
    }
  });
});

export default router;
