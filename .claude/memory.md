# 项目进展记录

## 项目名称
**旁观叙事App**（又名：齐思秒说）

---

## 当前状态（2026年4月11日晚）
- ✅ 后端已成功部署到 Render：https://kylinai-1.onrender.com
- ✅ API 测试正常（/api/v1/health 返回 OK）
- ✅ APK 已构建完成
- ⚠️ 小说导入功能：短文件可用，长文件（34万字）处理超时
- ❌ 角色生成器：401 认证错误，环境变量配置问题待修复

---

## 部署信息

### 后端
- **平台**: Render
- **地址**: https://kylinai-1.onrender.com
- **健康检查**: /api/v1/health
- **服务名称**: KylinAI-1
- **构建命令**: `npm install --legacy-peer-deps && npm run build`
- **启动命令**: `NODE_ENV=production PORT=${PORT:-5000} node dist/index.js`

### 前端
- **框架**: Expo / React Native
- **构建方式**: EAS Build
- **项目名**: kylin_0424 / myapp

### 代码仓库
- **GitHub**: https://github.com/Kylin0424/KylinAI
- **本地路径**: `C:\projects\`

---

## AI 服务配置

### 火山引擎方舟（当前使用）
- **API Key**: `8ac43f1d-8e8b-462a-b6fc-e94b7a3567d6`
- **Base URL**: `https://ark.cn-beijing.volces.com/api/v3`
- **推理接入点ID**: `ep-20260411122808-27xnp`
- **模型**: Doubao-1.5-pro-32k
- **免费额度**: 50万 tokens
- **当前剩余**: 约 3.3 万 tokens（2026年4月11日）
- **充值金额**: 1 元人民币

### 扣子 Bot（备选方案）
- **Bot ID**: 7627341821664559146
- **Bot URL**: https://www.coze.cn/space/7622475756576505862/bot/7627341821664559146
- **项目名称**: 旁观叙事APP(最终版)
- **项目地址**: https://code.coze.cn/p/7627398218137206830

---

## Render 环境变量配置

```
ARK_API_KEY=8ac43f1d-8e8b-462a-b6fc-e94b7a3567d6
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_MODEL=ep-20260411122808-27xnp
COZE_CODING_API_KEY=pat_PONYNLuPSNNBeDMeqqMF3Idq61VtGIVxT8oOFFuQWaaB78xKpx7Kz70SXUZV89Wx
COZE_CODING_BASE_URL=https://api.coze.cn
COZE_CODING_MODEL_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
COZE_INTEGRATION_BASE_URL=https://api.coze.cn
COZE_INTEGRATION_MODEL_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
COZE_WORKLOAD_IDENTITY_API_KEY=pat_PONYNLuPSNNBeDMeqqMF3Idq61VtGIVxT8oOFFuQWaaB78xKpx7Kz70SXUZV89Wx
OPENAI_API_KEY=placeholder  # 需要改成火山引擎 API Key
OPENAI_BASE_URL=https://api.openai.com/v1  # 需要改成火山引擎地址
OPENAI_MODEL_BASE_URL=https://api.openai.com/v1
OPEN_API_BASE=https://api.openai.com/v1
```

### 待修复的环境变量
角色生成器使用 `@langchain/openai`，读取 `OPENAI_API_KEY` 和 `OPENAI_BASE_URL`，需要修改为：
```
OPENAI_API_KEY=8ac43f1d-8e8b-462a-b6fc-e94b7a3567d6
OPENAI_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
OPENAI_MODEL_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
OPEN_API_BASE=https://ark.cn-beijing.volces.com/api/v3
```

---

## 核心功能

### 1. 小说导入（/api/v1/import/analyze）
- 支持格式：TXT、DOCX
- 功能：章节识别、角色识别、关系网络
- 当前问题：长文件处理超时（34万字约需8分钟）

### 2. 角色生成（/api/v1/character/generate）
- 功能：AI 生成角色设定
- 当前问题：401 认证错误，环境变量未正确配置

### 3. AI 续写
- 基于锁定的角色设定续写
- 保持人设一致性

---

## 待解决问题

