# Docker Jenkins 调试命令

## 1. 查看 Jenkins 容器信息

### 查看运行中的容器
```bash
docker ps
# 找到 Jenkins 容器的 CONTAINER ID 或 NAME
```

### 查看容器详细配置
```bash
# 替换 <container_id> 为实际的容器ID或名称
docker inspect <container_id>
```

### 查看卷挂载信息
```bash
# 查看挂载的卷
docker inspect <container_id> | grep -A 20 "Mounts"

# 或者在 Windows PowerShell 中
docker inspect <container_id> | Select-String -Pattern "Mounts" -Context 0,20
```

## 2. 进入 Jenkins 容器检查权限

### 进入容器
```bash
docker exec -it <container_id> bash
```

### 在容器内检查权限
```bash
# 查看当前用户
whoami
# 应该显示: jenkins

# 查看用户 ID
id
# 应该显示: uid=1000(jenkins) gid=1000(jenkins)

# 查看工作空间权限
ls -la /var/jenkins_home/workspace/

# 尝试创建测试目录
mkdir -p /var/jenkins_home/workspace/h5-coverage-demo/deploy
echo "测试" > /var/jenkins_home/workspace/h5-coverage-demo/deploy/test.txt
cat /var/jenkins_home/workspace/h5-coverage-demo/deploy/test.txt

# 检查 /var/www 权限
ls -la /var/www 2>/dev/null || echo "/var/www 不存在或无权限访问"

# 退出容器
exit
```

## 3. 查看 Docker 启动命令

### 如果用 docker run 启动
```bash
# 查看容器启动命令
docker inspect <container_id> --format='{{.Config.Cmd}}'

# 查看完整的创建命令（近似）
docker inspect <container_id> --format='{{json .Config}}'
```

### 如果用 docker-compose 启动
```bash
# 查看 docker-compose.yml 内容
cat docker-compose.yml

# 查看当前运行的配置
docker-compose config
```

## 4. 查看容器日志
```bash
# 查看最新的日志
docker logs <container_id> --tail 100

# 实时查看日志
docker logs -f <container_id>
```

---

## 立即解决方案（无需修改 Docker）

### 方案 A: 修改 Jenkins 任务参数 (推荐)

1. 进入 Jenkins Web 界面
2. 打开你的 h5-coverage-demo 任务
3. 点击 "Build with Parameters"
4. **修改 DEPLOY_PATH 参数**:
   - ❌ 旧值: `/var/www/html/h5-coverage-demo`
   - ✅ 新值: `/var/jenkins_home/workspace/h5-coverage-demo/deploy`
   - 或使用: `${WORKSPACE}/deploy`
5. 点击 "Build" 开始构建

### 方案 B: 提交代码更新使用新的默认值

```bash
cd d:\Programing\idea\H5-cc\h5-coverage-demo

# 提交 Jenkinsfile 的修改
git add Jenkinsfile JENKINS_DEPLOYMENT.md
git commit -m "fix: 修改默认部署路径为 workspace/deploy"
git push origin main
```

然后在 Jenkins 中:
1. 使用默认参数（不手动指定 DEPLOY_PATH）
2. 重新构建

---

## 长期解决方案（配置 Docker 卷挂载）

如果你确实需要部署到 `/var/www/html`，需要配置 Docker 卷挂载。

### 步骤:

1. **停止 Jenkins 容器**
```bash
docker stop <container_id>
```

2. **创建新的启动命令**（包含卷挂载）
```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/www/html:/var/www/html \
  jenkins/jenkins:lts

# 设置宿主机目录权限
sudo mkdir -p /var/www/html
sudo chown -R 1000:1000 /var/www/html
```

3. **或使用 Docker Compose**
```yaml
version: '3'
services:
  jenkins:
    image: jenkins/jenkins:lts
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/www/html:/var/www/html
    user: "1000:1000"  # jenkins 用户的 UID/GID

volumes:
  jenkins_home:
```

---

## 我的推荐

**对于开发测试阶段，建议使用方案 A**:
- ✅ 无需修改 Docker 配置
- ✅ 立即可用
- ✅ 使用 `${WORKSPACE}/deploy` 作为部署路径

**部署成功后，你可以:**
- 在 Jenkins 中下载归档的产物
- 或在构建机上访问 `/var/jenkins_home/workspace/h5-coverage-demo/deploy/`
- 或添加后续步骤将文件复制/上传到实际的 Web 服务器
