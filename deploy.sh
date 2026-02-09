#!/bin/bash

# 部署脚本
# 使用方法: ./deploy.sh [nginx|docker] [部署路径]

set -e

DEPLOY_MODE=${1:-nginx}
DEPLOY_PATH=${2:-/var/www/html/h5-coverage-demo}
COVERAGE_SERVER_PORT=${3:-8081}

echo "=========================================="
echo "H5覆盖率项目部署脚本"
echo "=========================================="
echo "部署模式: $DEPLOY_MODE"
echo "部署路径: $DEPLOY_PATH"
echo "覆盖率服务器端口: $COVERAGE_SERVER_PORT"
echo "=========================================="

# 检查dist目录是否存在
if [ ! -d "dist" ]; then
    echo "错误: dist目录不存在，请先执行构建"
    exit 1
fi

if [ "$DEPLOY_MODE" = "nginx" ]; then
    echo ""
    echo "正在部署到Nginx..."
    
    # 创建部署目录
    sudo mkdir -p "$DEPLOY_PATH"
    
    # 复制文件
    echo "复制文件到 $DEPLOY_PATH..."
    sudo cp -r dist/* "$DEPLOY_PATH/"
    
    # 复制覆盖率服务器脚本
    if [ -f "coverage-server.js" ]; then
        sudo cp coverage-server.js "$DEPLOY_PATH/"
        echo "✓ 覆盖率服务器脚本已复制"
    fi
    
    # 设置权限
    echo "设置文件权限..."
    sudo chown -R www-data:www-data "$DEPLOY_PATH" 2>/dev/null || \
    sudo chown -R nginx:nginx "$DEPLOY_PATH" 2>/dev/null || \
    sudo chown -R $(whoami):$(whoami) "$DEPLOY_PATH"
    
    sudo chmod -R 755 "$DEPLOY_PATH"
    
    # 创建覆盖率数据目录
    sudo mkdir -p "$DEPLOY_PATH/.nyc_output"
    sudo chmod 777 "$DEPLOY_PATH/.nyc_output"
    
    echo ""
    echo "✓ Nginx部署完成"
    echo ""
    echo "下一步操作:"
    echo "1. 配置Nginx（参考 nginx.conf）"
    echo "2. 启动覆盖率服务器:"
    echo "   cd $DEPLOY_PATH"
    echo "   node coverage-server.js"
    echo "   或使用PM2:"
    echo "   pm2 start coverage-server.js --name h5-coverage-server"
    echo "3. 访问应用: http://your-server-ip/h5-coverage-demo"
    
elif [ "$DEPLOY_MODE" = "docker" ]; then
    echo ""
    echo "正在构建Docker镜像..."
    
    # 检查Dockerfile是否存在
    if [ ! -f "Dockerfile" ]; then
        echo "错误: Dockerfile不存在"
        exit 1
    fi
    
    # 构建镜像
    docker build -t h5-coverage-demo:latest \
        --build-arg ENABLE_COVERAGE=${ENABLE_COVERAGE:-false} \
        .
    
    echo ""
    echo "✓ Docker镜像构建完成"
    echo ""
    echo "启动容器:"
    echo "  docker run -d \\"
    echo "    --name h5-coverage-demo \\"
    echo "    -p 80:80 \\"
    echo "    -p ${COVERAGE_SERVER_PORT}:8081 \\"
    echo "    -e ENABLE_COVERAGE=${ENABLE_COVERAGE:-false} \\"
    echo "    h5-coverage-demo:latest"
    
else
    echo "错误: 不支持的部署模式: $DEPLOY_MODE"
    echo "支持的模式: nginx, docker"
    exit 1
fi

echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="

