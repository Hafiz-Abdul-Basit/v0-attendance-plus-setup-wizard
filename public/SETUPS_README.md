# Setups Tab - Truancy Configuration Manager

## Overview

The new **Setups** tab provides a comprehensive interface for managing configuration data across multiple records simultaneously. Currently implemented:

### 1. Truancy Configuration (Active)
- Bulk edit properties across all truancy configuration records
- Real-time change preview with modification counts
- JSON export functionality
- Visual record browser with color highlights

### 2. Component Configuration (Coming Soon)
- Manage system components for clients

### 3. Setup Configuration (Coming Soon)
- Setup-related configurations

---

## Truancy Configuration Manager Features

### Bulk Edit Fields
Update these fields across all records at once:
- **Period** - School year period (e.g., "SchoolYear", "6 months")
- **Action** - Action type (e.g., "Truancy Warning Letter 1")
- **Category** - Absence category (e.g., "UnExcused Absence")
- **Highlight Color** - Color code with picker (e.g., "#b7effb")
- **User Type** - User type designation (e.g., "campus")
- **Description** - Description text
- **Category Title** - Category display title

### How to Use

1. **Click "Show Editor"** - Opens the bulk edit panel
2. **Enter Values** - Leave fields empty to skip them
3. **See Change Count** - Each field shows how many records will be affected
4. **Apply Changes** - Click "Apply Changes to All Records" button
5. **Preview JSON** - Click "Preview JSON" to see the updated data
6. **Export** - Click "Export JSON" to download the configuration file

### Real-Time Features

✓ Change counters show how many records will be affected per field
✓ Records summary displays all current records with their actions and colors
✓ JSON preview shows the exact data structure before export
✓ Instant visual feedback with color highlights in the record list

### Export Format

Downloaded file format:
```
truancy-configuration-YYYY-MM-DD.json
```

Contains the complete updated truancy configuration array ready to be imported into your system.

---

## Files Created

- `/components/client-setup/SetupsTabs.tsx` - Main tab container
- `/components/client-setup/TruancyConfigurationEditor.tsx` - Bulk editor component
- `/components/client-setup/ComponentConfigurationViewer.tsx` - Component viewer (placeholder)

## Access

The Setups tab is available in the main navigation header next to "Setup Agent" and "View Snippets" buttons.

---

## Future Enhancements

- Import JSON configuration files
- Duplicate configurations for multiple clients
- Schedule bulk updates
- Configuration versioning and rollback