### 优先级1：修复角色生成器
- 去 Render → Environment
- 把 `OPENAI_API_KEY` 改成火山引擎的 Key
- 把 `OPENAI_BASE_URL` 等改成火山引擎地址

### 优先级2：优化 Token 消耗
- 当前方案：处理一部34万字小说约消耗46万 tokens
- 省钱方案：
  1. 换更便宜的模型（Doubao-1.5-lite，价格是 pro 的 1/10）
  2. 半自动章节标记（用户手动标记，不消耗 token）
  3. 只处理前 10-20 万字

### 优先级3：长文件超时
- 方案1：改前端超时时间（2分钟→10分钟）
- 方案2：后台异步处理，完成后通知

---

## 软件架构

### 前端交互流程
```
前端-交互界面 → 打开动画 → 主页面
                            ↓
            ┌───────────────┴───────────────┐
            ↓                               ↓
        导入小说                          角色生成
            ↓                               ↓
        显示导入小说                    角色信息 + 世界背景
            ↓                               ↓
        确定章节（半自动标记）          角色设定确认
            ↓                               ↓
            └───────────────┬───────────────┘
                            ↓
                        小说编辑页面
                            ↓
                        AI续写（保持人设一致）
                            ↓
                        续写完成
                            ↓
                ┌───────────┴───────────┐
                ↓                       ↓
            导出文本                生成标准剧本
```

### 后台服务架构
```
中转站-AI
    ↓
火山引擎方舟 ←→ 扣子API（备选）
    ↓
章节识别 | 角色识别 | 关系网络
    ↓
API & KEY 配置
    ↓
数据库
    ↓
角色库（锁定的角色设定）
```

---

## 技术架构

| 组件 | 技术 |
|------|------|
| 前端框架 | Expo / React Native |
| 后端框架 | Express.js (Node.js) |
| AI SDK | OpenAI SDK、LangChain |
| 文件解析 | Mammoth (DOCX) |
| 部署平台 | Render (后端) / EAS Build (APK) |

---

## 重要提醒

### 代码变更后检查清单
每次修改代码并 git push 后，必须确认：
1. **GitHub 仓库**：是否已更新（检查 commit ID）
2. **Render 后端**：是否自动部署了最新代码（检查部署时间和 commit ID）

### 常用操作
- 热更新（仅 JS/TS 代码修改）：`eas update --branch preview`
- 本地拉取最新代码：`git pull`
- 检查 Render 部署：https://dashboard.render.com/web/srv-d7bjmb7afjfc73f0qttg

---

## 工作流程规范（重要 - 2026年4月30日更新）

### 与开发者协作的完整工作流程

#### 第一步：理解问题
- 听到用户描述问题后，**先静默思考**
- 理解问题的本质是什么
- 分析可能的原因

#### 第二步：与用户确认
- 向用户总结理解的问题
- 确认理解是否正确
- 如有多个可能原因，逐一与用户确认

#### 第三步：沟通实现方案
- 提出实现方案供用户选择
- 解释每个方案的优缺点
- 等待用户确认后再开始代码改动

#### 第四步：思考影响
- 在改动代码前，思考这个改动会造成什么影响
- 检查相关文件是否有联动影响
- 避免造成新的问题

#### 第五步：代码改动
- 按照确认的方案进行代码改动
- 改动完成后进行静态检查

#### 第六步：推送代码
- 改动完成后立即推送到 GitHub
- **必须明确告知 commit 哈希值**

#### 第七步：告知用户
- 告诉用户改动了什么
- 告诉用户需要测试什么
- **提醒用户查看自动部署情况**
- 如果没有自动部署，告知用户手动部署

---

### Git 工作流程（强制执行）

1. **每次代码改动后必须推送**
   ```bash
   git add -A
   git commit -m "描述改动内容"
   git push origin main
   ```

2. **推送后必须告知**
   - commit 哈希值
   - 改动了哪些文件
   - 需要测试什么

3. **部署确认**
   - 提醒用户查看 GitHub 仓库确认 commit
   - 提醒用户查看自动部署情况
   - 如果没有自动部署，提示用户手动部署

---

### 示例流程

