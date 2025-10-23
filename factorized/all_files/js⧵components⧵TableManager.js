/**
 * TableManager - Component for rendering and managing the fields table
 * FIXED: Properly passes fieldId in FIELD_SELECTED event
 */
import { getTypeColor, getGroupColor } from '../utils/colorUtils.js';
import { formatGroupName } from '../utils/formatters.js';
import { EVENTS } from '../../config/constants.js';

export class TableManager {
    constructor(stateManager, eventBus, schemaService) {
        this.stateManager = stateManager;
        this.eventBus = eventBus;
        this.schemaService = schemaService;
        
        this.tableBody = document.getElementById('fieldsTableBody');
        this.tableHeader = document.querySelector('.table-header');
        
        console.log('🔧 TableManager initialized');
        console.log('  - tableBody:', !!this.tableBody);
        console.log('  - tableHeader:', !!this.tableHeader);
    }

    /**
     * Render entire table
     */
    renderTable() {
        console.log('📊 TableManager.renderTable() called');
        
        if (!this.tableBody) {
            console.error('❌ ERROR: tableBody element not found!');
            return;
        }

        const state = this.stateManager.getState();
        const { filteredFields } = state;

        console.log('  - Rendering', filteredFields.length, 'fields');

        this.tableBody.innerHTML = '';

        filteredFields.forEach(field => {
            const row = this.createFieldRow(field);
            this.tableBody.appendChild(row);
        });
        
        console.log('  ✅ Table rendered successfully');
    }

    /**
     * Create a single field row
     * @param {Object} field - Field object
     * @returns {HTMLElement} Row element
     */
    createFieldRow(field) {
        const row = document.createElement('div');
        row.className = 'field-row';
        row.dataset.fieldId = field.id;
        
        // FIX: Properly pass fieldId in event data object
        row.addEventListener('click', () => {
            console.log('🖱️  Field row clicked:', field.id);
            console.log('  - Calling stateManager.setSelectedField()');
            
            // The StateManager.setSelectedField will emit FIELD_SELECTED event
            // with proper event data: { fieldId }
            this.stateManager.setSelectedField(field.id);
            
            console.log('  - setSelectedField() called with:', field.id);
        });

        const typeColor = getTypeColor(field.type);
        const groupColor = getGroupColor(field.group);

        const state = this.stateManager.getState();
        const { settings } = state;

        // Create column content
        const columns = {
            name: `<div class="field-name">${field.id}</div>`,
            type: `<div class="field-type" style="background-color: ${typeColor.bg}; color: ${typeColor.text}; border-color: ${typeColor.border};">${field.type}</div>`,
            group: `<div class="field-group" style="background-color: ${groupColor.bg}; color: ${groupColor.text}; border-color: ${groupColor.border};">${formatGroupName(field.group)}</div>`,
            description: `<div class="field-description">${field.description}</div>`,
            comments: `<div class="field-comments">${field.comments}</div>`,
            indicators: `<div class="field-indicators">
                ${field.hasComments ? '<span class="indicator comments" title="Has comments"></span>' : ''}
                ${field.hasErrors ? '<span class="indicator errors" title="Has errors"></span>' : ''}
                ${field.hasChanges ? '<span class="indicator changes" title="Has changes"></span>' : ''}
                ${field.hasImprovements ? '<span class="indicator improvements" title="Has improvements"></span>' : ''}
            </div>`
        };

        // Filter to only visible columns
        const visibleColumns = settings.columnOrder.filter(col => settings.columnVisibility[col]);
        
        // Build row HTML
        row.innerHTML = visibleColumns.map(columnId => columns[columnId]).join('');

        // Apply grid template
        const gridTemplate = visibleColumns.map(col => {
            const width = settings.columnWidths[col];
            return col === 'indicators' ? `${width}px` : `${width}fr`;
        }).join(' ');
        row.style.gridTemplateColumns = gridTemplate;

        return row;
    }

    /**
     * Update a single row
     * @param {string} fieldId - Field ID
     */
    updateRow(fieldId) {
        const state = this.stateManager.getState();
        const field = state.allFields.find(f => f.id === fieldId);
        if (!field) return;

        const existingRow = this.tableBody.querySelector(`[data-field-id="${fieldId}"]`);
        if (!existingRow) return;

        const newRow = this.createFieldRow(field);

        // Preserve selection state
        if (existingRow.classList.contains('selected')) {
            newRow.classList.add('selected');
        }

        existingRow.parentNode.replaceChild(newRow, existingRow);
    }

    /**
     * Select a field row
     * @param {string} fieldId - Field ID
     */
    selectField(fieldId) {
        console.log('🎯 TableManager.selectField() called with:', fieldId);
        
        if (!this.tableBody) {
            console.error('❌ ERROR: tableBody is null');
            return;
        }
        
        // Update visual selection
        this.tableBody.querySelectorAll('.field-row').forEach(row => {
            const isSelected = row.dataset.fieldId === fieldId;
            row.classList.toggle('selected', isSelected);
            
            if (isSelected) {
                console.log('  ✅ Row selected:', row.dataset.fieldId);
            }
        });
    }

    /**
     * Apply column order from settings
     */
    applyColumnOrder() {
        const state = this.stateManager.getState();
        const { settings } = state;

        if (!settings) return;

        // Filter to only visible columns
        const visibleColumns = settings.columnOrder.filter(col => settings.columnVisibility[col]);

        // Build grid template
        const gridTemplate = visibleColumns.map(col => {
            const width = settings.columnWidths[col];
            return col === 'indicators' ? `${width}px` : `${width}fr`;
        }).join(' ');

        // Apply to header
        if (this.tableHeader) {
            this.tableHeader.style.gridTemplateColumns = gridTemplate;
        }

        // Apply to all rows
        if (this.tableBody) {
            this.tableBody.querySelectorAll('.field-row').forEach(row => {
                row.style.gridTemplateColumns = gridTemplate;
            });
        }

        // Reorder header columns
        this.reorderHeaderColumns();
    }

    /**
     * Reorder header columns based on settings
     */
    reorderHeaderColumns() {
        if (!this.tableHeader) return;

        const state = this.stateManager.getState();
        const { settings } = state;

        const columnHeaders = {
            name: 'Field Name',
            type: 'Type',
            group: 'Group',
            description: 'Description',
            comments: 'Comments',
            indicators: 'Status'
        };

        this.tableHeader.innerHTML = '';

        // Filter to only visible columns
        const visibleColumns = settings.columnOrder.filter(col => settings.columnVisibility[col]);
        
        visibleColumns.forEach(columnId => {
            const div = document.createElement('div');
            div.className = `th field-${columnId}`;
            div.textContent = columnHeaders[columnId];
            this.tableHeader.appendChild(div);
        });
    }

    /**
     * Refresh entire table (re-render)
     */
    refreshTable() {
        console.log('🔄 TableManager.refreshTable() called');
        this.renderTable();
    }
}