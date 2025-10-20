/**
 * SchemaEditor - Main orchestrator class
 * Coordinates all services and components
 */

import { EventBus } from './EventBus.js';
import { StateManager } from './StateManager.js';
import { StorageService } from '../services/StorageService.js';
import { FileService } from '../services/FileService.js';
import { SchemaService } from '../services/SchemaService.js';
import { FilterService } from '../services/FilterService.js';
import { TableManager } from '../components/TableManager.js';
import { FilterBar } from '../components/FilterBar.js';
import { FieldDetailsPanel } from '../components/FieldDetailsPanel.js';
import { SettingsModal } from '../components/SettingsModal.js';
import { EmptyState } from '../components/EmptyState.js';
import { ThemeManager } from '../ui/ThemeManager.js';
import { NotificationManager } from '../ui/NotificationManager.js';
import { EVENTS } from '../../config/constants.js';

export class SchemaEditor {
    constructor() {
        // Initialize core
        this.eventBus = new EventBus();
        this.stateManager = new StateManager(this.eventBus);
        
        // Initialize services
        this.storageService = new StorageService();
        this.fileService = new FileService(this.stateManager);
        this.schemaService = new SchemaService(this.stateManager);
        this.filterService = new FilterService(this.stateManager);
        
        // Initialize UI managers
        this.themeManager = new ThemeManager(this.stateManager, this.eventBus);
        this.notificationManager = new NotificationManager();
        
        // Initialize components
        this.emptyState = new EmptyState();
        this.tableManager = new TableManager(this.stateManager, this.eventBus, this.schemaService);
        this.filterBar = new FilterBar(this.stateManager, this.eventBus, this.filterService);
        this.fieldDetailsPanel = new FieldDetailsPanel(this.stateManager, this.eventBus, this.schemaService);
        this.settingsModal = new SettingsModal(this.stateManager, this.eventBus, this.storageService);
        
        // Initialize application
        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        // Load settings
        const settings = this.storageService.loadSettings();
        this.stateManager.setSettings(settings);
        
        // Initialize theme
        this.themeManager.setTheme(settings.theme);
        
        // Check browser support
        this.checkBrowserSupport();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup event subscriptions
        this.setupEventSubscriptions();
        
        // Show empty state
        this.emptyState.show();
    }

    /**
     * Check browser support for File System Access API
     */
    checkBrowserSupport() {
        const hasFileSystemAccess = this.fileService.isFileSystemAccessSupported();
        
        if (hasFileSystemAccess) {
            document.getElementById('browserLimitationInfo').style.display = 'none';
            document.getElementById('fallbackControls').style.display = 'none';
        } else {
            document.getElementById('browserLimitationInfo').style.display = 'block';
            document.getElementById('fallbackControls').style.display = 'flex';
        }
    }

    /**
     * Setup DOM event listeners
     */
    setupEventListeners() {
        // File operations
        document.getElementById('scanFolderBtn').addEventListener('click', 
            () => this.handleFolderScan());
        document.getElementById('fileInput').addEventListener('change', 
            (e) => this.handleFileLoad(e));
        document.getElementById('saveBtn').addEventListener('click', 
            () => this.handleSave());
        document.getElementById('downloadFilteredBtn').addEventListener('click', 
            () => this.handleDownloadFiltered());
        
        // Settings
        document.getElementById('settingsBtn').addEventListener('click', 
            () => this.settingsModal.open());
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.fieldDetailsPanel.close();
                this.filterBar.closeAllDropdowns();
                this.settingsModal.close();
            }
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            // Close dropdowns when clicking outside
            if (!e.target.closest('.custom-dropdown')) {
                this.filterBar.closeAllDropdowns();
            }
            
            // Close settings modal when clicking overlay
            if (e.target.classList.contains('settings-overlay')) {
                this.settingsModal.close();
            }
            
            // Close field details panel when clicking outside
            const panel = document.getElementById('fieldDetailsPanel');
            const isFieldDetailsOpen = panel.style.display === 'flex';
            
