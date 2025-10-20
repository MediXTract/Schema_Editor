/**
 * FileService - File operations (read, write, download)
 * FIXED: Removed double folder selection prompt
 */
export class FileService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Check if File System Access API is supported
     * @returns {boolean} True if supported
     */
    isFileSystemAccessSupported() {
        return 'showDirectoryPicker' in window;
    }

    /**
     * Scan folder for schema files
     * @returns {Promise<number>} Number of found schemas
     */
    async scanFolder() {
        if (!this.isFileSystemAccessSupported()) {
            throw new Error('File System Access API not supported');
        }

        // FIX: Let the CALLER handle showDirectoryPicker, not this method
        // Or if we handle it here, don't require the caller to also call it
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        this.stateManager.setDirectoryHandle(dirHandle);

        const allSchemas = new Map();
        let foundSchemaFiles = 0;

        for await (const [name, handle] of dirHandle.entries()) {
            if (handle.kind === 'file' && name.endsWith('.json')) {
                const versionMatch = name.match(/^schema_v(\d+)\.json$/);
                if (versionMatch) {
                    try {
                        const file = await handle.getFile();
                        const content = await file.text();
                        const data = JSON.parse(content);

                        if (data.type === 'object' && data.properties) {
                            const version = parseInt(versionMatch[1]);
                            allSchemas.set(version, { data, filename: name });
                            foundSchemaFiles++;
                        }
                    } catch (error) {
                        console.warn(`Skipping invalid schema file: ${name}`, error);
                    }
                }
            }
        }

        if (foundSchemaFiles === 0) {
            throw new Error('No valid schema files found. Looking for files named schema_vNNN.json');
        }

        // Store all schemas in state
        allSchemas.forEach((value, key) => {
            this.stateManager.addSchemaVersion(key, value.data, value.filename);
        });

        return foundSchemaFiles;
    }

    /**
     * Load files manually
     * @param {FileList} files - FileList from input element
     * @returns {Promise<number>} Number of loaded schemas
     */
    async loadFiles(files) {
        const allSchemas = new Map();
        let foundSchemaFiles = 0;

        for (const file of files) {
            if (file.name.endsWith('.json')) {
                const versionMatch = file.name.match(/^schema_v(\d+)\.json$/);
                if (versionMatch) {
                    try {
                        const content = await this.readFileContent(file);
                        const data = JSON.parse(content);

                        if (data.type === 'object' && data.properties) {
                            const version = parseInt(versionMatch[1]);
                            allSchemas.set(version, { data, filename: file.name });
                            foundSchemaFiles++;
                        }
                    } catch (error) {
                        console.warn(`Skipping invalid schema file: ${file.name}`, error);
                    }
                }
            }
        }

        if (foundSchemaFiles === 0) {
            throw new Error('No valid schema files found. Looking for files named schema_vNNN.json');
        }

        // Store all schemas in state
        allSchemas.forEach((value, key) => {
            this.stateManager.addSchemaVersion(key, value.data, value.filename);
        });

        return foundSchemaFiles;
    }

    /**
     * Read file content
     * @param {File} file - File object
     * @returns {Promise<string>} File content
     */
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Save schema to file
     * @param {Object} schema - Schema object
     * @param {number} version - Version number
     * @returns {Promise<string>} Filename
     */
    async saveSchema(schema, version) {
        const filename = `schema_v${version.toString().padStart(3, '0')}.json`;
        const content = JSON.stringify(schema, null, 2);

        const state = this.stateManager.getState();
        const dirHandle = state.directoryHandle;

        if (dirHandle) {
            try {
                const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();
                return filename;
            } catch (error) {
                console.warn('Failed to save to folder, falling back to download:', error);
            }
        }

        // Fallback to download
        this.downloadFile(filename, content);
        return filename;
    }

    /**
     * Download file
     * @param {string} filename - Filename
     * @param {string} content - File content
     */
    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}