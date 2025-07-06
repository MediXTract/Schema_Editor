# 📘 Schema Field Editor

A modern, browser-based editor for managing and editing JSON Schema fields. Load multiple schema files, filter and view fields with ease, and make inline changes — all from a clean, responsive interface.

---

## 🚀 Features

- 🗂 **Folder and file loading** (using File System Access API or manual file selection)
- 🔍 **Advanced filtering** by type, group, comments, errors, and changes
- 🧩 **Inline field editing** with real-time UI updates
- 🧪 **Enum support**, group management, and schema version tracking
- 💾 **One-click saving** with versioned filenames (`schema_v001.json`, etc.)
- 📱 **Responsive design** for desktop and mobile

---

## 🛠️ Usage

### 1. Clone the repository

```bash
git clone https://github.com/your-username/schema-field-editor.git
cd schema-field-editor
```

### 2. Open `index.html` in a supported browser

> 💡 Best experienced in Chrome or Edge (supports File System Access API). Firefox and Safari users can manually select `.json` files.

---

## 📂 File Structure

```bash
schema-field-editor/
├── index.html          # Main HTML file
├── styles.css          # Modern UI styles
├── script.js           # Application logic
└── README.md           # You're here!
```

---

## 📤 How to Deploy

You can host this app on GitHub Pages or any static web server:

### GitHub Pages

1. Push to GitHub
2. In repo settings, enable GitHub Pages (source: `/main` or `/docs`)
3. Done — your app is live at:
   ```
   https://your-username.github.io/schema-field-editor/
   ```

---

## 🧪 Example Schema Format

Make sure your `.json` files follow this general format:

```json
{
  "type": "object",
  "properties": {
    "field_name": {
      "type": "string",
      "description": "A sample field",
      "group_id": "group_a",
      "comments": "This is optional",
      "errors": true,
      "changes": false
    }
  }
}
```

For version detection, use filenames like `schema_v001.json`, `schema_v002.json`, etc.

---

## 🙌 Credits

Created with 💙 by [MediXTract](https://github.com/MediXTract)  
Inspired by the need for simpler JSON Schema editing tools.

---

## 📄 License

MIT License. Free to use, modify, and distribute.
