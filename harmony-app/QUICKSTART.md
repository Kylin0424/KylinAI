# 鸿蒙原生应用 - 快速使用指南

## 第一步：安装 DevEco Studio

1. 访问华为开发者官网：https://developer.harmonyos.com/cn/develop/deveco-studio/
2. 下载适合你系统的版本（Windows / macOS）
3. 安装时选择默认配置，确保勾选 **HarmonyOS SDK**
4. 首次启动会自动下载 SDK（选择 API 12+）

---

## 第二步：导入项目

### 方式一：直接打开
```
DevEco Studio → File → Open → 选择 harmony-app 文件夹
```

### 方式二：复制项目（如果需要）
```bash
# 将项目复制到你的工作目录
cp -r /workspace/projects/harmony-app ~/你的工作目录/
```

---

## 第三步：配置签名（真机调试必需）

1. 打开 DevEco Studio
2. 点击 `File → Project Structure`
3. 选择 `Signing Configs`
4. 勾选 `Support HarmonyOS`
5. 点击 `Sign In` 登录华为账号
6. 自动生成签名证书

---

## 第四步：运行应用

### 使用模拟器
1. 点击 `Tools → Device Manager`
2. 创建或启动 Phone 模拟器
3. 点击工具栏绿色 **Run** 按钮

### 使用真机
1. 手机开启开发者模式和 USB 调试
2. 连接电脑
3. 点击工具栏绿色 **Run** 按钮

---

## 项目核心文件说明

| 文件 | 说明 |
|------|------|
| `entry/src/main/ets/pages/Index.ets` | 首页 - 世界背景设定 |
| `entry/src/main/ets/pages/NovelWriting.ets` | 创作页 - AI生成楔子 |
| `entry/src/main/ets/pages/WorksList.ets` | 作品列表页 |
| `entry/src/main/ets/services/AIService.ets` | AI服务（调用后端API） |
| `entry/src/main/ets/services/StorageService.ets` | 本地存储服务 |

---

## 配置后端API地址

如果你的后端部署在其他地址，请修改：

```typescript
// 文件：entry/src/main/ets/services/AIService.ets
// 第10行
private baseUrl: string = 'http://你的服务器地址:9091/api/v1';
```

---

## 打包发布

### 测试包（HAP）
```
Build → Build Hap(s)/APP(s) → Build Hap(s)
```
输出位置：`entry/build/default/outputs/default/entry-default-signed.hap`

### 发布包（APP - 用于上架应用市场）
```
Build → Build Hap(s)/APP(s) → Build APP(s)
```
输出位置：`entry/build/default/outputs/default/entry-default-signed.app`

---

## 常见问题

### Q: 模拟器启动失败？
确保电脑 BIOS 已开启虚拟化（VT-x / AMD-V）

### Q: 真机无法安装？
- 确认已配置签名
- 确认手机已开启 USB 调试
- 尝试重新插拔 USB 线

### Q: 编译报错？
- 检查 SDK 版本是否为 API 12+
- 尝试 `File → Invalidate Caches / Restart`

---

## 需要帮助？

如果你需要：
- 修改UI样式
- 添加新功能
- 调整API接口
- 解决编译问题

请告诉我具体需求，我来帮你处理！
