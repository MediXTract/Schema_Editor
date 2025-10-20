/**
 * PatientClassificationPanel - Component for patient-level performance classification
 */
import { 
    CLASSIFICATION_GROUPS, 
    CLASSIFICATION_LABELS,
    CLASSIFICATION_GROUP_LABELS,
    CLASSIFICATION_COLORS,
    SEVERITY,
    PATIENT_ID_FORMAT,
    EVENTS 
} from '../../config/constants.js';
import { createElement } from '../utils/domUtils.js';

export class PatientClassificationPanel {
    constructor(stateManager, eventBus, performanceService) {
        this.stateManager = stateManager;
        this.eventBus = eventBus;
        this.performanceService = performanceService;
        
        this.currentFieldId = null;
        this.currentPatientId = null;
        this.editMode = false;
    }

    /**
     * Render patient classification UI for a field
     * @param {string} fieldId - Field ID
     * @param {HTMLElement} container - Container element
     */
    render(fieldId, container) {
        this.currentFieldId = fieldId;
        container.innerHTML = '';

        const state = this.stateManager.getState();
        const schema = state.currentSchema;

        // Create main container
        const mainContainer = createElement('div', { className: 'patient-classification-container' });

        // Patient selector section
        const selectorSection = this.createPatientSelector(schema, fieldId);
        mainContainer.appendChild(selectorSection);

        // Patient list section
        const listSection = this.createPatientList(schema, fieldId);
        mainContainer.appendChild(listSection);

        container.appendChild(mainContainer);
    }

    /**
     * Create patient selector section
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     * @returns {HTMLElement} Selector section
     */
    createPatientSelector(schema, fieldId) {
        const section = createElement('div', { className: 'patient-selector-section' });

        const header = createElement('div', { className: 'section-header' });
        header.innerHTML = `
            <h5>Add Patient Classification</h5>
            <span class="section-subtitle">Classify performance for a specific patient</span>
        `;

        const inputGroup = createElement('div', { className: 'patient-input-group' });
        
        const input = createElement('input', {
            type: 'text',
            className: 'patient-id-input',
            placeholder: PATIENT_ID_FORMAT,
            id: 'patientIdInput'
        });

        const addButton = createElement('button', {
            className: 'btn btn-primary btn-sm',
            type: 'button'
        });
        addButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
            </svg>
            Add/Edit Patient
        `;

        addButton.addEventListener('click', () => {
            const patientId = this.performanceService.formatPatientId(input.value.trim());
            if (this.performanceService.validatePatientId(patientId)) {
                this.openPatientForm(fieldId, patientId);
                input.value = '';
            } else {
                alert('Invalid patient ID format. Use: patient_XXX (e.g., patient_001)');
            }
        });

        // Enter key support
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addButton.click();
            }
        });

        inputGroup.appendChild(input);
        inputGroup.appendChild(addButton);

        section.appendChild(header);
        section.appendChild(inputGroup);

        return section;
    }

    /**
     * Create patient list section
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     * @returns {HTMLElement} List section
     */
    createPatientList(schema, fieldId) {
        const section = createElement('div', { className: 'patient-list-section' });

        const header = createElement('div', { className: 'section-header' });
        header.innerHTML = `
            <h5>Classified Patients</h5>
        `;

        const patients = this.performanceService.getPatientsForField(schema, fieldId);

        const listContainer = createElement('div', { className: 'patient-list' });

        if (patients.length === 0) {
            const emptyState = createElement('div', { className: 'empty-patient-list' });
            emptyState.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.3; margin-bottom: 0.5rem;">
                    <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                </svg>
                <p>No patients classified yet</p>
                <span style="font-size: 0.875rem; color: var(--gray-500);">Add a patient above to start</span>
            `;
            listContainer.appendChild(emptyState);
        } else {
            patients.forEach(patientId => {
                const item = this.createPatientListItem(schema, fieldId, patientId);
                listContainer.appendChild(item);
            });
        }

        section.appendChild(header);
        section.appendChild(listContainer);

