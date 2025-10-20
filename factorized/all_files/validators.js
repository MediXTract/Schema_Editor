/**
 * Validation utility functions
 */

/**
 * Validate JSON string
 * @param {string} jsonString - JSON string to validate
 * @returns {Object} {valid: boolean, error: string|null, data: any}
 */
export function validateJSON(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        return { valid: true, error: null, data };
    } catch (error) {
        return { valid: false, error: error.message, data: null };
    }
}

/**
 * Validate field type
 * @param {string} type - Field type to validate
 * @returns {boolean} True if valid type
 */
export function validateFieldType(type) {
    const validTypes = ['string', 'number', 'integer', 'boolean', 'array', 'object', 'null'];
    return validTypes.includes(type);
}

/**
 * Validate date range
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {string} min - Minimum date
 * @param {string} max - Maximum date
 * @returns {boolean} True if date is within range
 */
export function validateDateRange(date, min, max) {
    const dateObj = new Date(date);
    const minObj = min ? new Date(min) : null;
    const maxObj = max ? new Date(max) : null;
    
    if (isNaN(dateObj.getTime())) return false;
    if (minObj && dateObj < minObj) return false;
    if (maxObj && dateObj > maxObj) return false;
    
    return true;
}
