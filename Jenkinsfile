pipeline {
    agent any
    
    tools {
        // 如果使用NodeJS Plugin，取消注释下面这行并配置正确的名称
        // nodejs 'NodeJS'
    }
    
    parameters {
        choice(
            name: 'ENABLE_COVERAGE',
            choices: ['true', 'false'],
            description: '是否启用覆盖率插桩'
        )
        string(
            name: 'DEPLOY_TARGET',
            defaultValue: 'nginx',
            description: '部署目标: nginx 或 docker'
        )
        string(
            name: 'DEPLOY_PATH',
            defaultValue: '/var/www/html/h5-coverage-demo',
            description: '部署路径（Nginx模式）'
        )
        string(
            name: 'COVERAGE_SERVER_PORT',
            defaultValue: '8081',
            description: '覆盖率数据收集服务器端口'
        )
    }
    
    environment {
        ENABLE_COVERAGE = "${params.ENABLE_COVERAGE ?: 'false'}"
        DEPLOY_TARGET = "${params.DEPLOY_TARGET ?: 'nginx'}"
        DEPLOY_PATH = "${params.DEPLOY_PATH ?: '/var/www/html/h5-coverage-demo'}"
        COVERAGE_SERVER_PORT = "${params.COVERAGE_SERVER_PORT ?: '8081'}"
        NODE_VERSION = '18'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '=========================================='
                echo '正在检出代码...'
                echo '=========================================='
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo '=========================================='
                echo '正在安装依赖...'
                echo '=========================================='
                script {
                    dir('h5-coverage-demo') {
                        sh '''
                            echo "Node版本: $(node --version || echo '未安装')"
                            echo "NPM版本: $(npm --version || echo '未安装')"
                            npm install --legacy-peer-deps
                        '''
                    }
                }
            }
        }
        
        stage('Build with Coverage') {
            steps {
                echo '=========================================='
                echo '正在构建项目（覆盖率插桩: ${ENABLE_COVERAGE}）...'
                echo '=========================================='
                script {
                    dir('h5-coverage-demo') {
                        sh '''
                            echo "构建配置:"
                            echo "  - ENABLE_COVERAGE: ${ENABLE_COVERAGE}"
                            echo "  - NODE_ENV: ${NODE_ENV:-production}"
                            
                            # 执行构建
                            ENABLE_COVERAGE=${ENABLE_COVERAGE} npm run build
                            
                            echo ""
                            echo "构建完成，检查产物..."
                            ls -lah dist/ || echo "⚠ dist目录不存在"
                        '''
                    }
                }
            }
        }
        
        stage('Verify Build Artifacts') {
            steps {
                echo '=========================================='
                echo '正在验证构建产物...'
                echo '=========================================='
                script {
                    dir('h5-coverage-demo') {
                        sh '''
                            echo "检查构建产物..."
                            
                            # 检查基本文件
                            if [ -d "dist" ]; then
                                echo "✓ dist目录存在"
                                ls -lah dist/
                            else
                                echo "✗ dist目录不存在"
                                exit 1
                            fi
                            
                            # 检查JS文件
                            if ls dist/*.js 1> /dev/null 2>&1; then
                                echo "✓ JS文件已生成"
                                ls -lh dist/*.js
                            else
                                echo "✗ JS文件未生成"
                                exit 1
                            fi
                            
                            # 检查Sourcemap文件
                            if ls dist/*.map 1> /dev/null 2>&1; then
                                echo "✓ Sourcemap文件已生成"
                            else
                                echo "⚠ Sourcemap文件未生成"
                            fi
                            
                            # 如果启用覆盖率，检查coverage-config.js
                            if [ "$ENABLE_COVERAGE" = "true" ]; then
                                if [ -f "dist/coverage-config.js" ]; then
                                    echo "✓ coverage-config.js已生成"
                                else
                                    echo "⚠ coverage-config.js未生成（可能影响覆盖率收集）"
                                fi
                            fi
                        '''
                    }
                }
            }
        }
        
        stage('Deploy') {
            when {
                expression { params.DEPLOY_TARGET != 'none' }
            }
            steps {
                echo '=========================================='
                echo "正在部署到 ${DEPLOY_TARGET}..."
                echo '=========================================='
                script {
                    dir('h5-coverage-demo') {
                        if (params.DEPLOY_TARGET == 'nginx') {
                            sh '''
                                echo "部署模式: Nginx"
                                echo "部署路径: ${DEPLOY_PATH}"
                                
                                # 创建部署目录
                                sudo mkdir -p ${DEPLOY_PATH}
                                
                                # 复制文件
                                sudo cp -r dist/* ${DEPLOY_PATH}/
                                
                                # 设置权限
                                sudo chown -R www-data:www-data ${DEPLOY_PATH} || sudo chown -R nginx:nginx ${DEPLOY_PATH} || true
                                sudo chmod -R 755 ${DEPLOY_PATH}
                                
                                echo "✓ 部署完成"
                                echo "访问地址: http://your-server-ip/h5-coverage-demo"
                            '''
                        } else if (params.DEPLOY_TARGET == 'docker') {
                            sh '''
                                echo "部署模式: Docker"
                                
                                # 构建Docker镜像（如果存在Dockerfile）
                                if [ -f "Dockerfile" ]; then
                                    docker build -t h5-coverage-demo:${BUILD_NUMBER} .
                                    echo "✓ Docker镜像构建完成"
                                else
                                    echo "⚠ 未找到Dockerfile，跳过Docker部署"
                                fi
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Start Coverage Server') {
            when {
                expression { 
                    params.ENABLE_COVERAGE == 'true' && 
                    params.DEPLOY_TARGET != 'none' 
                }
            }
            steps {
                echo '=========================================='
                echo '正在启动覆盖率数据收集服务器...'
                echo '=========================================='
                script {
                    dir('h5-coverage-demo') {
                        sh '''
                            echo "覆盖率服务器端口: ${COVERAGE_SERVER_PORT}"
                            echo "部署目标: ${DEPLOY_TARGET}"
                            
                            # 复制覆盖率服务器脚本到部署目录
                            if [ "$DEPLOY_TARGET" = "nginx" ]; then
                                sudo cp coverage-server.js ${DEPLOY_PATH}/ || true
                                echo "✓ 覆盖率服务器脚本已复制到部署目录"
                            fi
                            
                            # 注意：实际启动服务器需要在部署后手动执行或使用systemd服务
                            echo ""
                            echo "=========================================="
                            echo "覆盖率数据收集服务器配置说明:"
                            echo "=========================================="
                            echo "1. 服务器脚本: coverage-server.js"
                            echo "2. 端口: ${COVERAGE_SERVER_PORT}"
                            echo "3. 数据保存路径: ${DEPLOY_PATH}/.nyc_output/coverage.json"
                            echo ""
                            echo "启动命令:"
                            echo "  cd ${DEPLOY_PATH}"
                            echo "  node coverage-server.js"
                            echo ""
                            echo "或使用PM2:"
                            echo "  pm2 start coverage-server.js --name h5-coverage-server"
                            echo "=========================================="
                        '''
                    }
                }
            }
        }
        
        stage('Archive Artifacts') {
            steps {
                echo '=========================================='
                echo '正在归档构建产物...'
                echo '=========================================='
                archiveArtifacts artifacts: 'h5-coverage-demo/dist/**', 
                                 fingerprint: true,
                                 allowEmptyArchive: false
                
                // 如果启用覆盖率，也归档覆盖率相关文件
                script {
                    if (env.ENABLE_COVERAGE == 'true') {
                        archiveArtifacts artifacts: 'h5-coverage-demo/coverage-config.template.js',
                                         fingerprint: true,
                                         allowEmptyArchive: true
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo '=========================================='
            echo '✓ 构建和部署成功！'
            echo '=========================================='
            script {
                if (env.ENABLE_COVERAGE == 'true') {
                    echo """
                    覆盖率插桩已启用
                    
                    下一步操作:
                    1. 访问部署的应用
                    2. 在浏览器中操作应用，触发代码执行
                    3. 覆盖率数据会自动上报到覆盖率服务器
                    4. 使用以下命令生成覆盖率报告:
                       cd ${env.DEPLOY_PATH}
                       node coverage-server.js --report
                    """
                }
            }
        }
        failure {
            echo '=========================================='
            echo '✗ 构建或部署失败！'
            echo '=========================================='
        }
        always {
            // 清理工作空间（可选）
            // cleanWs()
        }
    }
}
