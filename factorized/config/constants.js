/**
 * Configuration Constants
 */

export const FIELD_TYPES = ['string', 'number', 'integer', 'boolean', 'array', 'object'];

export const THEMES = ['light', 'dark', 'joan'];

export const DEFAULT_SETTINGS = {
    theme: 'light',
    columnOrder: ['name', 'description', 'comments', 'group', 'type', 'indicators'],
    columnVisibility: {
        name: true,
        type: true,
        group: true,
        description: true,
        comments: true,
        indicators: true
    },
    columnWidths: {
        name: 2,
        type: 1,
        group: 1,
        description: 3,
        comments: 2,
        indicators: 120
    }
};

export const FILTER_STATES = {
    ALL: 'all',
    TRUE: 'true',
    FALSE: 'false'
};

export const COLUMN_LABELS = {
    name: 'Field Name',
    type: 'Type',
    group: 'Group',
    description: 'Description',
    comments: 'Comments',
    indicators: 'Status'
};

export const EVENTS = {
    SCHEMA_LOADED: 'schema:loaded',
    SCHEMA_UPDATED: 'schema:updated',
    FIELD_SELECTED: 'field:selected',
    FIELD_UPDATED: 'field:updated',
    FILTERS_CHANGED: 'filters:changed',
    SETTINGS_CHANGED: 'settings:changed',
    THEME_CHANGED: 'theme:changed',
    PATIENT_ADDED: 'patient:added',
    PATIENT_UPDATED: 'patient:updated',
    PATIENT_DELETED: 'patient:deleted',
    CLASSIFICATION_UPDATED: 'classification:updated'
};

export const STORAGE_KEYS = {
    SETTINGS: 'schemaEditorSettings'
};

// ========== NEW: PATIENT CLASSIFICATION CONSTANTS ==========

/**
 * Classification categories for patient performance tracking
 */
export const CLASSIFICATION_CATEGORIES = {
    // Status categories (mutually exclusive group)
    STATUS: {
        PENDING: 'pending',
        MATCH: 'match',
        NOT_APPLICABLE: 'not_applicable'
    },
    
    // Improvement categories (multiple allowed)
    IMPROVEMENTS: {
        FILLED_BLANK: 'filled_blank',
        CORRECTION: 'correction',
        STANDARDIZED: 'standardized',
        IMPROVED_COMMENT: 'improved_comment'
    },
    
    // Issue/Troubled categories (multiple allowed)
    ISSUES: {
        MISSING_DOCS: 'missing_docs',
        MISSING_DOCS_SUSPECTED: 'missing_docs_suspected',
        CONTRADICTIONS: 'contradictions',
        QUESTIONED: 'questioned'
    },
    
    // Resolved categories (multiple allowed)
    RESOLVED: {
        WAS_PERSONAL_DATA: 'was_personal_data',
        WAS_MISSING_DOCS: 'was_missing_docs',
        WAS_QUESTIONED: 'was_questioned'
    }
};

/**
 * Human-readable labels for classification categories
 */
export const CLASSIFICATION_LABELS = {
    // Status
    pending: 'Pending Analysis',
    match: 'Perfect Match',
    not_applicable: 'Not Applicable',
    
    // Improvements
    filled_blank: 'Filled Blank (Tool Found, Human Missed)',
    correction: 'Correction (Tool Correct, Human Wrong)',
    standardized: 'Standardized Format Applied',
    improved_comment: 'Improved Comment/Detail',
    
    // Issues
    missing_docs: 'Missing Documentation (Confirmed)',
    missing_docs_suspected: 'Missing Documentation (Suspected)',
    contradictions: 'Contradictory Information',
    questioned: 'Needs Expert Clarification',
    
    // Resolved
    was_personal_data: 'Was Personal Data (Resolved)',
    was_missing_docs: 'Was Missing Docs (Resolved)',
    was_questioned: 'Was Questioned (Resolved)'
};

/**
 * Short labels for compact display
 */
