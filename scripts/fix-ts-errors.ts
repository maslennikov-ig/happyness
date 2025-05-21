/**
 * TypeScript Error Remediation Script
 *
 * This script helps automate fixing some common TypeScript errors in the codebase.
 * It focuses on the most repetitive error patterns identified in the project.
 *
 * Usage:
 *   npx ts-node scripts/fix-ts-errors.ts [options]
 *
 * Options:
 *   --fix-dto-decorators   Fix common decorator issues in DTO files
 *   --fix-error-handling   Add proper error type checking in catch blocks
 *   --fix-controllers      Fix common controller return type issues
 *   --fix-all              Apply all fixes
 *   --dry-run              Show what would be changed without making changes
 *   --path <path>          Specific path to process (default: src/)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { glob } from 'glob';

// Configure command line arguments
const args = process.argv.slice(2);
const options = {
  fixDtoDecorators: args.includes('--fix-dto-decorators') || args.includes('--fix-all'),
  fixErrorHandling: args.includes('--fix-error-handling') || args.includes('--fix-all'),
  fixControllers: args.includes('--fix-controllers') || args.includes('--fix-all'),
  dryRun: args.includes('--dry-run'),
  targetPath: args.includes('--path') ? args[args.indexOf('--path') + 1] : 'src/',
};

if (args.length === 0 || args.includes('--help')) {
  console.log(`
TypeScript Error Remediation Script

This script helps automate fixing some common TypeScript errors in the codebase.
It focuses on the most repetitive error patterns identified in the project.

Usage:
  npx ts-node scripts/fix-ts-errors.ts [options]

Options:
  --fix-dto-decorators   Fix common decorator issues in DTO files
  --fix-error-handling   Add proper error type checking in catch blocks
  --fix-controllers      Fix common controller return type issues
  --fix-all              Apply all fixes
  --dry-run              Show what would be changed without making changes
  --path <path>          Specific path to process (default: src/)
  `);
  process.exit(0);
}

// Counter for statistics
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  decoratorsFixed: 0,
  errorHandlingsFixed: 0,
  controllersFixed: 0,
};

// Helper function to format counts
function formatCount(count: number): string {
  return count.toString().padStart(5);
}

/**
 * Fix DTO decorator issues
 * - Fix missing commas in decorators
 * - Fix improper parentheses
 */
