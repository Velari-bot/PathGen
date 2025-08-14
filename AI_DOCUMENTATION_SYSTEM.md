# AI Documentation System

This system automatically provides comprehensive Fortnite knowledge to every AI response while allowing users to add their own personal strategies.

## How It Works

### 1. Developer Documentation (Automatic)
- **Location**: `src/lib/ai-docs/index.ts`
- **Content**: Zone guides, mechanics, strategies, meta analysis, and pro tips
- **Usage**: Automatically included in every AI response
- **Management**: Use `/admin/docs` page to edit and manage

### 2. User Personalization (Optional)
- **Location**: User's browser localStorage
- **Content**: Personal strategies, goals, and custom knowledge
- **Usage**: Combined with developer documentation for personalized responses
- **Management**: Users can edit via AI Training section in `/ai` page

## File Structure

```
src/
├── lib/
│   └── ai-docs/
│       └── index.ts          # Core documentation and functions
├── app/
│   ├── ai/
│   │   └── page.tsx          # AI chat with training options
│   └── admin/
│       └── docs/
│           └── page.tsx      # Documentation management interface
```

## Core Functions

### `getFullDocumentation()`
Returns all documentation sections combined into one string.

### `getDocumentationSection(section)`
Returns a specific section (zoneGuides, mechanics, strategies, metaAnalysis, tipsAndTricks).

### `getDocumentationSummary()`
Returns a brief description of the AI's capabilities for the prompt.

## Adding New Documentation

1. **Edit the source file**: `src/lib/ai-docs/index.ts`
2. **Add new sections**: Create new constants and export them
3. **Update the interface**: Add new fields to `AIDocumentation`
4. **Update functions**: Modify `getFullDocumentation()` and `getDocumentationSection()`

## Example Usage

```typescript
import { getFullDocumentation, getDocumentationSummary } from '@/lib/ai-docs';

// In your AI prompt generation
const developerDocs = getFullDocumentation();
const developerSummary = getDocumentationSummary();

const prompt = `
${developerSummary}

${developerDocs}

User's custom knowledge: ${userCustomKnowledge}
User's goals: ${userGoals}
`;
```

## Admin Interface

Visit `/admin/docs` to:
- View all documentation sections
- Edit content in real-time
- Preview the full documentation
- Export/import documentation files

## Benefits

1. **Consistent Knowledge**: Every user gets the same high-quality base knowledge
2. **Personalization**: Users can still add their own strategies and goals
3. **Easy Management**: Developer can update documentation without code changes
4. **Scalable**: Documentation grows with the application
5. **Maintainable**: Centralized knowledge management

## Future Enhancements

- Database storage for documentation
- Version control and change history
- User contribution system
- Documentation analytics
- Multi-language support
- API endpoints for external management

## Notes

- Current implementation uses in-memory storage (changes don't persist on page refresh)
- For production, implement proper storage (database, file system, or CMS)
- Consider adding validation for documentation content
- Monitor AI response quality and adjust documentation accordingly
