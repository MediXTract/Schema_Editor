/**
 * Main Entry Point - Initialize the Schema Editor Application
 */

import { SchemaEditor } from './core/SchemaEditor.js';

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new SchemaEditor();
    
    // Make app globally accessible for debugging (optional)
    if (import.meta.env?.MODE === 'development') {
        window.schemaEditor = app;
    }
});
