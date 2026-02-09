# 修复本地 Git 仓库配置

## 问题诊断

错误信息：
```
fatal: '/var/jenkins_home/repositories/h5-coverage-demo' does not appear to be a git repository
```

**原因**: `.git` 目录没有被正确复制到容器内。

## 立即修复步骤

### 步骤 1: 检查服务器上的仓库

```bash
# 确认 .git 目录存在
ls -la /iotp/base/git-repos/h5-coverage-demo/.git

# 应该看到 .git 目录
```

### 步骤 2: 检查容器内的目录

```bash
# 进入容器检查
docker exec -it b1b2c451c54c ls -la /var/jenkins_home/repositories/h5-coverage-demo/

# 检查是否有 .git 目录
docker exec -it b1b2c451c54c ls -la /var/jenkins_home/repositories/h5-coverage-demo/.git
```

### 步骤 3A: 如果 .git 目录不存在 - 重新复制

```bash
# 删除容器内的旧目录
docker exec -it b1b2c451c54c rm -rf /var/jenkins_home/repositories/h5-coverage-demo

# 重新复制（确保包含隐藏文件）
docker cp /iotp/base/git-repos/h5-coverage-demo/. b1b2c451c54c:/var/jenkins_home/repositories/h5-coverage-demo/

# 注意最后的 /. 这样会复制所有内容包括隐藏文件

# 验证 .git 存在
docker exec -it b1b2c451c54c ls -la /var/jenkins_home/repositories/h5-coverage-demo/.git
```

### 步骤 3B: 如果 .git 存在但仍报错 - 检查权限

```bash
# 修复所有权
docker exec -it b1b2c451c54c chown -R jenkins:jenkins /var/jenkins_home/repositories/h5-coverage-demo

# 测试 Git 命令
docker exec -it b1b2c451c54c git -C /var/jenkins_home/repositories/h5-coverage-demo status
```

### 步骤 4: 验证 Git 仓库可用

```bash
# 在容器内测试 git ls-remote
docker exec -it b1b2c451c54c git ls-remote -h /var/jenkins_home/repositories/h5-coverage-demo HEAD

# 应该返回 commit hash，表示仓库正常
```

### 步骤 5: 在 Jenkins 重新测试

1. 回到 Jenkins Configure 页面
2. 在 "Source Code Management" 部分点击 "Test Connection" 或直接保存
3. 重新构建

---

## 完整的正确命令序列

```bash
# 1. 确认服务器仓库完整
ls -la /iotp/base/git-repos/h5-coverage-demo/.git

# 2. 删除容器内旧的（如果存在）
docker exec -it b1b2c451c54c rm -rf /var/jenkins_home/repositories/h5-coverage-demo

# 3. 重新复制（使用 /. 确保复制隐藏文件）
docker cp /iotp/base/git-repos/h5-coverage-demo/. b1b2c451c54c:/var/jenkins_home/repositories/h5-coverage-demo/

# 4. 验证
docker exec -it b1b2c451c54c ls -la /var/jenkins_home/repositories/h5-coverage-demo/.git

# 5. 修复权限
docker exec -it b1b2c451c54c chown -R jenkins:jenkins /var/jenkins_home/repositories/h5-coverage-demo

# 6. 测试 Git
docker exec -it b1b2c451c54c git -C /var/jenkins_home/repositories/h5-coverage-demo log -1 --oneline
```

---

## 替代方案：使用 tar 打包复制

如果 docker cp 无法复制隐藏文件，使用 tar：

```bash
# 1. 在服务器上打包
cd /iotp/base/git-repos
tar czf h5-coverage-demo.tar.gz h5-coverage-demo/

# 2. 复制到容器
docker cp /iotp/base/git-repos/h5-coverage-demo.tar.gz b1b2c451c54c:/tmp/

# 3. 在容器内解压
docker exec -it b1b2c451c54c bash -c "cd /var/jenkins_home/repositories && tar xzf /tmp/h5-coverage-demo.tar.gz && chown -R jenkins:jenkins h5-coverage-demo"

# 4. 清理
docker exec -it b1b2c451c54c rm /tmp/h5-coverage-demo.tar.gz
rm /iotp/base/git-repos/h5-coverage-demo.tar.gz

# 5. 验证
docker exec -it b1b2c451c54c ls -la /var/jenkins_home/repositories/h5-coverage-demo/.git
```

---

## 预期结果

执行后应该看到：

```bash
$ docker exec -it b1b2c451c54c git -C /var/jenkins_home/repositories/h5-coverage-demo status
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

然后在 Jenkins 中配置就能正常工作了。
