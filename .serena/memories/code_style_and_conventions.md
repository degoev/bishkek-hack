# Code Style and Conventions

## TypeScript Configuration

### Compiler Options (Next.js)
- **Target**: ES2020
- **Strict Mode**: Enabled
- **Module**: ESNext with Bundler resolution
- **JSX**: preserve (for Next.js)
- **Force Consistent Casing**: Enabled
- **Skip Lib Check**: true
- **Path Alias**: `~~/` maps to package root

### TypeScript Best Practices
- Always use strict typing
- Avoid `any` types
- Use TypeScript for all new files (.ts, .tsx)
- Type checking runs automatically via lint-staged on commit

## Prettier Configuration

### Next.js/TypeScript Files
```json
{
  "arrowParens": "avoid",
  "printWidth": 120,
  "tabWidth": 2,
  "trailingComma": "all"
}
```

### Import Order (Next.js)
1. React imports (`^react$`)
2. Next.js imports (`^next/(.*)$`)
3. Third-party modules
4. Heroicons (`^@heroicons/(.*)$`)
5. Internal imports (`^~~/(.*)$`)

**Plugins**:
- `@trivago/prettier-plugin-sort-imports` - Auto-sorts imports
- `prettier-plugin-tailwindcss` - Sorts Tailwind classes

### Solidity Files (.sol)
```json
{
  "printWidth": 120,
  "tabWidth": 4,
  "singleQuote": false,
  "bracketSpacing": true
}
```

**Plugin**: `prettier-plugin-solidity`

## Solidity Conventions

### File Structure
1. SPDX license identifier at top: `//SPDX-License-Identifier: MIT`
2. Pragma statement: `pragma solidity >=0.8.0 <0.9.0;`
3. Imports (hardhat console.sol for debugging, OpenZeppelin for production patterns)
4. NatSpec documentation
5. Contract declaration

### Documentation
- Use NatSpec comments for contracts and functions:
  ```solidity
  /**
   * Brief description
   * @author Author name
   * @param paramName Description
   * @return Description
   */
  ```
- Inline comments for complex logic
- Comments explaining "why" not just "what"

### Naming Conventions
- **Contracts**: PascalCase (`YourContract`, `MinecraftItems`)
- **Functions**: camelCase (`setGreeting`, `withdraw`)
- **State Variables**: camelCase with visibility (`owner`, `greeting`)
- **Events**: PascalCase (`GreetingChange`)
- **Modifiers**: camelCase (`isOwner`)
- **Constants**: UPPER_SNAKE_CASE
- **Private/Internal**: Prefix with underscore (`_owner`)

### Best Practices
- Always specify visibility (public, private, internal, external)
- Use `immutable` for variables set once in constructor
- Emit events for important state changes
- Use modifiers for access control
- Include security checks (require statements)
- Import OpenZeppelin for battle-tested implementations
- Remove `hardhat/console.sol` imports before production deployment

## React/Next.js Conventions

### Component Structure
```tsx
"use client"; // Add for client components

import React from "react";
import { OtherComponent } from "~~/components/OtherComponent";

const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks first
  // Event handlers
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

### Naming Conventions
- **Components**: PascalCase files and exports (`MyComponent.tsx`)
- **Hooks**: camelCase starting with "use" (`useMyHook.ts`)
- **Utilities**: camelCase (`formatEther.ts`)
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase (`MyProps`, `MyInterface`)

### Best Practices
- Use functional components with `React.FC` or explicit return types
- Add `"use client"` directive for client components (Next.js 13+)
- Use the `~~/` path alias for imports within the package
- Prefer named exports for utilities, default exports for components
- Use Scaffold-ETH hooks (`useScaffoldReadContract`, etc.) for web3 interactions
- Keep components focused and single-purpose
- Extract complex logic into custom hooks

## ESLint & Linting

### Lint-Staged Configuration
- **Next.js files** (`packages/nextjs/**/*.{ts,tsx}`):
  - Runs ESLint with --fix
  - Runs TypeScript type checking
- **Hardhat files** (`packages/hardhat/**/*.{ts,tsx}`):
  - Runs ESLint with --fix

### Pre-commit Hooks
- Husky runs lint-staged before commits
- Automatically formats and lints changed files
- Type checks Next.js code
- Prevents commits if linting/type checking fails

## General Best Practices

### File Organization
- One component/contract per file
- Group related files in directories
- Use index files for clean exports when appropriate
- Keep file names descriptive and consistent

### Comments & Documentation
- Document public APIs and complex logic
- Keep comments up-to-date with code changes
- Use JSDoc/NatSpec for exported functions
- Avoid obvious comments that restate the code

### Git Commits
- Use clear, descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused and atomic
- Follow conventional commits format when possible