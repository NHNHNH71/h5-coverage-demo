# 多阶段构建：构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 构建参数：是否启用覆盖率
ARG ENABLE_COVERAGE=false
ENV ENABLE_COVERAGE=${ENABLE_COVERAGE}

# 执行构建
RUN if [ "$ENABLE_COVERAGE" = "true" ]; then \
        ENABLE_COVERAGE=true npm run build; \
    else \
        npm run build; \
    fi

# 生产阶段：Nginx + Node.js
FROM nginx:alpine

# 安装Node.js（用于运行覆盖率服务器）
RUN apk add --no-cache nodejs npm

# 复制构建产物到Nginx
COPY --from=builder /app/dist /usr/share/nginx/html/h5-coverage-demo

# 复制覆盖率服务器脚本
COPY --from=builder /app/coverage-server.js /usr/share/nginx/html/h5-coverage-demo/

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建工作目录
RUN mkdir -p /usr/share/nginx/html/h5-coverage-demo/.nyc_output

# 暴露端口
EXPOSE 80 8081

# 启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

