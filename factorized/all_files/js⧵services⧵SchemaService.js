/**
 * SchemaService - Schema parsing, validation, and manipulation
 */
export class SchemaService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Parse schema into field array
     * @param {Object} schema - Schema object
     * @returns {Array} Array of field objects
     */
    parseSchema(schema) {
        if (!schema || !schema.properties) {
            throw new Error('Invalid schema format');
        }

        const fields = Object.entries(schema.properties).map(([id, def]) => ({
            id,
            definition: def,
            type: this.getFieldType(def),
            group: def.group_id || 'ungrouped',
            description: def.description || '',
            comments: def.comments || '',
            notes: def.notes || '',
            hasComments: Boolean(def.comments && def.comments.trim()),
            hasNotes: Boolean(def.notes && def.notes.trim()),
            hasErrors: Boolean(def.errors),
            hasChanges: Boolean(def.changes),
            hasImprovements: Boolean(def.improvements),
            // NEW: Patient classification indicators
            patientCount: def.performance ? Object.keys(def.performance).length : 0,
            hasPerformanceData: Boolean(def.performance && Object.keys(def.performance).length > 0)
        }));

        return fields;
    }

    /**
     * Extract metadata from fields
     * @param {Array} fields - Array of field objects
     * @returns {Object} Metadata object with type and group sets
     */
    extractMetadata(fields) {
        const typeOptions = new Set();
        const groupOptions = new Set();

        fields.forEach(field => {
            typeOptions.add(field.type);
            groupOptions.add(field.group);
        });

        return { typeOptions, groupOptions };
    }

    /**
     * Get field type from definition
     * @param {Object} fieldDef - Field definition
     * @returns {string} Field type
     */
    getFieldType(fieldDef) {
        if (fieldDef.enum) return 'enum';
        if (fieldDef.anyOf) {
            const types = fieldDef.anyOf
                .map(t => t.type || 'unknown')
                .filter(t => t !== 'null');
            return types.join('/');
        }
        return fieldDef.type || 'unknown';
    }

    /**
     * Update field property in schema
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     * @param {string} property - Property name
     * @param {*} value - New value
     * @returns {Object} Updated schema
     */
    updateFieldProperty(schema, fieldId, property, value) {
        const fieldDef = schema.properties[fieldId];

        if (property === 'type') {
            if (value && value !== 'null') {
                const currentFormat = this.extractFormatValue(fieldDef);
                fieldDef.anyOf = [{ type: value }, { type: "null" }];
                if (currentFormat) fieldDef.anyOf[0].format = currentFormat;
                delete fieldDef.type;
            } else {
                fieldDef.anyOf = [{ type: "null" }];
                delete fieldDef.type;
            }
        } else if (property === 'format') {
            if (fieldDef.anyOf && fieldDef.anyOf[0]) {
                if (value) fieldDef.anyOf[0].format = value;
                else delete fieldDef.anyOf[0].format;
            } else if (value) {
                fieldDef.format = value;
            } else {
                delete fieldDef.format;
            }
        } else if (property === 'default') {
            if (value !== '') {
                try {
                    fieldDef[property] = JSON.parse(value);
                } catch (e) {
                    fieldDef[property] = value;
                }
            } else {
                delete fieldDef[property];
            }
        } else {
            if (value === '' || value === false) {
                delete fieldDef[property];
            } else {
                fieldDef[property] = value;
            }
        }

        return schema;
    }

    /**
     * Extract type value from field definition
     * @param {Object} fieldDef - Field definition
     * @returns {string} Type value
     */
    extractTypeValue(fieldDef) {
        if (fieldDef.type) return fieldDef.type;
        if (fieldDef.anyOf && Array.isArray(fieldDef.anyOf)) {
            const nonNullType = fieldDef.anyOf.find(t => t.type && t.type !== 'null');
            if (nonNullType) return nonNullType.type;
        }
        return '';
    }

    /**
     * Extract format value from field definition
     * @param {Object} fieldDef - Field definition
     * @returns {string} Format value
     */
    extractFormatValue(fieldDef) {
        if (fieldDef.format) return fieldDef.format;
        if (fieldDef.anyOf && Array.isArray(fieldDef.anyOf)) {
            const typeWithFormat = fieldDef.anyOf.find(t => t.format);
            if (typeWithFormat) return typeWithFormat.format;
        }
        return '';
    }

    /**
     * Extract default value from field definition
     * @param {Object} fieldDef - Field definition
     * @returns {string} Default value
     */
    extractDefaultValue(fieldDef) {
        if (fieldDef.default !== undefined && fieldDef.default !== null) {
            return typeof fieldDef.default === 'string' 
                ? fieldDef.default 
                : JSON.stringify(fieldDef.default);
        }
        return '';
    }

    /**
     * Check if field has enum values
     * @param {Object} fieldDef - Field definition
     * @returns {boolean} True if field has enum
     */
    hasEnumValues(fieldDef) {
        if (fieldDef.enum && Array.isArray(fieldDef.enum)) return true;
        if (fieldDef.anyOf && Array.isArray(fieldDef.anyOf)) {
            return fieldDef.anyOf.some(t => t.enum && Array.isArray(t.enum));
        }
        return false;
    }

    /**
     * Extract enum values from field definition
     * @param {Object} fieldDef - Field definition
     * @returns {Array} Array of enum values
     */
    extractEnumValues(fieldDef) {
        if (fieldDef.enum && Array.isArray(fieldDef.enum)) {
            return fieldDef.enum;
        }
        if (fieldDef.anyOf && Array.isArray(fieldDef.anyOf)) {
            const enumType = fieldDef.anyOf.find(t => t.enum && Array.isArray(t.enum));
            if (enumType) return enumType.enum;
        }
        return [];
    }

    // ========== NEW: PERFORMANCE-RELATED METHODS ==========

    /**
     * Check if field has performance data
     * @param {Object} fieldDef - Field definition
     * @returns {boolean} True if has performance data
     */
    hasPerformanceData(fieldDef) {
        return Boolean(fieldDef.performance && Object.keys(fieldDef.performance).length > 0);
    }

    /**
     * Get performance data for field
     * @param {Object} fieldDef - Field definition
     * @returns {Object} Performance object
     */
    getPerformanceData(fieldDef) {
        return fieldDef.performance || {};
    }

    /**
     * Check if field has options dictionary (for enum labels)
     * @param {Object} fieldDef - Field definition
     * @returns {boolean} True if has options
     */
    hasOptions(fieldDef) {
        return Boolean(fieldDef.options && typeof fieldDef.options === 'object');
    }

    /**
     * Get options dictionary
     * @param {Object} fieldDef - Field definition
     * @returns {Object} Options object
     */
    getOptions(fieldDef) {
        return fieldDef.options || {};
    }

    /**
     * Get label for enum value
     * @param {Object} fieldDef - Field definition
     * @param {string} value - Enum value
     * @returns {string} Label or value if not found
     */
    getOptionLabel(fieldDef, value) {
        if (this.hasOptions(fieldDef)) {
            const options = this.getOptions(fieldDef);
            return options[value] || value;
        }
        return value;
    }

    /**
     * Extract notes from field definition
     * @param {Object} fieldDef - Field definition
     * @returns {string} Notes text
     */
    extractNotes(fieldDef) {
        return fieldDef.notes || '';
    }

    /**
     * Update notes for a field
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     * @param {string} notes - Notes text
     * @returns {Object} Updated schema
     */
    updateNotes(schema, fieldId, notes) {
        const fieldDef = schema.properties[fieldId];
        if (notes && notes.trim()) {
            fieldDef.notes = notes.trim();
        } else {
            delete fieldDef.notes;
        }
        return schema;
    }

    /**
     * Initialize performance object for field if it doesn't exist
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     * @returns {Object} Updated schema
     */
    initializePerformance(schema, fieldId) {
        if (!schema.properties[fieldId].performance) {
            schema.properties[fieldId].performance = {};
        }
        return schema;
    }

    /**
     * Clean field definition for export (remove metadata)
     * @param {Object} fieldDef - Field definition
     * @returns {Object} Cleaned definition
     */
    cleanFieldDefinition(fieldDef) {
        const cleaned = JSON.parse(JSON.stringify(fieldDef));
        
        // Remove metadata fields
        delete cleaned.group_id;
        delete cleaned.changes;
        delete cleaned.errors;
        delete cleaned.comments;
        delete cleaned.improvements;
        delete cleaned.notes;
        delete cleaned.performance; // Remove performance data in clean export
        delete cleaned.options; // Remove options if you want pure JSON Schema
        
        return cleaned;
    }

    /**
     * Get field statistics including performance data
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     * @returns {Object} Field statistics
     */
    getFieldStatistics(schema, fieldId) {
        const fieldDef = schema.properties[fieldId];
        const stats = {
            id: fieldId,
            type: this.getFieldType(fieldDef),
            group: fieldDef.group_id || 'ungrouped',
            hasEnum: this.hasEnumValues(fieldDef),
            enumCount: this.hasEnumValues(fieldDef) ? this.extractEnumValues(fieldDef).length : 0,
            hasOptions: this.hasOptions(fieldDef),
            hasNotes: Boolean(fieldDef.notes && fieldDef.notes.trim()),
            hasPerformance: this.hasPerformanceData(fieldDef),
            patientCount: this.hasPerformanceData(fieldDef) ? Object.keys(fieldDef.performance).length : 0
        };

        return stats;
    }

    /**
     * Validate schema structure including performance data
     * @param {Object} schema - Schema object
     * @returns {Object} Validation result
     */
    validateSchema(schema) {
        const errors = [];
        const warnings = [];

        if (!schema || typeof schema !== 'object') {
            errors.push('Schema must be an object');
            return { valid: false, errors, warnings };
        }

        if (!schema.properties || typeof schema.properties !== 'object') {
            errors.push('Schema must have a properties object');
            return { valid: false, errors, warnings };
        }

        // Validate each field
        Object.entries(schema.properties).forEach(([fieldId, fieldDef]) => {
            // Check performance data structure
            if (fieldDef.performance) {
                if (typeof fieldDef.performance !== 'object') {
                    errors.push(`Field ${fieldId}: performance must be an object`);
                } else {
                    // Validate each patient entry
                    Object.entries(fieldDef.performance).forEach(([patientId, patientData]) => {
                        if (!patientId.match(/^patient_\d{3}$/)) {
                            warnings.push(`Field ${fieldId}: patient ID "${patientId}" doesn't match expected format`);
                        }

                        if (typeof patientData !== 'object') {
                            errors.push(`Field ${fieldId}, ${patientId}: patient data must be an object`);
                        }

                        // Check for timestamp
                        if (patientData.last_updated && !this.isValidISO8601(patientData.last_updated)) {
                            warnings.push(`Field ${fieldId}, ${patientId}: last_updated is not a valid ISO 8601 timestamp`);
                        }

                        // Check severity range
                        if (patientData.severity !== null && patientData.severity !== undefined) {
                            if (typeof patientData.severity !== 'number' || patientData.severity < 1 || patientData.severity > 10) {
                                errors.push(`Field ${fieldId}, ${patientId}: severity must be a number between 1 and 10`);
                            }
                        }
                    });
                }
            }

            // Check options dictionary
            if (fieldDef.options) {
                if (typeof fieldDef.options !== 'object') {
                    errors.push(`Field ${fieldId}: options must be an object`);
                } else if (this.hasEnumValues(fieldDef)) {
                    const enumValues = this.extractEnumValues(fieldDef);
                    const optionKeys = Object.keys(fieldDef.options);
                    
                    // Check if all enum values have labels
                    enumValues.forEach(value => {
                        if (!optionKeys.includes(String(value))) {
                            warnings.push(`Field ${fieldId}: enum value "${value}" has no label in options`);
                        }
                    });
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Check if string is valid ISO 8601 date
     * @param {string} dateString - Date string
     * @returns {boolean} True if valid
     */
    isValidISO8601(dateString) {
        const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
        if (!iso8601Regex.test(dateString)) return false;
        
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }
}
