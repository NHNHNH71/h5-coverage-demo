# Jenkins Node.js 安装指南

如果 Jenkins 构建时提示 `node: not found`，说明 Jenkins 服务器上没有安装 Node.js。

## 方案1: 使用 Jenkins NodeJS 插件（推荐）

1. **安装 NodeJS 插件**
   - 进入 Jenkins 管理界面
   - 插件管理 → 可选插件
   - 搜索 "NodeJS" 并安装

2. **配置 NodeJS 工具**
   - 管理 Jenkins → 全局工具配置
   - 找到 "NodeJS" 部分
   - 点击 "新增 NodeJS"
   - 名称填写: `NodeJS`（或其他名称）
   - 版本选择: `18.x` 或更高
   - 保存

3. **修改 Jenkinsfile**
   - 取消注释 `tools` 块：
   ```groovy
   tools {
       nodejs 'NodeJS'  // 使用上面配置的名称
   }
   ```

## 方案2: 在 Jenkins 服务器上手动安装 Node.js

### 使用 NodeSource 仓库（推荐）

```bash
# 以 root 或使用 sudo
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 使用 NVM（Node Version Manager）

```bash
# 安装 NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载 shell 配置
source ~/.bashrc

# 安装 Node.js
nvm install 18
nvm use 18

# 设置为默认版本
nvm alias default 18
```

### 直接下载二进制文件

```bash
# 下载 Node.js
cd /tmp
wget https://nodejs.org/dist/v18.20.0/node-v18.20.0-linux-x64.tar.xz

# 解压
tar -xf node-v18.20.0-linux-x64.tar.xz

# 移动到系统目录
sudo mv node-v18.20.0-linux-x64 /opt/nodejs

# 创建符号链接
sudo ln -s /opt/nodejs/bin/node /usr/local/bin/node
sudo ln -s /opt/nodejs/bin/npm /usr/local/bin/npm
sudo ln -s /opt/nodejs/bin/npx /usr/local/bin/npx

# 验证
node --version
npm --version
```

## 方案3: 使用 Docker Agent（如果 Jenkins 支持 Docker）

修改 Jenkinsfile 的 `agent` 部分：

```groovy
agent {
    docker {
        image 'node:18'
        reuseNode true
    }
}
```

## 验证安装

安装完成后，在 Jenkins 构建日志中应该能看到：

```
✓ Node.js 已安装: v18.x.x
✓ NPM 版本: 9.x.x
```

## 故障排查

### 问题1: 安装后仍然找不到 node 命令

**原因**: PATH 环境变量未正确设置

**解决**:
```bash
# 检查 node 位置
which node

# 如果找到，添加到 PATH
export PATH="/path/to/node/bin:$PATH"

# 永久添加到 Jenkins 用户的环境变量
echo 'export PATH="/path/to/node/bin:$PATH"' >> ~/.bashrc
```

### 问题2: Jenkins 用户没有权限

**解决**: 使用 `sudo` 安装，或使用用户级安装（NVM）

### 问题3: 下载速度慢

**解决**: 使用国内镜像

```bash
# 使用淘宝镜像
export NVM_NODEJS_ORG_MIRROR=https://npm.taobao.org/mirrors/node
nvm install 18
```

## 推荐配置

对于生产环境，推荐使用：
- **NodeJS 插件** + **全局工具配置**（最简单）
- 或 **NVM**（灵活，支持多版本）

对于开发/测试环境，可以使用：
- **Docker Agent**（隔离性好）
- 或 **自动安装脚本**（当前 Jenkinsfile 已包含）

