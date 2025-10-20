/**
 * SettingsModal - Component for managing application settings
 */
import { COLUMN_LABELS, EVENTS } from '../../config/constants.js';

export class SettingsModal {
    constructor(stateManager, eventBus, storageService) {
        this.stateManager = stateManager;
        this.eventBus = eventBus;
        this.storageService = storageService;
        
        this.modal = document.getElementById('settingsModal');
        this.originalSettings = null;
        
        this.init();
    }

    /**
     * Initialize settings modal
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close buttons
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.cancel());
        document.getElementById('cancelSettingsBtn')?.addEventListener('click', () => this.cancel());
        
        // Save button
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => this.save());
        
        // Theme buttons
        document.getElementById('lightThemeBtn')?.addEventListener('click', () => this.selectTheme('light'));
        document.getElementById('darkThemeBtn')?.addEventListener('click', () => this.selectTheme('dark'));
        document.getElementById('joanThemeBtn')?.addEventListener('click', () => this.selectTheme('joan'));
    }

    /**
     * Open settings modal
     */
    open() {
        const state = this.stateManager.getState();
        
        // Store original settings for cancel functionality
        this.originalSettings = JSON.parse(JSON.stringify(state.settings));
        
        this.modal.style.display = 'flex';
        
        // Update UI
        this.updateThemeButtons();
        this.updateColumnOrderDisplay();
        this.initializeColumnDragDrop();
    }

    /**
     * Close settings modal
     */
    close() {
        this.modal.style.display = 'none';
    }

    /**
     * Cancel settings changes
     */
    cancel() {
        if (this.originalSettings) {
            // Revert to original settings
            this.stateManager.setSettings(this.originalSettings);
            
            // Apply reverted theme
            this.eventBus.emit(EVENTS.THEME_CHANGED, this.originalSettings.theme);
        }
        
        this.close();
    }

    /**
     * Save settings
     */
    save() {
        const state = this.stateManager.getState();
        
        // Save to storage
        this.storageService.saveSettings(state.settings);
        
        // Emit settings changed event
        this.eventBus.emit(EVENTS.SETTINGS_CHANGED);
        
        this.close();
    }

    /**
     * Select theme
     * @param {string} theme - Theme name
     */
    selectTheme(theme) {
        this.stateManager.updateSettings({ theme });
        this.updateThemeButtons();
        
        // Apply theme immediately for preview
        this.eventBus.emit(EVENTS.THEME_CHANGED, theme);
    }

    /**
     * Update theme button states
     */
    updateThemeButtons() {
        const state = this.stateManager.getState();
        const currentTheme = state.settings?.theme || 'light';
        
        document.getElementById('lightThemeBtn')?.classList.toggle('active', currentTheme === 'light');
        document.getElementById('darkThemeBtn')?.classList.toggle('active', currentTheme === 'dark');
        document.getElementById('joanThemeBtn')?.classList.toggle('active', currentTheme === 'joan');
    }

    /**
     * Update column order display
     */
    updateColumnOrderDisplay() {
        const container = document.getElementById('columnOrderList');
        if (!container) return;

        const state = this.stateManager.getState();
        const { settings } = state;

        container.innerHTML = '';

        settings.columnOrder.forEach(columnId => {
            const item = document.createElement('div');
            item.className = 'column-item';
            item.dataset.column = columnId;
            item.draggable = true;

            const isVisible = settings.columnVisibility[columnId];
            const currentWidth = settings.columnWidths[columnId];
            const isPixelBased = columnId === 'indicators';

            const eyeIcon = isVisible ?
                `<path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>` :
                `<path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.38,7 12,7Z"/>`;

            item.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="drag-handle">
                    <path d="M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z"/>
                </svg>
                <span class="column-label">${COLUMN_LABELS[columnId]}</span>
                <div class="column-width-adjuster">
                    <input type="range" 
                           class="width-slider" 
                           min="${isPixelBased ? 80 : 0.5}" 
                           max="${isPixelBased ? 300 : 5}" 
                           step="${isPixelBased ? 10 : 0.1}" 
                           value="${currentWidth}" 
                           data-column="${columnId}">
                    <span class="width-display">${currentWidth}${isPixelBased ? 'px' : 'fr'}</span>
                </div>
                <button class="column-visibility-toggle ${isVisible ? 'visible' : 'hidden'}" data-column="${columnId}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        ${eyeIcon}
                    </svg>
                </button>
            `;

            // Visibility toggle
            const toggleBtn = item.querySelector('.column-visibility-toggle');
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleColumnVisibility(columnId);
            });

            // Width slider
            const widthSlider = item.querySelector('.width-slider');
            widthSlider.addEventListener('input', (e) => {
                e.stopPropagation();
                this.handleColumnWidthChange(columnId, parseFloat(e.target.value));
            });

            container.appendChild(item);
        });
    }

    /**
     * Initialize drag and drop for column reordering
     */
    initializeColumnDragDrop() {
        const container = document.getElementById('columnOrderList');
        if (!container) return;

        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('column-item')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.column);
            }
        });

        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('column-item')) {
                e.target.classList.remove('dragging');
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragging = container.querySelector('.dragging');
            if (!dragging) return;

            const siblings = [...container.querySelectorAll('.column-item:not(.dragging)')];

            const nextSibling = siblings.find(sibling => {
                return e.clientY <= sibling.getBoundingClientRect().top + sibling.offsetHeight / 2;
            });

            container.insertBefore(dragging, nextSibling);
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            this.updateColumnOrderFromDOM();
        });

        // Prevent dragging when clicking controls
        container.addEventListener('mousedown', (e) => {
            if (e.target.closest('.column-visibility-toggle') || e.target.closest('.column-width-adjuster')) {
                const columnItem = e.target.closest('.column-item');
                if (columnItem) {
                    columnItem.draggable = false;
                    setTimeout(() => {
                        columnItem.draggable = true;
                    }, 100);
                }
            }
        });
    }

    /**
     * Update column order from DOM
     */
    updateColumnOrderFromDOM() {
        const container = document.getElementById('columnOrderList');
        if (!container) return;

        const items = container.querySelectorAll('.column-item');
        const newOrder = Array.from(items).map(item => item.dataset.column);

        this.stateManager.updateSettings({ columnOrder: newOrder });
    }

    /**
     * Handle column width change
     * @param {string} columnId - Column ID
     * @param {number} newWidth - New width value
     */
    handleColumnWidthChange(columnId, newWidth) {
        const state = this.stateManager.getState();
        const currentWidths = state.settings.columnWidths;

        this.stateManager.updateSettings({
            columnWidths: { ...currentWidths, [columnId]: newWidth }
        });

        // Update display
        const widthDisplay = document.querySelector(`[data-column="${columnId}"] .width-display`);
        if (widthDisplay) {
            const isPixelBased = columnId === 'indicators';
            widthDisplay.textContent = `${newWidth}${isPixelBased ? 'px' : 'fr'}`;
        }
    }

    /**
     * Toggle column visibility
     * @param {string} columnId - Column ID
     */
    toggleColumnVisibility(columnId) {
        const state = this.stateManager.getState();
        const currentVisibility = state.settings.columnVisibility;

        this.stateManager.updateSettings({
            columnVisibility: { ...currentVisibility, [columnId]: !currentVisibility[columnId] }
        });

        // Refresh display
        this.updateColumnOrderDisplay();
        this.initializeColumnDragDrop();
    }
}
