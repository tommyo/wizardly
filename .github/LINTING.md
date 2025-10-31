# Linting Configuration

This project uses ESLint with Airbnb-style rules for code quality and consistency.

## Configuration

The linting setup is defined in [`eslint.config.ts`](../eslint.config.ts) and includes:

### Style Guides

1. **Airbnb JavaScript/TypeScript Style Guide**
   - Single quotes for strings
   - No semicolons
   - 2-space indentation
   - Trailing commas in multiline structures
   - Consistent spacing and formatting

2. **Vue.js Best Practices**
   - Vue 3 composition API patterns
   - Component naming conventions
   - Template formatting

3. **TypeScript Best Practices**
   - Type safety enforcement
   - Explicit return types (optional)
   - No explicit `any` (warning)

### Linters Used

- **ESLint**: Main linting engine
- **oxlint**: Fast Rust-based linter for additional checks
- **TypeScript ESLint**: TypeScript-specific rules
- **Vue ESLint**: Vue.js-specific rules
- **Import Plugin**: Import/export statement organization

## Running Linters

### Lint All Files

```bash
npm run lint
```

This runs both oxlint and ESLint in sequence.

### Lint with ESLint Only

```bash
npm run lint:eslint
```

### Lint with oxlint Only

```bash
npm run lint:oxlint
```

### Auto-fix Issues

Both linters support auto-fixing:

```bash
npm run lint  # Auto-fixes what it can
```

## Key Rules

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes (`'hello'`)
- **Semicolons**: Required at end of statements
- **Trailing Commas**: Required in multiline objects/arrays
- **Arrow Functions**: Preferred over function expressions
- **Const/Let**: Use `const` by default, `let` when reassignment needed
- **No var**: `var` is forbidden

### Import Organization

Imports are automatically organized in this order:
1. Built-in Node.js modules
2. External packages
3. Internal modules
4. Parent directory imports
5. Sibling imports
6. Index imports

Example:
```typescript
import fs from 'fs'
import { ref } from 'vue'
import { myUtil } from '@/utils'
import { helper } from '../helpers'
import { sibling } from './sibling'
```

### TypeScript Rules

- **Unused Variables**: Error (except those prefixed with `_`)
- **Explicit Any**: Warning (discouraged but allowed)
- **Non-null Assertions**: Warning (use sparingly)
- **Return Types**: Optional (inferred types are fine)

### Vue Rules

- **Component Names**: Multi-word names not required
- **Attributes Per Line**: Max 3 on single line, 1 per line in multiline
- **Template Indentation**: 2 spaces
- **Script Indentation**: 2 spaces, no base indent

## Warnings vs Errors

### Errors (Must Fix)

- Syntax errors
- Unused variables (except `_` prefixed)
- Missing semicolons (when required by ASI rules)
- Incorrect indentation
- Case declarations without blocks

### Warnings (Should Fix)

- `console.log` statements (use `console.warn` or `console.error` instead)
- Non-null assertions (`!`) - use type guards when possible
- Explicit `any` types - prefer proper typing

## IDE Integration

### VS Code

Install the ESLint extension:
```
ext install dbaeumer.vscode-eslint
```

Add to `.vscode/settings.json`:
```json
{
  "eslint.validate": [
    "javascript",
    "typescript",
    "vue"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Other IDEs

Most modern IDEs support ESLint. Check your IDE's documentation for setup instructions.

## CI/CD Integration

Linting runs automatically in GitHub Actions:

- **On Pull Requests**: Full lint check (see [`.github/workflows/ci.yml`](workflows/ci.yml))
- **Before Publishing**: Full lint check (see [`.github/workflows/publish.yml`](workflows/publish.yml))

Failed linting will block:
- Pull request merges
- npm package publishing

## Disabling Rules

### For a Single Line

```typescript
// eslint-disable-next-line no-console
console.log('Debug info')
```

### For a Block

```typescript
/* eslint-disable no-console */
console.log('Debug 1')
console.log('Debug 2')
/* eslint-enable no-console */
```

### For an Entire File

```typescript
/* eslint-disable no-console */
// Rest of file...
```

**Note**: Disabling rules should be rare and well-justified.

## Common Issues

### "Parsing error" in Vue files

Make sure you're using the latest version of `eslint-plugin-vue` and that your `eslint.config.ts` properly configures Vue file parsing.

### Import order errors

Run `npm run lint` to auto-fix import ordering issues.

### Indentation errors

Configure your editor to use 2 spaces for indentation. Most auto-fix on save.

### TypeScript errors vs ESLint errors

- **TypeScript errors**: Type checking issues (run `npm run type-check`)
- **ESLint errors**: Code style and quality issues (run `npm run lint`)

Both must pass for CI/CD to succeed.

## Customization

To modify linting rules, edit [`eslint.config.ts`](../eslint.config.ts):

```typescript
rules: {
  // Change severity: 'off' | 'warn' | 'error'
  'no-console': 'warn',
  
  // Customize rule options
  'indent': ['error', 2, { SwitchCase: 1 }],
}
```

After changes, run `npm run lint` to verify the configuration works.

## Resources

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Vue ESLint Plugin](https://eslint.vuejs.org/)
- [TypeScript ESLint](https://typescript-eslint.io/)