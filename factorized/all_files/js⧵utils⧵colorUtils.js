/**
 * Color utility functions for type and group badges
 */

/**
 * Get color configuration for a field type
 * @param {string} type - Field type
 * @returns {Object} Color object with bg, text, and border properties
 */
export function getTypeColor(type) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    const lightColors = {
        'string': { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
        'number': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
        'integer': { bg: '#e0e7ff', text: '#4338ca', border: '#6366f1' },
        'boolean': { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
        'array': { bg: '#fce7f3', text: '#be185d', border: '#ec4899' },
        'object': { bg: '#f3e8ff', text: '#7c3aed', border: '#a855f7' },
        'enum': { bg: '#fed7d7', text: '#c53030', border: '#e53e3e' },
        'unknown': { bg: '#f7fafc', text: '#4a5568', border: '#a0aec0' }
    };
    
    const darkColors = {
        'string': { bg: '#451a03', text: '#fbbf24', border: '#f59e0b' },
        'number': { bg: '#1e3a8a', text: '#60a5fa', border: '#3b82f6' },
        'integer': { bg: '#312e81', text: '#a78bfa', border: '#6366f1' },
        'boolean': { bg: '#14532d', text: '#4ade80', border: '#22c55e' },
        'array': { bg: '#831843', text: '#f472b6', border: '#ec4899' },
        'object': { bg: '#581c87', text: '#c084fc', border: '#a855f7' },
        'enum': { bg: '#7f1d1d', text: '#f87171', border: '#e53e3e' },
        'unknown': { bg: '#374151', text: '#9ca3af', border: '#6b7280' }
    };
    
    const colors = isDark ? darkColors : lightColors;
    return colors[type] || colors['unknown'];
}

/**
 * Get color configuration for a group using hash-based selection
 * @param {string} group - Group name
 * @returns {Object} Color object with bg, text, and border properties
 */
export function getGroupColor(group) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    const lightColors = [
        { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' }, // Blue
        { bg: '#dcfce7', text: '#166534', border: '#22c55e' }, // Green
        { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' }, // Yellow
        { bg: '#fce7f3', text: '#be185d', border: '#ec4899' }, // Pink
        { bg: '#f3e8ff', text: '#7c3aed', border: '#a855f7' }, // Purple
        { bg: '#fed7d7', text: '#c53030', border: '#e53e3e' }, // Red
        { bg: '#e0f2fe', text: '#0c4a6e', border: '#0891b2' }, // Cyan
        { bg: '#ecfdf5', text: '#064e3b', border: '#059669' }, // Emerald
        { bg: '#fdf4ff', text: '#86198f', border: '#d946ef' }, // Fuchsia
        { bg: '#fff7ed', text: '#9a3412', border: '#ea580c' }  // Orange
    ];
    
    const darkColors = [
        { bg: '#1e3a8a', text: '#60a5fa', border: '#3b82f6' }, // Blue
        { bg: '#14532d', text: '#4ade80', border: '#22c55e' }, // Green
        { bg: '#451a03', text: '#fbbf24', border: '#f59e0b' }, // Yellow
        { bg: '#831843', text: '#f472b6', border: '#ec4899' }, // Pink
        { bg: '#581c87', text: '#c084fc', border: '#a855f7' }, // Purple
        { bg: '#7f1d1d', text: '#f87171', border: '#e53e3e' }, // Red
        { bg: '#0c4a6e', text: '#0891b2', border: '#0891b2' }, // Cyan
        { bg: '#064e3b', text: '#10b981', border: '#059669' }, // Emerald
        { bg: '#86198f', text: '#d946ef', border: '#d946ef' }, // Fuchsia
        { bg: '#9a3412', text: '#fb923c', border: '#ea580c' }  // Orange
    ];

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < group.length; i++) {
        hash = ((hash << 5) - hash + group.charCodeAt(i)) & 0x7fffffff;
    }
    
    const colors = isDark ? darkColors : lightColors;
    return colors[hash % colors.length];
}
