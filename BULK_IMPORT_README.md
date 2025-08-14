# Bulk Documentation Import System

## Overview
The bulk import system allows you to upload multiple PDF or TXT files at once and automatically categorize them into the appropriate documentation sections. This makes it much easier to import large amounts of Fortnite knowledge without manually copying and pasting.

## How It Works

### 1. File Upload
- **Supported Formats**: PDF, TXT, MD (Markdown)
- **Multiple Files**: Select multiple files at once
- **File Size**: No strict limit, but larger files may take longer to process

### 2. Auto-Categorization
The system automatically categorizes your content based on keywords:

- **Zone Guides**: zone, map, location, drop, landing, rotation, position, area, region
- **Mechanics**: build, edit, shoot, aim, movement, inventory, shield, health, material
- **Strategies**: strategy, tactic, approach, method, technique, playstyle, engagement
- **Meta Analysis**: meta, weapon, item, balance, patch, update, current, season
- **Tips & Tricks**: tip, trick, advice, help, improve, better, pro, expert

### 3. Manual Categorization
If you prefer manual control, you can disable auto-categorization and files will be imported into the currently selected section.

## Usage Steps

### Step 1: Prepare Your Files
1. **Organize your content** into logical files (e.g., `zone_guide.txt`, `building_tips.pdf`)
2. **Use descriptive filenames** - the system uses filenames to help with categorization
3. **Ensure content is readable** - avoid heavily formatted or image-heavy PDFs

### Step 2: Upload Files
1. Go to `/admin/docs` in your app
2. Click "Choose Files" in the Bulk Import section
3. Select multiple files (PDF, TXT, or MD)
4. Review the selected files list

### Step 3: Configure Import Options
1. **Auto-categorization**: Leave checked for automatic sorting
2. **Manual mode**: Uncheck to import all files into the current section

### Step 4: Import
1. Click "Import X Files" button
2. Watch the progress as files are processed
3. Review the categorized content in the editor
4. Make any manual adjustments if needed
5. Save your changes

## Example File Structure

```
fortnite_docs/
├── zones/
│   ├── tilted_towers_guide.txt
│   ├── retail_row_strategy.pdf
│   └── rotation_tips.md
├── mechanics/
│   ├── building_basics.txt
│   ├── combat_guide.pdf
│   └── movement_tips.md
├── strategies/
│   ├── box_fighting.txt
│   ├── team_tactics.pdf
│   └── solo_strategies.md
└── meta/
    ├── current_weapons.txt
    ├── season_analysis.pdf
    └── patch_notes.md
```

## Testing the System

### Generate Test Files
1. Click "Generate Test Files" in the Test File Generator section
2. Download the generated sample files
3. Use these files to test the bulk import functionality

### Test Files Include
- `zone_guide.txt` - Zone management content
- `building_mechanics.txt` - Building mechanics content
- `advanced_strategies.txt` - Strategy content

## Best Practices

### Content Organization
- **Keep files focused** on one topic per file
- **Use clear headings** with # symbols for better structure
- **Include examples** and specific details
- **Avoid generic content** - be specific to Fortnite

### File Naming
- **Use descriptive names**: `tilted_towers_rotation.txt` vs `guide.txt`
- **Include category hints**: `zone_`, `mech_`, `strat_` prefixes
- **Avoid special characters** in filenames

### Content Quality
- **Be specific**: "Use ramps for height advantage" vs "Build things"
- **Include context**: Explain when and why to use techniques
- **Update regularly**: Keep content current with game changes

## Troubleshooting

### Common Issues

**PDF Parsing Errors**
- Ensure PDFs contain text (not just images)
- Try converting to TXT format if issues persist
- Check file size - very large PDFs may timeout

**Categorization Issues**
- Review the keywords list above
- Add relevant keywords to your content
- Use descriptive filenames
- Consider manual categorization for complex content

**Import Failures**
- Check file formats (PDF, TXT, MD only)
- Ensure files aren't corrupted
- Try importing files one at a time to isolate issues

### Performance Tips
- **Batch similar content** into single files
- **Keep individual files** under 1MB for best performance
- **Process in smaller batches** if importing many files
- **Use TXT format** for fastest processing

## Advanced Features

### Custom Keywords
You can modify the categorization keywords in the `categorizeContent` function in `src/app/admin/docs/page.tsx`:

```typescript
const keywords = {
  zoneGuides: ['zone', 'map', 'location', 'drop', 'landing', 'rotation', 'position', 'area', 'region'],
  mechanics: ['build', 'edit', 'shoot', 'aim', 'movement', 'inventory', 'shield', 'health', 'material'],
  // Add your own custom keywords here
};
```

### File Processing Hooks
The system processes files sequentially, so you can add custom processing logic:

```typescript
// Add custom processing before categorization
if (file.name.includes('custom')) {
  content = processCustomContent(content);
}
```

## Integration with AI

Once imported, all documentation is automatically included in every AI response:

1. **Developer Documentation**: Your imported content
2. **User Personalization**: Individual user preferences and knowledge
3. **Fortnite Tracker Data**: Real-time player stats and information

The AI combines all three sources to provide comprehensive, personalized coaching.

## Future Enhancements

- **Database Storage**: Save imported content to database for persistence
- **Version Control**: Track changes and revert to previous versions
- **Content Validation**: Check for duplicate or conflicting information
- **Bulk Export**: Export all documentation as a single file
- **Content Templates**: Pre-defined templates for common documentation types
- **API Integration**: Import from external sources (Google Docs, Notion, etc.)

## Support

If you encounter issues with the bulk import system:

1. Check the browser console for error messages
2. Verify file formats and sizes
3. Test with the sample files first
4. Review the troubleshooting section above
5. Check the file processing logs in the import progress

The system is designed to be robust and user-friendly, making it easy to build a comprehensive Fortnite knowledge base for your AI coaching system.
