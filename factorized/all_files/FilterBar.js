/**
 * FilterBar - Component for filtering fields
 */
import { DropdownManager } from '../ui/DropdownManager.js';
import { formatGroupName } from '../utils/formatters.js';
import { EVENTS } from '../../config/constants.js';

export class FilterBar {
    constructor(stateManager, eventBus, filterService) {
        this.stateManager = stateManager;
        this.eventBus = eventBus;
        this.filterService = filterService;
        this.dropdownManager = new DropdownManager();
        
        this.init();
    }

    /**
     * Initialize filter bar
     */
    init() {
        this.setupEventListeners();
        this.initializeDropdowns();
        this.initializeFilterButtons();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Three-state filter toggles
        ['comments', 'errors', 'changes', 'improvements'].forEach(filterName => {
            const button = document.getElementById(`${filterName}Filter`);
            if (button) {
                button.addEventListener('click', (e) => {
                    this.handleThreeStateFilter(filterName, e.currentTarget);
                });
            }
        });

        // Clear filters button
        const clearBtn = document.getElementById('clearFilters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    /**
     * Initialize dropdowns
     */
    initializeDropdowns() {
        const typeDropdown = document.getElementById('typeFilter');
        const groupDropdown = document.getElementById('groupFilter');

        if (typeDropdown) {
            this.dropdownManager.register('type', typeDropdown, (selected) => {
                this.stateManager.updateFilters({ types: selected });
            });
        }

        if (groupDropdown) {
            this.dropdownManager.register('group', groupDropdown, (selected) => {
                this.stateManager.updateFilters({ groups: selected });
            });
        }
    }

    /**
     * Initialize filter button states
     */
    initializeFilterButtons() {
        ['comments', 'errors', 'changes', 'improvements'].forEach(filterName => {
            const button = document.getElementById(`${filterName}Filter`);
            if (button) {
                this.updateFilterButtonState(button, filterName, 'all');
            }
        });
    }

    /**
     * Populate filter options from schema metadata
     */
    populateFilterOptions() {
        const state = this.stateManager.getState();
        const { typeOptions, groupOptions } = state;

        this.populateDropdown('type', Array.from(typeOptions).sort());
        this.populateDropdown('group', Array.from(groupOptions).sort());
    }

    /**
     * Populate dropdown with options
     * @param {string} dropdownType - 'type' or 'group'
     * @param {Array} options - Array of option values
     */
    populateDropdown(dropdownType, options) {
        const dropdown = document.getElementById(`${dropdownType}Filter`);
        if (!dropdown) return;

        const content = dropdown.querySelector('.dropdown-content');
        if (!content) return;

        content.innerHTML = '';

        options.forEach(option => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'dropdown-option';
            optionDiv.dataset.value = option;

            const displayValue = dropdownType === 'group' ? formatGroupName(option) : option;

            optionDiv.innerHTML = `
                <div class="dropdown-option-checkbox"></div>
                <span>${displayValue}</span>
            `;

            optionDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dropdownManager.handleOptionClick(dropdownType, option);
            });

            content.appendChild(optionDiv);
        });
    }

    /**
     * Handle search input
     * @param {string} value - Search value
     */
    handleSearch(value) {
        this.stateManager.updateFilters({ 
            search: value.toLowerCase().trim() 
        });
    }

    /**
     * Handle three-state filter toggle
     * @param {string} filterName - Filter name
     * @param {HTMLElement} button - Button element
     */
    handleThreeStateFilter(filterName, button) {
        const state = this.stateManager.getState();
        const currentState = state.filters[filterName];
        
        let newState;
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

        this.stateManager.updateFilters({ [filterName]: newState });
        this.updateFilterButtonState(button, filterName, newState);
    }

    /**
     * Update filter button visual state
     * @param {HTMLElement} button - Button element
     * @param {string} filterName - Filter name
     * @param {string} state - State ('all', 'true', 'false')
     */
    updateFilterButtonState(button, filterName, state) {
        if (!button) return;

        button.setAttribute('data-state', state);

        const label = button.querySelector('.filter-label');
        if (!label) return;

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

    /**
     * Clear all filters
     */
    clearAllFilters() {
        // Clear search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }

        // Clear dropdowns
        this.dropdownManager.clearSelection('type');
        this.dropdownManager.clearSelection('group');

        // Reset filter buttons
        this.initializeFilterButtons();

        // Update state
        this.stateManager.clearFilters();
    }

    /**
     * Update results count display
     */
    updateResultsCount() {
        const state = this.stateManager.getState();
        const count = state.filteredFields.length;
        const total = state.allFields.length;

        const resultsEl = document.getElementById('resultsCount');
        if (resultsEl) {
            const text = count === total ? `${total} fields` : `${count}/${total} fields`;
            resultsEl.textContent = text;
        }
    }

    /**
     * Close all dropdowns
     */
    closeAllDropdowns() {
        this.dropdownManager.closeAll();
    }
}
