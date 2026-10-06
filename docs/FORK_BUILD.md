# Cumora Fork — 本地二开版打包与隔离

本分支（`fork/local-app`）把 fork 仓库打成一个可与官方 Cumora.app **同机并存**的
本地 app：**Cumora Fork.app**（v `0.18.7-fork.1`）。

> 姊妹变体：`fork/local-app-dev`（mavis）产出 "Cumora Dev"，走 47899 端口 +
> 自建后端路线。两者共用 `electron/fork-config.cjs` 单一真相源模式，图标目录
> 分开（`build/icons/` vs `build/icons-fork/`），互不踩。

## 一键构建

```bash
./scripts-build-fork.sh          # build renderer → icon → electron-builder → 安装 /Applications → 启动
```

手工等价步骤：

```bash
npm run build
python3 scripts-make-fork-icon.py
npx electron-builder --mac --dir --arm64
rm -rf "/Applications/Cumora Fork.app"
cp -R "release/mac-arm64/Cumora Fork.app" /Applications/
xattr -cr "/Applications/Cumora Fork.app"
open "/Applications/Cumora Fork.app"
```

## 与原版的隔离矩阵

| 维度 | 官方 Cumora | Cumora Fork |
|---|---|---|
| Bundle ID | `io.cumora.app` | `io.cumora.fork` |
| 名称 / Dock | Cumora | **Cumora Fork**（图标带 FORK 角标） |
| userData | `~/Library/Application Support/cumora` | `~/Library/Application Support/Cumora Fork`（登录态/缓存/窗口状态完全隔离） |
| 深链 scheme | `cumora://` | `cumorafork://` |
| 自动更新 | updates.cumora.ai + GitHub | **禁用**（`publish: null`，无 app-update.yml；UI 显示"不支持自动更新"） |
| 单实例锁 | 按 userData 目录 | 独立目录 → 可与原版**同时运行** |
| 签名 | Developer ID + 公证 | ad-hoc（`identity: null`），本机直启 |
| API | https://api.cumora.ai | 同（`.env.production` bake 进 dist） |

## 已知取舍：OAuth 登录回环端口 47823

官方云的 `CUMORA_AUTH_RETURN_ALLOWLIST` 只放行 `http://127.0.0.1:47823/auth/done`
（实测其它端口 400）。所以本变体**保留 47823**，代价：

- 原版与 Fork **同时运行时，先启动者持有 47823**；后启动者登录时
  `EADDRINUSE`（warn-only，不影响使用），token 会投递到先启动者的监听器并被
  nonce 校验丢弃。
- **实操规则：登录时只开一个 Cumora 系 app**，登录完成后可随意并跑
  （session 已落盘到各自 userData，互不影响）。
- 要彻底解耦并跑 + 官方云登录，需要自建后端（把
  `CUMORA_AUTH_RETURN_ALLOWLIST` 加上自选端口），配合
  `CUMORA_FORK_API_BASE` 与 `fork-config.cjs` 的 `LOOPBACK_PORT` 一起改。

## 排障备忘（本次踩过的坑，勿重复）

1. **`ELECTRON_RUN_AS_NODE=1` 环境变量**会让任何 Electron 二进制退化成纯
   Node：app 静默 exit 0、零输出、userData 不创建。从 shell 直启测试前先
   `env -u ELECTRON_RUN_AS_NODE`（`open` 启动不受影响）。
2. **不要手工 `codesign --deep` 重签 electron-builder 产物**——会破坏
   `ElectronAsarIntegrity`，Electron 拒绝加载 main.cjs（同样是静默退出）。
   要改就改源码重新 `electron-builder`。
3. `app.setName()` 对打包产物无效（Info.plist 的 productName 赢），必须
   `app.setPath('userData', …)`（fork-config 模式已内置）。
4. `npx asar extract-file <asar> electron/main.cjs` 会把文件解到 **cwd**，
   在仓库根执行会覆盖工作区文件——解包请 `cd /tmp`。
5. 官方云 CORS 精确放行 `app://cumora` Origin，渲染层的 `app://cumora`
   scheme **不能改名**。

## 上游同步

fork 改动集中在：`electron/fork-config.cjs`（新）、`scripts-make-fork-icon.py`（新）、
`scripts-build-fork.sh`（改）、`electron/main.cjs`（小接线）、`package.json` build 块、
`src/lib/loopback.ts`（新）。rebase upstream/main 时冲突面很小。
