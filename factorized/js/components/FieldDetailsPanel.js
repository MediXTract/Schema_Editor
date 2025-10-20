/**
 * FieldDetailsPanel - Component for displaying and editing field details
 * DEBUG VERSION: Includes console logs to diagnose opening issues
 */
import { FormBuilder } from '../ui/FormBuilder.js';
import { getGroupColor } from '../utils/colorUtils.js';
import { formatGroupName } from '../utils/formatters.js';
import { autoResizeTextarea, debounce } from '../utils/domUtils.js';
import { validateJSON } from '../utils/validators.js';
import { EVENTS, FIELD_TYPES } from '../../config/constants.js';

export class FieldDetailsPanel {
    constructor(stateManager, eventBus, schemaService, performanceService, patientClassificationPanel) {
        console.log('🔧 FieldDetailsPanel constructor called');
        console.log('  - stateManager:', !!stateManager);
        console.log('  - eventBus:', !!eventBus);
        console.log('  - schemaService:', !!schemaService);
        console.log('  - performanceService:', !!performanceService);
        console.log('  - patientClassificationPanel:', !!patientClassificationPanel);
        
        this.stateManager = stateManager;
        this.eventBus = eventBus;
        this.schemaService = schemaService;
        this.performanceService = performanceService;
        this.patientClassificationPanel = patientClassificationPanel;
        this.formBuilder = new FormBuilder();
        
        this.panel = document.getElementById('fieldDetailsPanel');
        this.content = document.getElementById('fieldDetailsContent');
        
        console.log('  - panel element:', !!this.panel);
        console.log('  - content element:', !!this.content);
        
        if (!this.panel) {
            console.error('❌ ERROR: fieldDetailsPanel element not found in DOM!');
        }
        if (!this.content) {
            console.error('❌ ERROR: fieldDetailsContent element not found in DOM!');
        }
        
        this.init();
        console.log('✅ FieldDetailsPanel initialized successfully');
    }

    /**
     * Initialize panel
     */
    init() {
        console.log('🔧 FieldDetailsPanel.init() called');
        this.setupEventListeners();
        this.subscribeToEvents();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        console.log('🔧 Setting up event listeners');
        const closeBtn = document.getElementById('closePanelBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
            console.log('  ✅ Close button listener added');
        } else {
            console.warn('  ⚠️  Close button not found');
        }
    }

    /**
     * Subscribe to events
     */
    subscribeToEvents() {
        console.log('🔧 Subscribing to events');
        
        this.eventBus.on(EVENTS.FIELD_SELECTED, ({ fieldId }) => {
            console.log('📡 FIELD_SELECTED event received:', fieldId);
            if (fieldId) {
                this.show(fieldId);
            } else {
                console.warn('  ⚠️  fieldId is null/undefined');
            }
        });

        // Listen for classification updates to refresh panel
        this.eventBus.on(EVENTS.CLASSIFICATION_UPDATED, ({ fieldId }) => {
            console.log('📡 CLASSIFICATION_UPDATED event received:', fieldId);
            const state = this.stateManager.getState();
            if (state.selectedField === fieldId) {
                this.refreshPatientSection(fieldId);
            }
        });
        
        console.log('  ✅ Event subscriptions complete');
    }

    /**
     * Show panel for a field
     * @param {string} fieldId - Field ID
     */
    show(fieldId) {
        console.log('🎯 FieldDetailsPanel.show() called with fieldId:', fieldId);
        
        if (!this.panel) {
            console.error('❌ ERROR: panel element is null! Cannot show panel.');
            return;
        }
        
        const state = this.stateManager.getState();
        console.log('  - Current state:', state);
        
        if (!state.currentSchema) {
            console.error('❌ ERROR: currentSchema is null!');
            return;
        }
        
        if (!state.currentSchema.properties) {
            console.error('❌ ERROR: currentSchema.properties is null!');
            return;
        }
        
        const fieldDef = state.currentSchema.properties[fieldId];
        console.log('  - Field definition:', fieldDef);
        
        if (!fieldDef) {
            console.error(`❌ ERROR: Field definition not found for fieldId: ${fieldId}`);
            return;
        }

        try {
            // Update header
            console.log('  - Updating header...');
            this.updateHeader(fieldId, fieldDef);
            
            // Render form
            console.log('  - Rendering form...');
            this.renderForm(fieldId, fieldDef);
            
            // Show panel
            console.log('  - Showing panel...');
            this.panel.classList.add('open');
            this.panel.style.display = 'flex';
            
            console.log('✅ Panel should now be visible');
            console.log('  - panel.classList:', this.panel.classList.toString());
            console.log('  - panel.style.display:', this.panel.style.display);
        } catch (error) {
            console.error('❌ ERROR in show():', error);
            console.error('Stack trace:', error.stack);
        }
    }

