# 齐思妙说 - 鸿蒙原生应用

## 项目概述

本项目是基于 **ArkTS** 开发的鸿蒙原生应用，实现了 AI 驱动的小说生成功能。用户可以设置世界背景，AI 自动生成楔子，并支持多章节创作。

---

## 技术栈

- **开发语言**: ArkTS (TypeScript 扩展)
- **IDE**: DevEco Studio 5.0+
- **SDK**: HarmonyOS NEXT (API 12+)
- **架构**: 声明式 UI (ArkUI)

---

## 项目结构

```
harmony-app/
├── AppScope/                          # 应用全局配置
│   ├── app.json5                      # 应用配置
│   └── resources/base/element/        # 全局字符串资源
│       └── string.json
├── entry/                             # 入口模块
│   ├── src/main/
│   │   ├── ets/
│   │   │   ├── entryability/          # 应用入口
│   │   │   │   └── EntryAbility.ets
│   │   │   ├── components/            # 公共组件
│   │   │   │   └── CommonComponents.ets
│   │   │   ├── models/                # 数据模型
│   │   │   │   └── Novel.ets
│   │   │   ├── pages/                 # 页面
│   │   │   │   ├── Index.ets          # 首页
│   │   │   │   ├── NovelWriting.ets   # 创作页
│   │   │   │   └── WorksList.ets      # 作品列表
│   │   │   └── services/              # 服务层
│   │   │       ├── AIService.ets      # AI 调用
│   │   │       └── StorageService.ets # 本地存储
│   │   ├── resources/                 # 资源文件
│   │   │   ├── base/
│   │   │   │   ├── element/           # 颜色、字符串
│   │   │   │   ├── media/             # 图片资源
│   │   │   │   └── profile/           # 路由配置
│   │   │   │       └── main_pages.json
│   │   │   └── rawfile/               # 原始资源
│   │   └── module.json5               # 模块配置
├── build-profile.json5                # 构建配置
├── hvigorfile.ts                      # 构建脚本
├── oh-package.json5                   # 依赖管理
└── README.md
```

---

## 快速开始

### 1. 环境准备

#### 安装 DevEco Studio

1. 访问华为开发者官网下载 [DevEco Studio](https://developer.harmonyos.com/cn/develop/deveco-studio/)
2. 安装时选择默认配置，确保勾选 HarmonyOS SDK
3. 首次启动会自动下载 SDK（API 12+）

#### 配置签名（真机调试）

1. 打开 DevEco Studio → File → Project Structure
2. 选择 Signing Configs
3. 勾选 Support HarmonyOS
4. 点击 Sign In 登录华为账号
5. 自动生成签名

### 2. 导入项目

```bash
# 方式一：直接打开
# 在 DevEco Studio 中选择 File → Open → 选择 harmony-app 文件夹

# 方式二：复制到 DevEco Studio 工作目录
cp -r harmony-app ~/DevEcoStudioProjects/
```

### 3. 构建运行

1. 连接鸿蒙真机或启动模拟器
2. 点击工具栏 Run 按钮（绿色三角形）
3. 等待编译完成，应用自动安装

---

## 功能说明

### 首页 (Index.ets)
- 品牌展示
- 开始创作按钮 → 弹出世界背景设定弹窗
- 我的作品入口

### 创作页 (NovelWriting.ets)
- 自动生成楔子（第零章）
- 多章节管理
- 实时编辑与保存
- AI 续写辅助（预留接口）

### 作品列表 (WorksList.ets)
- 展示所有创作中的作品
- 左滑删除
- 点击继续创作

---

## API 接口

应用需要配合后端 API 使用：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/novel/prologue` | POST (SSE) | 流式生成楔子 |
| `/api/v1/novel/next-chapter` | POST (SSE) | AI 续写章节 |

**请求示例**：
```json
{
  "worldName": "艾泽拉斯",
  "eraBackground": "古代",
  "season": "冬"
}
```

**响应格式**（SSE）：
```
data: {"content": "在..."}
data: {"content": "遥远的..."}
data: [DONE]
```

---

## 杂志风 UI 设计

本应用采用杂志风格设计：

- **主色**: 克莱因蓝 (#002FA7)
- **辅助色**: 香槟金 (#C9A96E)
- **编辑红**: #C8102E
- **大留白**: 强调呼吸感
- **衬线字体**: 提升阅读体验

---

## 打包发布

### 生成 HAP 包

```bash
# 在 DevEco Studio 中
Build → Build Hap(s)/APP(s) → Build Hap(s)
```

### 生成 APP 包（上架应用市场）

```bash
Build → Build Hap(s)/APP(s) → Build APP(s)
```

APP 包位于：`entry/build/default/outputs/default/entry-default-signed.app`

---

## 常见问题

### 1. 模拟器启动失败
- 确保 BIOS 已开启虚拟化 (VT-x/AMD-V)
- 重启 DevEco Studio

### 2. 真机无法安装
- 检查 USB 调试是否开启
- 确认已配置签名

### 3. 编译报错
- 检查 SDK 版本是否为 API 12+
- File → Invalidate Caches / Restart

---

## React Native 项目迁移方案

如果你想将现有的 React Native 项目迁移到鸿蒙，请参考：

### 方案一：RNOH (React Native for OpenHarmony)

华为官方提供了 RN 适配层，支持将 RN 应用运行在鸿蒙上。

**要求**：
- React Native 版本需降级到 0.72.5
- 安装 `@react-native-oh/react-native-harmony`

**步骤**：
```bash
# 1. 降级 RN 版本
npm install react-native@0.72.5

# 2. 安装鸿蒙桥接库
npm install @react-native-oh/react-native-harmony@0.72.90

# 3. 创建鸿蒙工程
npx react-native-harmony-cli init

# 4. 修改 metro.config.js
# 参考: https://developer.huawei.com/consumer/cn/blog/topic/03199550770609061
```

### 方案二：原生重写（推荐）

使用本项目提供的 ArkTS 模板，重新实现核心功能。优点：
- 性能最优
- 充分利用鸿蒙特性
- 无第三方依赖限制

---

## 资源

- [HarmonyOS 开发者文档](https://developer.harmonyos.com/cn/docs/)
- [ArkTS 语法指南](https://developer.harmonyos.com/cn/docs/documentation/doc-guides-V3/arkts-get-started-0000001504769321-V3)
- [DevEco Studio 下载](https://developer.harmonyos.com/cn/develop/deveco-studio/)
- [RNOH 适配指南](https://developer.huawei.com/consumer/cn/blog/topic/03199550770609061)
