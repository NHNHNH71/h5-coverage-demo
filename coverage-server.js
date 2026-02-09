/**
 * 覆盖率数据收集服务器（生产环境版本）
 * 
 * 功能:
 * 1. 接收来自浏览器的覆盖率数据上报
 * 2. 保存覆盖率数据到文件
 * 3. 支持生成覆盖率报告
 * 
 * 使用方法:
 * 1. 启动服务器: node coverage-server.js
 * 2. 或使用PM2: pm2 start coverage-server.js --name h5-coverage-server
 * 3. 生成报告: node coverage-server.js --report
 * 
 * 环境变量:
 * - PORT: 服务器端口（默认: 8081）
 * - COVERAGE_DIR: 覆盖率数据目录（默认: .nyc_output）
 * - LOG_LEVEL: 日志级别（默认: info）
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const PORT = process.env.PORT || 8081;
const COVERAGE_DIR = process.env.COVERAGE_DIR || path.join(__dirname, '.nyc_output');
const COVERAGE_FILE = path.join(COVERAGE_DIR, 'coverage.json');
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// 确保覆盖率目录存在
if (!fs.existsSync(COVERAGE_DIR)) {
    fs.mkdirSync(COVERAGE_DIR, { recursive: true });
    console.log(`✓ 创建覆盖率目录: ${COVERAGE_DIR}`);
}

// 日志函数
function log(level, message, ...args) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[LOG_LEVEL] || 2;
    const messageLevel = levels[level] || 2;
    
    if (messageLevel <= currentLevel) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        console.log(prefix, message, ...args);
    }
}

// 初始化覆盖率数据
let coverageData = {};

// 读取已存在的覆盖率数据
if (fs.existsSync(COVERAGE_FILE)) {
    try {
        const existingData = fs.readFileSync(COVERAGE_FILE, 'utf8');
        coverageData = JSON.parse(existingData);
        const fileCount = Object.keys(coverageData).length;
        log('info', `已加载现有覆盖率数据 (${fileCount} 个文件)`);
    } catch (error) {
        log('warn', '读取现有覆盖率数据失败，将创建新文件:', error.message);
    }
}

// 保存覆盖率数据
function saveCoverageData() {
    try {
        fs.writeFileSync(COVERAGE_FILE, JSON.stringify(coverageData, null, 2));
        const fileCount = Object.keys(coverageData).length;
        log('info', `覆盖率数据已保存 (${fileCount} 个文件)`);
        return true;
    } catch (error) {
        log('error', '保存覆盖率数据失败:', error.message);
        return false;
    }
}

// 生成覆盖率报告
function generateReport() {
    log('info', '正在生成覆盖率报告...');
    
    try {
        if (!fs.existsSync(COVERAGE_FILE)) {
            log('warn', '未找到覆盖率数据文件，请先收集覆盖率数据');
            return false;
        }
        
        // 使用nyc生成报告
        execSync('npx nyc report --reporter=html --reporter=text --reporter=lcov', {
            cwd: __dirname,
            stdio: 'inherit'
        });
        
        log('info', '✓ 覆盖率报告已生成到 coverage/ 目录');
        log('info', '打开 coverage/index.html 查看详细报告');
        return true;
    } catch (error) {
        log('error', '生成覆盖率报告失败:', error.message);
        return false;
    }
}

// 处理命令行参数
if (process.argv.includes('--report')) {
    generateReport();
    process.exit(0);
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    const url = req.url;
    
    // CORS 头
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }
    
    // 处理覆盖率数据上报
    if (url === '/api/coverage' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.coverage && typeof data.coverage === 'object') {
                    const receivedFileCount = Object.keys(data.coverage).length;
                    
                    if (receivedFileCount === 0) {
                        // 空数据，可能是页面刚加载，代码还未执行
                        log('debug', '收到空的覆盖率数据（代码可能还未执行）');
                        res.writeHead(200, {
                            ...corsHeaders,
                            'Content-Type': 'application/json'
                        });
                        res.end(JSON.stringify({ 
                            success: true, 
                            message: '覆盖率数据为空（代码可能还未执行）' 
                        }));
                        return;
                    }
                    
                    // 合并覆盖率数据
                    Object.assign(coverageData, data.coverage);
                    
                    // 保存到文件
                    saveCoverageData();
                    
                    const totalFileCount = Object.keys(coverageData).length;
                    log('info', `✓ 覆盖率数据已接收 (本次: ${receivedFileCount} 个文件, 累计: ${totalFileCount} 个文件)`);
                    
                    res.writeHead(200, {
                        ...corsHeaders,
                        'Content-Type': 'application/json'
                    });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: '覆盖率数据已接收',
                        fileCount: totalFileCount
                    }));
                } else {
                    log('warn', '收到无效的覆盖率数据格式');
                    res.writeHead(400, {
                        ...corsHeaders,
                        'Content-Type': 'application/json'
                    });
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: '无效的覆盖率数据' 
                    }));
                }
            } catch (error) {
                log('error', '处理覆盖率数据失败:', error.message);
                res.writeHead(500, {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                });
                res.end(JSON.stringify({ 
                    success: false, 
                    message: error.message 
                }));
            }
        });
        return;
    }
    
    // 获取覆盖率统计信息
    if (url === '/api/coverage/stats' && req.method === 'GET') {
        const fileCount = Object.keys(coverageData).length;
        res.writeHead(200, {
            ...corsHeaders,
            'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({
            success: true,
            fileCount: fileCount,
            lastUpdate: fs.existsSync(COVERAGE_FILE) 
                ? fs.statSync(COVERAGE_FILE).mtime.toISOString() 
                : null
        }));
        return;
    }
    
    // 生成报告接口
    if (url === '/api/coverage/report' && req.method === 'POST') {
        const success = generateReport();
        res.writeHead(success ? 200 : 500, {
            ...corsHeaders,
            'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({
            success: success,
            message: success ? '覆盖率报告已生成' : '生成覆盖率报告失败'
        }));
        return;
    }
    
    // 404
    res.writeHead(404, corsHeaders);
    res.end('Not Found');
});

// 启动服务器
server.listen(PORT, () => {
    log('info', '==========================================');
    log('info', '覆盖率数据收集服务器已启动');
    log('info', '==========================================');
    log('info', `监听端口: ${PORT}`);
    log('info', `覆盖率数据目录: ${COVERAGE_DIR}`);
    log('info', `覆盖率数据文件: ${COVERAGE_FILE}`);
    log('info', '');
    log('info', 'API端点:');
    log('info', '  POST /api/coverage - 接收覆盖率数据');
    log('info', '  GET  /api/coverage/stats - 获取统计信息');
    log('info', '  POST /api/coverage/report - 生成覆盖率报告');
    log('info', '');
    log('info', '命令行:');
    log('info', '  node coverage-server.js --report - 生成覆盖率报告');
    log('info', '==========================================');
});

// 处理退出信号
process.on('SIGINT', () => {
    log('info', '\n正在关闭服务器...');
    saveCoverageData();
    server.close(() => {
        log('info', '服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    log('info', '\n收到终止信号，正在关闭服务器...');
    saveCoverageData();
    server.close(() => {
        log('info', '服务器已关闭');
        process.exit(0);
    });
});

// 定期保存覆盖率数据（每5分钟）
setInterval(() => {
    if (Object.keys(coverageData).length > 0) {
        saveCoverageData();
    }
}, 5 * 60 * 1000);