    /**
     * Close panel
     */
    close() {
        console.log('🚪 FieldDetailsPanel.close() called');
        if (this.panel) {
            this.panel.classList.remove('open');
            console.log('  ✅ Panel closed');
        }
        this.stateManager.setSelectedField(null);
    }

    /**
     * Update panel header
     * @param {string} fieldId - Field ID
     * @param {Object} fieldDef - Field definition
     */
    updateHeader(fieldId, fieldDef) {
        const fieldNameEl = document.getElementById('selectedFieldName');
        const fieldTypeEl = document.getElementById('selectedFieldType');
        
        if (fieldNameEl) {
            fieldNameEl.textContent = fieldId;
        }
        
        if (fieldTypeEl) {
            const fieldGroup = fieldDef.group_id || 'ungrouped';
            const groupColor = getGroupColor(fieldGroup);
            
            fieldTypeEl.textContent = formatGroupName(fieldGroup);
            fieldTypeEl.style.backgroundColor = groupColor.bg;
            fieldTypeEl.style.color = groupColor.text;
            fieldTypeEl.style.borderColor = groupColor.border;
        }
    }

    /**
     * Render form
     * @param {string} fieldId - Field ID
     * @param {Object} fieldDef - Field definition
     */
    renderForm(fieldId, fieldDef) {
        console.log('  📝 renderForm() called');
        
        if (!this.content) {
            console.error('    ❌ ERROR: content element is null!');
            return;
        }
        
        this.content.innerHTML = '';

        try {
            // 1. Metadata Section
            console.log('    - Creating metadata section...');
            const metadataSection = this.createMetadataSection(fieldDef);
            this.content.appendChild(metadataSection);

            // 2. Basic Properties Section
            console.log('    - Creating basic properties section...');
            const basicSection = this.createBasicPropertiesSection(fieldDef);
            this.content.appendChild(basicSection);

            // 3. Enum Values Section (if applicable)
            if (this.schemaService.hasEnumValues(fieldDef)) {
                console.log('    - Creating enum section...');
                const enumSection = this.createEnumSection(fieldDef);
                this.content.appendChild(enumSection);
            }

            // 4. Patient Classification Section
            console.log('    - Creating patient classification section...');
            const patientSection = this.createPatientClassificationSection(fieldId, fieldDef);
            this.content.appendChild(patientSection);

            // 5. Schema Structure Section
            console.log('    - Creating schema section...');
            const schemaSection = this.createSchemaSection(fieldId, fieldDef);
            this.content.appendChild(schemaSection);
            
            console.log('    ✅ All sections created successfully');
        } catch (error) {
            console.error('    ❌ ERROR in renderForm():', error);
            console.error('    Stack trace:', error.stack);
        }
    }