```
用户描述问题
  ↓
AI静默分析问题本质
  ↓
向用户总结理解："我理解的问题是XXX，对吗？"
  ↓
用户确认
  ↓
AI提出方案："方案A是...，方案B是...，推荐方案B因为..."
  ↓
用户选择方案
  ↓
AI思考改动影响："这个改动会影响XXX"
  ↓
AI开始编写代码
  ↓
代码完成，推送 git push
  ↓
告知用户：
  - commit: abc1234
  - 改动了: 文件A, 文件B
  - 测试: 请测试XXX功能
  - 提醒: 请查看自动部署情况
```

---

### 重要提醒

- **禁止不假思索直接改动代码**
- **禁止改动后不推送就结束**
- **禁止不告诉用户 commit 哈希值**
- **必须提醒用户测试和部署**

---

## 关系显示问题分析（2026年5月1日）

### 问题现象
- 关系显示为"家庭关系"而不是"朋友"、"同事"等具体关系
- 部分关系显示英文（如 uncle）

### 问题根源
1. **前端 `mapRelationToKey` 函数**（`client/screens/character-result/index.tsx` 第66-132行）
   - 负责将 AI 返回的中文关系名称转换为英文 ID
   - 如果没有匹配到任何已知关系，默认返回 `'family'`
   - 之前缺少"发小"、"哥们"等社会关系的映射

2. **后端 `relationTypeMap`**（`server/src/routes/character.ts`）
   - 负责将英文 ID 转换为中文显示
   - 缺少部分映射如 `'family': '家庭关系'`

3. **前端 `getRelationLabel` 函数**（`client/screens/character-list/index.tsx`）
   - 负责在角色库页面显示关系标签
   - 使用 `ADDITIONAL_RELATION_LABELS` 映射表

### 修复方案
1. 扩展 `mapRelationToKey` 函数，添加更多社会关系映射：
   - 发小 → childhood_friend
   - 哥们 → buddy
   - 战友 → comrade
   - 室友 → roommate
   - 邻居 → neighbor
   - 老板/上司 → boss
   - 客户 → client
   - 合作伙伴 → partner
   - 校友/同学 → classmate
   - 队友 → teammate
   - 粉丝 → fan
   - 偶像 → idol
   - 对手 → adversary
   - 宿敌 → arch_rival
   - 恩人 → benefactor
   - 熟人 → acquaintance
   - 亲戚 → relative

2. 后端 `relationTypeMap` 添加映射：
   - `'uncle': '舅舅/伯伯/叔叔'`
   - `'family': '家庭关系'`
   - `'adversary': '对手'`
   - `'arch_rival': '宿敌'`

3. 前端 `ADDITIONAL_RELATION_LABELS` 已有完整映射

---

## 未解决问题清单（重新编号，共7个）

| 序号 | 问题描述 | 优先级 | 备注 |
| ---- | -------- | ------ | ---- |
| 1 | AI未使用主角信息问题 | ●高 | 待确认是否已修复 |
| 2 | 正在创作页面添加配角无限转圈 | ●高 | 待修复 |
| 3 | 添加配角支持多人选择功能 | □中 | 部分解决，待完善 |
| 4 | 分隔符插入位置提示方式（显示在点击行） | □中 | 待修复 |
| 5 | 搜索功能只显示已提取章节 | □中 | 待修复 |
| 6 | 上下章节按钮文本内容不滚动 | □中 | 与问题5相关，待修复 |
| 7 | 导入小说完成导入按钮无反应 | □中 | 待修复 |
| 8 | 生成剧本角色一致性不完美 | □低 | 部分解决，优化提示词 |

## 已解决问题（供参考）
1. ✅ 角色生成器职业输入偶尔问题（可忽略）
2. ✅ 角色关系显示汉字
3. ✅ 角色详情返回按钮
4. ✅ 角色库频繁刷新（状态保持）
5. ✅ 搜索输入框移到下方

---

## 已完成里程碑

1. ✅ 注册 Render 账号并绑定 Visa 卡
2. ✅ 后端部署到 Render
3. ✅ 配置火山引擎方舟 API
4. ✅ 小说导入 API 调用成功
5. ✅ APK 构建
6. ✅ 软件架构图绘制
7. ✅ 建立与开发者协作的工作流程规范
