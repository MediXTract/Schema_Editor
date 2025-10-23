/**
 * ThemeManager - Handle theme switching
 */
import { EVENTS } from '../../config/constants.js';

export class ThemeManager {
    constructor(stateManager, eventBus) {
        this.stateManager = stateManager;
        this.eventBus = eventBus;
    }

    /**
     * Set theme
     * @param {string} theme - Theme name ('light', 'dark', 'joan')
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update state
        const state = this.stateManager.getState();
        if (state.settings) {
            this.stateManager.updateSettings({ theme });
        }
        
        // Emit event
        this.eventBus.emit(EVENTS.THEME_CHANGED, theme);
    }

    /**
     * Get current theme
     * @returns {string} Current theme name
     */
    getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    /**
     * Toggle between themes
     */
    toggleTheme() {
        const current = this.getTheme();
        const themes = ['light', 'dark', 'joan'];
        const currentIndex = themes.indexOf(current);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }
}