    /**
     * Create metadata section
     * @param {Object} fieldDef - Field definition
     * @returns {HTMLElement} Section element
     */
    createMetadataSection(fieldDef) {
        const debouncedUpdate = debounce((e) => this.handlePropertyChange(e), 300);

        const descriptionTextarea = this.formBuilder.createTextarea({
            value: fieldDef.description || '',
            property: 'description',
            placeholder: 'Field description...',
            onChange: debouncedUpdate
        });

        const commentsTextarea = this.formBuilder.createTextarea({
            value: fieldDef.comments || '',
            property: 'comments',
            placeholder: 'Comments or notes...',
            onChange: debouncedUpdate
        });

        const notesTextarea = this.formBuilder.createTextarea({
            value: fieldDef.notes || '',
            property: 'notes',
            placeholder: 'General notes about this variable\'s performance across all patients...',
            onChange: debouncedUpdate
        });

        const checkboxes = this.formBuilder.createCheckboxGroup([
            { checked: fieldDef.changes || false, property: 'changes', label: 'Changes' },
            { checked: fieldDef.errors || false, property: 'errors', label: 'Errors' },
            { checked: fieldDef.improvements || false, property: 'improvements', label: 'Improvements' }
        ]);

        checkboxes.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', (e) => this.handlePropertyChange(e));
        });

        const grid = document.createElement('div');
        grid.className = 'form-grid';
        
        grid.appendChild(this.formBuilder.createFormField({
            label: 'Description',
            input: descriptionTextarea,
            fullWidth: true
        }));
        
        grid.appendChild(this.formBuilder.createFormField({
            label: 'Comments',
            input: commentsTextarea,
            fullWidth: true
        }));

        grid.appendChild(this.formBuilder.createFormField({
            label: 'General Notes (Variable-Level)',
            input: notesTextarea,
            fullWidth: true
        }));

        const section = this.formBuilder.createFormSection({
            title: 'Metadata',
            collapsible: false,
            content: grid
        });

        section.appendChild(checkboxes);

        return section;
    }

    /**
     * Create basic properties section
     * @param {Object} fieldDef - Field definition
     * @returns {HTMLElement} Section element
     */
    createBasicPropertiesSection(fieldDef) {
        const state = this.stateManager.getState();
        
        const typeOptions = FIELD_TYPES.map(t => ({ value: t, label: t }));
        const typeSelect = this.formBuilder.createSelect({
            options: typeOptions,
            value: this.schemaService.extractTypeValue(fieldDef),
            property: 'type',
            onChange: (e) => this.handlePropertyChange(e)
        });

        const formatInput = this.formBuilder.createInput({
            value: this.schemaService.extractFormatValue(fieldDef),
            property: 'format',
            placeholder: 'e.g., date, email',
            onChange: (e) => this.handlePropertyChange(e)
        });

        const defaultInput = this.formBuilder.createInput({
            value: this.schemaService.extractDefaultValue(fieldDef),
            property: 'default',
            placeholder: 'Default value',
            onChange: (e) => this.handlePropertyChange(e)
        });

        const groupOptions = [
            ...Array.from(state.groupOptions).sort().map(g => ({ value: g, label: formatGroupName(g) })),
            { value: '__new__', label: '+ Create New Group' }
        ];
        
        const groupSelect = this.formBuilder.createSelect({
            options: groupOptions,
            value: fieldDef.group_id || 'ungrouped',
            property: 'group_id',
            onChange: (e) => this.handleGroupChange(e)
        });

        const grid = this.formBuilder.createFormGrid([
            { label: 'Type', input: typeSelect },
            { label: 'Format', input: formatInput },
            { label: 'Default Value', input: defaultInput },
            { label: 'Group', input: groupSelect }
        ]);

        return this.formBuilder.createFormSection({
            title: 'Basic Properties',
            collapsible: false,
            content: grid
        });
    }

    /**
     * Create enum section
     * @param {Object} fieldDef - Field definition
     * @returns {HTMLElement} Section element
     */
    createEnumSection(fieldDef) {
        const enumValues = this.schemaService.extractEnumValues(fieldDef);
        
        const enumList = document.createElement('div');
        enumList.className = 'enum-list';

        enumValues.forEach(value => {
            enumList.appendChild(this.createEnumItem(value));
        });

        const addButton = document.createElement('button');
        addButton.className = 'enum-add';
        addButton.textContent = '+ Add Option';
        addButton.type = 'button';
        addButton.onclick = () => {
            enumList.appendChild(this.createEnumItem(''));
            this.updateEnumValues();
        };

        const container = document.createElement('div');
        container.appendChild(enumList);
        container.appendChild(addButton);

        return this.formBuilder.createFormSection({
            title: 'Enum Options',
            collapsible: true,
            collapsed: false,
            content: container
        });
    }

    /**
     * Create enum item
     * @param {string} value - Enum value
     * @returns {HTMLElement} Enum item element
     */
    createEnumItem(value) {
        const div = document.createElement('div');
        div.className = 'enum-item';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.placeholder = 'Enum value';
        input.className = 'enum-input';

        const button = document.createElement('button');
        button.className = 'enum-remove';
        button.textContent = '×';
        button.type = 'button';
        button.onclick = () => {
            div.remove();
            this.updateEnumValues();
        };

        div.appendChild(input);
        div.appendChild(button);

        input.addEventListener('change', () => this.updateEnumValues());

        return div;
    }

    /**
     * Update enum values in schema
     */
    updateEnumValues() {
        const state = this.stateManager.getState();
        const selectedField = state.selectedField;
        if (!selectedField) return;

        const enumItems = this.content.querySelectorAll('.enum-item input');
        const values = Array.from(enumItems)
            .map(input => input.value.trim())
            .filter(value => value !== '');

        const fieldDef = state.currentSchema.properties[selectedField];

        if (fieldDef.anyOf && Array.isArray(fieldDef.anyOf)) {
            const typeWithEnum = fieldDef.anyOf.find(t => t.type && t.type !== 'null');
            if (typeWithEnum) {
                if (values.length > 0) typeWithEnum.enum = values;
                else delete typeWithEnum.enum;
            }
        } else {
            if (values.length > 0) fieldDef.enum = values;
            else delete fieldDef.enum;
        }

        this.stateManager.updateSchema(state.currentSchema);
        this.refreshFieldData(selectedField);
    }

    /**
     * Create patient classification section
     * @param {string} fieldId - Field ID
     * @param {Object} fieldDef - Field definition
     * @returns {HTMLElement} Section element
     */
    createPatientClassificationSection(fieldId, fieldDef) {
        console.log('      🏥 Creating patient classification section');
        
        const container = document.createElement('div');
        container.className = 'patient-classification-wrapper';
        container.id = 'patientClassificationWrapper';

        try {
            if (this.patientClassificationPanel) {
                console.log('      - Rendering patient classification panel...');
                this.patientClassificationPanel.render(fieldId, container);
                console.log('      ✅ Patient classification panel rendered');
            } else {
                console.error('      ❌ ERROR: patientClassificationPanel is null!');
                container.innerHTML = '<p style="color: red; padding: 1rem;">Error: Patient classification panel not available</p>';
            }
        } catch (error) {
            console.error('      ❌ ERROR rendering patient classification:', error);
            container.innerHTML = '<p style="color: red; padding: 1rem;">Error rendering patient classification: ' + error.message + '</p>';
        }

        return this.formBuilder.createFormSection({
            title: 'Patient Classifications',
            collapsible: true,
            collapsed: true,
            content: container
        });
    }

    /**
     * Refresh patient classification section
     * @param {string} fieldId - Field ID
     */
    refreshPatientSection(fieldId) {
        console.log('🔄 Refreshing patient section for field:', fieldId);
        const wrapper = document.getElementById('patientClassificationWrapper');
        if (wrapper) {
            wrapper.innerHTML = '';
            this.patientClassificationPanel.render(fieldId, wrapper);
            console.log('  ✅ Patient section refreshed');
        } else {
            console.warn('  ⚠️  Patient classification wrapper not found');
        }
    }

    /**
     * Create schema structure section
     * @param {string} fieldId - Field ID
     * @param {Object} fieldDef - Field definition
     * @returns {HTMLElement} Section element
     */
    createSchemaSection(fieldId, fieldDef) {
        const container = document.createElement('div');
        container.className = 'schema-editor-container';

        const fieldWithName = { [fieldId]: fieldDef };

        const textarea = document.createElement('textarea');
        textarea.className = 'schema-json-editor';
        textarea.value = JSON.stringify(fieldWithName, null, 2);

        const validationMsg = document.createElement('div');
        validationMsg.className = 'schema-validation-message';
        validationMsg.style.display = 'none';

        textarea.addEventListener('input', () => {
            autoResizeTextarea(textarea, 120, 400);
            this.validateSchemaJson(textarea, validationMsg);
        });

        textarea.addEventListener('change', () => {
            this.handleSchemaJsonChange(textarea, validationMsg);
        });

        setTimeout(() => autoResizeTextarea(textarea, 120, 400), 0);

        container.appendChild(textarea);
        container.appendChild(validationMsg);

        return this.formBuilder.createFormSection({
            title: 'Schema Structure (JSON)',
            collapsible: true,
            collapsed: true,
            content: container
        });
    }

    /**
     * Validate schema JSON
     * @param {HTMLTextAreaElement} textarea - Textarea element
     * @param {HTMLElement} validationMsg - Validation message element
     * @returns {boolean} True if valid
     */
    validateSchemaJson(textarea, validationMsg) {
        const result = validateJSON(textarea.value);

        if (result.valid) {
            validationMsg.style.display = 'none';
            textarea.classList.remove('error');
            return true;
        } else {
            validationMsg.textContent = `JSON Error: ${result.error}`;
            validationMsg.style.display = 'block';
            textarea.classList.add('error');
            return false;
        }
    }

    /**
     * Handle schema JSON change
     * @param {HTMLTextAreaElement} textarea - Textarea element
     * @param {HTMLElement} validationMsg - Validation message element
     */
    handleSchemaJsonChange(textarea, validationMsg) {
        const state = this.stateManager.getState();
        const selectedField = state.selectedField;
        if (!selectedField) return;

        if (!this.validateSchemaJson(textarea, validationMsg)) return;

        try {
            const parsed = JSON.parse(textarea.value);
            const newFieldDefinition = parsed[selectedField] || parsed;

            state.currentSchema.properties[selectedField] = newFieldDefinition;
            this.stateManager.updateSchema(state.currentSchema);

            this.refreshFieldData(selectedField);

        } catch (error) {
            console.error('Error updating schema structure:', error);
        }
    }

    /**
     * Handle property change
     * @param {Event} event - Change event
     */
    handlePropertyChange(event) {
        const state = this.stateManager.getState();
        const selectedField = state.selectedField;
        if (!selectedField) return;

        const property = event.target.dataset.property;
        let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value.trim();

        this.schemaService.updateFieldProperty(state.currentSchema, selectedField, property, value);
        this.stateManager.updateSchema(state.currentSchema);

        if (event.target.tagName === 'TEXTAREA') {
            autoResizeTextarea(event.target);
        }

        this.refreshFieldData(selectedField);
    }

    /**
     * Handle group change
     * @param {Event} event - Change event
     */
    handleGroupChange(event) {
        const state = this.stateManager.getState();
        const selectedField = state.selectedField;
        if (!selectedField) return;

        let value = event.target.value;

        if (value === '__new__') {
            const newGroup = prompt('Enter new group name:');
            if (newGroup && newGroup.trim()) {
                value = newGroup.trim();
                
                state.groupOptions.add(value);
                
                const groupOptions = [
                    ...Array.from(state.groupOptions).sort().map(g => ({ value: g, label: formatGroupName(g) })),
                    { value: '__new__', label: '+ Create New Group' }
                ];
                
                event.target.innerHTML = '';
                groupOptions.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.label;
                    option.selected = opt.value === value;
                    event.target.appendChild(option);
                });
            } else {
                event.target.value = state.currentSchema.properties[selectedField].group_id || 'ungrouped';
                return;
            }
        }

        this.schemaService.updateFieldProperty(state.currentSchema, selectedField, 'group_id', value);
        this.stateManager.updateSchema(state.currentSchema);

        this.refreshFieldData(selectedField);
    }

    /**
     * Refresh field data after update
     * @param {string} fieldId - Field ID
     */
    refreshFieldData(fieldId) {
        const state = this.stateManager.getState();
        const def = state.currentSchema.properties[fieldId];

        const fieldIndex = state.allFields.findIndex(f => f.id === fieldId);
        if (fieldIndex !== -1) {
            state.allFields[fieldIndex] = {
                id: fieldId,
                definition: def,
                type: this.schemaService.getFieldType(def),
                group: def.group_id || 'ungrouped',
                description: def.description || '',
                comments: def.comments || '',
                notes: def.notes || '',
                hasComments: Boolean(def.comments && def.comments.trim()),
                hasNotes: Boolean(def.notes && def.notes.trim()),
                hasErrors: Boolean(def.errors),
                hasChanges: Boolean(def.changes),
                hasImprovements: Boolean(def.improvements),
                patientCount: def.performance ? Object.keys(def.performance).length : 0,
                hasPerformanceData: Boolean(def.performance && Object.keys(def.performance).length > 0)
            };
        }

        this.updateHeader(fieldId, def);

        this.eventBus.emit(EVENTS.FIELD_UPDATED, { fieldId });

        const filterService = this.stateManager.getState().filterService;
        if (filterService) {
            this.eventBus.emit(EVENTS.FILTERS_CHANGED);
        }
    }
}