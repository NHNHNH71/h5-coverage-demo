/**
 * 本地测试服务器
 * 用于收集覆盖率数据并生成报告
 * 
 * 使用方法:
 * 1. 先构建项目: ENABLE_COVERAGE=true npm run build
 * 2. 启动服务器: node test-server.js
 * 3. 访问 http://localhost:8080
 * 4. 在浏览器中操作应用，触发代码执行
 * 5. 覆盖率数据会自动保存到 .nyc_output/coverage.json
 * 6. 按 Ctrl+C 停止服务器，会自动生成覆盖率报告
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 8080;
const COVERAGE_DIR = path.join(__dirname, '.nyc_output');
const COVERAGE_FILE = path.join(COVERAGE_DIR, 'coverage.json');

// 确保覆盖率目录存在
if (!fs.existsSync(COVERAGE_DIR)) {
    fs.mkdirSync(COVERAGE_DIR, { recursive: true });
}

// 初始化覆盖率数据
let coverageData = {};

// 读取已存在的覆盖率数据
if (fs.existsSync(COVERAGE_FILE)) {
    try {
        const existingData = fs.readFileSync(COVERAGE_FILE, 'utf8');
        coverageData = JSON.parse(existingData);
        console.log('已加载现有覆盖率数据');
    } catch (error) {
        console.warn('读取现有覆盖率数据失败，将创建新文件');
    }
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    const url = req.url;
    
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
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, message: '覆盖率数据为空（代码可能还未执行）' }));
                        return;
                    }
                    
                    // 合并覆盖率数据
                    Object.assign(coverageData, data.coverage);
                    
                    // 保存到文件
                    fs.writeFileSync(COVERAGE_FILE, JSON.stringify(coverageData, null, 2));
                    
                    const totalFileCount = Object.keys(coverageData).length;
                    console.log(`✓ 覆盖率数据已接收并保存 (本次: ${receivedFileCount} 个文件, 累计: ${totalFileCount} 个文件)`);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: '覆盖率数据已接收' }));
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: '无效的覆盖率数据' }));
                }
            } catch (error) {
                console.error('处理覆盖率数据失败:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: error.message }));
            }
        });
        return;
    }
    
    // 处理静态文件
    let filePath = path.join(__dirname, 'dist', url === '/' ? 'index.html' : url);
    
    // 安全检查：确保文件在dist目录内
    const distPath = path.resolve(__dirname, 'dist');
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(distPath)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        res.writeHead(404);
        res.end('Not Found');
        return;
    }
    
    // 读取并返回文件
    const ext = path.extname(filePath);
    const contentType = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.map': 'application/json',
        '.json': 'application/json',
    }[ext] || 'application/octet-stream';
    
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
});

// 启动服务器
server.listen(PORT, () => {
    console.log('==========================================');
    console.log('本地覆盖率测试服务器已启动');
    console.log('==========================================');
    console.log(`访问地址: http://localhost:${PORT}`);
    console.log('');
    console.log('操作步骤:');
    console.log('1. 在浏览器中访问上述地址');
    console.log('2. 操作应用，触发代码执行（点击按钮等）');
    console.log('3. 覆盖率数据会自动收集');
    console.log('4. 按 Ctrl+C 停止服务器并生成报告');
    console.log('==========================================');
});

// 处理退出信号，生成覆盖率报告
process.on('SIGINT', () => {
    console.log('\n正在生成覆盖率报告...');
    
    try {
        // 使用nyc生成报告
        if (fs.existsSync(COVERAGE_FILE)) {
            execSync('npx nyc report --reporter=html --reporter=text --reporter=lcov', {
                cwd: __dirname,
                stdio: 'inherit'
            });
            console.log('\n✓ 覆盖率报告已生成到 coverage/ 目录');
            console.log('打开 coverage/index.html 查看详细报告');
        } else {
            console.log('⚠ 未找到覆盖率数据文件，请先访问应用并执行操作');
        }
    } catch (error) {
        console.error('生成覆盖率报告失败:', error.message);
    }
    
    process.exit(0);
});

