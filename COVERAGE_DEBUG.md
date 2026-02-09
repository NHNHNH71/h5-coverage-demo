# 覆盖率调试指南

## 问题：window.__coverage__ 为空

如果控制台中 `window.__coverage__` 显示为空对象 `{}`，请按以下步骤排查：

### 1. 确认构建时启用了覆盖率

确保构建时设置了环境变量：
```bash
# Windows PowerShell
$env:ENABLE_COVERAGE='true'; npm run build

# Windows CMD
set ENABLE_COVERAGE=true && npm run build

# Linux/Mac
ENABLE_COVERAGE=true npm run build
```

### 2. 检查插桩是否生效

打开构建后的 bundle 文件（`dist/bundle.*.js`），搜索 `__coverage__`，应该能看到类似这样的代码：
```javascript
var e="__coverage__",o=e[o]||(e[o]={});
```

如果找不到，说明插桩未生效。

### 3. 等待代码执行

覆盖率数据只有在代码**执行后**才会被填充到 `window.__coverage__` 中。

- 页面刚加载时，`window.__coverage__` 可能是空的
- 需要等待 JavaScript 代码执行后，覆盖率数据才会出现
- 建议等待 3-5 秒后再检查

### 4. 使用调试函数

在浏览器控制台中运行：
```javascript
// 显示覆盖率数据统计
window.showCoverageInfo()

// 直接查看覆盖率数据
console.log(window.__coverage__)

// 查看文件数量
console.log('文件数:', Object.keys(window.__coverage__ || {}).length)
```

### 5. 验证步骤

1. 使用启用覆盖率的构建：
   ```bash
   $env:ENABLE_COVERAGE='true'; npm run build
   ```

2. 启动测试服务器：
   ```bash
   npm run test:coverage
   ```

3. 打开浏览器访问 `http://localhost:9000`

4. 打开浏览器控制台（F12）

5. 等待页面加载完成（3-5秒）

6. 在控制台运行：
   ```javascript
   window.showCoverageInfo()
   ```

7. 应该能看到类似这样的输出：
   ```
   === 覆盖率数据统计 ===
   文件数量: 3
   已插桩的文件:
     - D:\Programing\idea\H5-cc\h5-coverage-demo\src\index.js
       语句数: 17 函数数: 2 分支数: 1
     - D:\Programing\idea\H5-cc\h5-coverage-demo\src\utils.js
       语句数: 18 函数数: 4 分支数: 5
     - D:\Programing\idea\H5-cc\h5-coverage-demo\src\components\Button.js
       语句数: 10 函数数: 5 分支数: 2
   ==================
   ```

### 6. 常见问题

**Q: 为什么页面加载后立即检查是空的？**
A: 覆盖率数据是在代码执行时动态填充的。需要等待 JavaScript 代码执行后才能看到数据。

**Q: 插桩后代码变大了，正常吗？**
A: 正常。插桩会增加代码量，通常会增加 2-5 倍。

**Q: 生产模式下的压缩会影响覆盖率吗？**
A: 不会。babel-plugin-istanbul 会在压缩之前进行插桩，所以压缩不会影响覆盖率数据。

**Q: 如何确认插桩已生效？**
A: 
1. 检查 bundle 文件大小（插桩后会明显增大）
2. 在 bundle 文件中搜索 `__coverage__`
3. 使用 `window.showCoverageInfo()` 查看统计信息

### 7. 手动触发代码执行

如果覆盖率数据仍然为空，可以手动触发一些操作来执行代码：
- 点击页面上的按钮
- 在控制台运行：`window.location.reload()`
- 等待自动上报触发（每5秒一次）

