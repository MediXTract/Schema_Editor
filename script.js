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
            comments: 'all',     // 'all', 'true', 'false'
            errors: 'all',       // 'all', 'true', 'false'
            changes: 'all',      // 'all', 'true', 'false'
            improvements: 'all'  // 'all', 'true', 'false'
        };
        
        // Metadata caches for performance
        this.typeOptions = new Set();
        this.groupOptions = new Set();
        
        // Custom dropdown state
        this.dropdowns = {
            type: { isOpen: false, selected: [] },
            group: { isOpen: false, selected: [] }
        };
        
        // Settings state with defaults
        this.settings = {
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
        
        this.initializeEventListeners();
        this.checkBrowserSupport();
        this.loadSettings();
        this.initializeTheme();
        this.initializeFilterButtons();
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
        
        document.getElementById('commentsFilter').addEventListener('click', this.handleThreeStateFilter.bind(this, 'comments'));
        document.getElementById('errorsFilter').addEventListener('click', this.handleThreeStateFilter.bind(this, 'errors'));
        document.getElementById('changesFilter').addEventListener('click', this.handleThreeStateFilter.bind(this, 'changes'));
        document.getElementById('improvementsFilter').addEventListener('click', this.handleThreeStateFilter.bind(this, 'improvements'));
        document.getElementById('clearFilters').addEventListener('click', this.clearAllFilters.bind(this));
        
        // Panel management
        document.getElementById('closePanelBtn').addEventListener('click', this.closeFieldDetails.bind(this));
        
        // Settings
        document.getElementById('settingsBtn').addEventListener('click', this.openSettings.bind(this));
        document.getElementById('closeSettingsBtn').addEventListener('click', this.cancelSettings.bind(this));
        document.getElementById('cancelSettingsBtn').addEventListener('click', this.cancelSettings.bind(this));
        document.getElementById('saveSettingsBtn').addEventListener('click', this.saveSettings.bind(this));
        document.getElementById('lightThemeBtn').addEventListener('click', () => this.selectTheme('light'));
        document.getElementById('darkThemeBtn').addEventListener('click', () => this.selectTheme('dark'));
        document.getElementById('joanThemeBtn').addEventListener('click', () => this.selectTheme('joan'));
        
        // Handle escape key to close panel and dropdowns
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeFieldDetails();
                this.closeAllDropdowns();
                
                // Only cancel settings if modal is open
                const modal = document.getElementById('settingsModal');
                if (modal.style.display === 'flex') {
                    this.cancelSettings();
                }
            }
        });

        // Close field details panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('fieldDetailsPanel');
            const isFieldDetailsOpen = panel.style.display === 'flex';
            
            if (isFieldDetailsOpen) {
                // Check if click is outside the panel
                const isClickOutsidePanel = !panel.contains(e.target);
                
                // Check if click is not on a table row
                const isClickOnTableRow = e.target.closest('.field-row');
                
                // Close panel if clicking outside and not on a table row
                if (isClickOutsidePanel && !isClickOnTableRow) {
                    this.closeFieldDetails();
                }
            }
            
            // Close dropdowns when clicking outside
            if (!e.target.closest('.custom-dropdown')) {
                this.closeAllDropdowns();
            }
            
            // Close settings modal when clicking overlay
            if (e.target.classList.contains('settings-overlay')) {
                this.cancelSettings();
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
            comments: def.comments || '',
            hasComments: Boolean(def.comments && def.comments.trim()),
            hasErrors: Boolean(def.errors),
            hasChanges: Boolean(def.changes),
            hasImprovements: Boolean(def.improvements)
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
        
        // Apply saved column order
        this.applyColumnOrder();
        this.renderFieldsTable();
        this.updateFieldStats();
    }

    // Efficient filtering
    handleSearchInput(event) {
        this.filters.search = event.target.value.toLowerCase().trim();
        this.applyFilters();
    }

    // Three-state filtering for boolean properties
    handleThreeStateFilter(filterName, event) {
        // Use currentTarget to get the button element, not the child that was clicked
        const button = event.currentTarget;
        
        const currentState = this.filters[filterName];
        let newState;
        
        // Cycle through: all -> true -> false -> all
        switch (currentState) {
            case 'all':
                newState = 'true';
                break;
            case 'true':
                newState = 'false';
                break;
            case 'false':
                newState = 'all';
                break;
            default:
                newState = 'all';
        }
        
        this.filters[filterName] = newState;
        this.updateFilterButtonState(button, filterName, newState);
        this.applyFilters();
    }

    updateFilterButtonState(button, filterName, state) {
        if (!button) {
            console.warn(`Button not found for filter: ${filterName}`);
            return;
        }
        
        button.setAttribute('data-state', state);
        
        const label = button.querySelector('.filter-label');
        if (!label) {
            console.warn(`Label not found in button for filter: ${filterName}`);
            return;
        }
        
        const capitalizedName = filterName.charAt(0).toUpperCase() + filterName.slice(1);
        
        switch (state) {
            case 'all':
                label.textContent = `${capitalizedName}: All`;
                break;
            case 'true':
                label.textContent = `${capitalizedName}: True`;
                break;
            case 'false':
                label.textContent = `${capitalizedName}: False`;
                break;
        }
    }

    initializeFilterButtons() {
        // Initialize all filter buttons to 'all' state
        const filterButtons = ['comments', 'errors', 'changes', 'improvements'];
        filterButtons.forEach(filterName => {
            const button = document.getElementById(`${filterName}Filter`);
            if (button) {
                this.updateFilterButtonState(button, filterName, 'all');
            }
        });
    }

    clearAllFilters() {
        this.filters = {
            search: '',
            types: [],
            groups: [],
            comments: 'all',
            errors: 'all',
            changes: 'all',
            improvements: 'all'
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
        
        // Reset filter buttons
        this.initializeFilterButtons();

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
                    field.comments.toLowerCase().includes(this.filters.search) ||
                    field.group.toLowerCase().includes(this.filters.search);
                if (!searchMatch) return false;
            }

            // Type filter - check if field type is in selected types array
            if (this.filters.types.length > 0 && !this.filters.types.includes(field.type)) return false;

            // Group filter - check if field group is in selected groups array
            if (this.filters.groups.length > 0 && !this.filters.groups.includes(field.group)) return false;

            // Three-state boolean filters
            if (!this.matchesThreeStateFilter(field.hasComments, this.filters.comments)) return false;
            if (!this.matchesThreeStateFilter(field.hasErrors, this.filters.errors)) return false;
            if (!this.matchesThreeStateFilter(field.hasChanges, this.filters.changes)) return false;
            if (!this.matchesThreeStateFilter(field.hasImprovements, this.filters.improvements)) return false;

            return true;
        });

        this.renderFieldsTable();
        this.updateResultsCount();
    }

    matchesThreeStateFilter(fieldValue, filterState) {
        switch (filterState) {
            case 'all':
                return true; // Show all regardless of value
            case 'true':
                return fieldValue === true; // Show only fields where property is true
            case 'false':
                return fieldValue === false || fieldValue === null || fieldValue === undefined; // Show only fields where property is false/null/undefined
            default:
                return true;
        }
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

        // Create column content based on settings order
        const columns = {
            name: `<div class="field-name">${field.id}</div>`,
            type: `<div class="field-type" style="background-color: ${typeColor.bg}; color: ${typeColor.text}; border-color: ${typeColor.border};">${field.type}</div>`,
            group: `<div class="field-group" style="background-color: ${groupColor.bg}; color: ${groupColor.text}; border-color: ${groupColor.border};">${this.formatGroupName(field.group)}</div>`,
            description: `<div class="field-description">${field.description}</div>`,
            comments: `<div class="field-comments">${field.comments}</div>`,
            indicators: `<div class="field-indicators">
                ${field.hasComments ? '<span class="indicator comments" title="Has comments"></span>' : ''}
                ${field.hasErrors ? '<span class="indicator errors" title="Has errors"></span>' : ''}
                ${field.hasChanges ? '<span class="indicator changes" title="Has changes"></span>' : ''}
                ${field.hasImprovements ? '<span class="indicator improvements" title="Has improvements"></span>' : ''}
            </div>`
        };

        // Filter to only visible columns based on settings
        const visibleColumns = this.settings.columnOrder.filter(col => this.settings.columnVisibility[col]);
        
        // Build row HTML based on visible columns only
        row.innerHTML = visibleColumns.map(columnId => columns[columnId]).join('');

        // Apply grid template for visible columns with custom widths
        const gridTemplate = visibleColumns.map(col => {
            const width = this.settings.columnWidths[col];
            return col === 'indicators' ? `${width}px` : `${width}fr`;
        }).join(' ');
        row.style.gridTemplateColumns = gridTemplate;

        return row;
    }

    updateFieldStats() {
        document.getElementById('fieldStats').textContent = `${this.allFields.length} fields`;
    }

    updateResultsCount() {
        const count = this.filteredFields.length;
        const total = this.allFields.length;
        const text = count === total ? `${total} fields` : `${count}/${total} fields`;
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
        const fieldGroup = fieldDef.group_id || 'ungrouped';
        const groupColor = this.getGroupColor(fieldGroup);
        
        document.getElementById('selectedFieldName').textContent = fieldId;
        
        const fieldGroupBadge = document.getElementById('selectedFieldType');
        fieldGroupBadge.textContent = this.formatGroupName(fieldGroup);
        fieldGroupBadge.style.backgroundColor = groupColor.bg;
        fieldGroupBadge.style.color = groupColor.text;
        fieldGroupBadge.style.borderColor = groupColor.border;
        
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

        // 1. Metadata Section (First)
        const metadataSection = this.createFormSection('Metadata');
        this.appendToFormSection(metadataSection, `
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
                    <label>Changes</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" ${fieldDef.errors ? 'checked' : ''} data-property="errors">
                    <label>Errors</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" ${fieldDef.improvements ? 'checked' : ''} data-property="improvements">
                    <label>Improvements</label>
                </div>
            </div>
        `);
        content.appendChild(metadataSection);

        // 2. Basic Properties Section (Second)
        const basicSection = this.createFormSection('Basic Properties');
        this.appendToFormSection(basicSection, `
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
        `);
        content.appendChild(basicSection);

        // 3. Enum Values (if applicable) - Collapsible
        if (this.hasEnumValues(fieldDef)) {
            const enumSection = this.createFormSection('Enum Options', true);
            this.appendToFormSection(enumSection, this.createEnumEditor(fieldDef));
            content.appendChild(enumSection);
        }

        // 4. Schema Structure Preview Section (Third/Last) - Collapsible
        const schemaSection = this.createFormSection('Schema Structure', true);
        this.appendToFormSection(schemaSection, this.createSchemaEditor(fieldDef));
        content.appendChild(schemaSection);

        // Add event listeners to form elements
        this.attachFormEventListeners(content);
        
        // Auto-resize any textareas with existing content (including schema editor)
        content.querySelectorAll('textarea').forEach(textarea => {
            setTimeout(() => this.autoResizeTextarea(textarea), 50);
        });
    }

    createFormSection(title, collapsible = false) {
        const section = document.createElement('div');
        section.className = `form-section${collapsible ? ' collapsible' : ''}`;
        
        if (collapsible) {
            const header = document.createElement('div');
            header.className = 'form-section-header';
            header.innerHTML = `
                <h4>${title}</h4>
                <svg class="collapse-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7,10L12,15L17,10H7Z"/>
                </svg>
            `;
            
            const content = document.createElement('div');
            content.className = 'form-section-content collapsed';
            
            header.addEventListener('click', () => {
                this.toggleFormSection(section);
            });
            
            section.appendChild(header);
            section.appendChild(content);
            
            return section;
        } else {
            section.innerHTML = `<h4>${title}</h4>`;
            return section;
        }
    }

    toggleFormSection(section) {
        const content = section.querySelector('.form-section-content');
        const icon = section.querySelector('.collapse-icon');
        const isCollapsed = content.classList.contains('collapsed');
        
        if (isCollapsed) {
            content.classList.remove('collapsed');
            icon.style.transform = 'rotate(180deg)';
            
            // Auto-resize any textareas in the newly expanded section
            setTimeout(() => {
                content.querySelectorAll('textarea').forEach(textarea => {
                    this.autoResizeTextarea(textarea);
                });
            }, 300); // Wait for expand animation to complete
        } else {
            content.classList.add('collapsed');
            icon.style.transform = 'rotate(0deg)';
        }
    }

    appendToFormSection(section, content) {
        if (section.classList.contains('collapsible')) {
            const sectionContent = section.querySelector('.form-section-content');
            if (typeof content === 'string') {
                sectionContent.innerHTML += content;
            } else {
                sectionContent.appendChild(content);
            }
        } else {
            if (typeof content === 'string') {
                section.innerHTML += content;
            } else {
                section.appendChild(content);
            }
        }
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
            // Skip schema editor textarea as it has its own handlers
            if (element.classList.contains('schema-json-editor')) {
                return;
            }
            
            element.addEventListener('change', this.handleFieldPropertyChange.bind(this));
            
            // Auto-resize textareas (but not schema editor)
            if (element.tagName === 'TEXTAREA') {
                let debounceTimer;
                
                // Resize on input (typing)
                element.addEventListener('input', () => {
                    this.autoResizeTextarea(element);
                    
                    // Real-time updates for description and comments (debounced)
                    if (element.dataset.property === 'description' || element.dataset.property === 'comments') {
                        clearTimeout(debounceTimer);
                        debounceTimer = setTimeout(() => {
                            // Create a synthetic event for the debounced update
                            const syntheticEvent = {
                                target: element,
                                type: 'input'
                            };
                            this.handleFieldPropertyChange(syntheticEvent);
                        }, 300); // 300ms debounce for real-time typing updates
                    }
                });
                
                // Resize on paste
                element.addEventListener('paste', () => {
                    // Delay to allow paste content to be processed
                    setTimeout(() => this.autoResizeTextarea(element), 0);
                });
                
                // Initial resize for existing content
                setTimeout(() => this.autoResizeTextarea(element), 0);
            }
            
            // Real-time updates for other form elements
            if (element.tagName === 'SELECT' || element.type === 'checkbox') {
                element.addEventListener('input', this.handleFieldPropertyChange.bind(this));
            }
        });
    }

    autoResizeTextarea(textarea) {
        // Skip if textarea is not visible (e.g., in a collapsed section)
        if (textarea.offsetHeight === 0) {
            return;
        }
        
        // Store the current scroll position to restore it later
        const scrollTop = textarea.scrollTop;
        
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        
        // Different max heights for different types of textareas
        const isSchemaEditor = textarea.classList.contains('schema-json-editor');
        const maxHeight = isSchemaEditor ? 400 : 300;
        const minHeight = isSchemaEditor ? 120 : 60;
        
        // Calculate the new height based on scrollHeight
        // Add a small buffer (2px) to prevent scrollbars from appearing
        const newHeight = Math.min(
            Math.max(textarea.scrollHeight + 2, minHeight),
            maxHeight
        );
        
        // Set the new height
        textarea.style.height = newHeight + 'px';
        
        // Show scrollbar only if content exceeds max height
        const scrollThreshold = maxHeight - 2; // buffer
        if (textarea.scrollHeight > scrollThreshold) {
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.overflowY = 'hidden';
        }
        
        // Restore scroll position
        textarea.scrollTop = scrollTop;
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
        
        // Auto-resize textarea if it's a textarea element
        if (event.target.tagName === 'TEXTAREA') {
            this.autoResizeTextarea(event.target);
        }
        
        // Immediately update the table row and panel header
        this.refreshFieldData(this.selectedField);
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
                comments: def.comments || '',
                hasComments: Boolean(def.comments && def.comments.trim()),
                hasErrors: Boolean(def.errors),
                hasChanges: Boolean(def.changes),
                hasImprovements: Boolean(def.improvements)
            };
        }
        
        // Update the specific row in the table instead of re-rendering everything
        this.updateTableRow(fieldId);
        
        // Update panel header if this is the currently selected field
        if (this.selectedField === fieldId) {
            this.updatePanelHeader(fieldId);
        }
        
        // Update filter results and counts if field no longer matches current filters
        this.applyFilters();
    }

    updateTableRow(fieldId) {
        const field = this.allFields.find(f => f.id === fieldId);
        if (!field) return;
        
        const existingRow = document.querySelector(`[data-field-id="${fieldId}"]`);
        if (!existingRow) return;
        
        const newRow = this.createFieldRow(field);
        
        // Preserve selection state
        if (existingRow.classList.contains('selected')) {
            newRow.classList.add('selected');
        }
        
        // Replace the existing row
        existingRow.parentNode.replaceChild(newRow, existingRow);
    }

    updatePanelHeader(fieldId) {
        const fieldDef = this.currentSchema.properties[fieldId];
        const fieldGroup = fieldDef.group_id || 'ungrouped';
        const groupColor = this.getGroupColor(fieldGroup);
        
        const fieldGroupBadge = document.getElementById('selectedFieldType');
        if (fieldGroupBadge) {
            fieldGroupBadge.textContent = this.formatGroupName(fieldGroup);
            fieldGroupBadge.style.backgroundColor = groupColor.bg;
            fieldGroupBadge.style.color = groupColor.text;
            fieldGroupBadge.style.borderColor = groupColor.border;
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
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.placeholder = 'Enum value';
        input.className = 'enum-input'; // Add specific class for better CSS targeting
        
        const button = document.createElement('button');
        button.className = 'enum-remove';
        button.textContent = '×';
        button.onclick = () => {
            div.remove();
            this.updateEnumValues();
        };
        
        div.appendChild(input);
        div.appendChild(button);
        
        input.addEventListener('change', this.updateEnumValues.bind(this));
        
        return div;
    }

    createSchemaEditor(fieldDef) {
        const container = document.createElement('div');
        container.className = 'schema-editor-container';
        
        // Show the complete field definition (including all metadata)
        const completeFieldDef = { ...fieldDef };
        
        // Create the textarea for JSON editing
        const textarea = document.createElement('textarea');
        textarea.className = 'schema-json-editor';
        textarea.value = JSON.stringify(completeFieldDef, null, 2);
        textarea.placeholder = 'Complete JSON schema for this field including all properties...';
        
        // Add event listeners
        textarea.addEventListener('input', () => {
            this.autoResizeTextarea(textarea);
            this.validateAndUpdateSchemaJson(textarea);
        });
        
        textarea.addEventListener('change', () => {
            this.handleSchemaJsonChange(textarea);
        });
        
        // Create validation message area
        const validationMsg = document.createElement('div');
        validationMsg.className = 'schema-validation-message';
        validationMsg.style.display = 'none';
        
        container.appendChild(textarea);
        container.appendChild(validationMsg);
        
        // Auto-resize the textarea initially
        setTimeout(() => this.autoResizeTextarea(textarea), 0);
        
        return container;
    }

    createCleanFieldDefinition(fieldDef) {
        // Return the complete field definition (no longer "cleaning" it)
        return { ...fieldDef };
    }

    validateAndUpdateSchemaJson(textarea) {
        const validationMsg = textarea.parentElement.querySelector('.schema-validation-message');
        
        try {
            const parsed = JSON.parse(textarea.value);
            validationMsg.style.display = 'none';
            textarea.classList.remove('error');
            return true;
        } catch (error) {
            validationMsg.textContent = `JSON Error: ${error.message}`;
            validationMsg.style.display = 'block';
            textarea.classList.add('error');
            return false;
        }
    }

    handleSchemaJsonChange(textarea) {
        if (!this.selectedField) return;
        
        const isValid = this.validateAndUpdateSchemaJson(textarea);
        if (!isValid) return;
        
        try {
            const newFieldDefinition = JSON.parse(textarea.value);
            
            // Update the field definition with the complete new structure
            this.currentSchema.properties[this.selectedField] = newFieldDefinition;
            
            // Immediately update the table row and panel header
            this.refreshFieldData(this.selectedField);
            
            // Update the form fields to reflect JSON changes (but preserve the JSON editor content)
            const currentTextareaValue = textarea.value;
            this.renderFieldDetailsForm(this.currentSchema.properties[this.selectedField]);
            
            // Restore the JSON editor content (since renderFieldDetailsForm would reset it)
            const newJsonEditor = document.querySelector('.schema-json-editor');
            if (newJsonEditor && newJsonEditor !== textarea) {
                newJsonEditor.value = currentTextareaValue;
                setTimeout(() => this.autoResizeTextarea(newJsonEditor), 0);
            }
            
        } catch (error) {
            console.error('Error updating schema structure:', error);
        }
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

    getGroupColor(group) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        // Generate consistent colors for groups using hash-based approach
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

        // Simple hash function to assign consistent colors
        let hash = 0;
        for (let i = 0; i < group.length; i++) {
            hash = ((hash << 5) - hash + group.charCodeAt(i)) & 0x7fffffff;
        }
        
        const colors = isDark ? darkColors : lightColors;
        return colors[hash % colors.length];
    }

    formatGroupName(groupId) {
        if (groupId === 'ungrouped') return 'Ungrouped';
        return groupId.replace(/group_/, 'Group ').replace(/_/g, ' ');
    }

    async saveChanges() {
        try {
            const newVersion = this.currentVersion + 1;
            const filename = `schema_v${newVersion.toString().padStart(3, '0')}.json`;
            
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
        if (this.filters.comments === 'true') parts.push('CommentsTrue');
        else if (this.filters.comments === 'false') parts.push('CommentsFalse');
        else parts.push('CommentsAll');
        
        if (this.filters.errors === 'true') parts.push('ErrorsTrue');
        else if (this.filters.errors === 'false') parts.push('ErrorsFalse');
        else parts.push('ErrorsAll');
        
        if (this.filters.changes === 'true') parts.push('ChangesTrue');
        else if (this.filters.changes === 'false') parts.push('ChangesFalse');
        else parts.push('ChangesAll');
        
        if (this.filters.improvements === 'true') parts.push('ImprovementsTrue');
        else if (this.filters.improvements === 'false') parts.push('ImprovementsFalse');
        else parts.push('ImprovementsAll');
        
        // If no filters applied, use "noFilters"
        if (this.filters.types.length === 0 && 
            this.filters.groups.length === 0 && 
            this.filters.comments === 'all' && 
            this.filters.errors === 'all' && 
            this.filters.changes === 'all' &&
            this.filters.improvements === 'all' &&
            !this.filters.search) {
            parts.splice(1); // Remove all filter parts
            parts.push('noFilters');
        }
        
        // Add version (increment from current version)
        const version = (this.currentVersion + 1).toString().padStart(3, '0');
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

    // Settings Management
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('schemaEditorSettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
        }
    }

    saveSettingsToStorage() {
        try {
            localStorage.setItem('schemaEditorSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
        }
    }

    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
    }

    openSettings() {
        // Store original settings for cancel functionality
        this.originalSettings = { ...this.settings };
        
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'flex';
        
        // Update theme buttons to reflect current theme
        this.updateThemeButtons();
        
        // Initialize column order
        this.updateColumnOrderDisplay();
        
        // Initialize drag and drop
        this.initializeColumnDragDrop();
        
        // Close dropdowns
        this.closeAllDropdowns();
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'none';
    }

    cancelSettings() {
        const modal = document.getElementById('settingsModal');
        
        // Only revert if modal is open
        if (modal.style.display === 'flex') {
            // Revert to original settings
            this.settings = { ...this.originalSettings };
            
            // Apply original theme
            document.documentElement.setAttribute('data-theme', this.settings.theme);
            
            // Apply original column order if schema is loaded
            if (this.currentSchema) {
                this.applyColumnOrder();
                this.renderFieldsTable();
            }
            
            this.closeSettings();
        }
    }

    selectTheme(theme) {
        this.settings.theme = theme;
        this.updateThemeButtons();
        
        // Apply theme immediately for preview
        document.documentElement.setAttribute('data-theme', theme);
    }

    updateThemeButtons() {
        const lightBtn = document.getElementById('lightThemeBtn');
        const darkBtn = document.getElementById('darkThemeBtn');
        const joanBtn = document.getElementById('joanThemeBtn');
        
        lightBtn.classList.toggle('active', this.settings.theme === 'light');
        darkBtn.classList.toggle('active', this.settings.theme === 'dark');
        joanBtn.classList.toggle('active', this.settings.theme === 'joan');
    }

    applyJoanPreset() {
        // Apply Joan theme and reset column order to the new default
        this.settings.theme = 'joan';
        this.settings.columnOrder = ['name', 'description', 'comments', 'group', 'type', 'indicators'];
        this.settings.columnVisibility = {
            name: true,
            type: true,
            group: true,
            description: true,
            comments: true,
            indicators: true
        };
        this.settings.columnWidths = {
            name: 2,
            type: 1,
            group: 1,
            description: 3,
            comments: 2,
            indicators: 120
        };
        
        // Update UI immediately
        document.documentElement.setAttribute('data-theme', 'joan');
        this.updateThemeButtons();
        this.updateColumnOrderDisplay();
        this.initializeColumnDragDrop();
        
        // Apply changes if schema is loaded
        if (this.currentSchema) {
            this.applyColumnOrder();
            this.renderFieldsTable();
        }
    }

    updateColumnOrderDisplay() {
        const container = document.getElementById('columnOrderList');
        container.innerHTML = '';
        
        const columnLabels = {
            name: 'Field Name',
            type: 'Type',
            group: 'Group',
            description: 'Description',
            comments: 'Comments',
            indicators: 'Status'
        };
        
        this.settings.columnOrder.forEach(columnId => {
            const item = document.createElement('div');
            item.className = 'column-item';
            item.dataset.column = columnId;
            item.draggable = true;
            
            const isVisible = this.settings.columnVisibility[columnId];
            const currentWidth = this.settings.columnWidths[columnId];
            const isPixelBased = columnId === 'indicators';
            const eyeIcon = isVisible ? 
                `<path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>` :
                `<path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.38,7 12,7Z"/>`;
            
            item.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="drag-handle">
                    <path d="M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z"/>
                </svg>
                <span class="column-label">${columnLabels[columnId]}</span>
                <div class="column-width-adjuster">
                    <input type="range" 
                           class="width-slider" 
                           min="${isPixelBased ? 80 : 0.5}" 
                           max="${isPixelBased ? 300 : 5}" 
                           step="${isPixelBased ? 10 : 0.1}" 
                           value="${currentWidth}" 
                           data-column="${columnId}">
                    <span class="width-display">${currentWidth}${isPixelBased ? 'px' : 'fr'}</span>
                </div>
                <button class="column-visibility-toggle ${isVisible ? 'visible' : 'hidden'}" data-column="${columnId}" title="${isVisible ? 'Hide column' : 'Show column'}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        ${eyeIcon}
                    </svg>
                </button>
            `;
            
            // Add click handler for visibility toggle
            const toggleBtn = item.querySelector('.column-visibility-toggle');
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleColumnVisibility(columnId);
            });
            
            // Add input handler for width adjustment
            const widthSlider = item.querySelector('.width-slider');
            widthSlider.addEventListener('input', (e) => {
                e.stopPropagation();
                this.handleColumnWidthChange(columnId, parseFloat(e.target.value));
            });
            
            container.appendChild(item);
        });
    }

    initializeColumnDragDrop() {
        const container = document.getElementById('columnOrderList');
        
        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('column-item')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.column);
            }
        });
        
        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('column-item')) {
                e.target.classList.remove('dragging');
            }
        });
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragging = container.querySelector('.dragging');
            if (!dragging) return;
            
            const siblings = [...container.querySelectorAll('.column-item:not(.dragging)')];
            
            const nextSibling = siblings.find(sibling => {
                return e.clientY <= sibling.getBoundingClientRect().top + sibling.offsetHeight / 2;
            });
            
            container.insertBefore(dragging, nextSibling);
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            this.updateColumnOrderFromDOM();
        });
        
        // Prevent dragging when clicking on visibility toggle or width adjuster
        container.addEventListener('mousedown', (e) => {
            if (e.target.closest('.column-visibility-toggle') || e.target.closest('.column-width-adjuster')) {
                const columnItem = e.target.closest('.column-item');
                if (columnItem) {
                    columnItem.draggable = false;
                    // Re-enable dragging after a short delay
                    setTimeout(() => {
                        columnItem.draggable = true;
                    }, 100);
                }
            }
        });
    }

    updateColumnOrderFromDOM() {
        const items = document.querySelectorAll('#columnOrderList .column-item');
        this.settings.columnOrder = Array.from(items).map(item => item.dataset.column);
    }

    handleColumnWidthChange(columnId, newWidth) {
        this.settings.columnWidths[columnId] = newWidth;
        
        // Update the display immediately
        const widthDisplay = document.querySelector(`[data-column="${columnId}"] .width-display`);
        if (widthDisplay) {
            const isPixelBased = columnId === 'indicators';
            widthDisplay.textContent = `${newWidth}${isPixelBased ? 'px' : 'fr'}`;
        }
        
        // Apply changes immediately if schema is loaded
        if (this.currentSchema) {
            this.applyColumnOrder();
            this.renderFieldsTable();
        }
    }

    toggleColumnVisibility(columnId) {
        this.settings.columnVisibility[columnId] = !this.settings.columnVisibility[columnId];
        this.updateColumnOrderDisplay();
        
        // Apply changes immediately if schema is loaded
        if (this.currentSchema) {
            this.applyColumnOrder();
            this.renderFieldsTable();
        }
    }

    resetColumnOrder() {
        this.settings.columnOrder = ['name', 'description', 'comments', 'group', 'type', 'indicators'];
        this.settings.columnVisibility = {
            name: true,
            type: true,
            group: true,
            description: true,
            comments: true,
            indicators: true
        };
        this.settings.columnWidths = {
            name: 2,
            type: 1,
            group: 1,
            description: 3,
            comments: 2,
            indicators: 120
        };
        this.updateColumnOrderDisplay();
        this.initializeColumnDragDrop();
    }

    saveSettings() {
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        // Apply column order
        this.applyColumnOrder();
        
        // Save to localStorage
        this.saveSettingsToStorage();
        
        // Re-render table if schema is loaded to update colors
        if (this.currentSchema) {
            this.renderFieldsTable();
        }
        
        this.closeSettings();
    }

    applyColumnOrder() {
        const header = document.querySelector('.table-header');
        
        // Filter to only visible columns
        const visibleColumns = this.settings.columnOrder.filter(col => this.settings.columnVisibility[col]);
        
        // Build grid template based on visible columns and custom widths
        const gridTemplate = visibleColumns.map(col => {
            const width = this.settings.columnWidths[col];
            return col === 'indicators' ? `${width}px` : `${width}fr`;
        }).join(' ');
        
        // Apply to header
        header.style.gridTemplateColumns = gridTemplate;
        
        // Apply to all rows
        document.querySelectorAll('.field-row').forEach(row => {
            row.style.gridTemplateColumns = gridTemplate;
        });
        
        // Reorder header children to match visible columns
        this.reorderHeaderColumns();
    }

    reorderHeaderColumns() {
        const header = document.querySelector('.table-header');
        const columnHeaders = {
            name: 'Field Name',
            type: 'Type', 
            group: 'Group',
            description: 'Description',
            comments: 'Comments',
            indicators: 'Status'
        };
        
        header.innerHTML = '';
        
        // Filter to only visible columns and create headers
        const visibleColumns = this.settings.columnOrder.filter(col => this.settings.columnVisibility[col]);
        visibleColumns.forEach(columnId => {
            const div = document.createElement('div');
            div.className = `th field-${columnId}`;
            div.textContent = columnHeaders[columnId];
            header.appendChild(div);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SchemaEditor();
});
