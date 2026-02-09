/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
    if (!(date instanceof Date)) {
        throw new Error('参数必须是Date对象');
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * 计算数组元素的和
 * @param {number[]} numbers - 数字数组
 * @returns {number} 数组元素的和
 */
export function calculateSum(numbers) {
    if (!Array.isArray(numbers)) {
        throw new Error('参数必须是数组');
    }
    
    if (numbers.length === 0) {
        return 0;
    }
    
    return numbers.reduce((sum, num) => {
        if (typeof num !== 'number') {
            throw new Error('数组元素必须是数字');
        }
        return sum + num;
    }, 0);
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否为有效邮箱
 */
export function validateEmail(email) {
    if (typeof email !== 'string') {
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

