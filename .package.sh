#!/bin/bash

# H5覆盖率验证项目构建脚本
# 支持ENABLE_COVERAGE参数控制是否启用覆盖率插桩

set -e

echo "=========================================="
echo "H5覆盖率验证项目构建脚本"
echo "=========================================="

# 检查ENABLE_COVERAGE环境变量
if [ "$ENABLE_COVERAGE" = "true" ]; then
    echo "✓ 覆盖率插桩已启用"
    export NODE_ENV=production
    export BABEL_ENV=coverage
    export ENABLE_COVERAGE=true
else
    echo "✓ 标准构建模式"
    export NODE_ENV=production
    export BABEL_ENV=production
    export ENABLE_COVERAGE=false
fi

# 安装依赖
echo ""
echo "正在安装依赖..."
npm install

# 执行构建
echo ""
echo "正在执行构建..."
npm run build

# 如果开启覆盖率，生成coverage-config.js模板（Jenkins会覆盖）
if [ "$ENABLE_COVERAGE" = "true" ]; then
    echo ""
    echo "正在生成coverage-config.js模板..."
    if [ -f "coverage-config.template.js" ]; then
        cp coverage-config.template.js dist/coverage-config.js
        echo "✓ coverage-config.js已生成"
    else
        echo "⚠ 警告: coverage-config.template.js不存在，跳过生成"
    fi
fi

# 收集sourcemap文件到指定目录
echo ""
echo "正在收集sourcemap文件..."
if [ -d "dist" ]; then
    mkdir -p dist/sourcemaps
    find dist -name "*.map" -type f -exec cp {} dist/sourcemaps/ \;
    echo "✓ sourcemap文件已收集到 dist/sourcemaps/"
else
    echo "⚠ 警告: dist目录不存在"
fi

echo ""
echo "=========================================="
echo "构建完成！"
echo "=========================================="

