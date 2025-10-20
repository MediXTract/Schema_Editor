/**
 * FilterService - Filtering logic and algorithms
 */
export class FilterService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Apply filters to all fields
     * @returns {Array} Filtered fields
     */
    applyFilters() {
        const state = this.stateManager.getState();
        const { allFields, filters } = state;

        const filteredFields = allFields.filter(field => {
            // Search filter
            if (filters.search) {
                const searchMatch = 
                    field.id.toLowerCase().includes(filters.search) ||
                    field.description.toLowerCase().includes(filters.search) ||
                    field.comments.toLowerCase().includes(filters.search) ||
                    field.group.toLowerCase().includes(filters.search);
                if (!searchMatch) return false;
            }

            // Type filter
            if (filters.types.length > 0 && !filters.types.includes(field.type)) {
                return false;
            }

            // Group filter
            if (filters.groups.length > 0 && !filters.groups.includes(field.group)) {
                return false;
            }

            // Three-state boolean filters
            if (!this.matchesThreeStateFilter(field.hasComments, filters.comments)) return false;
            if (!this.matchesThreeStateFilter(field.hasErrors, filters.errors)) return false;
            if (!this.matchesThreeStateFilter(field.hasChanges, filters.changes)) return false;
            if (!this.matchesThreeStateFilter(field.hasImprovements, filters.improvements)) return false;

            return true;
        });

        this.stateManager.setFilteredFields(filteredFields);
        return filteredFields;
    }

    /**
     * Check if field value matches three-state filter
     * @param {boolean} fieldValue - Field value
     * @param {string} filterState - Filter state ('all', 'true', 'false')
     * @returns {boolean} True if matches
     */
    matchesThreeStateFilter(fieldValue, filterState) {
        switch (filterState) {
            case 'all':
                return true;
            case 'true':
                return fieldValue === true;
            case 'false':
                return fieldValue === false || fieldValue === null || fieldValue === undefined;
            default:
                return true;
        }
    }
}
