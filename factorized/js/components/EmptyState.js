/**
 * EmptyState - Component for displaying empty state
 */
export class EmptyState {
    constructor() {
        this.emptyStateEl = document.getElementById('emptyState');
        this.schemaEditorEl = document.getElementById('schemaEditor');
    }

    /**
     * Show empty state
     */
    show() {
        if (this.emptyStateEl) {
            this.emptyStateEl.style.display = 'block';
        }
        if (this.schemaEditorEl) {
            this.schemaEditorEl.style.display = 'none';
        }
        
        // Hide loading and error messages
        const loadingEl = document.getElementById('loadingIndicator');
        const errorEl = document.getElementById('errorMessage');
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
    }

    /**
     * Hide empty state
     */
    hide() {
        if (this.emptyStateEl) {
            this.emptyStateEl.style.display = 'none';
        }
    }
}
