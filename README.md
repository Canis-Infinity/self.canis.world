# Self｜日常狀態與回診紀錄

私人使用的繁體中文日誌，部署網址 `https://self.canis.world/`，伺服器目錄 `/home/self.canis.world`，port `7347`。不開放註冊；心理量表已依需求移除。

## 功能

- Dashboard：期間平均心情、平均睡眠、記錄天數、心情變化、下次回診與近期紀錄。
- 情緒、睡眠、身體數據、用藥、自我反思的新增、查看、修改與刪除。
- 回診行事曆：七欄大型月曆，支援切換月份、回到今天、點日期新增與點事件編輯／刪除；欄位為標題、日期、想討論的事、上午診／下午診／晚診、看診號碼。
- 用藥紀錄：選擇早／中／晚／睡前，透過 Radio 選擇已服用／未服用，並記錄用藥後反應；不需填寫藥名與劑量。
- 自我反思：保留標題、日期時間、我的想法與選填圖片，不顯示反思題目、感謝的事與備註。
- 狀態紀錄都有日期時間，新增時預設當下；睡眠另記入睡與起床時間。回診只選日期與診別，不記錄時分。
- 五類狀態紀錄皆可選填圖片：JPEG／PNG／WebP，每張 5 MB，每筆 4 張；回診安排不提供附件欄位。
- 回診摘要：日期／關鍵字篩選、依類型整理，桌面列印或由瀏覽器另存 PDF，手機直接匯出 PDF，可包含圖片。PDF 由自有 backend 的 Chromium 列印引擎使用同一份報表 HTML 與列印樣式產生，保留卡片、分頁與可選取文字。回診卡片可開啟回診日前 30 天摘要。
- JSON 匯出包含目前篩選結果與圖片 ID，不含圖片二進位檔；它是資料交換格式，並非完整備份。
- 淺色／深色／系統主題、Empty、Skeleton、Toast、自訂 404／500／離線頁面。
- 原生 shadcn/ui Base Sidebar 保留在共用版型，切換頁面只載入內容區；月曆與一般內容使用對應的詳細 Skeleton。表單錯誤使用中文 Toast。
- 登入可勾選「記住帳號」：持續記住信箱直到取消勾選或清除瀏覽器資料，不儲存密碼；登入工作階段與 debt／thrift 一樣為 7 天。舊版已儲存的紀錄不會因表單簡化而刪除。
- PWA 可安裝；只快取離線頁與圖示，不快取私人資料，不提供離線新增或同步。

時間以 UTC 儲存、裝置時區顯示。圖表和摘要只整理個人輸入，沒有醫療判讀功能。

## 技術與元件來源

Next.js、React、TypeScript、Zod、Tailwind CSS v4、Prettier、lucide-react、nextjs-toploader、next-themes。

依指定指令初始化：

```sh
npx shadcn@latest init --preset b1Ymqvgiu --template next --pointer
```

Preset：Base UI / Nova / neutral / blue / Inter / lucide。`components/ui` 保留官方 CLI 輸出，Prettier 不修改此目錄；產品組合放在外層 components。沒有使用 Radix UI 或 React Aria。

