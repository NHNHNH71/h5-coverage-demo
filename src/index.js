import { formatDate, calculateSum } from './utils';
import Button from './components/Button';
import './styles.css';

// 初始化应用
function initApp() {
    console.log('H5覆盖率验证项目已启动');
    
    // 创建按钮组件
    const buttonContainer = document.getElementById('app');
    const button = new Button('点击我', () => {
        alert('按钮被点击了！');
    });
    buttonContainer.appendChild(button.render());
    
    // 测试工具函数
    const currentDate = formatDate(new Date());
    console.log('当前日期:', currentDate);
    
    const numbers = [1, 2, 3, 4, 5];
    const sum = calculateSum(numbers);
    console.log('数组求和:', sum);
    
    // 显示信息
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info';
    infoDiv.innerHTML = `
        <h2>H5覆盖率验证项目</h2>
        <p>当前日期: ${currentDate}</p>
        <p>数组 [${numbers.join(', ')}] 的和: ${sum}</p>
    `;
    buttonContainer.appendChild(infoDiv);
}

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

