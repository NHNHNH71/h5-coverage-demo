#!/bin/sh

# 启动覆盖率服务器（如果启用覆盖率）
if [ "$ENABLE_COVERAGE" = "true" ]; then
    echo "启动覆盖率数据收集服务器..."
    cd /usr/share/nginx/html/h5-coverage-demo
    node coverage-server.js &
    COVERAGE_SERVER_PID=$!
    echo "覆盖率服务器已启动 (PID: $COVERAGE_SERVER_PID)"
fi

# 执行原始入口点
exec "$@"

