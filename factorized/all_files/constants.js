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
    THEME_CHANGED: 'theme:changed'
};

export const STORAGE_KEYS = {
    SETTINGS: 'schemaEditorSettings'
};
