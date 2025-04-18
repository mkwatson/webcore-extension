#!/usr/bin/env node

/**
 * Find all cross-package imports in the project.
 * Useful for identifying patterns and potential issues.
 */

const { execSync } = require('child_process');
// const fs = require('fs'); // Unused
// const path = require('path'); // Unused

// Find all imports between packages
function findCrossPackageImports() {
  try {
    console.log('📦 Finding all cross-package imports...');
    
    // Use grep to find all imports from one package to another
    const cmd = 'grep -r --include="*.ts" --include="*.tsx" "from \\"@webcore/" packages';
    const result = execSync(cmd, { encoding: 'utf-8' }).trim();
    
    const lines = result.split('\n').filter(Boolean);
    
    // Parse results into structured data
    const imports = lines.map(line => {
      // Format is: packages/package-name/path/to/file.ts:import { X } from "@webcore/package-name";
      const [file, importStatement] = line.split(':', 2);
      
      const sourcePackage = file.split('/')[1];
      
      // Extract the target package from the import statement
      const match = importStatement.match(/@webcore\/([^/]+)/);
      const targetPackage = match ? match[1] : 'unknown';

      // Check if it's using the new standardized import pattern
      const isStandardPattern = importStatement.includes('@webcore/shared/types/') || 
                                importStatement.includes('@webcore/shared/constants/');
      
      return {
        sourceFile: file,
        sourcePackage,
        targetPackage,
        import: importStatement.trim(),
        isStandardPattern
      };
    });
    
    // Group by source and target packages
    const byPackages = {};
    
    imports.forEach(item => {
      const key = `${item.sourcePackage} -> ${item.targetPackage}`;
      if (!byPackages[key]) {
        byPackages[key] = [];
      }
      byPackages[key].push(item);
    });
    
    // Print summary
    console.log(`\nFound ${imports.length} cross-package imports:`);
    
    Object.entries(byPackages).forEach(([key, items]) => {
      console.log(`\n${key} (${items.length} imports):`);
      items.forEach(item => {
        console.log(`  ${item.sourceFile}: ${item.import}`);
      });
    });
    
    // Check for problematic backend imports (those not using standardized pattern)
    const problematicBackendImports = imports.filter(item => 
      item.sourcePackage === 'backend' && 
      !item.isStandardPattern
    );
    
    if (problematicBackendImports.length > 0) {
      console.log('\n⚠️ WARNING: Found non-standardized imports in backend:');
      problematicBackendImports.forEach(item => {
        console.log(`  ${item.sourceFile}: ${item.import}`);
        console.log('  💡 Use the standardized pattern: import from "@webcore/shared/types/..." or "@webcore/shared/constants/..."');
      });
    }

    // Check for old-style imports in any package
    const oldStyleImports = imports.filter(item => 
      item.import.includes('@webcore/shared/messaging-types')
    );
    
    if (oldStyleImports.length > 0) {
      console.log('\n⚠️ WARNING: Found deprecated import patterns:');
      oldStyleImports.forEach(item => {
        console.log(`  ${item.sourceFile}: ${item.import}`);
        console.log('  💡 Update to use "@webcore/shared/types/messaging" instead.');
      });
    }
    
  } catch (error) {
    console.error('Error finding cross-package imports:', error);
  }
}

// Run the main function
findCrossPackageImports(); 