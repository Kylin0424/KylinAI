# 后台地址修改记录

## 修改说明

**开发环境**：使用 `http://localhost:9091`（本地后端）  
**生产环境**：使用 `https://kylinai-1.onrender.com`（线上后端）

---

## 修改的文件列表

### 1. client/screens/novel/index.tsx
**行号**：18  
**修改前**：
```typescript
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';
```
**修改后**：
```typescript
const EXPO_PUBLIC_BACKEND_BASE_URL = 'http://localhost:9091';
```

### 2. client/screens/character-result/index.tsx
**行号**：28  
**修改前**：
```typescript
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';
```
**修改后**：
```typescript
const EXPO_PUBLIC_BACKEND_BASE_URL = 'http://localhost:9091';
```

### 3. client/screens/novel-writing/index.tsx
**行号**：46  
**修改前**：
```typescript
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';
```
**修改后**：
```typescript
const EXPO_PUBLIC_BACKEND_BASE_URL = 'http://localhost:9091';
```

### 4. client/screens/character-detail/index.tsx
**行号**：40  
**修改前**：
```typescript
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';
```
**修改后**：
```typescript
const EXPO_PUBLIC_BACKEND_BASE_URL = 'http://localhost:9091';
```

### 5. client/screens/home/index.tsx
**行号**：57  
**修改前**：
```typescript
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';
```
**修改后**：
```typescript
const EXPO_PUBLIC_BACKEND_BASE_URL = 'http://localhost:9091';
```

### 6. client/screens/novel-import/index.tsx
**行号**：35  
**修改前**：
```typescript
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';
```
**修改后**：
```typescript
const EXPO_PUBLIC_BACKEND_BASE_URL = 'http://localhost:9091';
```

### 7. client/app.config.ts
**行号**：53-58  
**修改前**：
```typescript
process.env.EXPO_PUBLIC_BACKEND_BASE_URL ? [
  "expo-router",
  {
    "origin": process.env.EXPO_PUBLIC_BACKEND_BASE_URL
  }
] : 'expo-router',
```
**修改后**：
```typescript
// 开发环境不设置代理，直接使用本地地址
'expo-router',
```

---

## 发布时恢复方法

### 方法 1：使用 git 恢复（推荐）

```bash
cd /workspace/projects
git checkout -- client/screens/ client/app.config.ts
```

### 方法 2：手动修改（按文件逐个修改）

将所有文件中的：
```typescript
const EXPO_PUBLIC_BACKEND_BASE_URL = 'http://localhost:9091';
```
改回：
```typescript
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || '';
```

将 `client/app.config.ts` 中的：
```typescript
// 开发环境不设置代理，直接使用本地地址
'expo-router',
```
改回：
```typescript
process.env.EXPO_PUBLIC_BACKEND_BASE_URL ? [
  "expo-router",
  {
    "origin": process.env.EXPO_PUBLIC_BACKEND_BASE_URL
  }
] : 'expo-router',
```

---

## 环境变量配置（生产环境）

生产环境的环境变量配置在 `client/eas.json` 中：

```json
{
  "env": {
    "EXPO_PUBLIC_BACKEND_BASE_URL": "https://kylinai-1.onrender.com"
  }
}
```

---

## 验证方法

### 开发环境
```bash
# 确认后端地址
curl http://localhost:9091/api/v1/health
```

### 生产环境
```bash
# 确认后端地址
curl https://kylinai-1.onrender.com/api/v1/health
```
