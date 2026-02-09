# Jenkins 部署配置说明

## 问题背景

在 Docker 化的 Jenkins 环境中，默认的 `jenkins` 用户通常没有 `sudo` 权限，也无法直接写入系统目录如 `/var/www/html`。

## 解决方案

### 方案 1: 部署到 Jenkins Workspace (推荐用于开发/测试)

**优点**: 无需额外配置，Jenkins 用户直接有权限

**配置**:
- 使用默认部署路径: `${WORKSPACE}/deploy`
- 构建产物会复制到: `/var/jenkins_home/workspace/h5-coverage-demo/deploy/`

**访问方式**:
- 可以将部署目录挂载到主机，或通过 Jenkins 的 HTTP 服务访问
- 或者在后续步骤中将文件复制到 Nginx/Web 服务器

### 方案 2: 使用 Docker 卷挂载

**配置步骤**:

1. **启动 Jenkins 时挂载卷**:
```bash
docker run -d \
  -v /var/www/html:/var/www/html \
  -v jenkins_home:/var/jenkins_home \
  -p 8080:8080 \
  jenkins/jenkins:lts
```

2. **设置卷权限**:
```bash
# 在主机上执行
sudo chown -R 1000:1000 /var/www/html
# 1000 是 Jenkins 容器内 jenkins 用户的 UID
```

3. **Jenkins 参数配置**:
- DEPLOY_PATH: `/var/www/html/h5-coverage-demo`

### 方案 3: 使用 Nginx 容器共享卷

**Docker Compose 配置**:

```yaml
version: '3'
services:
  jenkins:
    image: jenkins/jenkins:lts
    volumes:
      - jenkins_home:/var/jenkins_home
      - web_content:/web  # 共享卷
    ports:
      - "8080:8080"

  nginx:
    image: nginx:alpine
    volumes:
      - web_content:/usr/share/nginx/html  # 共享卷
    ports:
      - "80:80"

volumes:
  jenkins_home:
  web_content:
```

**Jenkins 参数配置**:
- DEPLOY_PATH: `/web/h5-coverage-demo`

### 方案 4: 使用 scp/rsync 远程部署

**修改 Jenkinsfile Deploy 阶段**:

```groovy
sh '''
    echo "远程部署到 Web 服务器..."
    
    # 使用 scp
    scp -r dist/* user@webserver:/var/www/html/h5-coverage-demo/
    
    # 或使用 rsync
    rsync -avz dist/ user@webserver:/var/www/html/h5-coverage-demo/
'''
```

**前置条件**:
- 配置 Jenkins 到 Web 服务器的 SSH 免密登录
- 在 Jenkins 凭据中添加 SSH 密钥

### 方案 5: 仅归档构建产物，手动部署

**优点**: 最简单，不需要自动部署配置

**步骤**:
1. Jenkins 参数设置: `DEPLOY_TARGET = 'none'`
2. 构建完成后，在 Jenkins 的"归档产物"中下载 `dist/**` 文件
3. 手动上传到 Web 服务器

## 推荐配置

### 开发/测试环境
- 使用**方案 1** (Workspace 部署)
- 或使用**方案 5** (仅归档)

### 生产环境
- 使用**方案 3** (Docker Compose 共享卷)
- 或使用**方案 4** (远程部署)

## 当前 Jenkinsfile 配置

已更新为:
- ✅ 移除所有 `sudo` 命令
- ✅ 默认部署路径改为 `${WORKSPACE}/deploy`
- ✅ 添加友好的错误提示
- ✅ 权限设置改为可选（失败不中断流程）

## 验证部署结果

```bash
# 查看部署目录
ls -la ${WORKSPACE}/deploy/

# 如果使用 Docker 部署，在容器内查看
docker exec jenkins ls -la /var/jenkins_home/workspace/h5-coverage-demo/deploy/
```
