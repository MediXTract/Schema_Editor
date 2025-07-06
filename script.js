class SchemaEditor {
    constructor() {
        this.currentSchema = null;
        this.currentVersion = 0;
        this.allSchemas = new Map();
        this.selectedField = null;
        this.directoryHandle = null;
        
        // Efficient filtering state
        this.allFields = [];
        this.filteredFields = [];
        this.filters = {
            search: '',
            types: [],
            groups: [],
            hasComments: false,
            hasErrors: false,
            hasChanges: false
        };
        
        // Metadata caches for performance
        this.typeOptions = new Set();
        this.groupOptions = new Set();
        
        // Custom dropdown state
        this.dropdowns = {
            type: { isOpen: false, selected: [] },
            group: { isOpen: false, selected: [] }
        };
        
        this.initializeEventListeners();
        this.checkBrowserSupport();
        this.showEmptyState();
    }

    ensureFilterArrays() {
        if (!this.filters.types || !Array.isArray(this.filters.types)) {
            this.filters.types = [];
        }
        if (!this.filters.groups || !Array.isArray(this.filters.groups)) {
            this.filters.groups = [];
        }
    }

    checkBrowserSupport() {
        const hasFileSystemAccess = 'showDirectoryPicker' in window;
        
        if (hasFileSystemAccess) {
            document.getElementById('browserLimitationInfo').style.display = 'none';
            document.getElementById('fallbackControls').style.display = 'none';
        } else {
            document.getElementById('browserLimitationInfo').style.display = 'block';
            document.getElementById('fallbackControls').style.display = 'flex';
        }
    }

    initializeEventListeners() {
        // File operations
        document.getElementById('scanFolderBtn').addEventListener('click', this.handleFolderScan.bind(this));
        document.getElementById('fileInput').addEventListener('change', this.handleFileLoad.bind(this));
        document.getElementById('saveBtn').addEventListener('click', this.saveChanges.bind(this));
        document.getElementById('downloadFilteredBtn').addEventListener('click', this.downloadFilteredFields.bind(this));
        
        // Filtering
        document.getElementById('searchInput').addEventListener('input', this.handleSearchInput.bind(this));
        
        // Custom dropdown event listeners
        this.initializeCustomDropdowns();
        
        document.getElementById('commentsFilter').addEventListener('click', this.handleToggleFilter.bind(this, 'hasComments'));
        document.getElementById('errorsFilter').addEventListener('click', this.handleToggleFilter.bind(this, 'hasErrors'));
        document.getElementById('changesFilter').addEventListener('click', this.handleToggleFilter.bind(this, 'hasChanges'));
        document.getElementById('clearFilters').addEventListener('click', this.clearAllFilters.bind(this));
        
        // Panel management
        document.getElementById('closePanelBtn').addEventListener('click', this.closeFieldDetails.bind(this));
        
        // Handle escape key to close panel and dropdowns
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeFieldDetails();
                this.closeAllDropdowns();
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-dropdown')) {
                this.closeAllDropdowns();
            }
        });
    }

    initializeCustomDropdowns() {
        // Type filter dropdown
        const typeDropdown = document.getElementById('typeFilter');
        const typeTrigger = typeDropdown.querySelector('.dropdown-trigger');
        typeTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown('type');
        });

        // Group filter dropdown
        const groupDropdown = document.getElementById('groupFilter');
        const groupTrigger = groupDropdown.querySelector('.dropdown-trigger');
        groupTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown('group');
        });
    }

    toggleDropdown(dropdownType) {
        // Close other dropdowns
        Object.keys(this.dropdowns).forEach(key => {
            if (key !== dropdownType) {
                this.closeDropdown(key);
            }
        });

        // Toggle the clicked dropdown
        if (this.dropdowns[dropdownType].isOpen) {
            this.closeDropdown(dropdownType);
        } else {
            this.openDropdown(dropdownType);
        }
    }

    openDropdown(dropdownType) {
        const dropdown = document.getElementById(`${dropdownType}Filter`);
        dropdown.classList.add('open');
        this.dropdowns[dropdownType].isOpen = true;
    }

    closeDropdown(dropdownType) {
        const dropdown = document.getElementById(`${dropdownType}Filter`);
        dropdown.classList.remove('open');
        this.dropdowns[dropdownType].isOpen = false;
    }

    closeAllDropdowns() {
        Object.keys(this.dropdowns).forEach(key => {
            this.closeDropdown(key);
        });
    }

    handleDropdownOptionClick(dropdownType, value, event) {
        event.stopPropagation();
        
        const selected = this.dropdowns[dropdownType].selected;
        const index = selected.indexOf(value);
        
        if (index === -1) {
            // Add to selection
            selected.push(value);
        } else {
            // Remove from selection
            selected.splice(index, 1);
        }
        
        // Update filters
        this.filters[dropdownType === 'type' ? 'types' : 'groups'] = [...selected];
        
        // Update dropdown display
        this.updateDropdownDisplay(dropdownType);
        this.updateDropdownOptions(dropdownType);
        
        // Apply filters
        this.applyFilters();
    }

    updateDropdownDisplay(dropdownType) {
        const dropdown = document.getElementById(`${dropdownType}Filter`);
        const label = dropdown.querySelector('.dropdown-label');
        const selected = this.dropdowns[dropdownType].selected;
        
        if (selected.length === 0) {
            label.innerHTML = dropdownType === 'type' ? 'All Types' : 'All Groups';
        } else if (selected.length === 1) {
            const displayValue = dropdownType === 'group' ? 
                this.formatGroupName(selected[0]) : selected[0];
            label.innerHTML = displayValue;
        } else if (selected.length <= 2) {
            const displayValues = selected.map(val => 
                dropdownType === 'group' ? this.formatGroupName(val) : val
            ).join(', ');
            label.innerHTML = displayValues;
        } else {
            label.innerHTML = `<div class="dropdown-selected-tags">
                <span class="dropdown-tag">${selected.length} selected</span>
            </div>`;
        }
    }

    updateDropdownOptions(dropdownType) {
        const dropdown = document.getElementById(`${dropdownType}Filter`);
        const content = dropdown.querySelector('.dropdown-content');
        const selected = this.dropdowns[dropdownType].selected;
        
        // Update option states
        content.querySelectorAll('.dropdown-option').forEach(option => {
            const value = option.dataset.value;
            const isSelected = selected.includes(value);
            option.classList.toggle('selected', isSelected);
        });
    }

    showEmptyState() {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('schemaEditor').style.display = 'none';
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('saveBtn').disabled = true;
        document.getElementById('downloadFilteredBtn').style.display = 'none';
    }

    showLoading(message = 'Loading...') {
        document.getElementById('loadingText').textContent = message;
        document.getElementById('loadingIndicator').style.display = 'flex';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('schemaEditor').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'none';
    }

    showError(message) {
        const errorEl = document.getElementById('errorMessage');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        document.getElementById('loadingIndicator').style.display = 'none';
    }

    async handleFolderScan() {
        if (!('showDirectoryPicker' in window)) {
            this.showError('Your browser does not support folder scanning. Please select files manually.');
            return;
        }

        try {
            this.showLoading('Selecting folder...');
            
            this.directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            this.showLoading('Scanning for schema files...');
            await this.scanDirectoryForSchemas();
            
        } catch (error) {
            if (error.name === 'AbortError') {
                this.showEmptyState();
                return;
            }
            this.showError(`Error scanning folder: ${error.message}`);
        }
    }

    async scanDirectoryForSchemas() {
        try {
            this.allSchemas.clear();
            let foundSchemaFiles = 0;
            
            for await (const [name, handle] of this.directoryHandle.entries()) {
                if (handle.kind === 'file' && name.endsWith('.json')) {
                    // Only consider files that match the exact pattern: schema_vNNN.json
                    const versionMatch = name.match(/^schema_v(\d+)\.json$/);
                    if (versionMatch) {
                        try {
                            const file = await handle.getFile();
                            const content = await file.text();
                            const data = JSON.parse(content);
                            
                            // Validate that it's a proper schema
                            if (data.type === 'object' && data.properties) {
                                const version = parseInt(versionMatch[1]);
                                this.allSchemas.set(version, { data, filename: name });
                                foundSchemaFiles++;
                            }
                        } catch (error) {
                            console.warn(`Skipping invalid schema file: ${name}`, error);
                        }
                    }
                }
            }

            if (foundSchemaFiles === 0) {
                this.showError('No valid schema files found. Looking for files named schema_vNNN.json (where NNN is a number).');
                return;
            }

            this.loadLatestSchema();
            
        } catch (error) {
            this.showError(`Error processing folder: ${error.message}`);
        }
    }

    async handleFileLoad(event) {
        this.showLoading('Processing files...');
        
        try {
            const files = Array.from(event.target.files);
            this.allSchemas.clear();
            let foundSchemaFiles = 0;
            
            for (const file of files) {
                if (file.name.endsWith('.json')) {
                    // Only consider files that match the exact pattern: schema_vNNN.json
                    const versionMatch = file.name.match(/^schema_v(\d+)\.json$/);
                    if (versionMatch) {
                        try {
                            const content = await this.readFileContent(file);
                            const data = JSON.parse(content);
                            
                            // Validate that it's a proper schema
                            if (data.type === 'object' && data.properties) {
                                const version = parseInt(versionMatch[1]);
                                this.allSchemas.set(version, { data, filename: file.name });
                                foundSchemaFiles++;
                            }
                        } catch (error) {
                            console.warn(`Skipping invalid schema file: ${file.name}`, error);
                        }
                    }
                }
            }

            if (foundSchemaFiles === 0) {
                this.showError('No valid schema files found. Looking for files named schema_vNNN.json (where NNN is a number).');
                return;
            }

            this.loadLatestSchema();
            
        } catch (error) {
            this.showError(`Error loading files: ${error.message}`);
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    loadLatestSchema() {
        // Find latest version
        this.currentVersion = Math.max(...this.allSchemas.keys());
        const schemaInfo = this.allSchemas.get(this.currentVersion);
        this.currentSchema = schemaInfo.data;
        
        // Update UI
        this.updateVersionDisplay(schemaInfo.filename);
        this.processSchema();
        this.populateFilterOptions();
        this.showSchemaEditor();
    }

    updateVersionDisplay(filename) {
        document.getElementById('currentVersion').textContent = `Loaded: ${filename}`;
    }

    processSchema() {
        if (!this.currentSchema || !this.currentSchema.properties) {
            throw new Error('Invalid schema format');
        }

        // Convert schema to efficient field array
        this.allFields = Object.entries(this.currentSchema.properties).map(([id, def]) => ({
            id,
            definition: def,
            type: this.getFieldType(def),
            group: def.group_id || 'ungrouped',
            description: def.description || '',
            hasComments: Boolean(def.comments && def.comments.trim()),
            hasErrors: Boolean(def.errors),
            hasChanges: Boolean(def.changes)
        }));

        // Extract metadata for filters
        this.typeOptions.clear();
        this.groupOptions.clear();
        
        this.allFields.forEach(field => {
            this.typeOptions.add(field.type);
            this.groupOptions.add(field.group);
        });

        // Apply filters
        this.applyFilters();
    }

    populateFilterOptions() {
        this.populateCustomDropdown('type', Array.from(this.typeOptions).sort());
        this.populateCustomDropdown('group', Array.from(this.groupOptions).sort());
    }

    populateCustomDropdown(dropdownType, options) {
        const dropdown = document.getElementById(`${dropdownType}Filter`);
        const content = dropdown.querySelector('.dropdown-content');
        
        content.innerHTML = '';
        
        options.forEach(option => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'dropdown-option';
            optionDiv.dataset.value = option;
            
            const displayValue = dropdownType === 'group' ? this.formatGroupName(option) : option;
            
            optionDiv.innerHTML = `
                <div class="dropdown-option-checkbox"></div>
                <span>${displayValue}</span>
            `;
            
            optionDiv.addEventListener('click', (e) => {
                this.handleDropdownOptionClick(dropdownType, option, e);
            });
            
            content.appendChild(optionDiv);
        });
    }

    showSchemaEditor() {
        document.getElementById('schemaEditor').style.display = 'flex';
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('saveBtn').disabled = false;
        document.getElementById('downloadFilteredBtn').style.display = 'inline-flex';
        
        this.renderFieldsTable();
        this.updateFieldStats();
    }

    // Efficient filtering
    handleSearchInput(event) {
        this.filters.search = event.target.value.toLowerCase().trim();
        this.applyFilters();
    }

    handleToggleFilter(filterName, event) {
        this.filters[filterName] = !this.filters[filterName];
        event.target.classList.toggle('active', this.filters[filterName]);
        this.applyFilters();
    }

    clearAllFilters() {
        this.filters = {
            search: '',
            types: [],
            groups: [],
            hasComments: false,
            hasErrors: false,
            hasChanges: false
        };

        // Reset dropdown states
        this.dropdowns.type.selected = [];
        this.dropdowns.group.selected = [];
        
        // Reset UI
        document.getElementById('searchInput').value = '';
        this.updateDropdownDisplay('type');
        this.updateDropdownDisplay('group');
        this.updateDropdownOptions('type');
        this.updateDropdownOptions('group');
        
        document.getElementById('commentsFilter').classList.remove('active');
        document.getElementById('errorsFilter').classList.remove('active');
        document.getElementById('changesFilter').classList.remove('active');

        this.applyFilters();
    }

    applyFilters() {
        // Ensure filter arrays are properly initialized
        this.ensureFilterArrays();
        
        this.filteredFields = this.allFields.filter(field => {
            // Search filter
            if (this.filters.search) {
                const searchMatch = 
                    field.id.toLowerCase().includes(this.filters.search) ||
                    field.description.toLowerCase().includes(this.filters.search) ||
                    field.group.toLowerCase().includes(this.filters.search);
                if (!searchMatch) return false;
            }

            // Type filter - check if field type is in selected types array
            if (this.filters.types.length > 0 && !this.filters.types.includes(field.type)) return false;

            // Group filter - check if field group is in selected groups array
            if (this.filters.groups.length > 0 && !this.filters.groups.includes(field.group)) return false;

            // Metadata filters
            if (this.filters.hasComments && !field.hasComments) return false;
            if (this.filters.hasErrors && !field.hasErrors) return false;
            if (this.filters.hasChanges && !field.hasChanges) return false;

            return true;
        });

        this.renderFieldsTable();
        this.updateResultsCount();
    }

    renderFieldsTable() {
        const tbody = document.getElementById('fieldsTableBody');
        tbody.innerHTML = '';

        this.filteredFields.forEach(field => {
            const row = this.createFieldRow(field);
            tbody.appendChild(row);
        });
    }

    createFieldRow(field) {
        const row = document.createElement('div');
        row.className = 'field-row';
        row.dataset.fieldId = field.id;
        row.addEventListener('click', () => this.selectField(field.id));

        const typeColor = this.getTypeColor(field.type);
        const groupColor = this.getGroupColor(field.group);

        row.innerHTML = `
            <div class="field-name">${field.id}</div>
            <div class="field-type" style="background-color: ${typeColor.bg}; color: ${typeColor.text}; border-color: ${typeColor.border};">${field.type}</div>
            <div class="field-group" style="background-color: ${groupColor.bg}; color: ${groupColor.text}; border-color: ${groupColor.border};">${this.formatGroupName(field.group)}</div>
            <div class="field-description">${field.description}</div>
            <div class="field-indicators">
                ${field.hasComments ? '<span class="indicator comments" title="Has comments"></span>' : ''}
                ${field.hasErrors ? '<span class="indicator errors" title="Has errors"></span>' : ''}
                ${field.hasChanges ? '<span class="indicator changes" title="Has changes"></span>' : ''}
            </div>
        `;

        return row;
    }

    updateFieldStats() {
        document.getElementById('fieldStats').textContent = `${this.allFields.length} fields`;
    }

    updateResultsCount() {
        const count = this.filteredFields.length;
        const total = this.allFields.length;
        const text = count === total ? `${total} fields` : `${count} of ${total} fields`;
        document.getElementById('resultsCount').textContent = text;
    }

    selectField(fieldId) {
        // Update visual selection
        document.querySelectorAll('.field-row').forEach(row => {
            row.classList.toggle('selected', row.dataset.fieldId === fieldId);
        });

        this.selectedField = fieldId;
        this.showFieldDetails(fieldId);
    }

    showFieldDetails(fieldId) {
        const fieldDef = this.currentSchema.properties[fieldId];
        const panel = document.getElementById('fieldDetailsPanel');
        const fieldType = this.getFieldType(fieldDef);
        const typeColor = this.getTypeColor(fieldType);
        
        document.getElementById('selectedFieldName').textContent = fieldId;
        
        const fieldTypeBadge = document.getElementById('selectedFieldType');
        fieldTypeBadge.textContent = fieldType;
        fieldTypeBadge.style.backgroundColor = typeColor.bg;
        fieldTypeBadge.style.color = typeColor.text;
        fieldTypeBadge.style.borderColor = typeColor.border;
        
        this.renderFieldDetailsForm(fieldDef);
        
        panel.classList.add('open');
        panel.style.display = 'flex';
    }

    closeFieldDetails() {
        const panel = document.getElementById('fieldDetailsPanel');
        panel.classList.remove('open');
        
        // Clear selection
        document.querySelectorAll('.field-row').forEach(row => {
            row.classList.remove('selected');
        });
        
        this.selectedField = null;
    }

    renderFieldDetailsForm(fieldDef) {
        const content = document.getElementById('fieldDetailsContent');
        content.innerHTML = '';

        // Basic Properties
        const basicSection = this.createFormSection('Basic Properties');
        basicSection.innerHTML += `
            <div class="form-grid">
                <div class="form-field">
                    <label>Type</label>
                    <select data-property="type">
                        ${this.generateTypeOptions(this.extractTypeValue(fieldDef))}
                    </select>
                </div>
                <div class="form-field">
                    <label>Format</label>
                    <input type="text" value="${this.extractFormatValue(fieldDef)}" data-property="format">
                </div>
                <div class="form-field">
                    <label>Default Value</label>
                    <input type="text" value="${this.extractDefaultValue(fieldDef)}" data-property="default">
                </div>
                <div class="form-field">
                    <label>Group</label>
                    <select data-property="group_id">
                        ${this.generateGroupOptions(fieldDef.group_id)}
                    </select>
                </div>
            </div>
        `;
        content.appendChild(basicSection);

        // Metadata
        const metadataSection = this.createFormSection('Metadata');
        metadataSection.innerHTML += `
            <div class="form-grid">
                <div class="form-field full-width">
                    <label>Description</label>
                    <textarea data-property="description">${fieldDef.description || ''}</textarea>
                </div>
                <div class="form-field full-width">
                    <label>Comments</label>
                    <textarea data-property="comments">${fieldDef.comments || ''}</textarea>
                </div>
            </div>
            <div class="checkbox-group">
                <div class="checkbox-item">
                    <input type="checkbox" ${fieldDef.changes ? 'checked' : ''} data-property="changes">
                    <label>Has Changes</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" ${fieldDef.errors ? 'checked' : ''} data-property="errors">
                    <label>Has Errors</label>
                </div>
            </div>
        `;
        content.appendChild(metadataSection);

        // Enum Values (if applicable)
        if (this.hasEnumValues(fieldDef)) {
            const enumSection = this.createFormSection('Enum Options');
            enumSection.appendChild(this.createEnumEditor(fieldDef));
            content.appendChild(enumSection);
        }

        // Add event listeners to form elements
        this.attachFormEventListeners(content);
    }

    createFormSection(title) {
        const section = document.createElement('div');
        section.className = 'form-section';
        section.innerHTML = `<h4>${title}</h4>`;
        return section;
    }

    generateGroupOptions(currentGroup) {
        let options = '';
        Array.from(this.groupOptions).sort().forEach(group => {
            const selected = group === currentGroup ? 'selected' : '';
            options += `<option value="${group}" ${selected}>${this.formatGroupName(group)}</option>`;
        });
        options += '<option value="__new__">+ Create New Group</option>';
        return options;
    }

    generateTypeOptions(currentType) {
        const types = ['string', 'number', 'integer', 'boolean', 'array', 'object'];
        let options = '';
        
        types.forEach(type => {
            const selected = type === currentType ? 'selected' : '';
            options += `<option value="${type}" ${selected}>${type}</option>`;
        });
        
        return options;
    }

    attachFormEventListeners(container) {
        // Input and textarea changes
        container.querySelectorAll('input, textarea, select').forEach(element => {
            element.addEventListener('change', this.handleFieldPropertyChange.bind(this));
        });
    }

    handleFieldPropertyChange(event) {
        if (!this.selectedField) return;

        const property = event.target.dataset.property;
        let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value.trim();

        // Handle special cases
        if (property === 'group_id' && value === '__new__') {
            const newGroup = prompt('Enter new group name:');
            if (newGroup && newGroup.trim()) {
                value = newGroup.trim();
                this.groupOptions.add(value);
                this.populateFilterOptions();
                // Update the select element
                event.target.innerHTML = this.generateGroupOptions(value);
                event.target.value = value;
            } else {
                event.target.value = this.currentSchema.properties[this.selectedField].group_id || '';
                return;
            }
        }

        // Update schema
        this.updateFieldProperty(this.selectedField, property, value);
        
        // Refresh field data and re-render if needed
        this.refreshFieldData(this.selectedField);
        this.renderFieldsTable();
        this.updateResultsCount();
    }

    updateFieldProperty(fieldId, property, value) {
        const fieldDef = this.currentSchema.properties[fieldId];
        
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
    }

    refreshFieldData(fieldId) {
        const fieldIndex = this.allFields.findIndex(f => f.id === fieldId);
        if (fieldIndex !== -1) {
            const def = this.currentSchema.properties[fieldId];
            this.allFields[fieldIndex] = {
                id: fieldId,
                definition: def,
                type: this.getFieldType(def),
                group: def.group_id || 'ungrouped',
                description: def.description || '',
                hasComments: Boolean(def.comments && def.comments.trim()),
                hasErrors: Boolean(def.errors),
                hasChanges: Boolean(def.changes)
            };
        }
    }

    createEnumEditor(fieldDef) {
        const container = document.createElement('div');
        
        // Extract enum values
        let enumValues = [];
        if (fieldDef.enum && Array.isArray(fieldDef.enum)) {
            enumValues = fieldDef.enum;
        } else if (fieldDef.anyOf && Array.isArray(fieldDef.anyOf)) {
            const enumType = fieldDef.anyOf.find(t => t.enum && Array.isArray(t.enum));
            if (enumType) enumValues = enumType.enum;
        }

        const enumList = document.createElement('div');
        enumList.className = 'enum-list';

        enumValues.forEach(value => {
            enumList.appendChild(this.createEnumItem(value));
        });

        const addButton = document.createElement('button');
        addButton.className = 'enum-add';
        addButton.textContent = '+ Add Option';
        addButton.onclick = () => {
            enumList.appendChild(this.createEnumItem(''));
            this.updateEnumValues();
        };

        container.appendChild(enumList);
        container.appendChild(addButton);

        return container;
    }

    createEnumItem(value) {
        const div = document.createElement('div');
        div.className = 'enum-item';
        
        div.innerHTML = `
            <input type="text" value="${value}" placeholder="Enum value">
            <button class="enum-remove" onclick="this.parentElement.remove(); this.updateEnumValues();">×</button>
        `;

        div.querySelector('input').addEventListener('change', this.updateEnumValues.bind(this));
        
        return div;
    }

    updateEnumValues() {
        if (!this.selectedField) return;

        const enumItems = document.querySelectorAll('.enum-item input');
        const values = Array.from(enumItems)
            .map(input => input.value.trim())
            .filter(value => value !== '');

        const fieldDef = this.currentSchema.properties[this.selectedField];

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
    }

    // Utility methods
    extractTypeValue(fieldDef) {
        if (fieldDef.type) return fieldDef.type;
        if (fieldDef.anyOf && Array.isArray(fieldDef.anyOf)) {
            const nonNullType = fieldDef.anyOf.find(t => t.type && t.type !== 'null');
            if (nonNullType) return nonNullType.type;
        }
        return '';
    }

    extractFormatValue(fieldDef) {
        if (fieldDef.format) return fieldDef.format;
        if (fieldDef.anyOf && Array.isArray(fieldDef.anyOf)) {
            const typeWithFormat = fieldDef.anyOf.find(t => t.format);
            if (typeWithFormat) return typeWithFormat.format;
        }
        return '';
    }

    extractDefaultValue(fieldDef) {
        if (fieldDef.default !== undefined && fieldDef.default !== null) {
            return typeof fieldDef.default === 'string' ? fieldDef.default : JSON.stringify(fieldDef.default);
        }
        return '';
    }

    getFieldType(fieldDef) {
        if (fieldDef.enum) return 'enum';
        if (fieldDef.anyOf) {
            const types = fieldDef.anyOf.map(t => t.type || 'unknown').filter(t => t !== 'null');
            return types.join('/');
        }
        return fieldDef.type || 'unknown';
    }

    hasEnumValues(fieldDef) {
        if (fieldDef.enum && Array.isArray(fieldDef.enum)) return true;
        if (fieldDef.anyOf && Array.isArray(fieldDef.anyOf)) {
            return fieldDef.anyOf.some(t => t.enum && Array.isArray(t.enum));
        }
        return false;
    }

    getTypeColor(type) {
        const typeColors = {
            'string': { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
            'number': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
            'integer': { bg: '#e0e7ff', text: '#4338ca', border: '#6366f1' },
            'boolean': { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
            'array': { bg: '#fce7f3', text: '#be185d', border: '#ec4899' },
            'object': { bg: '#f3e8ff', text: '#7c3aed', border: '#a855f7' },
            'enum': { bg: '#fed7d7', text: '#c53030', border: '#e53e3e' },
            'unknown': { bg: '#f7fafc', text: '#4a5568', border: '#a0aec0' }
        };
        
        return typeColors[type] || typeColors['unknown'];
    }

    getGroupColor(group) {
        // Generate consistent colors for groups using hash-based approach
        const groupColors = [
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

        // Simple hash function to assign consistent colors
        let hash = 0;
        for (let i = 0; i < group.length; i++) {
            hash = ((hash << 5) - hash + group.charCodeAt(i)) & 0x7fffffff;
        }
        
        return groupColors[hash % groupColors.length];
    }

    formatGroupName(groupId) {
        if (groupId === 'ungrouped') return 'Ungrouped';
        return groupId.replace(/group_/, 'Group ').replace(/_/g, ' ');
    }

    async saveChanges() {
        try {
            const newVersion = this.currentVersion + 1;
            const filename = `schema_v${newVersion}.json`;
            
            if (this.directoryHandle) {
                try {
                    const fileHandle = await this.directoryHandle.getFileHandle(filename, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(JSON.stringify(this.currentSchema, null, 2));
                    await writable.close();
                    
                    this.showSaveSuccess('Saved to folder!');
                } catch (error) {
                    this.downloadFile(filename);
                }
            } else {
                this.downloadFile(filename);
            }
            
            this.currentVersion = newVersion;
            this.allSchemas.set(newVersion, { data: this.currentSchema, filename });
            this.updateVersionDisplay(filename);
            
        } catch (error) {
            this.showError(`Error saving: ${error.message}`);
        }
    }

    downloadFile(filename) {
        const blob = new Blob([JSON.stringify(this.currentSchema, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSaveSuccess('Downloaded!');
    }

    async downloadFilteredFields() {
        // Create filtered schema containing only visible fields
        const filteredSchema = {
            type: "object",
            properties: {},
            required: [],
            additionalProperties: true
        };

        // Add only filtered fields to the new schema, removing specified keys
        this.filteredFields.forEach(field => {
            const cleanFieldDef = this.cleanFieldDefinition(field.definition);
            filteredSchema.properties[field.id] = cleanFieldDef;
        });

        // Generate filename based on active filters
        const filename = this.generateFilteredFilename();
        
        // Try to save to the same folder first, fall back to download
        if (this.directoryHandle) {
            try {
                const fileHandle = await this.directoryHandle.getFileHandle(filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(JSON.stringify(filteredSchema, null, 2));
                await writable.close();
                
                this.showDownloadSuccess(`Saved to folder: ${filename}`);
                return;
            } catch (error) {
                console.warn('Could not save to folder, falling back to download:', error);
            }
        }
        
        // Fallback to regular download
        this.downloadJsonFile(filteredSchema, filename);
        this.showDownloadSuccess(`Downloaded: ${filename}`);
    }

    cleanFieldDefinition(fieldDef) {
        // Create a copy and remove the specified keys
        const cleaned = JSON.parse(JSON.stringify(fieldDef));
        delete cleaned.group_id;
        delete cleaned.changes;
        delete cleaned.errors;
        delete cleaned.comments;
        return cleaned;
    }

    generateFilteredFilename() {
        // Ensure filter arrays are properly initialized
        this.ensureFilterArrays();
        
        const parts = ['schema'];
        
        // Add filter parts to filename
        if (this.filters.types.length > 0) {
            this.filters.types.forEach(type => {
                parts.push(`Type${type.charAt(0).toUpperCase() + type.slice(1)}`);
            });
        }
        
        if (this.filters.groups.length > 0) {
            this.filters.groups.forEach(group => {
                const groupName = group.replace('group_', 'Group').replace('_', '');
                parts.push(groupName);
            });
        }
        
        // Add metadata filters
        if (this.filters.hasComments) parts.push('CommentsTrue');
        if (this.filters.hasErrors) parts.push('ErrorsTrue'); 
        if (this.filters.hasChanges) parts.push('ChangesTrue');
        
        // Add "All" for unfiltered metadata
        if (!this.filters.hasComments && !this.filters.hasErrors && !this.filters.hasChanges) {
            parts.push('CommentsAll', 'ErrorsAll', 'ChangesAll');
        } else {
            if (!this.filters.hasComments) parts.push('CommentsAll');
            if (!this.filters.hasErrors) parts.push('ErrorsAll');
            if (!this.filters.hasChanges) parts.push('ChangesAll');
        }
        
        // If no filters applied, use "noFilters"
        if (this.filters.types.length === 0 && 
            this.filters.groups.length === 0 && 
            !this.filters.hasComments && 
            !this.filters.hasErrors && 
            !this.filters.hasChanges &&
            !this.filters.search) {
            parts.splice(1); // Remove all filter parts
            parts.push('noFilters');
        }
        
        // Add version (increment from current version)
        const version = this.currentVersion + 1;
        parts.push(`v${version}`);
        
        return parts.join('_') + '.json';
    }

    downloadJsonFile(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showDownloadSuccess(message) {
        const downloadBtn = document.getElementById('downloadFilteredBtn');
        const originalHTML = downloadBtn.innerHTML;
        downloadBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
        </svg> Downloaded!`;
        downloadBtn.style.background = 'var(--success)';
        
        setTimeout(() => {
            downloadBtn.innerHTML = originalHTML;
            downloadBtn.style.background = '';
        }, 2000);
    }

    showSaveSuccess(message) {
        const saveBtn = document.getElementById('saveBtn');
        const originalHTML = saveBtn.innerHTML;
        saveBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
        </svg> ${message}`;
        saveBtn.style.background = 'var(--success)';
        
        setTimeout(() => {
            saveBtn.innerHTML = originalHTML;
            saveBtn.style.background = '';
        }, 2000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SchemaEditor();
});
