import { EVENTS } from '../../config/constants.js';

/**
 * StateManager - Centralized state management with observable pattern
 */
export class StateManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        // Initialize state
        this.state = {
            currentSchema: null,
            currentVersion: 0,
            allSchemas: new Map(),
            allFields: [],
            filteredFields: [],
            selectedField: null,
            filters: {
                search: '',
                types: [],
                groups: [],
                comments: 'all',
                errors: 'all',
                changes: 'all',
                improvements: 'all'
            },
            settings: null, // Will be loaded from StorageService
            typeOptions: new Set(),
            groupOptions: new Set(),
            directoryHandle: null
        };
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return this.state;
    }

    /**
     * Update state and emit event
     * @param {Object} updates - State updates
     * @param {string} eventName - Event to emit (optional)
     */
    setState(updates, eventName = null) {
        Object.assign(this.state, updates);
        
        if (eventName) {
            this.eventBus.emit(eventName, this.state);
        }
    }

    /**
     * Set current schema
     * @param {Object} schema - Schema object
     * @param {number} version - Schema version
     */
    setSchema(schema, version) {
        this.setState({
            currentSchema: schema,
            currentVersion: version
        }, EVENTS.SCHEMA_LOADED);
    }

    /**
     * Update schema
     * @param {Object} schema - Updated schema object
     */
    updateSchema(schema) {
        this.setState({
            currentSchema: schema
        }, EVENTS.SCHEMA_UPDATED);
    }

    /**
     * Add schema version to collection
     * @param {number} version - Version number
     * @param {Object} data - Schema data
     * @param {string} filename - Filename
     */
    addSchemaVersion(version, data, filename) {
        this.state.allSchemas.set(version, { data, filename });
    }

    /**
     * Set all fields
     * @param {Array} fields - Array of field objects
     */
    setAllFields(fields) {
        this.setState({ allFields: fields });
    }

    /**
     * Set filtered fields
     * @param {Array} fields - Array of filtered field objects
     */
    setFilteredFields(fields) {
        this.setState({ filteredFields: fields });
    }

    /**
     * Set selected field
     * @param {string} fieldId - Field ID
     */
    setSelectedField(fieldId) {
        this.setState({
            selectedField: fieldId
        }, EVENTS.FIELD_SELECTED);
    }

    /**
     * Update filters
     * @param {Object} filterUpdates - Filter updates
     */
    updateFilters(filterUpdates) {
        this.setState({
            filters: { ...this.state.filters, ...filterUpdates }
        }, EVENTS.FILTERS_CHANGED);
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.setState({
            filters: {
                search: '',
                types: [],
                groups: [],
                comments: 'all',
                errors: 'all',
                changes: 'all',
                improvements: 'all'
            }
        }, EVENTS.FILTERS_CHANGED);
    }

    /**
     * Set settings
     * @param {Object} settings - Settings object
     */
    setSettings(settings) {
        this.setState({
            settings
        }, EVENTS.SETTINGS_CHANGED);
    }

    /**
     * Update settings
     * @param {Object} settingsUpdates - Settings updates
     */
    updateSettings(settingsUpdates) {
        this.setState({
            settings: { ...this.state.settings, ...settingsUpdates }
        }, EVENTS.SETTINGS_CHANGED);
    }

    /**
     * Set type options
     * @param {Set} types - Set of type strings
     */
    setTypeOptions(types) {
        this.setState({ typeOptions: types });
    }

    /**
     * Set group options
     * @param {Set} groups - Set of group strings
     */
    setGroupOptions(groups) {
        this.setState({ groupOptions: groups });
    }

    /**
     * Set directory handle
     * @param {FileSystemDirectoryHandle} handle - Directory handle
     */
    setDirectoryHandle(handle) {
        this.setState({ directoryHandle: handle });
    }

    /**
     * Get field by ID
     * @param {string} fieldId - Field ID
     * @returns {Object|null} Field object or null
     */
    getField(fieldId) {
        return this.state.allFields.find(f => f.id === fieldId) || null;
    }

    /**
     * Update field in allFields array
     * @param {string} fieldId - Field ID
     * @param {Object} updates - Field updates
     */
    updateField(fieldId, updates) {
        const index = this.state.allFields.findIndex(f => f.id === fieldId);
        if (index !== -1) {
            this.state.allFields[index] = {
                ...this.state.allFields[index],
                ...updates
            };
            this.eventBus.emit(EVENTS.FIELD_UPDATED, { fieldId, updates });
        }
    }
}