            if (isFieldDetailsOpen) {
                const isClickOutsidePanel = !panel.contains(e.target);
                const isClickOnTableRow = e.target.closest('.field-row');
                
                if (isClickOutsidePanel && !isClickOnTableRow) {
                    this.fieldDetailsPanel.close();
                }
            }
        });
    }

    /**
     * Setup event bus subscriptions
     */
    setupEventSubscriptions() {
        // Schema loaded
        this.eventBus.on(EVENTS.SCHEMA_LOADED, () => {
            this.onSchemaLoaded();
        });
        
        // Schema updated
        this.eventBus.on(EVENTS.SCHEMA_UPDATED, () => {
            this.tableManager.refreshTable();
        });
        
        // Filters changed
        this.eventBus.on(EVENTS.FILTERS_CHANGED, () => {
            this.filterService.applyFilters();
            this.tableManager.renderTable();
            this.filterBar.updateResultsCount();
        });
        
        // Settings changed
        this.eventBus.on(EVENTS.SETTINGS_CHANGED, () => {
            const state = this.stateManager.getState();
            this.storageService.saveSettings(state.settings);
            this.tableManager.applyColumnOrder();
            this.tableManager.renderTable();
        });
        
        // Theme changed
        this.eventBus.on(EVENTS.THEME_CHANGED, (theme) => {
            this.tableManager.renderTable();
        });
        
        // Field selected
        this.eventBus.on(EVENTS.FIELD_SELECTED, ({ fieldId }) => {
            this.tableManager.selectField(fieldId);
        });
    }

    /**
     * Handle folder scan
     */
    async handleFolderScan() {
        if (!this.fileService.isFileSystemAccessSupported()) {
            this.notificationManager.showError('Your browser does not support folder scanning. Please select files manually.');
            return;
        }

        try {
            this.notificationManager.showLoading('Selecting folder...');
            
            const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            this.stateManager.setDirectoryHandle(dirHandle);
            
            this.notificationManager.showLoading('Scanning for schema files...');
            await this.fileService.scanFolder();
            
            this.loadLatestSchema();
            
        } catch (error) {
            if (error.name === 'AbortError') {
                this.emptyState.show();
                this.notificationManager.hide();
                return;
            }
            this.notificationManager.showError(`Error scanning folder: ${error.message}`);
        }
    }

    /**
     * Handle file load
     */
    async handleFileLoad(event) {
        this.notificationManager.showLoading('Processing files...');
        
        try {
            const files = Array.from(event.target.files);
            await this.fileService.loadFiles(files);
            
            this.loadLatestSchema();
            
        } catch (error) {
            this.notificationManager.showError(`Error loading files: ${error.message}`);
        }
    }

    /**
     * Load latest schema version
     */
    loadLatestSchema() {
        const state = this.stateManager.getState();
        const allSchemas = state.allSchemas;
        
        // Find latest version
        const latestVersion = Math.max(...allSchemas.keys());
        const schemaInfo = allSchemas.get(latestVersion);
        
        this.stateManager.setSchema(schemaInfo.data, latestVersion);
        this.updateVersionDisplay(schemaInfo.filename);
        
        // Process schema
        this.processSchema(schemaInfo.data);
        
        // Show schema editor
        this.showSchemaEditor();
    }

    /**
     * Process schema
     */
    processSchema(schema) {
        // Parse schema into fields
        const fields = this.schemaService.parseSchema(schema);
        this.stateManager.setAllFields(fields);
        
        // Extract metadata
        const { typeOptions, groupOptions } = this.schemaService.extractMetadata(fields);
        this.stateManager.setTypeOptions(typeOptions);
        this.stateManager.setGroupOptions(groupOptions);
        
        // Initialize filter options
        this.filterBar.populateFilterOptions();
        
        // Apply initial filters
        this.filterService.applyFilters();
    }

    /**
     * Update version display
     */
    updateVersionDisplay(filename) {
        document.getElementById('currentVersion').textContent = `Loaded: ${filename}`;
    }

    /**
     * Show schema editor
     */
    showSchemaEditor() {
        this.emptyState.hide();
        document.getElementById('schemaEditor').style.display = 'flex';
        document.getElementById('saveBtn').disabled = false;
        document.getElementById('downloadFilteredBtn').style.display = 'inline-flex';
        this.notificationManager.hide();
        
        // Update field stats
        this.updateFieldStats();
        
        // Apply column order
        this.tableManager.applyColumnOrder();
        
        // Render table
        this.tableManager.renderTable();
        this.filterBar.updateResultsCount();
    }

    /**
     * Update field statistics
     */
    updateFieldStats() {
        const state = this.stateManager.getState();
        const fieldCount = state.allFields.length;
        document.getElementById('fieldStats').textContent = `${fieldCount} fields`;
    }

    /**
     * Handle schema loaded event
     */
    onSchemaLoaded() {
        console.log('Schema loaded successfully');
    }

    /**
     * Handle save
     */
    async handleSave() {
        try {
            const state = this.stateManager.getState();
            const newVersion = state.currentVersion + 1;
            
            const filename = await this.fileService.saveSchema(
                state.currentSchema, 
                newVersion
            );
            
            // Update state
            this.stateManager.addSchemaVersion(
                newVersion, 
                state.currentSchema, 
                filename
            );
            this.stateManager.setState({ currentVersion: newVersion });
            this.updateVersionDisplay(filename);
            
            this.notificationManager.showSuccess('Saved successfully!');
            
        } catch (error) {
            this.notificationManager.showError(`Error saving: ${error.message}`);
        }
    }

    /**
     * Handle download filtered fields
     */
    async handleDownloadFiltered() {
        try {
            const state = this.stateManager.getState();
            const { filteredFields, currentSchema, filters } = state;
            
            // Create filtered schema
            const filteredSchema = {
                type: "object",
                properties: {},
                required: [],
                additionalProperties: true
            };

            // Add only filtered fields (clean version without metadata)
            filteredFields.forEach(field => {
                const cleanDef = this.cleanFieldDefinition(field.definition);
                filteredSchema.properties[field.id] = cleanDef;
            });

            // Generate filename based on filters
            const filename = this.generateFilteredFilename(filters, state.currentVersion);
            
            // Save/download
            const content = JSON.stringify(filteredSchema, null, 2);
            this.fileService.downloadFile(filename, content);
            
            this.notificationManager.showSuccess(`Downloaded: ${filename}`);
            
        } catch (error) {
            this.notificationManager.showError(`Error downloading: ${error.message}`);
        }
    }

    /**
     * Clean field definition (remove metadata fields)
     */
    cleanFieldDefinition(fieldDef) {
        const cleaned = JSON.parse(JSON.stringify(fieldDef));
        delete cleaned.group_id;
        delete cleaned.changes;
        delete cleaned.errors;
        delete cleaned.comments;
        delete cleaned.improvements;
        return cleaned;
    }

    /**
     * Generate filename for filtered export
     */
    generateFilteredFilename(filters, currentVersion) {
        const parts = ['schema'];
        
        // Add filter parts
        if (filters.types.length > 0) {
            filters.types.forEach(type => {
                parts.push(`Type${type.charAt(0).toUpperCase() + type.slice(1)}`);
            });
        }
        
        if (filters.groups.length > 0) {
            filters.groups.forEach(group => {
                const groupName = group.replace('group_', 'Group').replace('_', '');
                parts.push(groupName);
            });
        }
        
        // Check if no filters
        const hasNoFilters = 
            filters.types.length === 0 && 
            filters.groups.length === 0 && 
            filters.comments === 'all' && 
            filters.errors === 'all' && 
            filters.changes === 'all' &&
            filters.improvements === 'all' &&
            !filters.search;
        
        if (hasNoFilters) {
            parts.push('noFilters');
        }
        
        // Add version
        const version = (currentVersion + 1).toString().padStart(3, '0');
        parts.push(`v${version}`);
        
        return parts.join('_') + '.json';
    }
}
