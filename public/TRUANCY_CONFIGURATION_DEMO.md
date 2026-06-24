# Truancy Configuration Manager - Live Demonstration Guide

## Quick Overview
The Truancy Configuration Manager allows you to update bulk properties for all truancy records at once, then export the updated configuration as JSON. No more manual updates for each client setup!

---

## Step-by-Step Walkthrough

### Step 1: Access the Feature
1. Click the **"Setups"** button in the top header (purple/indigo button)
2. The sidebar will hide and you'll see full-width configuration tabs
3. Click the **"Truancy Configuration"** tab (middle tab)

### Step 2: View Current Records
You'll see:
- **Configuration Manager** header
- **Action buttons** (Show Editor, Preview JSON, Export JSON)
- **Records summary** showing all 14 records with:
  - Action name (e.g., "Warning Letter 1")
  - Period (e.g., "SchoolYear")
  - Color highlight preview (colored box on the right)

Example record display:
```
Truancy Warning Letter 1
Focused Absence | Period: SchoolYear
[Light Blue Color Preview Box]
```

---

## Step 3: Bulk Edit Mode

### Click "Show Editor" Button
The editor panel expands with input fields for:

1. **Period** - e.g., "SchoolYear", "Semester", "Month"
2. **Action** - e.g., "Warning Letter 1", "Parent Conference"
3. **Category** - e.g., "Unexcused Absence", "Excused Absence"
4. **HighlightColor** - Color picker with hex input (e.g., #b7effb)
5. **UserType** - e.g., "campus", "admin", "parent"
6. **Description** - Detailed explanation of the intervention
7. **CategoryTitle** - Display name for the category

### Real-Time Change Preview
As you type, you'll see:
- **"Changes Preview"** section updates instantly
- Shows how many records each field will affect
- Example: "Period: Will update 14 records"
- Example: "Action: Will update 10 records"

---

## Step 4: Apply Changes

### Workflow Example: Update All Records

**Scenario**: You want to set the same period and highlight color for all records

1. **Enter Period**: Type "SchoolYear" in the Period field
   - Preview shows: "Period: Will update 14 records"

2. **Choose Color**: Click the color input or type hex code
   - Change HighlightColor to "#d4a574" (gold)
   - Preview shows: "HighlightColor: Will update 14 records"

3. **Leave Other Fields Empty**: (They won't change)

4. **Click "Apply Changes to All Records"** button
   - Toast notification: "✓ Updated 14 records!"
   - Records on the right refresh with new values
   - Color boxes update to gold

---

## Step 5: Preview Changes

### Click "Preview JSON" Button
A modal shows the exact JSON structure:

```json
[
  {
    "_id": { "$oid": "66955387b1f772d2658f4420" },
    "Period": "SchoolYear",
    "Action": "Truancy Warning Letter 1",
    "Category": "UnExcused Absence",
    "CampusType": "'Elementary School'; 'Middle School'; 'High School'",
    "Role": "",
    "ChooseAction": "Truancy Warning Letter 1:WL1",
    "IsConsecutive": false,
    "TotalAbsences": "",
    "HighlightColor": "#d4a574",
    "UserType": "campus",
    "Description": "...",
    "CategoryTitle": "UnExcused Absence"
  }
  // ... 13 more records
]
```

- Scroll through to verify all changes
- Click "Close" to dismiss

---

## Step 6: Export Configuration

### Click "Export JSON" Button
- File downloads as: `truancy-configuration-2026-06-22.json`
- Contains all updated records ready for database import
- Timestamped filename for version tracking

---

## Advanced Features

### Reset to Defaults
- Click **"Reset to Default"** button
- Reverts all records to original state
- Useful if you make unwanted changes

### Selective Updates
Don't fill all fields - only update what you need:

**Example**: Only change colors
- Leave Period, Action, Category empty
- Enter only HighlightColor: "#ff6b6b"
- Click Apply
- Result: Only color changes, other fields unchanged

### Batch Operations
You can do multiple edit-and-apply cycles:

1. First update: Change all Periods → Apply
2. Second update: Change all Colors → Apply
3. Third update: Change all UserTypes → Apply

All changes are cumulative!

---

## Common Scenarios

### Scenario 1: Update Color Scheme for New School Year
1. Show Editor
2. Enter HighlightColor: "#a78bfa" (purple)
3. Apply Changes
4. Export JSON

### Scenario 2: Standardize User Type for Campus Staff
1. Show Editor
2. Enter UserType: "campus"
3. Apply Changes
4. Export JSON

### Scenario 3: Add Descriptions to All Warnings
1. Show Editor
2. Enter Description: "First level warning for excessive absences"
3. Apply Changes
4. Export JSON
5. Preview to verify
6. Export for import to database

### Scenario 4: Update Multiple Fields at Once
1. Show Editor
2. Enter:
   - Period: "SchoolYear"
   - Category: "Unexcused Absence"
   - HighlightColor: "#fca5a5" (red)
   - UserType: "campus"
3. Apply Changes (all 4 fields update)
4. Preview to verify
5. Export JSON

---

## Tips & Tricks

✓ **Partial Updates**: Empty fields are skipped - perfect for surgical changes
✓ **Color Picker**: Click the colored square for visual color selection
✓ **JSON Preview**: Always check before exporting to catch mistakes
✓ **Multiple Sessions**: Can run multiple cycles of edit → apply → export
✓ **Timestamped Files**: File names include date for easy organization
✓ **No Network Required**: All changes are instant, no API calls

---

## Fields Reference

| Field | Purpose | Example |
|-------|---------|---------|
| Period | School period for intervention | SchoolYear, Semester, Month |
| Action | Type of intervention | Warning Letter 1, Parent Conference |
| Category | Absence category | Unexcused Absence, Excused Absence |
| HighlightColor | UI highlight color (hex) | #b7effb, #fca5a5 |
| UserType | Role level | campus, admin, parent, staff |
| Description | Details about intervention | "First warning for 3 absences" |
| CategoryTitle | Display name | Unexcused Absence |

---

## Troubleshooting

**Q: Changes not showing in preview?**
- A: Make sure you clicked "Apply Changes to All Records"

**Q: Can't see color picker?**
- A: Click the colored square input field next to "HighlightColor"

**Q: Want to undo changes?**
- A: Click "Reset to Default" to revert everything

**Q: File didn't download?**
- A: Check browser download settings and allow pop-ups

**Q: Which records will be updated?**
- A: Check the "Changes Preview" section - it shows the count for each field

---

## Summary

**3-Minute Workflow**:
1. Click "Setups" → "Truancy Configuration"
2. Click "Show Editor"
3. Fill in the fields you want to update
4. Click "Apply Changes to All Records"
5. Click "Preview JSON" to verify
6. Click "Export JSON" to download
7. Import into your database

**Result**: Instantly update configuration for all client setups instead of manually editing each record!
