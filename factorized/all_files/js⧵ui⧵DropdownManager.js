/**
 * DropdownManager - Manage custom dropdown behavior
 */
export class DropdownManager {
    constructor() {
        this.dropdowns = new Map();
    }

    /**
     * Register a dropdown
     * @param {string} id - Dropdown ID
     * @param {HTMLElement} element - Dropdown element
     * @param {Function} onSelectionChange - Callback for selection changes
     */
    register(id, element, onSelectionChange) {
        this.dropdowns.set(id, {
            element,
            isOpen: false,
            selected: [],
            onSelectionChange
        });

        // Setup event listeners
        const trigger = element.querySelector('.dropdown-trigger');
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle(id);
            });
        }
    }

    /**
     * Toggle dropdown open/closed
     * @param {string} id - Dropdown ID
     */
    toggle(id) {
        const dropdown = this.dropdowns.get(id);
        if (!dropdown) return;

        // Close other dropdowns
        this.dropdowns.forEach((dd, ddId) => {
            if (ddId !== id) {
                this.close(ddId);
            }
        });

        // Toggle this dropdown
        if (dropdown.isOpen) {
            this.close(id);
        } else {
            this.open(id);
        }
    }

    /**
     * Open dropdown
     * @param {string} id - Dropdown ID
     */
    open(id) {
        const dropdown = this.dropdowns.get(id);
        if (!dropdown) return;

        dropdown.element.classList.add('open');
        dropdown.isOpen = true;
    }

    /**
     * Close dropdown
     * @param {string} id - Dropdown ID
     */
    close(id) {
        const dropdown = this.dropdowns.get(id);
        if (!dropdown) return;

        dropdown.element.classList.remove('open');
        dropdown.isOpen = false;
    }

    /**
     * Close all dropdowns
     */
    closeAll() {
        this.dropdowns.forEach((_, id) => {
            this.close(id);
        });
    }

    /**
     * Handle option click
     * @param {string} id - Dropdown ID
     * @param {string} value - Option value
     */
    handleOptionClick(id, value) {
        const dropdown = this.dropdowns.get(id);
        if (!dropdown) return;

        const index = dropdown.selected.indexOf(value);
        
        if (index === -1) {
            dropdown.selected.push(value);
        } else {
            dropdown.selected.splice(index, 1);
        }

        this.updateDisplay(id);
        this.updateOptions(id);

        // Callback
        if (dropdown.onSelectionChange) {
            dropdown.onSelectionChange(dropdown.selected);
        }
    }

    /**
     * Update dropdown display
     * @param {string} id - Dropdown ID
     */
    updateDisplay(id) {
        const dropdown = this.dropdowns.get(id);
        if (!dropdown) return;

        const label = dropdown.element.querySelector('.dropdown-label');
        if (!label) return;

        const selected = dropdown.selected;
        const defaultLabel = id === 'typeFilter' ? 'All Types' : 'All Groups';

        if (selected.length === 0) {
            label.textContent = defaultLabel;
        } else if (selected.length === 1) {
            label.textContent = selected[0];
        } else if (selected.length <= 2) {
            label.textContent = selected.join(', ');
        } else {
            label.innerHTML = `<div class="dropdown-selected-tags">
                <span class="dropdown-tag">${selected.length} selected</span>
            </div>`;
        }
    }

    /**
     * Update dropdown options display
     * @param {string} id - Dropdown ID
     */
    updateOptions(id) {
        const dropdown = this.dropdowns.get(id);
        if (!dropdown) return;

        const content = dropdown.element.querySelector('.dropdown-content');
        if (!content) return;

        content.querySelectorAll('.dropdown-option').forEach(option => {
            const value = option.dataset.value;
            const isSelected = dropdown.selected.includes(value);
            option.classList.toggle('selected', isSelected);
        });
    }

    /**
     * Set selected values
     * @param {string} id - Dropdown ID
     * @param {Array} values - Array of selected values
     */
    setSelected(id, values) {
        const dropdown = this.dropdowns.get(id);
        if (!dropdown) return;

        dropdown.selected = [...values];
        this.updateDisplay(id);
        this.updateOptions(id);
    }

    /**
     * Get selected values
     * @param {string} id - Dropdown ID
     * @returns {Array} Array of selected values
     */
    getSelected(id) {
        const dropdown = this.dropdowns.get(id);
        return dropdown ? [...dropdown.selected] : [];
    }

    /**
     * Clear selection
     * @param {string} id - Dropdown ID
     */
    clearSelection(id) {
        this.setSelected(id, []);
        
        const dropdown = this.dropdowns.get(id);
        if (dropdown && dropdown.onSelectionChange) {
            dropdown.onSelectionChange([]);
        }
    }
}