- Date Picker 與 Time Picker：依 [shadcn 官方組合](https://ui.shadcn.com/docs/components/base/date-picker)，使用 Calendar、Popover、Button、Input type=time。
- File Upload：[Dice UI Base](https://diceui.com/docs/components/base/file-upload)，透過 `npx shadcn add @diceui/file-upload` 安裝。
- OG 圖以 Next ImageResponse 產生，PWA 圖示為向量圖形轉 PNG。

## 本機啟動

Node.js 24。backend 需先設定既有 `.env` 的 `MONGODB_CONNECT`，並啟動 MongoDB 與 backend。

```sh
cd backend
npm ci
npm run dev
```

另一個終端：

```sh
cd self
npm ci
cp .env.example .env.local
npm run dev
```

開啟 `http://localhost:7347`。若 Windows 保留了此 port，可用 `npx next dev -H 127.0.0.1 -p 17347` 作本機預覽；正式設定仍為 7347。

## 建立帳號（本機）

在 **backend** 目錄執行，並使用 backend 的 MongoDB 設定：

```sh
cd backend
npm run create-self-user
```

依序輸入名稱、電子郵件、密碼與確認密碼。密碼輸入隱藏，至少 12 字元且不得超過 72 bytes。若電子郵件已存在，會詢問是否重設密碼；重設後既有登入階段全部失效。

## 建立帳號（Docker／server）

先部署 backend 的程式更新並重新啟動 backend。既有容器名稱是 `backend_canis_world`：

```sh
docker restart backend_canis_world
docker exec -it backend_canis_world npm run create-self-user
```

或在 **backend 的 docker-compose.yml 所在目錄**使用 Compose：

```sh
docker compose exec backend npm run create-self-user
```

此指令是在 backend 容器執行，不是在 self 容器。不要把密碼放進 shell 參數或 commit。

## 部署 self

將 self 原始碼及 lockfile 放到 `/home/self.canis.world`，並同步本次 backend 修改。

```sh
cd /home/self.canis.world
docker compose up -d
docker compose logs -f self
```

Compose 使用 Node 24，安裝後建置再啟動。對外 port 7347，預設 backend 為 `http://host.docker.internal:7344`；若 backend 位址不同，在部署 `.env` 設定 `INTERNAL_API_BASE_URL`。

在現有 HTTPS Nginx vhost 中，使用下列反向代理設定；憑證設定沿用你的伺服器：

```nginx
client_max_body_size 6m;
location / {
    proxy_pass http://127.0.0.1:7347;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_http_version 1.1;
}
error_page 502 503 504 /50x.html;
location = /50x.html {
    root /home/self.canis.world/public;
    internal;
}
```

Next API 代理只呼叫 backend，包含同源檢查、請求大小上限與 HttpOnly session cookie。資料和圖片儲存在既有 MongoDB 的 `self_*` collections，每次讀寫都依帳號檢查；API 回應 `no-store`。網站 metadata 與 robots 設為不索引，避免私人網站被搜尋引擎收錄。

備份請使用既有 MongoDB 備份流程，納入 `self_users`、`self_entries`、`self_images`；sessions 可重新登入重建。移除紀錄中的附件關聯不會立刻清除資料庫內圖片，避免破壞其他紀錄對同一圖片的參照。

## 檢查

```sh
# self
npm run typecheck
npm run format:check
npm run build
# backend
node node_modules/vitest/vitest.mjs run tests/self.test.js
```

UI 測試可使用獨立暫存 MongoDB：在 backend 設定 `SELF_E2E=1` 後執行 `node scripts/self-e2e-server.js`（API 17447）；self 設定 `INTERNAL_API_BASE_URL=http://127.0.0.1:17447`。測試帳號 `self@example.test`／`self-e2e-password` 僅存在於暫存資料庫，停止後即清除，不可用於正式環境。

- 各頁使用對應 Skeleton：登入表單、總覽統計與圖表、情緒／睡眠／身體／用藥／反思紀錄卡、回診月曆與分組回診摘要；路由切換、登入檢查及 API 載入均依頁面顯示，Sidebar 不參與 Skeleton。

- 回診摘要統一由「匯出報表」對話框確認日期、關鍵字、筆數與圖片選項，支援 PDF／JSON；桌面另提供列印，手機隱藏列印。

PDF 匯出需先部署 backend 最新版本，執行 `docker compose up -d --build --force-recreate` 安裝 Chromium 與繁體中文字型；再更新 self。PDF API 需登入，僅可讀取本人附件，不連線至外部網站，報表不落地保存。

- 總覽最近紀錄每頁 6 筆，各類紀錄及回診摘要每頁 20 筆，使用原生 shadcn/ui Pagination 與後端篩選。統計涵蓋完整區間；PDF／JSON／列印會在確認匯出時讀取完整篩選結果。月曆只取畫面日期範圍，CRUD 保留月份。
- 一般紀錄標題固定、不顯示標題欄位；新回診預設「身心科回診」。新增飲食紀錄：餐別、飲食、飲料、食慾、備註與選填圖片。
- 心情與食慾皆為 1–10 整數（min=1、max=10、step=1）；卡片以紅色 #9F0712（1 分）至綠色 #016630（10 分）標示。平均值可包含小數，單筆紀錄不可。
- 舊心情資料需在 backend 執行 `node scripts/migrate-self-moods.js`；Docker：`docker exec backend_canis_world node scripts/migrate-self-moods.js`。1/2/3/4/5 轉成 1/3/6/8/10，保留原分數、日期、內容與附件，可安全重跑。
