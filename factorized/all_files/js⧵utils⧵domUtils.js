/**
 * DOM manipulation utility functions
 */

/**
 * Auto-resize textarea based on content
 * @param {HTMLTextAreaElement} textarea - Textarea element
 * @param {number} minHeight - Minimum height in pixels
 * @param {number} maxHeight - Maximum height in pixels
 */
export function autoResizeTextarea(textarea, minHeight = 60, maxHeight = 300) {
    if (textarea.offsetHeight === 0) return;
    
    const scrollTop = textarea.scrollTop;
    textarea.style.height = 'auto';
    
    const newHeight = Math.min(
        Math.max(textarea.scrollHeight + 2, minHeight),
        maxHeight
    );
    
    textarea.style.height = newHeight + 'px';
    
    const scrollThreshold = maxHeight - 2;
    if (textarea.scrollHeight > scrollThreshold) {
        textarea.style.overflowY = 'auto';
    } else {
        textarea.style.overflowY = 'hidden';
    }
    
    textarea.scrollTop = scrollTop;
}

/**
 * Create element with attributes
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {string|HTMLElement|Array} children - Child content
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attributes = {}, children = null) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    if (children) {
        if (typeof children === 'string') {
            element.textContent = children;
        } else if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        } else if (children instanceof HTMLElement) {
            element.appendChild(children);
        }
    }
    
    return element;
}

/**
 * Remove all child elements from a container
 * @param {HTMLElement} container - Container element
 */
export function removeAllChildren(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
