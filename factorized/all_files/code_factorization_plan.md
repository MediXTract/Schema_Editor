# Schema Field Editor - Code Factorization Plan

## Current State
- **script.js**: ~1,800 lines (monolithic class)
- **styles.css**: ~2,000 lines (single file with all styles)

## Proposed Structure

### 📁 Project Directory
```
schema-editor/
│
├── index.html
│
├── css/
│   ├── base/
│   │   ├── reset.css          # CSS reset & variables
│   │   ├── themes.css          # Theme definitions (light/dark/joan)
│   │   └── typography.css      # Font definitions
│   │
│   ├── components/
│   │   ├── buttons.css         # All button styles
│   │   ├── forms.css           # Form inputs, selects, textareas
│   │   ├── table.css           # Table header, rows, cells
│   │   ├── filters.css         # Filter bar, dropdowns, toggles
│   │   ├── modals.css          # Settings modal, overlays
│   │   ├── panels.css          # Field details panel
│   │   ├── badges.css          # Type badges, group badges, indicators
│   │   └── banners.css         # Error, warning, info banners
│   │
│   ├── layout/
│   │   ├── header.css          # App header styles
│   │   ├── main.css            # Main content area
│   │   └── responsive.css      # Media queries
│   │
│   └── main.css                # Import all CSS files
│
├── js/
│   ├── core/
│   │   ├── SchemaEditor.js     # Main orchestrator class (lightweight)
│   │   ├── StateManager.js     # Centralized state management
│   │   └── EventBus.js         # Event system for component communication
│   │
│   ├── services/
│   │   ├── FileService.js      # File operations (read, write, download)
│   │   ├── SchemaService.js    # Schema parsing, validation, versioning
│   │   ├── FilterService.js    # Filtering logic and algorithms
│   │   └── StorageService.js   # LocalStorage operations
│   │
│   ├── components/
│   │   ├── TableManager.js     # Table rendering and row management
│   │   ├── FilterBar.js        # Filter UI and interactions
│   │   ├── FieldDetailsPanel.js # Field editing panel
│   │   ├── SettingsModal.js    # Settings UI and preferences
│   │   └── EmptyState.js       # Empty state display
│   │
│   ├── ui/
│   │   ├── DropdownManager.js  # Custom dropdown logic
│   │   ├── FormBuilder.js      # Dynamic form generation
│   │   ├── ThemeManager.js     # Theme switching
│   │   └── NotificationManager.js # Toast/banner notifications
│   │
│   ├── utils/
│   │   ├── colorUtils.js       # Color generation for types/groups
│   │   ├── validators.js       # Schema validation helpers
│   │   ├── formatters.js       # Text formatting utilities
│   │   └── domUtils.js         # DOM manipulation helpers
│   │
│   └── main.js                 # Entry point, initialization
│
└── config/
    └── constants.js            # Configuration constants
```

---

## 🎯 Factorization Strategy

### **1. Core Layer** (Orchestration)
**SchemaEditor.js** (~200 lines)
- Initializes all components
- Coordinates high-level operations
- Maintains references to services and components
- Acts as the "main controller"

**StateManager.js** (~150 lines)
- Centralized state management
- Observable pattern for state changes
- Stores: currentSchema, filters, settings, selectedField

**EventBus.js** (~50 lines)
- Publish/subscribe event system
- Decouples components from each other

---

### **2. Services Layer** (Business Logic)
**FileService.js** (~250 lines)
- `scanFolder()` - Directory picker and scanning
- `loadFiles()` - File reading (with fallback)
- `saveSchema()` - Save with versioning
- `downloadFile()` - Export functionality

**SchemaService.js** (~300 lines)
- `parseSchema()` - Convert schema to field array
- `validateSchema()` - JSON schema validation
- `getFieldType()` - Type extraction
- `updateFieldProperty()` - Property updates
- `extractMetadata()` - Metadata extraction

**FilterService.js** (~200 lines)
- `applyFilters()` - Main filtering algorithm
- `matchesThreeStateFilter()` - Boolean filter logic
- `buildFilteredArray()` - Efficient filtering

**StorageService.js** (~100 lines)
- `saveSettings()` - LocalStorage persistence
- `loadSettings()` - Settings retrieval
- `clearSettings()` - Reset functionality

---

### **3. Components Layer** (UI Components)
**TableManager.js** (~300 lines)
- `renderTable()` - Full table rendering
- `createFieldRow()` - Single row creation
- `updateRow()` - Row updates
- `applyColumnOrder()` - Column reordering
- `selectField()` - Selection handling

**FilterBar.js** (~250 lines)
- `renderFilterBar()` - Filter UI rendering
- `handleSearch()` - Search input
- `updateDropdowns()` - Dropdown state
- `clearFilters()` - Reset filters

