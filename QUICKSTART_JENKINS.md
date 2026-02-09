# Jenkins 快速开始指南

## 5 分钟快速配置

### 步骤 1: 在 Jenkins 中创建 Pipeline Job

1. 登录 Jenkins（`http://your-server-ip:8080`）
2. 点击 **新建任务**
3. 输入任务名称: `h5-coverage-demo`
4. 选择 **流水线 (Pipeline)**
5. 点击 **确定**

### 步骤 2: 配置 Pipeline

在 **流水线** 配置中：

1. **定义**: 选择 **Pipeline script from SCM**
2. **SCM**: 选择 **Git**
3. **Repository URL**: 输入你的 Git 仓库地址
4. **Credentials**: 如果需要，配置 Git 凭据
5. **分支**: `*/main` 或你的主分支名称
6. **脚本路径**: `h5-coverage-demo/Jenkinsfile`

### 步骤 3: 首次构建

1. 点击 **保存**
2. 点击 **立即构建**
3. 在构建参数中：
   - **ENABLE_COVERAGE**: 选择 `true`
   - **DEPLOY_TARGET**: 选择 `nginx` 或 `none`（首次构建可以先不部署）
   - **DEPLOY_PATH**: 使用默认值或自定义路径
   - **COVERAGE_SERVER_PORT**: 使用默认值 `8081`

### 步骤 4: 配置部署环境（如果选择部署）

#### Nginx 部署

1. **安装 Nginx**（如果未安装）:
   ```bash
   sudo apt update
   sudo apt install nginx -y
   ```

2. **配置 Nginx**:
   ```bash
   # 复制配置文件
   sudo cp /path/to/h5-coverage-demo/nginx.conf /etc/nginx/sites-available/h5-coverage-demo
   
   # 创建符号链接
   sudo ln -s /etc/nginx/sites-available/h5-coverage-demo /etc/nginx/sites-enabled/
   
   # 测试配置
   sudo nginx -t
   
   # 重载 Nginx
   sudo systemctl reload nginx
   ```

3. **启动覆盖率服务器**:
   ```bash
   # 安装 PM2（推荐）
   sudo npm install -g pm2
   
   # 启动服务器
   cd /var/www/html/h5-coverage-demo
   pm2 start coverage-server.js --name h5-coverage-server
   pm2 save
   pm2 startup
   ```

### 步骤 5: 验证部署

1. **访问应用**: `http://your-server-ip/h5-coverage-demo`
2. **打开浏览器控制台**（F12）
3. **操作应用**（点击按钮等）
4. **查看控制台输出**，应该看到覆盖率数据上报成功的消息

### 步骤 6: 生成覆盖率报告

在服务器上执行：

```bash
cd /var/www/html/h5-coverage-demo
node coverage-server.js --report
```

报告将生成在 `coverage/index.html`，可以通过以下方式查看：
- 使用 `scp` 下载到本地
- 配置 Nginx 提供静态文件服务
- 在 Jenkins 中配置 HTML Publisher 插件

## 常用命令

### 查看覆盖率服务器状态

```bash
# 如果使用 PM2
pm2 status
pm2 logs h5-coverage-server

# 如果使用 systemd
sudo systemctl status h5-coverage-server
```

### 查看覆盖率统计

```bash
curl http://localhost:8081/api/coverage/stats
```

### 手动触发覆盖率报告生成

```bash
curl -X POST http://localhost:8081/api/coverage/report
```

### 查看覆盖率数据

```bash
cat /var/www/html/h5-coverage-demo/.nyc_output/coverage.json
```

## 故障排查

### Git 连接错误（TLS 错误）

如果遇到以下错误：
```
fatal: unable to access 'https://github.com/...': GnuTLS recv error (-110): The TLS connection was non-properly terminated.
```

**解决方案 1: 在 Jenkins 服务器上配置 Git 使用 OpenSSL（推荐）**

在 Jenkins 服务器上执行：
```bash
# 检查 Git 使用的 TLS 后端
git config --global http.sslBackend openssl

# 或者如果系统没有 OpenSSL，尝试增加超时时间
git config --global http.postBuffer 524288000
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999
```

**解决方案 2: 在 Jenkinsfile 中添加 Git 配置步骤**

在 `Checkout` 阶段之前添加一个 `Configure Git` 阶段：
```groovy
stage('Configure Git') {
    steps {
        sh '''
            git config --global http.sslBackend openssl || true
            git config --global http.postBuffer 524288000 || true
            git config --global http.lowSpeedLimit 0 || true
            git config --global http.lowSpeedTime 999999 || true
        '''
    }
}
```

**解决方案 3: 使用 SSH 而不是 HTTPS**

1. 在 Jenkins 中配置 SSH 密钥
2. 将 Git 仓库 URL 改为 SSH 格式：`git@github.com:username/repo.git`

**解决方案 4: 增加 Git 超时时间**

在 Jenkins Job 配置中：
1. 进入 **Pipeline** 配置
2. 在 **Git** 配置中，展开 **Advanced**
3. 设置 **Timeout (in minutes)** 为更大的值（如 10）

**解决方案 5: 检查网络和代理设置**

如果 Jenkins 服务器在代理后面：
```bash
# 配置 Git 代理
git config --global http.proxy http://proxy-server:port
git config --global https.proxy https://proxy-server:port
```

### 构建失败

1. 检查 Jenkins 控制台输出
2. 确认 Node.js 已安装: `node --version`
3. 确认 npm 已安装: `npm --version`

### 部署失败

1. 检查部署路径权限
2. 确认 Nginx 配置正确: `sudo nginx -t`
3. 查看 Nginx 日志: `sudo tail -f /var/log/nginx/error.log`

### 覆盖率数据为空

1. 确认构建时 `ENABLE_COVERAGE=true`
2. 检查 `dist/coverage-config.js` 是否存在
3. 等待代码执行后再检查（覆盖率数据在代码执行后才会有）
4. 查看浏览器控制台是否有错误

### 覆盖率服务器无法访问

1. 检查服务器是否运行: `pm2 status` 或 `sudo systemctl status h5-coverage-server`
2. 检查端口是否开放: `netstat -tlnp | grep 8081`
3. 检查防火墙: `sudo ufw status`

## 下一步

- 阅读 [JENKINS_SETUP.md](./JENKINS_SETUP.md) 了解详细配置
- 配置自动化测试
- 设置覆盖率阈值和告警
- 集成到 CI/CD 流程

