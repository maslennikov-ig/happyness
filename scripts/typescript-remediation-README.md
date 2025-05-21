# TypeScript Error Remediation Tools

This directory contains tools to help with fixing TypeScript errors throughout the project. These tools are meant to complement the comprehensive TypeScript Error Remediation Plan (see `docs/typescript-errors-remediation-plan.md`).

## Automated Fix Script

The `fix-ts-errors.ts` script provides automated fixes for some of the most common TypeScript errors found in the codebase. It can significantly reduce the manual work required to fix repeated patterns of TypeScript errors.

### Prerequisites

To use these scripts, you need:

1. Node.js 18+ installed
2. TypeScript installed (`npm install -g typescript`)
3. ts-node installed for running TypeScript scripts directly (`npm install -g ts-node`)
4. Required dependencies: `npm install glob typescript fs-extra`

### Using the Fix Script

The script can be run in different modes to target specific types of errors:

```bash
# Dry run to see what would be fixed without making changes
npx ts-node scripts/fix-ts-errors.ts --dry-run

# Fix all identified issues
npx ts-node scripts/fix-ts-errors.ts --fix-all

# Fix only DTO decorator issues
npx ts-node scripts/fix-ts-errors.ts --fix-dto-decorators

# Fix error handling in catch blocks
npx ts-node scripts/fix-ts-errors.ts --fix-error-handling

# Fix controller return types
npx ts-node scripts/fix-ts-errors.ts --fix-controllers

# Target a specific directory
npx ts-node scripts/fix-ts-errors.ts --fix-all --path src/backend/modules/auth/
```

Always run with `--dry-run` first to see what changes would be made before applying them.

### What Issues Can It Fix?

The script currently addresses the following common issues:

#### 1. DTO Decorator Issues

- Missing commas in decorator options
- Improper parentheses in validation decorators
- Examples:

  ```typescript
  // Before
  @ApiProperty({
    description: 'Email пользователя'  // Missing comma
    example: 'user@example.com'
  })
  @IsEmail({} { message: 'Некорректный формат' })  // Missing comma

  // After
  @ApiProperty({
    description: 'Email пользователя',  // Comma added
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Некорректный формат' })  // Comma added
  ```

#### 2. Improper Error Handling

- Adds type annotations to catch error parameters
- Adds proper type checking before accessing error properties
- Examples:

  ```typescript
  // Before
  try {
    // ...
  } catch (error) {
    // No type annotation
    if (error.code === 'P2025') {
      // Unsafe property access
      // ...
    }
  }

  // After
  try {
    // ...
  } catch (error: unknown) {
    // Added type annotation
    // Type-safe error handling
    if (typeof error === 'object' && error !== null && 'code' in error) {
      if ((error as { code: unknown }).code === 'P2025') {
        // ...
      }
    }
  }
  ```

#### 3. Controller Method Return Types

- Adds explicit return types to controller methods
- Examples:

  ```typescript
  // Before
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    // ...
  }

  // After
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<any> {
    // ...
  }
  ```

### Limitations

The automated fixes have some limitations:

1. The script uses regex patterns to identify issues, which may not catch all cases or may produce incorrect changes in complex code structures.
2. The added types may be too general (`any` or `unknown`) and should be refined manually to more specific types.
3. Not all TypeScript errors can be fixed automatically, especially those requiring deeper understanding of the code's intent.

### Best Practices When Using the Script

1. **Always commit your changes** before running the script so you can revert if needed.
2. Run with `--dry-run` first to review potential changes.
3. After applying fixes, run tests to ensure nothing was broken.
4. Review the changes to refine generic types to more specific ones.
5. Run TypeScript compiler again to see if the remaining errors are reduced.

## Manual Fixes for Common Errors

For errors that can't be fixed automatically, refer to these patterns:

### 1. Missing Type Declarations for Path Aliases

Create declaration files for missing modules, especially for path aliases:

```typescript
// src/frontend/lib/validations/auth.d.ts
declare module '@/lib/validations/auth' {
  import * as z from 'zod';

  export const registerStep1Schema: z.ZodObject<any>;
  export type RegisterStep1FormValues = z.infer<typeof registerStep1Schema>;
  // ... other exports
}
```

### 2. Incomplete Interface Implementations for Mocks

When mocking classes, ensure all required properties and methods are implemented:

```typescript
// Before
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {}
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
};

// After
global.IntersectionObserver = class IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [0];

  constructor(callback: IntersectionObserverCallback) {}
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};
```

### 3. Property Initialization Issues

Use definite assignment assertions (!) or initialize properties in DTO classes:

```typescript
// Before
export class RegisterDto {
  email: string; // Error: Property has no initializer and is not definitely assigned
  password: string;
}

// After - Option 1: Use definite assignment assertion
export class RegisterDto {
  email!: string;
  password!: string;
}

// After - Option 2: Use initialization
export class RegisterDto {
  email: string = '';
  password: string = '';
}
```

## Contact

If you have questions about these tools or suggestions for improving them, please contact the Core TypeScript Team or open an issue in the project repository.
