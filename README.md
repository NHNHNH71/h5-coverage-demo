# H5覆盖率验证项目

这是一个简单的H5项目，用于验证Jenkins插桩构建和覆盖率报告生成流程。

## 快速开始

### 本地覆盖率报告生成实验（5分钟快速体验）

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启用覆盖率构建**
   ```bash
   # Windows PowerShell
   $env:ENABLE_COVERAGE="true"; npm run build
   
   # Windows CMD
   set ENABLE_COVERAGE=true && npm run build
   
   # Linux/Mac
   ENABLE_COVERAGE=true npm run build
   ```

3. **启动测试服务器**
   ```bash
   npm run test:coverage
   # 或
   node test-server.js
   ```

4. **在浏览器中测试**
   - 访问 http://localhost:8080
   - 点击按钮，查看控制台输出
   - 等待几秒钟让覆盖率数据自动上报

5. **生成覆盖率报告**
   - 在服务器终端按 `Ctrl+C` 停止服务器
   - 报告会自动生成在 `coverage/index.html`
   - 打开该文件查看详细覆盖率报告

详细步骤请参考 [本地覆盖率报告生成实验](#本地覆盖率报告生成实验) 章节。

## 项目结构

```
h5-coverage-demo/
├── package.json              # 项目依赖和脚本配置
├── webpack.config.js         # Webpack配置，支持sourcemap生成
├── .babelrc                  # Babel配置，支持覆盖率插桩
├── .package.sh               # 构建脚本，支持ENABLE_COVERAGE参数
├── nginx.conf                # Nginx配置文件（H5组件必需）
├── .nycrc.json               # nyc配置文件（报告生成时使用）
├── coverage-config.template.js  # coverage-config.js模板
├── index.html                # HTML入口文件
├── src/
│   ├── index.js              # 入口文件
│   ├── utils.js              # 工具函数（用于测试覆盖率）
│   ├── styles.css            # 样式文件
│   └── components/
│       └── Button.js         # 示例组件
└── README.md                 # 本文件
```

## 功能特性

- ✅ 支持覆盖率插桩（使用babel-plugin-istanbul）
- ✅ 支持sourcemap生成
- ✅ 支持Jenkins构建流程
- ✅ 包含示例代码用于覆盖率测试

## 本地开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:9000

### 标准构建

```bash
npm run build
```

### 覆盖率构建

```bash
ENABLE_COVERAGE=true npm run build
```

或使用构建脚本：

```bash
chmod +x .package.sh
ENABLE_COVERAGE=true ./.package.sh
```

## 本地覆盖率报告生成实验

### 实验目标

在本地环境中完整验证覆盖率插桩、数据收集和报告生成的整个流程。

### 实验步骤

#### 步骤1: 安装依赖

```bash
npm install
```

#### 步骤2: 启用覆盖率插桩构建

```bash
# Windows (PowerShell)
$env:ENABLE_COVERAGE="true"; npm run build

# Windows (CMD)
set ENABLE_COVERAGE=true && npm run build

# Linux/Mac
ENABLE_COVERAGE=true npm run build
```

或者使用构建脚本（需要Git Bash或WSL）：

```bash
chmod +x .package.sh
ENABLE_COVERAGE=true ./.package.sh
```

**验证构建产物**：

检查 `dist` 目录应包含：
- ✅ `bundle.[hash].js` - 插桩后的JS文件
- ✅ `bundle.[hash].js.map` - Sourcemap文件
- ✅ `coverage-config.js` - 覆盖率配置文件
- ✅ `sourcemaps/` 目录 - 包含所有sourcemap文件

#### 步骤3: 启动本地测试服务器

```bash
node test-server.js
```

服务器将在 `http://localhost:8080` 启动。

#### 步骤4: 在浏览器中操作应用

1. 打开浏览器，访问 `http://localhost:8080`
2. 打开浏览器开发者工具（F12），查看Console标签
3. 执行以下操作以触发代码执行：
   - **点击按钮** - 触发Button组件的点击事件
   - **查看控制台输出** - 自动触发utils.js中的函数调用
   - **刷新页面** - 触发所有初始化代码

4. 观察控制台输出，应该能看到：
   - "H5覆盖率验证项目已启动"
   - "当前日期: ..."
   - "数组求和: 15"
   - 覆盖率数据上报成功的消息（每5秒自动上报）

#### 步骤5: 查看覆盖率数据收集

在服务器终端中，你应该能看到类似以下输出：

```
✓ 覆盖率数据已接收并保存 (3 个文件)
```

这表示覆盖率数据正在被收集。

#### 步骤6: 生成覆盖率报告

1. 在服务器终端按 `Ctrl+C` 停止服务器
2. 服务器会自动调用nyc生成覆盖率报告

报告将生成在 `coverage/` 目录中：
- `coverage/index.html` - HTML格式的详细报告（推荐查看）
- `coverage/lcov.info` - LCOV格式报告（用于CI/CD集成）
- `coverage/coverage-final.json` - JSON格式的原始数据

#### 步骤7: 查看覆盖率报告

打开 `coverage/index.html` 文件，你将看到：

- **总体覆盖率统计**：语句、分支、函数、行数覆盖率
- **文件级别覆盖率**：每个源文件的详细覆盖率
- **代码高亮**：绿色表示已覆盖，红色表示未覆盖，黄色表示部分覆盖

**预期覆盖率**：
- `src/index.js` - 应该接近100%（所有代码都会执行）
- `src/utils.js` - 部分覆盖（formatDate和calculateSum会被调用，validateEmail不会被调用）
- `src/components/Button.js` - 应该接近100%（按钮会被点击）

#### 步骤8: 提高覆盖率（可选实验）

为了测试覆盖率收集的完整性，可以尝试：

1. 在浏览器控制台中手动调用未覆盖的函数：
   ```javascript
   // 测试validateEmail函数
   window.__coverage__ // 查看覆盖率对象
   ```

2. 修改 `src/index.js`，添加更多函数调用：
   ```javascript
   import { validateEmail } from './utils';
   console.log('邮箱验证:', validateEmail('test@example.com'));
   ```

3. 重新构建并测试，观察覆盖率变化。

### 实验验证清单

- [ ] 构建成功，生成了插桩后的JS文件
- [ ] Sourcemap文件已生成
- [ ] coverage-config.js文件已生成
- [ ] 测试服务器成功启动
- [ ] 浏览器可以正常访问应用
- [ ] 覆盖率数据成功收集（服务器终端有提示）
- [ ] 覆盖率报告成功生成
- [ ] 可以在HTML报告中查看详细的覆盖率信息

## Jenkins验证步骤（Docker环境）

### 前置准备

#### 1. 确认Jenkins运行环境

确认Jenkins运行在Docker容器中，并了解以下信息：
- Jenkins容器名称或ID
- Jenkins工作目录挂载位置
- Jenkins是否已安装Node.js插件或使用包含Node.js的镜像

#### 2. 检查Jenkins容器

```bash
# 查看运行中的Jenkins容器
docker ps | grep jenkins

# 查看Jenkins容器详细信息
docker inspect <jenkins-container-name>
```

#### 3. 进入Jenkins容器（如需要）

```bash
# 进入Jenkins容器
docker exec -it <jenkins-container-name> /bin/bash

# 或使用sh（如果容器没有bash）
docker exec -it <jenkins-container-name> /bin/sh

# 检查Node.js和npm是否已安装
node --version
npm --version
```

如果容器中没有Node.js，需要：
- 使用包含Node.js的Jenkins镜像，或
- 在Jenkins中安装Node.js插件（推荐）

### 步骤1: 项目上传到Git仓库

1. 初始化Git仓库（如果还没有）：
   ```bash
   cd h5-coverage-demo
   git init
   git add .
   git commit -m "Initial commit: H5覆盖率验证项目"
   ```

2. 推送到远程仓库（GitHub、GitLab等）：
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

3. 确保Jenkins可以访问该仓库（配置SSH密钥或访问令牌）

### 步骤2: 在Jenkins中配置H5构建Job

#### 2.1 访问Jenkins Web界面

1. 打开浏览器，访问Jenkins地址（通常是 `http://localhost:8080` 或配置的端口）
2. 使用管理员账号登录

#### 2.2 安装必要插件

进入 **Manage Jenkins** → **Manage Plugins** → **Available**，搜索并安装：

- **Pipeline** - 用于Pipeline类型Job
- **NodeJS Plugin** - 用于Node.js环境（如果Jenkins镜像中没有Node.js）
- **Git Plugin** - 用于Git集成（通常已安装）

安装完成后，重启Jenkins。

#### 2.3 配置Node.js（如果使用NodeJS Plugin）

1. 进入 **Manage Jenkins** → **Global Tool Configuration**
2. 找到 **NodeJS** 部分
3. 点击 **Add NodeJS**
4. 配置：
   - **Name**: `NodeJS`（或自定义名称）
   - **Version**: 选择LTS版本（如18.x或20.x）
   - **Global npm packages to install**: 留空或根据需要添加
5. 点击 **Save**

#### 2.4 创建Pipeline Job

1. 在Jenkins首页，点击 **New Item**
2. 输入Job名称，例如：`h5-coverage-demo`
3. 选择 **Pipeline** 类型
4. 点击 **OK**

#### 2.5 配置Pipeline Job

在Job配置页面中：

**General 标签**：
- 勾选 **This project is parameterized**
- 点击 **Add Parameter** → **Boolean Parameter**
  - **Name**: `ENABLE_COVERAGE`
  - **Default Value**: 取消勾选（默认false）
  - **Description**: `启用覆盖率插桩构建`

**Pipeline 标签**：
- **Definition**: 选择 **Pipeline script from SCM**
- **SCM**: 选择 **Git**
- **Repository URL**: 输入你的Git仓库地址
- **Credentials**: 选择或添加Git访问凭证
- **Branches to build**: `*/main` 或你的主分支名
- **Script Path**: `h5-coverage-demo/Jenkinsfile`（如果使用Jenkinsfile）或选择 **Pipeline script**

**如果使用Pipeline script**，粘贴以下内容：

```groovy
pipeline {
    agent any
    
    tools {
        // 如果使用NodeJS Plugin，取消注释下面这行
        // nodejs 'NodeJS'
    }
    
    environment {
        ENABLE_COVERAGE = "${params.ENABLE_COVERAGE ?: 'false'}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '正在检出代码...'
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                echo '正在构建项目...'
                script {
                    // 进入项目目录
                    dir('h5-coverage-demo') {
                        // 确保构建脚本有执行权限
                        sh 'chmod +x .package.sh || true'
                        
                        // 执行构建
                        sh '''
                            echo "ENABLE_COVERAGE=${ENABLE_COVERAGE}"
                            ENABLE_COVERAGE=${ENABLE_COVERAGE} ./.package.sh
                        '''
                    }
                }
            }
        }
        
        stage('Verify Build Artifacts') {
            steps {
                echo '正在验证构建产物...'
                script {
                    dir('h5-coverage-demo') {
                        // 检查必要文件是否存在
                        sh '''
                            echo "检查构建产物..."
                            ls -la dist/ || echo "dist目录不存在"
                            ls -la dist/*.js || echo "JS文件不存在"
                            ls -la dist/*.map || echo "Sourcemap文件不存在"
                            
                            if [ "$ENABLE_COVERAGE" = "true" ]; then
                                if [ -f "dist/coverage-config.js" ]; then
                                    echo "✓ coverage-config.js已生成"
                                else
                                    echo "⚠ coverage-config.js未生成"
                                fi
                            fi
                        '''
                    }
                }
            }
        }
        
        stage('Archive Artifacts') {
            steps {
                echo '正在归档构建产物...'
                archiveArtifacts artifacts: 'h5-coverage-demo/dist/**', 
                                 fingerprint: true,
                                 allowEmptyArchive: false
            }
        }
    }
    
    post {
        success {
            echo '构建成功！'
        }
        failure {
            echo '构建失败！'
        }
        always {
            // 清理工作空间（可选）
            // cleanWs()
        }
    }
}
```

**如果使用Jenkinsfile**，在项目根目录创建 `h5-coverage-demo/Jenkinsfile` 文件，内容同上。

点击 **Save** 保存配置。

### 步骤3: 执行标准构建验证

#### 3.1 执行标准构建（不启用覆盖率）

1. 在Job页面，点击 **Build with Parameters**
2. 确保 **ENABLE_COVERAGE** 未勾选（false）
3. 点击 **Build**

#### 3.2 查看构建日志

1. 点击构建历史中的构建号
2. 点击 **Console Output** 查看详细日志
3. 验证：
   - ✅ 代码检出成功
   - ✅ 依赖安装成功
   - ✅ 构建成功
   - ✅ 生成了 `bundle.[hash].js` 文件
   - ✅ 生成了 `bundle.[hash].js.map` 文件
   - ✅ **没有**生成 `coverage-config.js` 文件

#### 3.3 下载构建产物

1. 在构建详情页面，点击 **Artifacts**
2. 下载 `dist` 目录中的文件
3. 验证文件内容：
   - JS文件应该是压缩后的生产代码
   - Sourcemap文件应该存在

### 步骤4: 执行覆盖率构建验证

#### 4.1 执行覆盖率构建

1. 在Job页面，点击 **Build with Parameters**
2. **勾选** **ENABLE_COVERAGE**（设置为true）
3. 点击 **Build**

#### 4.2 查看构建日志

查看Console Output，验证：
- ✅ 日志中显示 "✓ 覆盖率插桩已启用"
- ✅ 构建成功
- ✅ 生成了 `coverage-config.js` 文件
- ✅ `dist/sourcemaps/` 目录包含所有sourcemap文件

#### 4.3 验证插桩代码

1. 下载构建产物
2. 打开 `dist/bundle.[hash].js` 文件
3. 搜索 `__coverage__`，应该能找到覆盖率插桩代码
4. 验证 `coverage-config.js` 文件存在且内容正确

### 步骤5: 部署和测试（可选）

#### 5.1 部署构建产物

将构建产物部署到测试环境（Nginx、Apache等）。

#### 5.2 配置覆盖率数据收集端点

确保测试环境有接收覆盖率数据的API端点（`/api/coverage`）。

#### 5.3 执行测试

1. 访问部署的应用
2. 执行各种操作触发代码执行
3. 检查覆盖率数据是否成功上报

### 步骤6: 生成覆盖率报告（在Jenkins中）

如果需要 Jenkins 自动生成覆盖率报告，可以在Pipeline中添加报告生成阶段：

```groovy
stage('Generate Coverage Report') {
    when {
        expression { params.ENABLE_COVERAGE == true }
    }
    steps {
        script {
            dir('h5-coverage-demo') {
                // 如果有收集到的覆盖率数据文件
                sh '''
                    if [ -f ".nyc_output/coverage.json" ]; then
                        npx nyc report --reporter=html --reporter=text --reporter=lcov
                        echo "覆盖率报告已生成"
                    else
                        echo "未找到覆盖率数据文件"
                    fi
                '''
            }
        }
    }
}
```

并在post阶段发布报告：

```groovy
post {
    always {
        publishHTML([
            reportDir: 'h5-coverage-demo/coverage',
            reportFiles: 'index.html',
            reportName: 'Coverage Report',
            keepAll: true
        ])
    }
}
```

### Docker Jenkins常见问题排查

#### 问题1: Jenkins容器中没有Node.js

**解决方案**：
1. 使用包含Node.js的Jenkins镜像，例如：
   ```bash
   docker run -d -p 8080:8080 -p 50000:50000 \
     -v jenkins_home:/var/jenkins_home \
     jenkins/jenkins:lts
   ```
   然后在Jenkins中安装NodeJS Plugin。

2. 或者在Jenkinsfile中使用Docker agent：
   ```groovy
   agent {
       docker {
           image 'node:18-alpine'
           args '-v /var/run/docker.sock:/var/run/docker.sock'
       }
   }
   ```

#### 问题2: 构建脚本权限问题

**解决方案**：
在Pipeline中添加：
```groovy
sh 'chmod +x .package.sh'
```

#### 问题3: 文件路径问题

**解决方案**：
确保在Pipeline中使用 `dir()` 进入正确的项目目录：
```groovy
dir('h5-coverage-demo') {
    // 构建命令
}
```

#### 问题4: 环境变量未传递

**解决方案**：
确保在environment块中正确定义：
```groovy
environment {
    ENABLE_COVERAGE = "${params.ENABLE_COVERAGE ?: 'false'}"
}
```

并在执行脚本时使用：
```groovy
sh 'ENABLE_COVERAGE=${ENABLE_COVERAGE} ./.package.sh'
```

### 5. 常见问题排查

#### 5.1 覆盖率插桩未生效

**问题**: 构建后代码中没有覆盖率插桩

**排查步骤**:
1. 检查 `ENABLE_COVERAGE` 环境变量是否为 `true`
2. 检查 `.babelrc` 中是否配置了 `babel-plugin-istanbul`
3. 检查 `package.json` 中是否安装了 `babel-plugin-istanbul`
4. 检查构建日志中是否有相关错误

**解决方案**:
- 确保 `BABEL_ENV=coverage` 环境变量已设置
- 确保 `babel-plugin-istanbul` 已正确安装
- 检查 `.babelrc` 配置是否正确

#### 5.2 Sourcemap未生成

**问题**: 构建后没有生成sourcemap文件

**排查步骤**:
1. 检查 `webpack.config.js` 中 `devtool` 配置
2. 检查构建日志

**解决方案**:
- 确保 `devtool: 'source-map'` 或类似配置已设置
- 检查webpack版本是否支持sourcemap

#### 5.3 coverage-config.js未生成

**问题**: 启用覆盖率后，`coverage-config.js` 文件未生成

**排查步骤**:
1. 检查 `.package.sh` 脚本是否正确执行
2. 检查 `coverage-config.template.js` 是否存在

**解决方案**:
- 确保 `.package.sh` 有执行权限
- 确保 `coverage-config.template.js` 文件存在

#### 5.4 覆盖率数据未上报

**问题**: 覆盖率数据无法上报到服务器

**排查步骤**:
1. 检查浏览器控制台是否有错误
2. 检查 `coverage-config.js` 中的端点配置
3. 检查网络请求是否成功

**解决方案**:
- 检查端点URL是否正确
- 检查服务器是否支持接收覆盖率数据
- 检查CORS配置

## 技术栈

- **构建工具**: Webpack 5
- **转译工具**: Babel
- **覆盖率工具**: babel-plugin-istanbul
- **报告工具**: nyc

## 依赖说明

### 开发依赖

- `webpack`: 模块打包工具
- `babel-loader`: Babel加载器
- `babel-plugin-istanbul`: 覆盖率插桩插件
- `html-webpack-plugin`: HTML模板插件
- `webpack-dev-server`: 开发服务器

## 注意事项

1. **覆盖率插桩**: 仅在 `ENABLE_COVERAGE=true` 时启用，避免影响生产构建性能
2. **Sourcemap**: 覆盖率报告需要sourcemap文件来映射回源代码
3. **构建脚本**: `.package.sh` 需要在Linux/Unix环境下执行，Windows环境可能需要使用Git Bash或WSL
4. **Nginx配置**: 部署时需要配置Nginx以支持单页应用路由

## 许可证

ISC

