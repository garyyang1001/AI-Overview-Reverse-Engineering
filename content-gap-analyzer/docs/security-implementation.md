# 🔒 AIO-Auditor v5.1 安全實施文檔

## 📋 概述

本文檔描述了 AIO-Auditor v5.1 中實施的完整安全措施，包括速率限制、請求驗證、安全標頭和保護機制。

## 🚀 已實施的安全功能

### 1. **分層速率限制系統**

#### 通用 API 限制
- **時間窗口：** 15 分鐘
- **限制：** 每 IP 100 次請求
- **適用範圍：** 所有 `/api/*` 端點

#### 分析端點嚴格限制
- **時間窗口：** 15 分鐘
- **限制：** 每 IP 5 次分析請求
- **適用範圍：** `POST /api/analyze`, `POST /api/start`
- **原因：** 分析是資源密集型操作

#### 健康檢查寬鬆限制
- **時間窗口：** 1 分鐘
- **限制：** 每 IP 60 次請求
- **特殊處理：** 本地請求 (127.0.0.1, ::1) 跳過限制

#### 測試端點開發限制
- **時間窗口：** 5 分鐘
- **限制：** 每 IP 20 次請求
- **適用範圍：** 僅開發環境

#### 管理端點嚴格限制
- **時間窗口：** 5 分鐘
- **限制：** 每 IP 10 次管理操作
- **適用範圍：** 需要 API Key 的端點

### 2. **請求大小和內容驗證**

#### 請求大小限制
- **默認限制：** 1MB
- **配置變數：** `MAX_REQUEST_SIZE`
- **HTTP 狀態：** 413 Payload Too Large

#### JSON 載荷安全驗證
- **UTF-8 編碼檢查**
- **Null 字節檢測**
- **惡意腳本模式檢測：**
  - `<script>` 標籤
  - `javascript:` 協議
  - `eval()` 函數調用
  - `document.cookie` 訪問
  - 事件處理器 (`onload`, `onerror`)

### 3. **安全標頭和保護**

#### Helmet 安全配置
- **內容安全政策 (CSP)：**
  - 默認來源：自身
  - 允許連接：OpenAI API, SerpAPI
  - 禁止框架嵌入
  - 禁止對象嵌入

- **HTTP 嚴格傳輸安全 (HSTS)：**
  - 最大年齡：1 年
  - 包含子域
  - 預加載支持

- **其他安全標頭：**
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1
  - Referrer-Policy: no-referrer

### 4. **身份驗證和授權**

#### API Key 認證
- **標頭：** `X-API-Key`
- **環境變數：** `ADMIN_API_KEY`
- **適用端點：**
  - `GET /api/queue/stats`
  - `POST /api/prompts/switch`
  - `DELETE /api/cache`

#### IP 白名單（可選）
- **配置變數：** `ADMIN_ALLOWED_IPS`
- **格式：** 逗號分隔的 IP 地址
- **開發環境：** 自動跳過檢查

### 5. **User-Agent 驗證**

#### 必要性檢查
- 所有請求必須包含 User-Agent 標頭

#### 惡意客戶端檢測
- **阻止的模式：**
  - SQLMap
  - Nikto
  - Nessus
  - Masscan
  - OWASP ZAP

### 6. **CORS 安全配置**

#### 配置選項
- **允許來源：** `CORS_ORIGIN` 環境變數（逗號分隔）
- **允許方法：** GET, POST, PUT, DELETE, OPTIONS
- **允許標頭：** Content-Type, Authorization, X-API-Key
- **預檢快取：** 24 小時

### 7. **安全日誌和監控**

#### 安全事件記錄
- **記錄條件：**
  - HTTP 狀態碼 >= 400
  - 請求時間 > 30 秒
  - 速率限制觸發
  - 安全驗證失敗

#### 記錄信息
- IP 地址
- User-Agent
- 請求 URL 和方法
- 錯誤詳情
- 時間戳

## 🔧 配置指南

### 環境變數

```bash
# 基本安全設置
MAX_REQUEST_SIZE=1048576          # 1MB 請求限制
ADMIN_API_KEY=your_secure_key     # 管理 API 金鑰

# CORS 配置
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# 速率限制配置
RATE_LIMIT_WINDOW_MS=900000       # 15 分鐘
RATE_LIMIT_MAX_REQUESTS=100       # 通用限制

# IP 白名單（可選）
ADMIN_ALLOWED_IPS=192.168.1.100,10.0.0.50
```

### 生產環境建議

1. **啟用 HTTPS：**
   ```bash
   FORCE_HTTPS=true
   ```

2. **配置信任代理：**
   ```bash
   TRUST_PROXY=true
   ```

3. **設置強化的 API Key：**
   ```bash
   ADMIN_API_KEY=$(openssl rand -hex 32)
   ```

## 📊 安全端點

### 錯誤統計監控
```
GET /api/health/errors
POST /api/health/errors/reset  # 需要 API Key
```

### 詳細健康檢查
```
GET /api/health/detailed
```

## ⚠️ 安全最佳實踐

### 1. **定期安全檢查**
- 監控錯誤統計
- 檢查異常請求模式
- 更新安全配置

### 2. **API Key 管理**
- 定期輪換 API Key
- 使用強隨機生成的密鑰
- 安全存儲環境變數

### 3. **網路安全**
- 在生產環境中使用 HTTPS
- 配置防火牆規則
- 考慮使用 CDN 和 DDoS 保護

### 4. **監控和告警**
- 設置速率限制告警
- 監控異常 IP 活動
- 實施日誌分析

## 🚨 威脅防護

### 已防護的攻擊類型
- **DDoS 攻擊：** 多層速率限制
- **資料洩露：** 請求大小限制
- **XSS 攻擊：** 內容安全政策
- **CSRF 攻擊：** CORS 嚴格配置
- **注入攻擊：** 載荷內容驗證
- **掃描攻擊：** User-Agent 檢測

### 回應策略
- **速率限制：** 自動阻擋 + 日誌記錄
- **惡意內容：** 拒絕請求 + 安全日誌
- **未授權訪問：** HTTP 401/403 + 告警

## 📈 性能影響

### 安全中間件開銷
- **請求驗證：** < 1ms
- **速率限制檢查：** < 0.5ms
- **安全標頭：** < 0.1ms
- **總體影響：** 最小，< 2ms 每請求

### 優化建議
- 使用 Redis 進行速率限制存儲
- 實施請求快取
- 考慮邊緣防護 (Edge Protection)

---

**注意：** 本安全實施遵循 OWASP Top 10 和行業最佳實踐，提供企業級安全保護。