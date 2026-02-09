# 文件说明总结

本文档说明为云服务器 Jenkins 配置创建的所有文件及其用途。

## 核心文件

### 1. Jenkinsfile
**路径**: `h5-coverage-demo/Jenkinsfile`

**用途**: Jenkins Pipeline 脚本，定义完整的构建、部署和覆盖率收集流程

**功能**:
- 代码检出
- 依赖安装
- 插桩构建（可选）
- 构建产物验证
- 部署到 Nginx 或 Docker（可选）
- 覆盖率服务器配置
- 构建产物归档

**参数**:
- `ENABLE_COVERAGE`: 是否启用覆盖率插桩
- `DEPLOY_TARGET`: 部署目标（nginx/docker/none）
- `DEPLOY_PATH`: 部署路径
- `COVERAGE_SERVER_PORT`: 覆盖率服务器端口

### 2. coverage-server.js
**路径**: `h5-coverage-demo/coverage-server.js`

**用途**: 覆盖率数据收集服务器（生产环境版本）

**功能**:
- 接收来自浏览器的覆盖率数据上报
- 保存覆盖率数据到 `.nyc_output/coverage.json`
- 提供 API 接口：
  - `POST /api/coverage` - 接收覆盖率数据
  - `GET /api/coverage/stats` - 获取统计信息
  - `POST /api/coverage/report` - 生成覆盖率报告
- 支持命令行参数 `--report` 生成报告
- 自动定期保存数据

**环境变量**:
- `PORT`: 服务器端口（默认: 8081）
- `COVERAGE_DIR`: 覆盖率数据目录（默认: .nyc_output）
- `LOG_LEVEL`: 日志级别（默认: info）

### 3. nginx.conf
**路径**: `h5-coverage-demo/nginx.conf`

**用途**: Nginx 配置文件，用于部署 H5 应用和代理覆盖率 API

**功能**:
- 提供静态文件服务
- 代理覆盖率数据上报到覆盖率服务器
- 配置 CORS 头
- 静态资源缓存
- Sourcemap 文件不缓存

**部署位置**: `/etc/nginx/sites-available/h5-coverage-demo`

### 4. Dockerfile
**路径**: `h5-coverage-demo/Dockerfile`

**用途**: Docker 镜像构建文件，支持多阶段构建

**功能**:
- 构建阶段：安装依赖并构建项目
- 生产阶段：基于 Nginx，包含 Node.js 运行覆盖率服务器
- 支持通过 `ENABLE_COVERAGE` 构建参数控制插桩

**构建参数**:
- `ENABLE_COVERAGE`: 是否启用覆盖率插桩

### 5. docker-entrypoint.sh
**路径**: `h5-coverage-demo/docker-entrypoint.sh`

**用途**: Docker 容器启动脚本

**功能**:
- 如果 `ENABLE_COVERAGE=true`，自动启动覆盖率服务器
- 启动 Nginx

### 6. deploy.sh
**路径**: `h5-coverage-demo/deploy.sh`

**用途**: 部署脚本，支持 Nginx 和 Docker 两种部署方式

**使用方法**:
```bash
./deploy.sh [nginx|docker] [部署路径] [覆盖率服务器端口]
```

**功能**:
- Nginx 模式：复制文件到指定目录，设置权限
- Docker 模式：构建 Docker 镜像

## 配置文件

### 7. coverage-config.template.js
**路径**: `h5-coverage-demo/coverage-config.template.js`

**用途**: 覆盖率配置模板，构建时复制到 `dist/coverage-config.js`

**功能**:
- 配置覆盖率数据上报端点
- 自动上报覆盖率数据
- 提供调试函数 `window.showCoverageInfo()`

## 文档文件

### 8. JENKINS_SETUP.md
**路径**: `h5-coverage-demo/JENKINS_SETUP.md`

**用途**: 详细的 Jenkins 配置指南

**内容**:
- 前置要求
- Jenkins Job 配置（Pipeline 和自由风格）
- 部署配置（Nginx 和 Docker）
- 覆盖率数据收集流程
- 验证部署
- 常见问题
- 最佳实践

### 9. QUICKSTART_JENKINS.md
**路径**: `h5-coverage-demo/QUICKSTART_JENKINS.md`

**用途**: 快速开始指南，5 分钟快速配置

**内容**:
- 快速配置步骤
- 常用命令
- 故障排查

### 10. COVERAGE_DEBUG.md
**路径**: `h5-coverage-demo/COVERAGE_DEBUG.md`

**用途**: 覆盖率调试指南

**内容**:
- 问题排查步骤
- 调试方法
- 常见问题解答

### 11. FILES_SUMMARY.md
**路径**: `h5-coverage-demo/FILES_SUMMARY.md`

**用途**: 本文档，文件说明总结

## 工作流程

### 构建流程

1. **Jenkins 触发构建**
   - 检出代码
   - 安装依赖
   - 执行构建（如果 `ENABLE_COVERAGE=true`，启用插桩）
   - 验证构建产物
   - 归档构建产物

2. **部署流程**（如果启用）
   - 复制文件到部署目录（Nginx 模式）
   - 或构建 Docker 镜像（Docker 模式）
   - 配置覆盖率服务器

3. **运行时数据收集**
   - 用户访问应用
   - 浏览器加载插桩后的代码
   - 代码执行时收集覆盖率数据
   - 自动上报到覆盖率服务器
   - 服务器保存数据到文件

4. **生成报告**
   - 通过 API 或命令行生成报告
   - 报告保存在 `coverage/` 目录

## 目录结构

```
h5-coverage-demo/
├── Jenkinsfile                    # Jenkins Pipeline 脚本
├── coverage-server.js             # 覆盖率数据收集服务器
├── nginx.conf                     # Nginx 配置文件
├── Dockerfile                      # Docker 镜像构建文件
├── docker-entrypoint.sh           # Docker 启动脚本
├── deploy.sh                      # 部署脚本
├── coverage-config.template.js    # 覆盖率配置模板
├── JENKINS_SETUP.md               # 详细配置指南
├── QUICKSTART_JENKINS.md          # 快速开始指南
├── COVERAGE_DEBUG.md              # 调试指南
└── FILES_SUMMARY.md               # 本文档
```

## 使用建议

1. **首次使用**: 阅读 `QUICKSTART_JENKINS.md` 快速开始
2. **详细配置**: 参考 `JENKINS_SETUP.md` 了解详细配置
3. **问题排查**: 查看 `COVERAGE_DEBUG.md` 解决常见问题
4. **文件说明**: 参考本文档了解各文件用途

## 注意事项

1. **权限**: 确保 Jenkins 用户有足够的权限进行部署
2. **端口**: 确保覆盖率服务器端口（默认 8081）未被占用
3. **防火墙**: 确保相关端口已开放
4. **Node.js**: 确保服务器已安装 Node.js（用于运行覆盖率服务器）
5. **Nginx**: 如果使用 Nginx 部署，确保已安装并配置

## 下一步

- 配置 Jenkins Job
- 执行首次构建
- 部署到目标环境
- 验证覆盖率数据收集
- 生成覆盖率报告

