# Jenkins 云服务器配置指南

本指南说明如何在云服务器的 Jenkins 上配置 H5 覆盖率项目的插桩构建、部署和覆盖率数据收集。

## 前置要求

### 1. Jenkins 环境准备

确保 Jenkins 服务器已安装以下工具：
- **Node.js** (推荐 v18+)
- **npm** (通常随 Node.js 一起安装)
- **Docker** (可选，如果使用 Docker 部署)
- **Nginx** (可选，如果使用 Nginx 部署)

### 2. 安装 Jenkins 插件

在 Jenkins 管理界面安装以下插件（如果使用）：
- **NodeJS Plugin** (可选，用于管理 Node.js 版本)
- **Pipeline** (通常已预装)
- **Git** (通常已预装)

### 3. 配置 Node.js（如果使用 NodeJS Plugin）

1. 进入 **Jenkins 管理** → **全局工具配置**
2. 找到 **NodeJS** 部分
3. 添加 Node.js 安装：
   - 名称: `NodeJS` (或自定义名称)
   - 版本: 选择 Node.js 18 或更高版本
   - 勾选 **自动安装**

## Jenkins Job 配置

### 方式一：使用 Jenkinsfile（推荐）

#### 1. 创建 Pipeline Job

1. 在 Jenkins 中点击 **新建任务**
2. 输入任务名称，选择 **流水线 (Pipeline)**
3. 点击 **确定**

#### 2. 配置 Pipeline

在 **流水线** 部分：

**选项 A：从 SCM 获取 Jenkinsfile**
- **定义**: 选择 **Pipeline script from SCM**
- **SCM**: 选择 **Git**
- **Repository URL**: 输入你的 Git 仓库地址
- **Credentials**: 配置 Git 凭据（如果需要）
- **分支**: `*/main` 或你的主分支
- **脚本路径**: `h5-coverage-demo/Jenkinsfile`

**选项 B：直接在 Jenkins 中编写**
- **定义**: 选择 **Pipeline script**
- 将 `Jenkinsfile` 的内容复制到脚本框中

#### 3. 配置参数

Pipeline 支持以下参数（可在构建时选择）：

- **ENABLE_COVERAGE**: 是否启用覆盖率插桩 (`true`/`false`)
- **DEPLOY_TARGET**: 部署目标 (`nginx`/`docker`/`none`)
- **DEPLOY_PATH**: 部署路径（Nginx 模式，默认: `/var/www/html/h5-coverage-demo`）
- **COVERAGE_SERVER_PORT**: 覆盖率服务器端口（默认: `8081`）

### 方式二：使用自由风格项目

如果不想使用 Pipeline，可以创建自由风格项目：

1. **源码管理**: 配置 Git 仓库
2. **构建环境**: 
   - 勾选 **Provide Node & npm bin/ folder to PATH**
   - 选择 Node.js 版本
3. **构建步骤**:
   ```bash
   cd h5-coverage-demo
   npm install --legacy-peer-deps
   ENABLE_COVERAGE=true npm run build
   ```
4. **构建后操作**:
   - **归档构件**: `h5-coverage-demo/dist/**`

## 部署配置

### Nginx 部署

#### 1. 配置 Nginx

将 `nginx.conf` 复制到 Nginx 配置目录：

```bash
sudo cp h5-coverage-demo/nginx.conf /etc/nginx/sites-available/h5-coverage-demo
sudo ln -s /etc/nginx/sites-available/h5-coverage-demo /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl reload nginx
```

#### 2. 启动覆盖率服务器

覆盖率服务器需要单独运行，可以使用以下方式：

**方式 A：直接运行**
```bash
cd /var/www/html/h5-coverage-demo
node coverage-server.js
```

**方式 B：使用 PM2（推荐）**
```bash
npm install -g pm2
cd /var/www/html/h5-coverage-demo
pm2 start coverage-server.js --name h5-coverage-server
pm2 save
pm2 startup  # 设置开机自启
```

**方式 C：使用 systemd 服务**

创建服务文件 `/etc/systemd/system/h5-coverage-server.service`:

```ini
[Unit]
Description=H5 Coverage Data Collection Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/html/h5-coverage-demo
ExecStart=/usr/bin/node coverage-server.js
Restart=always
RestartSec=10
Environment=PORT=8081
Environment=COVERAGE_DIR=/var/www/html/h5-coverage-demo/.nyc_output

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable h5-coverage-server
sudo systemctl start h5-coverage-server
sudo systemctl status h5-coverage-server
```

### Docker 部署

#### 1. 构建镜像

在 Jenkins Pipeline 中，Docker 部署会自动构建镜像。也可以手动构建：