export const CLASSIFICATION_SHORT_LABELS = {
    pending: 'Pending',
    match: 'Match',
    not_applicable: 'N/A',
    filled_blank: 'Filled Blank',
    correction: 'Correction',
    standardized: 'Standardized',
    improved_comment: 'Improved',
    missing_docs: 'Missing Docs',
    missing_docs_suspected: 'Missing Docs?',
    contradictions: 'Contradictions',
    questioned: 'Questioned',
    was_personal_data: 'Fixed: Personal',
    was_missing_docs: 'Fixed: Missing',
    was_questioned: 'Fixed: Questioned'
};

/**
 * Category groupings for UI organization
 */
export const CLASSIFICATION_GROUPS = {
    status: ['pending', 'match', 'not_applicable'],
    improvements: ['filled_blank', 'correction', 'standardized', 'improved_comment'],
    issues: ['missing_docs', 'missing_docs_suspected', 'contradictions', 'questioned'],
    resolved: ['was_personal_data', 'was_missing_docs', 'was_questioned']
};

/**
 * Group labels for UI sections
 */
export const CLASSIFICATION_GROUP_LABELS = {
    status: 'Status (Select One)',
    improvements: 'Improvements (Multiple Allowed)',
    issues: 'Issues/Troubled (Multiple Allowed)',
    resolved: 'Resolved (Multiple Allowed)'
};

/**
 * Severity rating configuration
 */
export const SEVERITY = {
    MIN: 1,
    MAX: 10,
    DEFAULT: 5,
    LABELS: {
        1: 'Minor',
        3: 'Low',
        5: 'Medium',
        7: 'High',
        10: 'Critical'
    }
};

/**
 * Patient ID validation pattern
 */
export const PATIENT_ID_PATTERN = /^patient_\d{3}$/;

/**
 * Patient ID format helper
 */
export const PATIENT_ID_FORMAT = 'patient_XXX (e.g., patient_001)';

/**
 * Colors for classification categories
 */
export const CLASSIFICATION_COLORS = {
    // Status
    pending: { light: '#FEF3C7', dark: '#78350F' },
    match: { light: '#D1FAE5', dark: '#065F46' },
    not_applicable: { light: '#E5E7EB', dark: '#374151' },
    
    // Improvements
    filled_blank: { light: '#DBEAFE', dark: '#1E40AF' },
    correction: { light: '#E0E7FF', dark: '#4338CA' },
    standardized: { light: '#DDD6FE', dark: '#5B21B6' },
    improved_comment: { light: '#FBCFE8', dark: '#9F1239' },
    
    // Issues
    missing_docs: { light: '#FEE2E2', dark: '#991B1B' },
    missing_docs_suspected: { light: '#FED7AA', dark: '#9A3412' },
    contradictions: { light: '#FECACA', dark: '#7F1D1D' },
    questioned: { light: '#FEF08A', dark: '#713F12' },
    
    // Resolved
    was_personal_data: { light: '#D1FAE5', dark: '#065F46' },
    was_missing_docs: { light: '#BBF7D0', dark: '#14532D' },
    was_questioned: { light: '#A7F3D0', dark: '#064E3B' }
};

/**
 * Validation rules for classifications
 */
export const CLASSIFICATION_RULES = {
    // Contradictory combinations (cannot be selected together)
    CONTRADICTIONS: [
        ['match', 'correction'],
        ['match', 'filled_blank'],
        ['not_applicable', 'match'],
        ['not_applicable', 'correction'],
        ['not_applicable', 'filled_blank']
    ],
    
    // Required combinations (if A is selected, B should be considered)
    SUGGESTIONS: [
        {
            if: 'missing_docs',
            suggest: 'missing_docs_suspected',
            message: 'Consider marking as suspected if not confirmed'
        },
        {
            if: 'was_missing_docs',
            suggest: 'missing_docs',
            message: 'Was this originally marked as missing docs?'
        }
    ]
};

/**
 * Default patient performance data structure
 */
export const DEFAULT_PATIENT_PERFORMANCE = {
    severity: null,
    comment: '',
    last_updated: null
};
