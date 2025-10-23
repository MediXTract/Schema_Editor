/**
 * StorageService - LocalStorage operations
 */
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../../config/constants.js';

export class StorageService {
    /**
     * Save settings to localStorage
     * @param {Object} settings - Settings object
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
        }
    }

    /**
     * Load settings from localStorage
     * @returns {Object} Settings object
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
        }
        return { ...DEFAULT_SETTINGS };
    }

    /**
     * Clear all settings
     */
    clearSettings() {
        try {
            localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        } catch (error) {
            console.warn('Failed to clear settings from localStorage:', error);
        }
    }
}
