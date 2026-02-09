/**
 * 按钮组件
 */
export default class Button {
    constructor(text, onClick) {
        this.text = text || '按钮';
        this.onClick = onClick || (() => {});
    }
    
    /**
     * 渲染按钮元素
     * @returns {HTMLElement} 按钮DOM元素
     */
    render() {
        const button = document.createElement('button');
        button.className = 'custom-button';
        button.textContent = this.text;
        button.addEventListener('click', this.onClick);
        return button;
    }
    
    /**
     * 更新按钮文本
     * @param {string} newText - 新文本
     */
    updateText(newText) {
        this.text = newText;
    }
    
    /**
     * 禁用按钮
     */
    disable() {
        this.disabled = true;
    }
    
    /**
     * 启用按钮
     */
    enable() {
        this.disabled = false;
    }
}

