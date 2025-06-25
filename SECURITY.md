# 🔒 安全配置指南 (Security Configuration Guide)

## ⚠️ 重要安全提醒

**本項目包含敏感的 API 密鑰配置，請務必遵循以下安全規範！**

---

## 🚀 快速開始 (Quick Start)

### 1. 環境變數設置

```bash
# 1. 複製環境變數模板
cp content-gap-analyzer/backend/.env.example content-gap-analyzer/backend/.env

# 2. 編輯 .env 文件，填入您的實際 API 密鑰
nano content-gap-analyzer/backend/.env
```

### 2. 必需的 API 密鑰

#### OpenAI API Key
- **獲取位置**: https://platform.openai.com/api-keys
- **格式**: `sk-proj-...`
- **用途**: 內容精煉和最終分析

#### SerpAPI Key  
- **獲取位置**: https://serpapi.com/manage-api-key
- **格式**: 32位十六進制字符串
- **用途**: Google 搜索結果和 AI Overview 數據提取

---

## 🔑 API 密鑰獲取詳細指南

### OpenAI API Key
1. 訪問 [OpenAI API Keys 頁面](https://platform.openai.com/api-keys)
2. 登入您的 OpenAI 帳戶
3. 點擊 **"Create new secret key"**
4. 為密鑰命名（如 "AIO-Auditor-Production"）
5. 複製生成的密鑰（**注意：密鑰只會顯示一次**）
6. 將密鑰填入 `.env` 文件的 `OPENAI_API_KEY` 字段

### SerpAPI Key
1. 訪問 [SerpAPI 管理頁面](https://serpapi.com/manage-api-key)
2. 註冊或登入您的 SerpAPI 帳戶
3. 在儀表板中找到您的 API 密鑰
4. 複製密鑰並填入 `.env` 文件的 `SERPAPI_KEY` 字段

---

## 🛡️ 安全最佳實踐

### ✅ 應該做的事 (DO)
- [x] 將 `.env` 文件保持在 `.gitignore` 中
- [x] 定期輪換 API 密鑰（建議每 90 天）
- [x] 使用最小權限原則配置 API 密鑰
- [x] 在生產環境中使用環境變數而非文件
- [x] 定期監控 API 使用量和成本
- [x] 備份 `.env.backup` 文件到安全位置

### ❌ 絕對不要做的事 (DON'T)
- [ ] 將真實 API 密鑰提交到版本控制系統
- [ ] 在日誌中記錄 API 密鑰
- [ ] 透過不安全的管道（如電子郵件）分享密鑰
- [ ] 在前端代碼中硬編碼 API 密鑰
- [ ] 使用弱密碼保護包含密鑰的系統

---

## 🔍 安全檢查清單 (Security Checklist)

在部署前請確認：

- [ ] `.env` 文件已被 `.gitignore` 排除
- [ ] 所有真實 API 密鑰已從代碼庫中移除
- [ ] `.env.example` 僅包含佔位符值
- [ ] 生產環境使用環境變數而非 `.env` 文件
- [ ] API 密鑰具有適當的使用限制
- [ ] 已設置 API 使用量監控和告警

---

## 🚨 洩漏應急處理

如果意外將 API 密鑰提交到版本控制：

### 立即行動
1. **立即撤銷洩露的 API 密鑰**
   - OpenAI: 前往 API Keys 頁面並撤銷洩露的密鑰
   - SerpAPI: 重新生成新的 API 密鑰

2. **清理 Git 歷史**
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch content-gap-analyzer/backend/.env' \
   --prune-empty --tag-name-filter cat -- --all
   ```

3. **生成新的 API 密鑰**
4. **更新所有部署環境的密鑰**
5. **檢查 API 使用日誌是否有異常活動**

---

## 🔧 環境配置說明

### 開發環境 (.env)
```env
# 使用開發/測試用的 API 密鑰
OPENAI_API_KEY=sk-proj-...
SERPAPI_KEY=...
NODE_ENV=development
```

### 生產環境
```bash
# 使用系統環境變數
export OPENAI_API_KEY="sk-proj-..."
export SERPAPI_KEY="..."
export NODE_ENV="production"
```

---

## 📞 支援與問題回報

如有安全相關問題或發現潛在漏洞，請透過以下方式聯繫：

- **GitHub Issues**: [安全問題模板](https://github.com/username/Reverse-Engineering-AI-Overview/issues/new?template=security.md)
- **私人報告**: 請標記 `@username` 並使用 `SECURITY` 標籤

---

## 📝 更新日誌

- **v1.0.0** (2024-01-XX): 初始安全配置
- **v1.0.1** (2024-01-XX): 添加 API 密鑰輪換指南

---

⚠️ **請定期檢查此文件的更新，安全配置可能會隨著項目發展而變化**