        return section;
    }

    /**
     * Create patient list item
     * @param {Object} schema - Schema object
     * @param {string} fieldId - Field ID
     * @param {string} patientId - Patient ID
     * @returns {HTMLElement} List item
     */
    createPatientListItem(schema, fieldId, patientId) {
        const data = this.performanceService.getPerformanceData(schema, fieldId, patientId);
        const item = createElement('div', { className: 'patient-list-item' });

        // Get active classifications
        const activeCategories = Object.keys(data).filter(key => 
            data[key] === true && CLASSIFICATION_LABELS[key]
        );

        // Create badges for active classifications
        const badges = activeCategories.map(category => {
            const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
            const colors = CLASSIFICATION_COLORS[category] || { light: '#E5E7EB', dark: '#374151' };
            const bgColor = isDark ? colors.dark : colors.light;
            
            return `<span class="classification-badge" style="background-color: ${bgColor};" title="${CLASSIFICATION_LABELS[category]}">${category}</span>`;
        }).join('');

        const severityBadge = data.severity ? 
            `<span class="severity-badge severity-${this.getSeverityLevel(data.severity)}" title="Severity: ${data.severity}/10">
                ${data.severity}
            </span>` : '';

        const lastUpdated = data.last_updated ? 
            new Date(data.last_updated).toLocaleString() : 
            'Unknown';

        item.innerHTML = `
            <div class="patient-item-header">
                <div class="patient-item-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                    </svg>
                    <strong>${patientId}</strong>
                    ${severityBadge}
                </div>
                <div class="patient-item-actions">
                    <button class="btn-icon edit-patient" title="Edit" data-patient="${patientId}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                        </svg>
                    </button>
                    <button class="btn-icon delete-patient" title="Delete" data-patient="${patientId}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="patient-item-badges">
                ${badges || '<span class="no-classifications">No classifications</span>'}
            </div>
            ${data.comment ? `<div class="patient-item-comment">${data.comment}</div>` : ''}
            <div class="patient-item-footer">
                <span class="last-updated">Last updated: ${lastUpdated}</span>
            </div>
        `;

        // Add event listeners
        const editBtn = item.querySelector('.edit-patient');
        const deleteBtn = item.querySelector('.delete-patient');

        editBtn.addEventListener('click', () => {
            this.openPatientForm(fieldId, patientId);
        });

        deleteBtn.addEventListener('click', () => {
            if (confirm(`Delete classification for ${patientId}?`)) {
                this.deletePatient(fieldId, patientId);
            }
        });

        return item;
    }

    /**
     * Open patient classification form
     * @param {string} fieldId - Field ID
     * @param {string} patientId - Patient ID
     */
    openPatientForm(fieldId, patientId) {
        this.currentFieldId = fieldId;
        this.currentPatientId = patientId;
        this.editMode = true;

        const state = this.stateManager.getState();
        const schema = state.currentSchema;
        const existingData = this.performanceService.getPerformanceData(schema, fieldId, patientId);

        // Create modal
        const modal = this.createFormModal(fieldId, patientId, existingData);
        document.body.appendChild(modal);
    }

    /**
     * Create classification form modal
     * @param {string} fieldId - Field ID
     * @param {string} patientId - Patient ID
     * @param {Object|null} existingData - Existing classification data
     * @returns {HTMLElement} Modal element
     */
    createFormModal(fieldId, patientId, existingData) {
        const modal = createElement('div', { 
            className: 'classification-modal',
            id: 'classificationModal'
        });

        const overlay = createElement('div', { className: 'settings-overlay' });
        overlay.addEventListener('click', () => this.closeFormModal());

        const content = createElement('div', { className: 'classification-modal-content' });

        // Header
        const header = createElement('div', { className: 'modal-header' });
        header.innerHTML = `
            <div>
                <h3>Classify Patient: ${patientId}</h3>
                <p style="font-size: 0.875rem; color: var(--gray-500); margin-top: 0.25rem;">Field: ${fieldId}</p>
            </div>
            <button class="settings-close" id="closeClassificationModal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
            </button>
        `;

        // Body
        const body = createElement('div', { className: 'modal-body' });
        
        // Create classification form
        const form = this.createClassificationForm(existingData);
        body.appendChild(form);

        // Footer
        const footer = createElement('div', { className: 'modal-footer' });
        footer.innerHTML = `
            <button class="btn btn-primary" id="saveClassificationBtn">Save Classification</button>
            <button class="btn btn-secondary" id="cancelClassificationBtn">Cancel</button>
        `;

        content.appendChild(header);
        content.appendChild(body);
        content.appendChild(footer);

        modal.appendChild(overlay);
        modal.appendChild(content);

        // Event listeners
        const closeBtn = header.querySelector('#closeClassificationModal');
        const saveBtn = footer.querySelector('#saveClassificationBtn');
        const cancelBtn = footer.querySelector('#cancelClassificationBtn');

        closeBtn.addEventListener('click', () => this.closeFormModal());
        cancelBtn.addEventListener('click', () => this.closeFormModal());
        saveBtn.addEventListener('click', () => this.saveClassification());

        return modal;
    }

    /**
     * Create classification form
     * @param {Object|null} existingData - Existing classification data
     * @returns {HTMLElement} Form element
     */
    createClassificationForm(existingData) {
        const form = createElement('div', { className: 'classification-form' });

        // Create sections for each classification group
        Object.entries(CLASSIFICATION_GROUPS).forEach(([groupKey, categories]) => {
            const section = this.createClassificationSection(
                groupKey, 
                categories, 
                existingData
            );
            form.appendChild(section);
        });

        // Severity section
        const severitySection = this.createSeveritySection(existingData);
        form.appendChild(severitySection);

        // Comment section
        const commentSection = this.createCommentSection(existingData);
        form.appendChild(commentSection);

        // Validation message area
        const validationMsg = createElement('div', { 
            className: 'validation-message',
            id: 'classificationValidation',
            style: { display: 'none' }
        });
        form.appendChild(validationMsg);

        return form;
    }

    /**
     * Create classification section
     * @param {string} groupKey - Group key (status, improvements, issues, resolved)
     * @param {Array} categories - Array of category keys
     * @param {Object|null} existingData - Existing data
     * @returns {HTMLElement} Section element
     */
    createClassificationSection(groupKey, categories, existingData) {
        const section = createElement('div', { className: 'classification-section' });

        const header = createElement('h4', { className: 'section-title' });
        header.textContent = CLASSIFICATION_GROUP_LABELS[groupKey];

        const grid = createElement('div', { 
            className: `classification-grid ${groupKey === 'status' ? 'status-grid' : ''}` 
        });

        categories.forEach(category => {
            const item = createElement('div', { className: 'classification-item' });

            const checkbox = createElement('input', {
                type: 'checkbox',
                id: `class_${category}`,
                className: 'classification-checkbox',
                'data-category': category,
                'data-group': groupKey
            });

            if (existingData && existingData[category] === true) {
                checkbox.checked = true;
            }

            // For status group, use radio-like behavior
            if (groupKey === 'status') {
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        // Uncheck other status checkboxes
                        grid.querySelectorAll('input[data-group="status"]').forEach(cb => {
                            if (cb !== e.target) cb.checked = false;
                        });
                    }
                });
            }

            const label = createElement('label', {
                htmlFor: `class_${category}`,
                className: 'classification-label'
            });
            label.textContent = CLASSIFICATION_LABELS[category];

            item.appendChild(checkbox);
            item.appendChild(label);
            grid.appendChild(item);
        });

        section.appendChild(header);
        section.appendChild(grid);

        return section;
    }

    /**
     * Create severity section
     * @param {Object|null} existingData - Existing data
     * @returns {HTMLElement} Section element
     */
    createSeveritySection(existingData) {
        const section = createElement('div', { className: 'severity-section' });

        const header = createElement('h4', { className: 'section-title' });
        header.textContent = 'Severity Rating (Optional)';

        const sliderContainer = createElement('div', { className: 'severity-slider-container' });

        const slider = createElement('input', {
            type: 'range',
            id: 'severitySlider',
            className: 'severity-slider',
            min: SEVERITY.MIN,
            max: SEVERITY.MAX,
            value: existingData?.severity || SEVERITY.DEFAULT,
            step: 1
        });

        const valueDisplay = createElement('div', { className: 'severity-value' });
        const currentValue = existingData?.severity || SEVERITY.DEFAULT;
        valueDisplay.innerHTML = `
            <span class="severity-number">${currentValue}</span>
            <span class="severity-label">${this.getSeverityLabel(currentValue)}</span>
        `;

        slider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value, 10);
            valueDisplay.innerHTML = `
                <span class="severity-number">${value}</span>
                <span class="severity-label">${this.getSeverityLabel(value)}</span>
            `;
        });

        const clearBtn = createElement('button', {
            type: 'button',
            className: 'btn btn-ghost btn-sm'
        });
        clearBtn.textContent = 'Clear';
        clearBtn.addEventListener('click', () => {
            slider.value = SEVERITY.DEFAULT;
            valueDisplay.innerHTML = `
                <span class="severity-number">${SEVERITY.DEFAULT}</span>
                <span class="severity-label">${this.getSeverityLabel(SEVERITY.DEFAULT)}</span>
            `;
        });

        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);
        sliderContainer.appendChild(clearBtn);

        section.appendChild(header);
        section.appendChild(sliderContainer);

        return section;
    }

    /**
     * Create comment section
     * @param {Object|null} existingData - Existing data
     * @returns {HTMLElement} Section element
     */
    createCommentSection(existingData) {
        const section = createElement('div', { className: 'comment-section' });

        const header = createElement('h4', { className: 'section-title' });
        header.textContent = 'Detailed Comment';

        const textarea = createElement('textarea', {
            id: 'classificationComment',
            className: 'classification-comment',
            placeholder: 'Add detailed notes about this classification, including specific references to documentation...',
            rows: 4
        });

        if (existingData?.comment) {
            textarea.value = existingData.comment;
        }

        section.appendChild(header);
        section.appendChild(textarea);

        return section;
    }

    /**
     * Save classification
     */
    saveClassification() {
        const state = this.stateManager.getState();
        const schema = state.currentSchema;

        // Collect classifications
        const classifications = {};
        document.querySelectorAll('.classification-checkbox').forEach(checkbox => {
            classifications[checkbox.dataset.category] = checkbox.checked;
        });

        // Validate
        const validation = this.performanceService.validateClassifications(classifications);
        const validationMsg = document.getElementById('classificationValidation');

        if (!validation.valid) {
            validationMsg.textContent = validation.errors.join('. ');
            validationMsg.style.display = 'block';
            validationMsg.style.color = 'var(--danger)';
            return;
        }

        // Check if at least one classification is selected
        const hasSelection = Object.values(classifications).some(v => v === true);
        if (!hasSelection) {
            validationMsg.textContent = 'Please select at least one classification.';
            validationMsg.style.display = 'block';
            validationMsg.style.color = 'var(--danger)';
            return;
        }

        validationMsg.style.display = 'none';

        // Get severity
        const severitySlider = document.getElementById('severitySlider');
        const severity = severitySlider ? parseInt(severitySlider.value, 10) : null;

        // Get comment
        const commentTextarea = document.getElementById('classificationComment');
        const comment = commentTextarea ? commentTextarea.value.trim() : '';

        try {
            // Save to schema
            this.performanceService.setPatientClassification(
                schema,
                this.currentFieldId,
                this.currentPatientId,
                classifications,
                severity,
                comment
            );

            // Update state
            this.stateManager.updateSchema(schema);

            // Emit event
            this.eventBus.emit(EVENTS.CLASSIFICATION_UPDATED, {
                fieldId: this.currentFieldId,
                patientId: this.currentPatientId
            });

            // Close modal
            this.closeFormModal();

            // Refresh the panel
            const container = document.querySelector('.patient-classification-container');
            if (container && container.parentElement) {
                this.render(this.currentFieldId, container.parentElement);
            }

        } catch (error) {
            validationMsg.textContent = `Error: ${error.message}`;
            validationMsg.style.display = 'block';
            validationMsg.style.color = 'var(--danger)';
        }
    }

    /**
     * Delete patient classification
     * @param {string} fieldId - Field ID
     * @param {string} patientId - Patient ID
     */
    deletePatient(fieldId, patientId) {
        const state = this.stateManager.getState();
        const schema = state.currentSchema;

        this.performanceService.deletePatientClassification(schema, fieldId, patientId);
        this.stateManager.updateSchema(schema);

        this.eventBus.emit(EVENTS.PATIENT_DELETED, { fieldId, patientId });

        // Refresh the panel
        const container = document.querySelector('.patient-classification-container');
        if (container && container.parentElement) {
            this.render(fieldId, container.parentElement);
        }
    }

    /**
     * Close form modal
     */
    closeFormModal() {
        const modal = document.getElementById('classificationModal');
        if (modal) {
            modal.remove();
        }
        this.editMode = false;
    }

    /**
     * Get severity label from value
     * @param {number} value - Severity value
     * @returns {string} Label
     */
    getSeverityLabel(value) {
        if (value <= 2) return 'Minor';
        if (value <= 4) return 'Low';
        if (value <= 6) return 'Medium';
        if (value <= 8) return 'High';
        return 'Critical';
    }

    /**
     * Get severity level for CSS class
     * @param {number} value - Severity value
     * @returns {string} Level
     */
    getSeverityLevel(value) {
        if (value <= 2) return 'minor';
        if (value <= 4) return 'low';
        if (value <= 6) return 'medium';
        if (value <= 8) return 'high';
        return 'critical';
    }
}
