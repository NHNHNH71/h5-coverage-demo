/**
 * 覆盖率配置模板文件
 * Jenkins会在构建时生成实际的coverage-config.js文件
 * 此文件仅作为参考模板
 */

window.__coverage__ = window.__coverage__ || {};

// 调试函数：显示覆盖率数据统计
window.showCoverageInfo = function() {
    var coverage = window.__coverage__ || {};
    var fileCount = Object.keys(coverage).length;
    
    console.log('=== 覆盖率数据统计 ===');
    console.log('文件数量:', fileCount);
    
    if (fileCount === 0) {
        console.warn('⚠ 警告: window.__coverage__ 为空，可能的原因：');
        console.warn('1. 代码还未执行（等待页面加载完成）');
        console.warn('2. 插桩未生效（检查构建配置）');
        console.warn('3. 代码被压缩/混淆导致插桩失效');
    } else {
        console.log('已插桩的文件:');
        Object.keys(coverage).forEach(function(filePath) {
            var fileCoverage = coverage[filePath];
            var statements = Object.keys(fileCoverage.statementMap || {}).length;
            var functions = Object.keys(fileCoverage.fnMap || {}).length;
            var branches = Object.keys(fileCoverage.branchMap || {}).length;
            console.log('  - ' + filePath);
            console.log('    语句数:', statements, '函数数:', functions, '分支数:', branches);
        });
    }
    console.log('==================');
    
    return coverage;
};

// 覆盖率配置
window.coverageConfig = {
    // 覆盖率数据收集端点
    endpoint: '/api/coverage',
    
    // 是否自动上报
    autoReport: true,
    
    // 上报间隔（毫秒）
    reportInterval: 5000,
    
    // 覆盖率数据（动态读取，不在这里设置）
    
    // 上报覆盖率数据
    report: function() {
        if (!this.autoReport) {
            return;
        }
        
        // 动态读取最新的覆盖率数据
        var coverage = window.__coverage__ || {};
        var fileCount = Object.keys(coverage).length;
        
        if (fileCount === 0) {
            // 如果没有覆盖率数据，静默跳过（可能是页面刚加载，代码还未执行）
            return;
        }
        
        try {
            fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    coverage: coverage,
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                }),
            }).then(function(response) {
                if (response.ok) {
                    console.log('✓ 覆盖率数据已上报 (' + fileCount + ' 个文件)');
                }
            }).catch(function(error) {
                console.warn('覆盖率数据上报失败:', error);
            });
        } catch (error) {
            console.warn('覆盖率数据上报异常:', error);
        }
    },
};

// 如果启用自动上报，设置定时器
if (window.coverageConfig.autoReport) {
    // 页面加载完成后立即上报一次
    if (document.readyState === 'complete') {
        window.coverageConfig.report();
    } else {
        window.addEventListener('load', function() {
            window.coverageConfig.report();
        });
    }
    
    // 设置定时上报
    setInterval(function() {
        window.coverageConfig.report();
    }, window.coverageConfig.reportInterval);
    
    console.log('✓ 覆盖率自动上报已启用，每 ' + window.coverageConfig.reportInterval / 1000 + ' 秒上报一次');
    
    // 延迟显示覆盖率信息，确保代码已执行
    setTimeout(function() {
        console.log('\n[调试] 3秒后检查覆盖率数据...');
        window.showCoverageInfo();
    }, 3000);
}

// 页面卸载时上报
window.addEventListener('beforeunload', function() {
    window.coverageConfig.report();
});

