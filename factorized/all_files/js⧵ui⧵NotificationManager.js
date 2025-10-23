/**
 * NotificationManager - Handle loading, success, and error notifications
 */
export class NotificationManager {
    constructor() {
        this.loadingEl = document.getElementById('loadingIndicator');
        this.loadingTextEl = document.getElementById('loadingText');
        this.errorEl = document.getElementById('errorMessage');
    }

    /**
     * Show loading overlay with message
     * @param {string} message - Loading message
     */
    showLoading(message = 'Loading...') {
        if (this.loadingTextEl) {
            this.loadingTextEl.textContent = message;
        }
        if (this.loadingEl) {
            this.loadingEl.style.display = 'flex';
        }
        if (this.errorEl) {
            this.errorEl.style.display = 'none';
        }
    }

    /**
     * Hide loading overlay
     */
    hide() {
        if (this.loadingEl) {
            this.loadingEl.style.display = 'none';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (this.errorEl) {
            this.errorEl.textContent = message;
            this.errorEl.style.display = 'block';
        }
        this.hide();
    }

    /**
     * Show success message on button
     * @param {string} message - Success message
     * @param {string} buttonId - Button element ID (default: 'saveBtn')
     */
    showSuccess(message, buttonId = 'saveBtn') {
        const button = document.getElementById(buttonId);
        if (!button) return;

        const originalHTML = button.innerHTML;
        button.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
        </svg> ${message}`;
        
        const originalBg = button.style.background;
        button.style.background = 'var(--success)';
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.background = originalBg;
        }, 2000);
    }

    /**
     * Clear error message
     */
    clearError() {
        if (this.errorEl) {
            this.errorEl.style.display = 'none';
        }
    }
}
