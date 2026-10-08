# template-fullstack-biz-app

> 全栈 BizUnit 业务项目模版，支持可选 Tenant 端与客户端

基于 KneUnion 生态的全栈多租户业务应用脚手架，通过 `@kne/npm-tools` 模板机制一键生成完整的全栈项目。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | React 18 + React Router 6 |
| UI 组件库 | Ant Design 5 |
| 样式方案 | Sass |
| 构建工具 | Craco (Create React App 配置覆盖) |
| 远程组件 | `@kne/remote-loader` |
| 服务端框架 | Fastify 5 |
| 数据库 | SQLite3 + Sequelize ORM |
| 国际化 | `@kne/react-intl` |

## 核心特性

- **多端架构**：支持 Admin 超级后台、Tenant Admin 租户管理、Tenant Client 租户客户端、Client 普通客户端四种门户
- **高度可配置**：交互式 prompts 按需选择端和功能模块
- **条件编译**：EJS 模板在生成时裁剪不需要的代码，确保生成的代码干净无冗余
- **远程组件**：核心 UI 组件（components-core、components-admin 等）从 CDN 远程加载，实现组件共享与热更新
- **全栈一体**：前端 React + 后端 Fastify 在同一仓库，开发部署统一管理
- **企业级功能**：内置账户系统、多租户、RBAC 权限、文件管理、消息推送、第三方登录（钉钉/企业微信）、OSS 存储、任务调度
- **开箱即用**：提供完整的 Sample CRUD 示例模块作为开发参考

## 快速开始

### 前提条件

```bash
# 需安装 @kne/npm-tools
npm install -g @kne/npm-tools
```

### 创建项目

```bash
kne create fullstack-biz-app my-project
```

执行后按交互式提示完成配置，即可在 `my-project/` 目录下获得完整的全栈项目。

### 启动开发

```bash
cd my-project
npm start
```

该命令同时启动前端开发服务器（默认 `3040` 端口）和后端服务器（默认 `8040` 端口），前端请求 `/api` 路径将自动代理到后端。

### 构建部署

```bash
npm run build
```

构建产物位于 `build/` 目录，由后端静态文件服务托管。

### 作为 App Manager 子应用部署

生成的项目可直接作为 [`@kne/fastify-app-manager`](https://github.com/kne-union/fastify-app-manager) 的子应用上传部署（挂载在 `/app/{应用标识}/` 或绑定域名），无需额外改造：

| 要求 | 模版中的处理 |
|---|---|
| 路径前缀 | `src/commons/publicUrl.js` 读取部署时注入的 `window.runtimePublicUrl`；`BrowserRouter` 以其作 `basename`，401 跳登录、切换租户等整页跳转用 `withPublicUrl` 补前缀；接口请求以 `window.runtimeApiUrl` 为 `baseURL` |
| 存储隔离 | `@kne/modules-dev ^2.4.17` 与 remote（components-admin ≥1.1.114、components-thirdparty ≥0.1.50）共享 `@kne/local-storage` 单例，登录 token 按注入的 `window.__LOCAL_STORAGE_PREFIX` 隔离 |
| 共享库表前缀 | `@kne/fastify-sequelize ^4.0.5` 读取注入的 `DB_TABLE_PREFIX`（`t_{应用标识}_`）强制表名前缀 |
| 数据库 | 支持 `DB_PORT`；内置 `pg` 驱动以连接 postgres 共享库（mysql 需自行加 `mysql2`） |
| 端口 | 服务端监听环境变量 `PORT` |

打包：`npm run build` 后将 `package.json`、`build/`、`server/`（不含 `node_modules`、`.env`、本地数据库文件）压缩为 zip 上传。独立部署时上述注入变量为空，行为与普通部署一致。

> 重置密码邮件链接使用 `ORIGIN`，以路径模式挂载时应配置为含前缀的地址，如 `https://example.com/app/{应用标识}`。

## 项目结构

```
my-project/
├── package.json               # 前端主 package.json
├── craco.config.js            # Craco 构建配置
├── portal.config.json         # 运行时配置（记录模板生成时的选择项）
├── public/
│   ├── index.html             # HTML 入口
│   └── manifest.json          # PWA 配置
├── src/
│   ├── index.js               # 前端入口（动态导入 bootstrap）
│   ├── bootstrap.js           # React 渲染启动
│   ├── App.js                 # 主应用组件（路由配置）
│   ├── preset.js              # 全局预设初始化
│   ├── index.scss             # 全局样式
│   ├── setupProxy.js          # 开发代理配置
│   └── components/
│       ├── Admin/             # 超级管理员后台路由
│       ├── Apis/              # API 聚合与请求封装
│       ├── Client/            # 普通客户端（可选）
│       ├── Sample/            # 示例业务模块
│       ├── TenantAdmin/       # 租户管理端（可选）
│       └── TenantClient/      # 租户客户端（可选）
├── server/
│   ├── index.js               # 服务端入口
│   ├── server.js              # Fastify 服务器（插件注册）
│   ├── package.json           # 服务端 package.json
│   ├── libs/
│   │   ├── controllers/       # 业务控制器
│   │   ├── models/            # 数据模型
│   │   ├── services/          # 业务服务
│   │   ├── tasks/             # 定时任务
│   │   └── utils/             # 工具函数
│   └── messageTemplate/       # 邮件模板
└── Dockerfile                 # Docker 部署配置
```

## 配置项

模板生成时支持以下配置，按需选择：

| 配置项 | 说明 | 默认值 |
|---|---|---|
| `port` | 服务端端口号 | `8040` |
| `includeTenantAdmin` | 是否包含租户管理端 | `true` |
| `tenantAdminLayout` | 租户管理端布局风格 (`layout` / `system-layout`) | `system-layout` |
| `includeTenantClient` | 是否包含租户客户端 | `false` |
| `tenantClientLayout` | 租户客户端布局风格 | `system-layout` |
| `includeClient` | 是否包含普通客户端 | `false` |
| `clientLayout` | 客户端布局风格 | `system-layout` |
| `includeOss` | 是否启用阿里云 OSS | `false` |
| `includeDingtalk` | 是否启用钉钉集成 | `false` |
| `includeWecom` | 是否启用企业微信集成 | `false` |

## 四种门户说明

| 门户 | 路由前缀 | 适用场景 |
|---|---|---|
| **Admin** | `/admin/*` | 超级管理员后台，管理系统级任务、租户、用户 |
| **Tenant Admin** | `/tenant-admin/*` | 租户内部管理，公司信息、组织架构、用户权限 |
| **Tenant Client** | `/tenant/*` | 租户 C 端用户入口 |
| **Client** | `/*` | 不带租户的普通客户端 |

## 内置模块

### 账户系统 (`@kne/fastify-account`)

- 邮箱验证码注册/登录
- 密码重置
- 初始化管理员

### 多租户系统 (`@kne/fastify-tenant`)

- 租户创建与管理
- 组织架构管理
- RBAC 角色权限

### 任务调度 (`@kne/fastify-task`)

- 组织架构同步任务
- 第三方登录 URL 生成
- 第三方登录结果处理

### 文件管理 (`@kne/fastify-file-manager`)

- 文件上传/下载
- 可选阿里云 OSS 存储

### 消息推送 (`@kne/fastify-message`)

- 邮件发送（内置注册验证码、重置密码模板）

## 布局风格

每端可独立选择布局风格：

- **`system-layout`**：来自 `@kne/system-layout`，带侧边栏菜单、用户头像、渐变背景
- **`layout`**：来自远程组件 `components-core:Layout`，顶部导航栏风格

## License

ISC