**FieldDetailsPanel.js** (~400 lines)
- `showPanel()` - Display panel
- `renderForm()` - Form generation
- `createFormSection()` - Section builder
- `createEnumEditor()` - Enum editor
- `createSchemaEditor()` - Raw JSON editor
- `handlePropertyChange()` - Property updates

**SettingsModal.js** (~300 lines)
- `openModal()` - Display settings
- `renderThemeSelector()` - Theme UI
- `renderColumnOrder()` - Column management
- `saveSettings()` - Settings persistence
- `initializeDragDrop()` - Drag & drop setup

**EmptyState.js** (~50 lines)
- `show()` - Display empty state
- `hide()` - Hide empty state

---

### **4. UI Layer** (Reusable UI Logic)
**DropdownManager.js** (~150 lines)
- `toggle()` - Open/close dropdown
- `renderOptions()` - Options rendering
- `handleSelection()` - Selection logic
- `updateDisplay()` - Label updates

**FormBuilder.js** (~200 lines)
- `buildForm()` - Dynamic form creation
- `createInput()` - Input field factory
- `createTextarea()` - Textarea with auto-resize
- `createSelect()` - Select dropdown
- `attachEventListeners()` - Event binding

**ThemeManager.js** (~100 lines)
- `setTheme()` - Apply theme
- `getTheme()` - Get current theme
- `toggleTheme()` - Switch themes

**NotificationManager.js** (~100 lines)
- `showSuccess()` - Success message
- `showError()` - Error message
- `showInfo()` - Info message
- `showLoading()` - Loading overlay

---

### **5. Utils Layer** (Pure Functions)
**colorUtils.js** (~150 lines)
- `getTypeColor()` - Type badge colors
- `getGroupColor()` - Group badge colors (hash-based)
- `generateColorPalette()` - Theme-aware palettes

**validators.js** (~100 lines)
- `validateJSON()` - JSON validation
- `validateFieldType()` - Type checking
- `validateDateRange()` - Date validation

**formatters.js** (~100 lines)
- `formatGroupName()` - Group name formatting
- `formatDate()` - Date formatting
- `formatFileSize()` - Size formatting

**domUtils.js** (~100 lines)
- `autoResizeTextarea()` - Textarea auto-resize
- `createElement()` - Element factory
- `removeAllChildren()` - Clear container

---

### **6. Config Layer**
**constants.js** (~50 lines)
```javascript
export const FIELD_TYPES = ['string', 'number', 'integer', 'boolean', 'array', 'object'];
export const DEFAULT_SETTINGS = { theme: 'light', columnOrder: [...], ... };
export const VALIDATION_RANGES = { birth_weight: [200, 5000], ... };
export const THEMES = ['light', 'dark', 'joan'];
```

---

## 📊 Size Comparison

| Category | Current | Proposed | Files |
|----------|---------|----------|-------|
| **JavaScript** | 1 file (1,800 lines) | 23 files (~3,500 lines total) | More modular |
| **CSS** | 1 file (2,000 lines) | 16 files (~2,200 lines total) | Better organized |
| **Avg File Size** | N/A | ~150 lines/file | Manageable |

---

## 🔄 Communication Flow

```
User Interaction
      ↓
Components (UI)
      ↓
EventBus (events)
      ↓
Services (logic)
      ↓
StateManager (state)
      ↓
Components (re-render)
```

---

## 🎯 Benefits of This Structure

1. **Separation of Concerns**: UI, logic, and data are separated
2. **Testability**: Each module can be tested independently
3. **Maintainability**: Easy to find and fix bugs
4. **Scalability**: Easy to add new features (e.g., performance tracking UI)
5. **Reusability**: Components can be reused
6. **Readability**: Smaller files are easier to understand
7. **Collaboration**: Multiple developers can work simultaneously

---

## 🚀 Migration Strategy

### Phase 1: Setup & Core
1. Create directory structure
2. Extract constants and utilities
3. Create StateManager and EventBus
4. Refactor SchemaEditor to use new structure

### Phase 2: Services
5. Extract FileService
6. Extract SchemaService
7. Extract FilterService
8. Extract StorageService

### Phase 3: Components
9. Extract TableManager
10. Extract FilterBar
11. Extract FieldDetailsPanel
12. Extract SettingsModal

### Phase 4: UI & Polish
13. Extract UI utilities (Dropdown, FormBuilder, etc.)
14. Refactor CSS into modules
15. Test all functionality
16. Add performance tracking UI (new feature)

---

## 📝 Notes

- **ES6 Modules**: Use `import/export` syntax
- **Event-Driven**: Components communicate via EventBus
- **Single Responsibility**: Each file has one clear purpose
- **Progressive Enhancement**: Maintain browser compatibility
- **Documentation**: Add JSDoc comments to all functions
