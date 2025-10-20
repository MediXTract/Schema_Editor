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
            hasImprovements: Boolean(def.improvements)
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
}
