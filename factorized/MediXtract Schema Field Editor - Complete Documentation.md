# MediXtract Schema Field Editor - Complete Project Documentation

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Background and Motivation](#project-background-and-motivation)
3. [Application Architecture](#application-architecture)
4. [Current Project Structure](#current-project-structure)
5. [Schema Structure](#schema-structure)
6. [Performance Classification System](#performance-classification-system)
7. [Application Features](#application-features)
8. [Technical Implementation Details](#technical-implementation-details)
9. [Future Development](#future-development)
10. [Use Cases and Workflows](#use-cases-and-workflows)
11. [Schema Migration](#schema-migration)
12. [Best Practices](#best-practices)

---

## Executive Summary

This document provides a detailed overview of the Schema Field Editor application, a specialized web-based tool developed for the MediXtract project. MediXtract is a semi-automated medical data extraction system designed to extract information from medical reports. The Schema Field Editor serves as a quality control and performance tracking system that allows researchers to classify and analyze how well the automated extraction tool performs compared to human-validated data across multiple variables and patients.

---

## Project Background and Motivation

### The MediXtract Context

MediXtract is a tool that extracts information from medical reports semi-automatically, significantly accelerating the data extraction process for medical research studies. The system processes medical documentation and extracts structured data for various clinical variables. However, to ensure accuracy and reliability, it's essential to compare the tool's output against human-extracted and validated data.

### The Need for Performance Tracking

The research team needed a systematic way to:

1. **Compare outputs**: Analyze discrepancies between MediXtract's automated extraction and human-validated data
2. **Classify performance**: Categorize each variable's performance on a per-patient basis
3. **Track improvements**: Identify where the tool performs better than human extraction
4. **Document issues**: Record problems such as missing documentation, contradictory information, or variables requiring clarification
5. **Monitor resolution**: Track when identified issues are resolved
6. **Maintain data integrity**: Keep detailed records of all classifications with timestamps and comments

---

## Application Architecture

### Technology Stack

The Schema Field Editor is built as a single-page web application using:

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with custom properties for theming
- **Data Format**: JSON Schema
- **File System**: File System Access API (with fallback for unsupported browsers)
- **Storage**: LocalStorage for user preferences and settings

### Core Components

The application currently consists of three main files:

1. **index.html**: Application structure and layout
2. **script.js**: Core application logic and data management
3. **styles.css**: Comprehensive styling with theme support

---

## Current Project Structure

### Proposed Modular Architecture

The application is planned to be refactored into a modular structure for better maintainability and scalability:

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

### Module Descriptions

#### Core Modules

**SchemaEditor.js**
- Main orchestrator class (lightweight)
- Coordinates between services and components
- Minimal business logic
- Event delegation

**StateManager.js**
- Centralized application state
- Immutable state updates
- State subscriptions for reactive updates
- State persistence coordination

**EventBus.js**
- Pub/sub pattern for loose coupling
- Component communication without direct dependencies
- Event logging for debugging

#### Service Modules

**FileService.js**
- File System Access API integration
- File reading (schema JSON files)
- File writing (saving new versions)
- Download fallback for unsupported browsers
- Directory scanning
- Version detection

**SchemaService.js**
- Schema parsing and validation
- Schema version management
- Field extraction and processing
- Schema transformation utilities
- Metadata extraction

**FilterService.js**
- Efficient filtering algorithms
- Multi-criteria filtering
- Search functionality
- Filter state management
- Performance optimizations

**StorageService.js**
- LocalStorage abstraction
- Settings persistence
- Data serialization/deserialization
- Storage quota management

#### Component Modules

**TableManager.js**
- Table rendering
- Row generation
- Virtual scrolling (future optimization)
- Row selection
- Column customization
- Sort functionality

**FilterBar.js**
- Filter UI rendering
- Dropdown management
- Three-state toggle buttons
- Search input handling
- Clear filters functionality
- Results counter

**FieldDetailsPanel.js**
- Panel open/close animations
- Form rendering
- Field editing
- Real-time validation
- Auto-save functionality
- Schema structure editor

**SettingsModal.js**
- Settings UI
- Theme selection
- Column order management
- Column visibility toggles
- Width adjustments
- Settings persistence

**EmptyState.js**
- Empty state rendering
- Quick action buttons
- Onboarding messaging

#### UI Modules

**DropdownManager.js**
- Custom dropdown component
- Multi-select functionality
- Checkbox options
- Click-outside-to-close
- Keyboard navigation

**FormBuilder.js**
- Dynamic form generation
- Field type detection
- Auto-resizing textareas
- Collapsible sections
- Validation display

**ThemeManager.js**
- Theme application
- CSS custom property updates
- Theme persistence
- Smooth transitions

**NotificationManager.js**
- Toast notifications
- Success messages
- Error banners
- Loading indicators
- Dismissible alerts

#### Utility Modules

**colorUtils.js**
- Type color generation
- Group color generation (hash-based)
- Theme-aware color palettes
- Contrast calculation

**validators.js**
- Schema validation
- JSON validation
- Field value validation
- Type checking

**formatters.js**
- Date formatting
- Group name formatting
- Text truncation
- Number formatting

**domUtils.js**
- DOM manipulation helpers
- Element creation utilities
- Class management
- Event delegation helpers

---

## Schema Structure

### Schema Format Overview

The schema follows JSON Schema conventions with custom extensions for performance tracking. Each variable in the schema represents a clinical data point that can be extracted from medical records.

### Variable Definition Structure

```javascript
{
  "variable_id": {
    // JSON Schema validation structure
    "anyOf": [
      { "type": "string", "enum": ["0", "1"] },
      { "type": "null" }
    ],
    "default": null,
    
    // Descriptive information
    "description": "Detailed description of what this variable represents",
    
    // Organizational grouping
    "group_id": "group_1",  // or "personal_data" for patient-specific information
    
    // Enum value labels (when applicable)
    "options": {
      "0": "No",
      "1": "Yes"
    },
    
    // Variable-level notes
    "notes": "General observations about this variable's performance across all patients",
    
    // Patient-specific performance tracking (NEW)
    "performance": {
      "patient_001": {
        // Classification flags (sparse booleans - only present if true)
        "match": true,
        "filled_blank": true,
        "correction": true,
        "standardized": true,
        "improved_comment": true,
        "missing_docs": true,
        "missing_docs_suspected": true,
        "contradictions": true,
        "questioned": true,
        "was_personal_data": true,
        "was_missing_docs": true,
        "was_questioned": true,
        
        // Metadata
        "severity": 7,  // Optional 1-10 rating
        "comment": "Detailed explanation for this specific patient case",
        "last_updated": "2025-10-16T14:30:00Z"  // Automatic timestamp
      }
    }
  }
}
```

### Key Schema Features

1. **anyOf Structure**: Maintains JSON Schema validation while allowing nullable fields
2. **Options Dictionary**: Maps enum values to human-readable labels
3. **Group Organization**: Variables organized into logical groups
4. **Notes Field**: Variable-level general observations
5. **Performance Object**: Patient-specific classification data

---

## Performance Classification System

### Classification Categories

#### Status Categories (Mutually Exclusive)

- **pending**: Not yet analyzed
- **match**: Perfect match, both correct
- **not_applicable**: Not applicable (personal data)

#### Improvement Categories (Multiple Allowed)

- **filled_blank**: Tool found, human missed
- **correction**: Tool correct, human wrong
- **standardized**: Applied standard format
- **improved_comment**: Better text/detail

#### Issue/Troubled Categories (Multiple Allowed)

- **missing_docs**: Confirmed missing documentation
- **missing_docs_suspected**: Suspected missing docs
- **contradictions**: Contradictory information
- **questioned**: Needs expert clarification

#### Resolved Categories (Multiple Allowed)

- **was_personal_data**: Fixed personal data issue
- **was_missing_docs**: Fixed missing docs issue
- **was_questioned**: Fixed questioned issue

### Sparse Boolean Storage

Only `true` values are stored:

```javascript
// Sparse approach
{
  "match": true
}

// Instead of verbose
{
  "pending": false,
  "match": true,
  "filled_blank": false,
  // ... etc
}
```

### Severity Rating

Optional 1-10 rating indicating importance/criticality.

### Patient-Specific Comments

Detailed explanations with specific references to documentation.

### Automatic Timestamps

ISO 8601 timestamps track when classifications were made.

---

## Application Features

### 1. Schema Loading and Management

- Multiple schema versions support
- Naming convention: `schema_vNNN.json`
- Folder scanning (File System Access API)
- Manual file selection (fallback)
- Automatic version detection

### 2. Variable Table Display

- Customizable columns
- Drag-and-drop reordering
- Adjustable widths
- Show/hide columns
- Color-coded badges
- Visual status indicators

### 3. Advanced Filtering System

**Filters:**
- Search (real-time text)
- Type (multi-select)
- Group (multi-select)
- Comments (three-state)
- Errors (three-state)
- Changes (three-state)
- Improvements (three-state)

**Features:**
- Real-time updates
- Results counter
- Clear all button
- AND logic combinations

### 4. Field Details Panel

**Sections:**
1. Metadata (description, notes, flags)
2. Basic Properties (type, format, default, group)
3. Enum Options (collapsible)
4. Schema Structure (JSON editor)

**Features:**
- Auto-resizing textareas
- Real-time validation
- Auto-save
- Collapsible sections

### 5. Theme System

**Three themes:**
- Light (default)
- Dark (reduced eye strain)
- Joan (ultra-dark for OLED)

**Features:**
- Instant switching
- Persistent selection
- Comprehensive coverage

### 6. Customizable Layout

- Column reordering
- Width adjustment
- Visibility toggles
- Settings persistence

### 7. Data Export and Saving

- Create new versions
- Direct folder save (when supported)
- Browser download fallback
- Export filtered fields
- Descriptive filenames

### 8. User Interface Elements

- Responsive design
- Keyboard navigation
- Visual feedback
- Loading indicators
- Error banners
- Empty states

---

## Technical Implementation Details

### State Management

Single `SchemaEditor` class manages:
- Current schema
- All loaded schemas
- Field arrays
- Filter state
- Settings

### Efficient Filtering

Two-stage process:
1. Preprocessing on load
2. Single-pass filtering on interaction

### File System Integration

- Modern File System Access API
- Graceful degradation
- Read/write operations
- Version detection

### Auto-Resizing Textareas

Dynamic height adjustment based on content with min/max constraints.

### Color Generation

- Type colors (predefined palettes)
- Group colors (hash-based assignment)
- Theme-aware palettes

---

## Future Development

### Patient Classification UI

**Planned features:**
1. Patient selection dropdown/input
2. Classification checkboxes (grouped)
3. Severity slider (1-10)
4. Comment textarea
5. Patient list view
6. Edit/delete classifications

**Workflow options:**
- Variable-first (select variable, add patients)
- Patient-first (select patient, classify variables)
- Matrix view (variables × patients grid)

### Statistics and Reporting

- Summary statistics per variable
- Per-patient overview
- Filter by classifications
- Export reports
- Visual charts

### Validation Rules

- Prevent contradictory combinations
- Suggest logical category sets
- Warning messages

---

## Use Cases and Workflows

### Initial Setup

1. Open application
2. Scan folder or select files
3. Review loaded schema

### Variable Review

1. Search/filter variables
2. Click to open details
3. Review definition

### Future Classification Workflow

1. Select variable
2. Choose/enter patient ID
3. Check classification boxes
4. Set severity (optional)
5. Add detailed comment
6. Save classification
7. Repeat for other patients

### Export and Version Control

1. Make changes
2. Save as new version
3. Export filtered subsets

---

## Schema Migration

### Python Migration Script

Transforms legacy schemas to new format:

**Transformations:**
- Extract options from descriptions
- Rename `comments` to `notes`
- Remove deprecated fields
- Rename `group_4` to `personal_data`
- Preserve essential fields

**Usage:**
```bash
python adapt_schema.py schema_old.json schema_new.json
```

**Features:**
- Statistics reporting
- Option extraction
- Field renaming
- Validation

---

## Best Practices

### Schema Organization

1. Use clear, descriptive variable IDs
2. Provide comprehensive descriptions
3. Organize into logical groups
4. Always label enum values
5. Document in notes field

### Classification Guidelines

1. Be specific in comments
2. Use severity ratings
3. Avoid contradictions
4. Reference documentation
5. Track resolution with `was_*` categories

### Performance Considerations

1. Large schemas (1000+ vars) perform well
2. Use filters efficiently
3. Save versions regularly
4. Use Chrome/Edge for best support

---

## Conclusion

The Schema Field Editor is a comprehensive tool for the MediXtract project's quality control needs. It provides schema management and detailed patient-level performance tracking capabilities. The application combines modern web technologies with thoughtful UX design for medical researchers analyzing automated extraction quality.

**Project Status**: Schema structure updated and ready. UI implementation for performance tracking is next.

**Current Version**: Schema v2.0 (with performance structure, pending UI)

**Primary Use Case**: Medical data extraction quality control for neonatal research studies

---

*Document Last Updated: 2025-10-17*
*Project: MediXtract Schema Field Editor*
*Version: 2.0*