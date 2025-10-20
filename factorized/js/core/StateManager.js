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
            directoryHandle: null,
            
            // NEW: Patient-related state
            allPatients: new Set(),           // All unique patient IDs across schema
            selectedPatient: null,             // Currently selected patient ID
            patientFilter: null,               // Filter by specific patient
            performanceCache: new Map()        // Cache for performance summaries
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
        
        // Extract all patients from schema
        this.extractAllPatients(schema);
    }

    /**
     * Update schema
     * @param {Object} schema - Updated schema object
     */
    updateSchema(schema) {
        this.setState({
            currentSchema: schema
        }, EVENTS.SCHEMA_UPDATED);
        
        // Update patient list
        this.extractAllPatients(schema);
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

    // ========== NEW: PATIENT-RELATED STATE METHODS ==========

    /**
     * Extract all unique patient IDs from schema
     * @param {Object} schema - Schema object
     */
    extractAllPatients(schema) {
        const patients = new Set();
        
        if (schema && schema.properties) {
            Object.values(schema.properties).forEach(field => {
                if (field.performance) {
                    Object.keys(field.performance).forEach(patientId => {
                        patients.add(patientId);
                    });
                }
            });
        }
        
        this.state.allPatients = patients;
    }

    /**
     * Get all patient IDs
     * @returns {Array} Sorted array of patient IDs
     */
    getAllPatients() {
        return Array.from(this.state.allPatients).sort();
    }

    /**
     * Set selected patient
     * @param {string|null} patientId - Patient ID or null to clear
     */
    setSelectedPatient(patientId) {
        this.setState({
            selectedPatient: patientId
        }, EVENTS.PATIENT_ADDED);
    }

    /**
     * Get selected patient
     * @returns {string|null} Selected patient ID
     */
    getSelectedPatient() {
        return this.state.selectedPatient;
    }

    /**
     * Set patient filter
     * @param {string|null} patientId - Patient ID to filter by, or null to clear
     */
    setPatientFilter(patientId) {
        this.setState({
            patientFilter: patientId
        }, EVENTS.FILTERS_CHANGED);
    }

    /**
     * Get patient filter
     * @returns {string|null} Patient filter
     */
    getPatientFilter() {
        return this.state.patientFilter;
    }

    /**
     * Add patient to cache
     * @param {string} patientId - Patient ID
     */
    addPatient(patientId) {
        this.state.allPatients.add(patientId);
        this.eventBus.emit(EVENTS.PATIENT_ADDED, { patientId });
    }

    /**
     * Remove patient from cache (when deleted from all fields)
     * @param {string} patientId - Patient ID
     */
    removePatient(patientId) {
        this.state.allPatients.delete(patientId);
        
        // Clear if this was the selected patient
        if (this.state.selectedPatient === patientId) {
            this.state.selectedPatient = null;
        }
        
        // Clear if this was the patient filter
        if (this.state.patientFilter === patientId) {
            this.state.patientFilter = null;
        }
        
        this.eventBus.emit(EVENTS.PATIENT_DELETED, { patientId });
    }

    /**
     * Cache performance summary for a field or patient
     * @param {string} key - Cache key (fieldId or patientId)
     * @param {Object} summary - Summary data
     */
    cachePerformanceSummary(key, summary) {
        this.state.performanceCache.set(key, {
            data: summary,
            timestamp: Date.now()
        });
    }

    /**
     * Get cached performance summary
     * @param {string} key - Cache key
     * @param {number} maxAge - Maximum age in milliseconds (default: 60000 = 1 minute)
     * @returns {Object|null} Cached summary or null if not found/expired
     */
    getCachedPerformanceSummary(key, maxAge = 60000) {
        const cached = this.state.performanceCache.get(key);
        
        if (!cached) return null;
        
        const age = Date.now() - cached.timestamp;
        if (age > maxAge) {
            this.state.performanceCache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    /**
     * Clear performance cache
     */
    clearPerformanceCache() {
        this.state.performanceCache.clear();
    }

    /**
     * Invalidate cache for a specific key
     * @param {string} key - Cache key
     */
    invalidateCache(key) {
        this.state.performanceCache.delete(key);
    }
}
