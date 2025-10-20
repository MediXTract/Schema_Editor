/**
 * PerformanceService - Manage patient performance classifications
 */
import { 
    CLASSIFICATION_CATEGORIES, 
    CLASSIFICATION_GROUPS,
    DEFAULT_PATIENT_PERFORMANCE,
    PATIENT_ID_PATTERN 
} from '../../config/constants.js';

export class PerformanceService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Initialize performance object for a field if it doesn't exist
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     */
    initializePerformance(schema, fieldId) {
        if (!schema.properties[fieldId].performance) {
            schema.properties[fieldId].performance = {};
        }
    }

    /**
     * Get performance data for a specific field and patient
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     * @param {string} patientId - Patient ID
     * @returns {Object|null} Performance data or null if not found
     */
    getPerformanceData(schema, fieldId, patientId) {
        const field = schema.properties[fieldId];
        if (!field || !field.performance || !field.performance[patientId]) {
            return null;
        }
        return field.performance[patientId];
    }

    /**
     * Get all patients for a specific field
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     * @returns {Array} Array of patient IDs
     */
    getPatientsForField(schema, fieldId) {
        const field = schema.properties[fieldId];
        if (!field || !field.performance) {
            return [];
        }
        return Object.keys(field.performance).sort();
    }

    /**
     * Get all unique patient IDs across entire schema
     * @param {Object} schema - Schema object
     * @returns {Set} Set of patient IDs
     */
    getAllPatients(schema) {
        const patients = new Set();
        
        Object.values(schema.properties).forEach(field => {
            if (field.performance) {
                Object.keys(field.performance).forEach(patientId => {
                    patients.add(patientId);
                });
            }
        });
        
        return patients;
    }

    /**
     * Add or update patient classification for a field
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     * @param {string} patientId - Patient ID
     * @param {Object} classifications - Classification flags
     * @param {number|null} severity - Severity rating (1-10)
     * @param {string} comment - Comment text
     * @returns {Object} Updated schema
     */
    setPatientClassification(schema, fieldId, patientId, classifications, severity, comment) {
        // Validate patient ID
        if (!this.validatePatientId(patientId)) {
            throw new Error(`Invalid patient ID format: ${patientId}`);
        }

        // Initialize performance object if needed
        this.initializePerformance(schema, fieldId);

        // Create or update patient data (sparse storage - only true values)
        const patientData = {
            ...DEFAULT_PATIENT_PERFORMANCE,
            last_updated: new Date().toISOString()
        };

        // Add only true classification flags
        Object.entries(classifications).forEach(([key, value]) => {
            if (value === true) {
                patientData[key] = true;
            }
        });

        // Add severity if provided
        if (severity !== null && severity !== undefined) {
            patientData.severity = severity;
        }

        // Add comment if provided
        if (comment && comment.trim()) {
            patientData.comment = comment.trim();
        }

        // Set the patient data
        schema.properties[fieldId].performance[patientId] = patientData;

        return schema;
    }

    /**
     * Delete patient classification for a field
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     * @param {string} patientId - Patient ID
     * @returns {Object} Updated schema
     */
    deletePatientClassification(schema, fieldId, patientId) {
        const field = schema.properties[fieldId];
        if (field && field.performance && field.performance[patientId]) {
            delete field.performance[patientId];
            
            // Clean up empty performance object
            if (Object.keys(field.performance).length === 0) {
                delete field.performance;
            }
        }
        return schema;
    }

    /**
     * Validate patient ID format
     * @param {string} patientId - Patient ID to validate
     * @returns {boolean} True if valid
     */
    validatePatientId(patientId) {
        return PATIENT_ID_PATTERN.test(patientId);
    }

    /**
     * Format patient ID (pad numbers to 3 digits)
     * @param {string|number} input - Patient number or partial ID
     * @returns {string} Formatted patient ID
     */
    formatPatientId(input) {
        if (typeof input === 'number') {
            return `patient_${String(input).padStart(3, '0')}`;
        }
        
        // If already formatted, return as is
        if (this.validatePatientId(input)) {
            return input;
        }
        
        // Try to extract number
        const match = input.match(/\d+/);
        if (match) {
            const num = parseInt(match[0], 10);
            return `patient_${String(num).padStart(3, '0')}`;
        }
        
        return input;
    }

    /**
     * Get classification summary for a field
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     * @returns {Object} Summary statistics
     */
    getFieldSummary(schema, fieldId) {
        const patients = this.getPatientsForField(schema, fieldId);
        const summary = {
            totalPatients: patients.length,
            byCategory: {}
        };

        // Initialize counters for all categories
        Object.values(CLASSIFICATION_GROUPS).flat().forEach(category => {
            summary.byCategory[category] = 0;
        });

        // Count classifications
        patients.forEach(patientId => {
            const data = this.getPerformanceData(schema, fieldId, patientId);
            if (data) {
                Object.keys(data).forEach(key => {
                    if (data[key] === true && summary.byCategory.hasOwnProperty(key)) {
                        summary.byCategory[key]++;
                    }
                });
            }
        });

        return summary;
    }

    /**
     * Get all fields classified for a specific patient
     * @param {Object} schema - Schema object
     * @param {string} patientId - Patient ID
     * @returns {Array} Array of field IDs
     */
    getFieldsForPatient(schema, patientId) {
        const fields = [];
        
        Object.keys(schema.properties).forEach(fieldId => {
            const data = this.getPerformanceData(schema, fieldId, patientId);
            if (data) {
                fields.push(fieldId);
            }
        });
        
        return fields.sort();
    }

    /**
     * Get patient summary across all fields
     * @param {Object} schema - Schema object
     * @param {string} patientId - Patient ID
     * @returns {Object} Summary statistics
     */
    getPatientSummary(schema, patientId) {
        const fields = this.getFieldsForPatient(schema, patientId);
        const summary = {
            totalFields: fields.length,
            byCategory: {}
        };

        // Initialize counters
        Object.values(CLASSIFICATION_GROUPS).flat().forEach(category => {
            summary.byCategory[category] = 0;
        });

        // Count classifications across all fields
        fields.forEach(fieldId => {
            const data = this.getPerformanceData(schema, fieldId, patientId);
            if (data) {
                Object.keys(data).forEach(key => {
                    if (data[key] === true && summary.byCategory.hasOwnProperty(key)) {
                        summary.byCategory[key]++;
                    }
                });
            }
        });

        return summary;
    }

    /**
     * Check if classifications are valid (no contradictions)
     * @param {Object} classifications - Classification flags
     * @returns {Object} { valid: boolean, errors: Array }
     */
    validateClassifications(classifications) {
        const errors = [];
        const selected = Object.keys(classifications).filter(key => classifications[key] === true);

        // Check status exclusivity (only one status can be selected)
        const statusCategories = CLASSIFICATION_GROUPS.status;
        const selectedStatus = selected.filter(key => statusCategories.includes(key));
        
        if (selectedStatus.length > 1) {
            errors.push(`Only one status can be selected. Currently selected: ${selectedStatus.join(', ')}`);
        }

        // Check logical contradictions
        if (classifications.match && classifications.correction) {
            errors.push('Cannot select both "Match" and "Correction"');
        }
        if (classifications.match && classifications.filled_blank) {
            errors.push('Cannot select both "Match" and "Filled Blank"');
        }
        if (classifications.not_applicable && classifications.match) {
            errors.push('Cannot select both "Not Applicable" and "Match"');
        }
        if (classifications.not_applicable && (classifications.correction || classifications.filled_blank)) {
            errors.push('Cannot select "Not Applicable" with improvements');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get suggested classifications based on current selection
     * @param {Object} classifications - Current classification flags
     * @returns {Array} Array of suggestions
     */
    getSuggestions(classifications) {
        const suggestions = [];

        if (classifications.missing_docs && !classifications.missing_docs_suspected) {
            suggestions.push({
                category: 'missing_docs_suspected',
                message: 'Consider marking as suspected if not fully confirmed'
            });
        }

        if (classifications.was_missing_docs && !classifications.missing_docs) {
            suggestions.push({
                category: 'missing_docs',
                message: 'Was this originally marked as missing docs?'
            });
        }

        if (classifications.was_questioned && !classifications.questioned) {
            suggestions.push({
                category: 'questioned',
                message: 'Was this originally questioned?'
            });
        }

        return suggestions;
    }

    /**
     * Export performance data for a field
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     * @returns {Object} Exportable performance data
     */
    exportFieldPerformance(schema, fieldId) {
        const field = schema.properties[fieldId];
        return {
            fieldId,
            description: field.description || '',
            performance: field.performance || {}
        };
    }

    /**
     * Import performance data for a field
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     * @param {Object} performanceData - Performance data to import
     * @returns {Object} Updated schema
     */
    importFieldPerformance(schema, fieldId, performanceData) {
        if (!schema.properties[fieldId]) {
            throw new Error(`Field ${fieldId} does not exist`);
        }

        schema.properties[fieldId].performance = performanceData;
        return schema;
    }
}