function fixDtoDecorators(fileContent: string, filePath: string): string {
  if (!filePath.includes('dto')) {
    return fileContent;
  }

  // Fix missing commas in @ApiProperty decorators
  let modified = fileContent.replace(
    /(@ApiProperty\(\{[^}]*?)(\s+description:.*?)(\s+example:)/g,
    '$1$2,$3'
  );

  // Fix IsEmail decorator missing comma
  modified = modified.replace(/(@IsEmail\()({})(\s+{)/g, '$1$2,$3');

  // Fix MinLength decorator missing comma
  modified = modified.replace(/(@MinLength\()(\d+)(\s+{)/g, '$1$2,$3');

  // Fix IsEnum decorator missing comma
  modified = modified.replace(/(@IsEnum\()([A-Za-z]+)(\s+{)/g, '$1$2,$3');

  if (modified !== fileContent) {
    stats.decoratorsFixed++;
  }

  return modified;
}

/**
 * Fix error handling in catch blocks
 * - Add type annotations for error
 * - Add proper type checking before accessing properties
 */
function fixErrorHandling(fileContent: string): string {
  // Find catch blocks with type errors
  let modified = fileContent.replace(
    /catch\s*\(\s*error\s*\)\s*{\s*([^]*?)error\.([a-zA-Z0-9]+)/g,
    (match, prefix, property) => {
      if (match.includes('instanceof') || match.includes(': unknown')) {
        return match; // Already properly typed
      }

      // Create a type-safe replacement
      stats.errorHandlingsFixed++;
      return `catch (error: unknown) {\n    // Type-safe error handling\n    if (typeof error === 'object' && error !== null && '${property}' in error) {\n      ${prefix}(error as { ${property}: unknown }).${property}`;
    }
  );

  return modified;
}

/**
 * Fix common controller issues
 * - Add explicit return types to controller methods
 */
function fixControllers(fileContent: string, filePath: string): string {
  if (!filePath.includes('controller.ts')) {
    return fileContent;
  }

  let modified = fileContent;

  // Add explicit return types to controller methods
  const methodMatches = fileContent.matchAll(
    /@(Get|Post|Put|Patch|Delete)\([^)]*\)\s*\n\s*async\s+([a-zA-Z0-9]+)\(/g
  );

  for (const match of methodMatches) {
    const methodDeclaration = match[0];
    const methodName = match[2];

    if (!methodDeclaration.includes(': Promise<')) {
      const fixedDeclaration = methodDeclaration.replace(
        new RegExp(`async\\s+${methodName}\\(`),
        `async ${methodName}(): Promise<any> (`
      );
      modified = modified.replace(methodDeclaration, fixedDeclaration);
      stats.controllersFixed++;
    }
  }

  return modified;
}

/**
 * Process a single file
 */
async function processFile(filePath: string): Promise<void> {
  try {
    // Only process TypeScript files
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
      return;
    }

    stats.filesProcessed++;
    console.log(`Processing: ${filePath}`);

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let modified = fileContent;

    // Apply fixes based on command line options
    if (options.fixDtoDecorators) {
      modified = fixDtoDecorators(modified, filePath);
    }

    if (options.fixErrorHandling) {
      modified = fixErrorHandling(modified);
    }

    if (options.fixControllers) {
      modified = fixControllers(modified, filePath);
    }

    // Save the modified file if changes were made
    if (modified !== fileContent) {
      stats.filesModified++;
      if (!options.dryRun) {
        fs.writeFileSync(filePath, modified, 'utf-8');
        console.log(`  Fixed issues in: ${filePath}`);
      } else {
        console.log(`  Would fix issues in: ${filePath} (dry run)`);
      }
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

/**
 * Main function to run the script
 */
async function main(): Promise<void> {
  console.log('='.repeat(80));
  console.log(`TypeScript Error Remediation Script`);
  console.log(`Target path: ${options.targetPath}`);
  console.log(`Mode: ${options.dryRun ? 'Dry Run (no changes will be made)' : 'Fix'}`);
  console.log('='.repeat(80));

  try {
    // Find all TypeScript files in the target path
    const files = await glob(`${options.targetPath}**/*.{ts,tsx}`);

    if (files.length === 0) {
      console.log(`No TypeScript files found in ${options.targetPath}`);
      return;
    }

    console.log(`Found ${files.length} TypeScript files to process\n`);

    // Process each file
    for (const file of files) {
      await processFile(file);
    }

    // Print statistics
    console.log('\n='.repeat(80));
    console.log(`Results Summary:`);
    console.log(`  Files processed:      ${formatCount(stats.filesProcessed)}`);
    console.log(`  Files modified:       ${formatCount(stats.filesModified)}`);
    console.log(`  Decorators fixed:     ${formatCount(stats.decoratorsFixed)}`);
    console.log(`  Error handlers fixed: ${formatCount(stats.errorHandlingsFixed)}`);
    console.log(`  Controllers fixed:    ${formatCount(stats.controllersFixed)}`);
    console.log('='.repeat(80));

    if (options.dryRun) {
      console.log('\nThis was a dry run. No changes were made.');
      console.log('To apply these fixes, run the script without the --dry-run flag.');
    } else if (stats.filesModified > 0) {
      console.log('\nFixes applied successfully!');
      console.log(
        'Please review the changes and run tests to ensure everything works as expected.'
      );
      console.log('Some complex issues may still require manual intervention.');
    } else {
      console.log('\nNo issues requiring automatic fixing were found in the specified scope.');
    }
  } catch (error) {
    console.error('Error during execution:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