```bash
cd h5-coverage-demo
docker build -t h5-coverage-demo:latest --build-arg ENABLE_COVERAGE=true .
```

#### 2. 运行容器

```bash
docker run -d \
  --name h5-coverage-demo \
  -p 80:80 \
  -p 8081:8081 \
  -e ENABLE_COVERAGE=true \
  h5-coverage-demo:latest
```

## 覆盖率数据收集流程

### 1. 构建阶段

Jenkins Pipeline 会：
- 检出代码
- 安装依赖
- 执行插桩构建（如果 `ENABLE_COVERAGE=true`）
- 验证构建产物
- 部署到目标环境

### 2. 运行时数据收集

1. **用户访问应用**: 浏览器加载插桩后的 JavaScript 代码
2. **代码执行**: 用户操作应用，触发代码执行
3. **数据上报**: `coverage-config.js` 自动将覆盖率数据上报到 `/api/coverage`
4. **数据存储**: 覆盖率服务器接收数据并保存到 `.nyc_output/coverage.json`

### 3. 生成覆盖率报告

**方式 A：通过 API**
```bash
curl -X POST http://localhost:8081/api/coverage/report
```

**方式 B：命令行**
```bash
cd /var/www/html/h5-coverage-demo
node coverage-server.js --report
```

**方式 C：在 Jenkins 中**

可以在 Jenkins Pipeline 中添加一个阶段来生成报告：

```groovy
stage('Generate Coverage Report') {
    steps {
        sh '''
            cd /var/www/html/h5-coverage-demo
            node coverage-server.js --report
        '''
        publishHTML([
            reportDir: 'h5-coverage-demo/coverage',
            reportFiles: 'index.html',
            reportName: 'Coverage Report'
        ])
    }
}
```

## 验证部署

### 1. 检查构建产物

```bash
ls -lah /var/www/html/h5-coverage-demo/
# 应该看到: index.html, bundle.*.js, bundle.*.js.map, coverage-config.js
```

### 2. 检查覆盖率服务器

```bash
# 检查服务是否运行
curl http://localhost:8081/api/coverage/stats

# 应该返回:
# {"success":true,"fileCount":0,"lastUpdate":null}
```

### 3. 测试应用

1. 访问应用: `http://your-server-ip/h5-coverage-demo`
2. 打开浏览器控制台（F12）
3. 操作应用（点击按钮等）
4. 查看控制台，应该看到覆盖率数据上报成功的消息

### 4. 检查覆盖率数据

```bash
# 查看覆盖率数据文件
cat /var/www/html/h5-coverage-demo/.nyc_output/coverage.json

# 或查看统计信息
curl http://localhost:8081/api/coverage/stats
```

## 常见问题

### Q1: 构建失败，提示找不到 node 或 npm

**解决方案**:
- 确保 Jenkins 服务器已安装 Node.js
- 如果使用 NodeJS Plugin，确保已正确配置
- 或在 Pipeline 中使用 `sh` 命令指定完整路径

### Q2: 部署时权限不足

**解决方案**:
- 确保 Jenkins 用户有 sudo 权限（用于 Nginx 部署）
- 或配置 Jenkins 用户为 `www-data` 或 `nginx` 组的成员

### Q3: 覆盖率数据为空

**解决方案**:
- 确保 `ENABLE_COVERAGE=true` 时构建
- 检查 `dist/coverage-config.js` 是否存在
- 等待代码执行后再检查（覆盖率数据在代码执行后才会有）
- 查看浏览器控制台是否有错误

### Q4: 覆盖率服务器无法访问

**解决方案**:
- 检查防火墙设置，确保端口 8081 开放
- 检查 Nginx 配置中的代理设置
- 查看覆盖率服务器日志

### Q5: 如何查看覆盖率报告

**解决方案**:
1. 生成报告: `node coverage-server.js --report`
2. 报告位置: `coverage/index.html`
3. 可以通过 Jenkins HTML Publisher 插件在 Jenkins 中查看
4. 或使用 `scp` 下载到本地查看

## 最佳实践

1. **使用 PM2 管理覆盖率服务器**: 确保服务稳定运行
2. **定期生成报告**: 可以设置定时任务定期生成覆盖率报告
3. **归档覆盖率数据**: 在 Jenkins 中归档 `.nyc_output/coverage.json` 以便后续分析
4. **监控覆盖率趋势**: 可以集成到 CI/CD 流程中，设置覆盖率阈值
5. **分离构建和部署**: 可以创建两个独立的 Job，一个负责构建，一个负责部署

## 下一步

- 配置自动化测试触发覆盖率收集
- 集成到 CI/CD 流程
- 设置覆盖率阈值和告警
- 配置覆盖率报告自动发布

