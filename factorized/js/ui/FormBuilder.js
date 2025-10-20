/**
 * FormBuilder - Build dynamic forms with various input types
 */
import { autoResizeTextarea, createElement } from '../utils/domUtils.js';

export class FormBuilder {
    constructor() {
        this.eventHandlers = new Map();
    }

    /**
     * Create text input
     * @param {Object} config - Input configuration
     * @returns {HTMLInputElement} Input element
     */
    createInput(config) {
        const { 
            type = 'text', 
            value = '', 
            placeholder = '', 
            property = '',
            onChange = null 
        } = config;

        const input = document.createElement('input');
        input.type = type;
        input.value = value;
        input.placeholder = placeholder;
        
        if (property) {
            input.dataset.property = property;
        }

        if (onChange) {
            input.addEventListener('change', onChange);
            input.addEventListener('input', onChange);
        }

        return input;
    }

    /**
     * Create textarea with auto-resize
     * @param {Object} config - Textarea configuration
     * @returns {HTMLTextAreaElement} Textarea element
     */
    createTextarea(config) {
        const { 
            value = '', 
            placeholder = '', 
            property = '',
            minHeight = 60,
            maxHeight = 300,
            onChange = null,
            className = ''
        } = config;

        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.placeholder = placeholder;
        
        if (className) {
            textarea.className = className;
        }
        
        if (property) {
            textarea.dataset.property = property;
        }

        // Auto-resize functionality
        const resizeHandler = () => autoResizeTextarea(textarea, minHeight, maxHeight);
        
        textarea.addEventListener('input', resizeHandler);
        textarea.addEventListener('paste', () => {
            setTimeout(resizeHandler, 0);
        });

        if (onChange) {
            textarea.addEventListener('change', onChange);
            textarea.addEventListener('input', onChange);
        }

        // Initial resize
        setTimeout(resizeHandler, 0);

        return textarea;
    }

    /**
     * Create select dropdown
     * @param {Object} config - Select configuration
     * @returns {HTMLSelectElement} Select element
     */
    createSelect(config) {
        const { 
            options = [], 
            value = '', 
            property = '',
            onChange = null 
        } = config;

        const select = document.createElement('select');
        
        if (property) {
            select.dataset.property = property;
        }

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            option.selected = opt.value === value;
            select.appendChild(option);
        });

        if (onChange) {
            select.addEventListener('change', onChange);
        }

        return select;
    }

    /**
     * Create checkbox
     * @param {Object} config - Checkbox configuration
     * @returns {HTMLInputElement} Checkbox element
     */
    createCheckbox(config) {
        const { 
            checked = false, 
            property = '',
            label = '',
            onChange = null 
        } = config;

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = checked;
        
        if (property) {
            input.dataset.property = property;
        }

        if (onChange) {
            input.addEventListener('change', onChange);
        }

        return input;
    }

    /**
     * Create form field wrapper
     * @param {Object} config - Field configuration
     * @returns {HTMLElement} Field wrapper element
     */
    createFormField(config) {
        const { 
            label = '', 
            input = null,
            fullWidth = false 
        } = config;

        const field = document.createElement('div');
        field.className = 'form-field';
        
        if (fullWidth) {
            field.classList.add('full-width');
        }

        if (label) {
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            field.appendChild(labelEl);
        }

        if (input) {
            field.appendChild(input);
        }

        return field;
    }

    /**
     * Create form section
     * @param {Object} config - Section configuration
     * @returns {HTMLElement} Section element
     */
    createFormSection(config) {
        const { 
            title = '', 
            collapsible = false,
            collapsed = false,
            content = null 
        } = config;

        const section = document.createElement('div');
        section.className = collapsible ? 'form-section collapsible' : 'form-section';

        if (collapsible) {
            const header = document.createElement('div');
            header.className = 'form-section-header';
            header.innerHTML = `
                <h4>${title}</h4>
                <svg class="collapse-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7,10L12,15L17,10H7Z"/>
                </svg>
            `;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'form-section-content';
            
            if (collapsed) {
                contentDiv.classList.add('collapsed');
            }

            if (content) {
                if (typeof content === 'string') {
                    contentDiv.innerHTML = content;
                } else if (content instanceof HTMLElement) {
                    contentDiv.appendChild(content);
                }
            }

            header.addEventListener('click', () => {
                this.toggleSection(section);
            });

            section.appendChild(header);
            section.appendChild(contentDiv);
        } else {
            const h4 = document.createElement('h4');
            h4.textContent = title;
            section.appendChild(h4);

            if (content) {
                if (typeof content === 'string') {
                    const div = document.createElement('div');
                    div.innerHTML = content;
                    section.appendChild(div);
                } else if (content instanceof HTMLElement) {
                    section.appendChild(content);
                }
            }
        }

        return section;
    }

    /**
     * Toggle collapsible section
     * @param {HTMLElement} section - Section element
     */
    toggleSection(section) {
        const content = section.querySelector('.form-section-content');
        const icon = section.querySelector('.collapse-icon');
        
        if (!content || !icon) return;

        const isCollapsed = content.classList.contains('collapsed');

        if (isCollapsed) {
            content.classList.remove('collapsed');
            icon.style.transform = 'rotate(180deg)';

            // Auto-resize textareas in expanded section
            setTimeout(() => {
                content.querySelectorAll('textarea').forEach(textarea => {
                    autoResizeTextarea(textarea);
                });
            }, 300);
        } else {
            content.classList.add('collapsed');
            icon.style.transform = 'rotate(0deg)';
        }
    }

    /**
     * Create form grid
     * @param {Array} fields - Array of field configurations
     * @returns {HTMLElement} Grid element
     */
    createFormGrid(fields) {
        const grid = document.createElement('div');
        grid.className = 'form-grid';

        fields.forEach(fieldConfig => {
            const field = this.createFormField(fieldConfig);
            grid.appendChild(field);
        });

        return grid;
    }

    /**
     * Create checkbox group
     * @param {Array} checkboxes - Array of checkbox configurations
     * @returns {HTMLElement} Checkbox group element
     */
    createCheckboxGroup(checkboxes) {
        const group = document.createElement('div');
        group.className = 'checkbox-group';

        checkboxes.forEach(config => {
            const item = document.createElement('div');
            item.className = 'checkbox-item';

            const checkbox = this.createCheckbox(config);
            const label = document.createElement('label');
            label.textContent = config.label || '';

            item.appendChild(checkbox);
            item.appendChild(label);
            group.appendChild(item);
        });

        return group;
    }
}
