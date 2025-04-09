# TypeScript Guidelines

This project uses TypeScript with strict type checking to ensure code quality and catch issues at compile time.

## TypeScript Configuration

Our TypeScript configuration (in `tsconfig.json`) includes:

### Strict Mode

We have enabled the full `strict` mode, which includes:

- `noImplicitAny`: Disallows implicit `any` types
- `strictNullChecks`: Makes handling of null and undefined more explicit
- `strictFunctionTypes`: Enables more accurate function parameter type checking
- `strictBindCallApply`: Enforces correct types for `bind`, `call`, and `apply`
- `strictPropertyInitialization`: Ensures class properties are initialized
- `noImplicitThis`: Prevents implicit `this` references
- `alwaysStrict`: Enforces JavaScript strict mode in all files

### Additional Type Checking

Beyond the standard strict mode, we've enabled:

- `noUnusedLocals`: Reports errors for unused local variables
- `noUnusedParameters`: Reports errors for unused parameters (prefix unused parameters with `_`)
- `noImplicitReturns`: Ensures all code paths in a function return a value
- `noFallthroughCasesInSwitch`: Prevents accidental fallthrough in switch statements
- `exactOptionalPropertyTypes`: Makes optional property types more precise

## Best Practices

Follow these TypeScript best practices for this project:

### Type Declaration

- Always declare types for variables, parameters, and return values
- Use interface for object types that may be extended
- Use type for union types, intersections, or precise object shapes
- Avoid `any` type whenever possible

```typescript
// ✅ Good
interface UserData {
  id: string;
  name: string;
  email?: string; // Optional property
}

// ✅ Good
function processUser(user: UserData): string {
  return user.id;
}

// ❌ Avoid
function processData(data: any): any {
  return data.id;
}
```

### Nullable Values

- Always check for null/undefined when working with values that might be null
- Use optional chaining (`?.`) and nullish coalescing (`??`) for cleaner code

```typescript
// ✅ Good
function getUserName(user?: UserData): string {
  return user?.name ?? 'Guest';
}
```

### Type Assertions

- Use type assertions (`as Type`) only when you know more about a type than TypeScript does
- Prefer type guards over type assertions when possible

```typescript
// ✅ Good: Type guard
function isUserData(obj: unknown): obj is UserData {
  return !!obj && typeof obj === 'object' && 'id' in obj;
}

// ⚠️ Use with caution: Type assertion
const userData = someObject as UserData;
```

### Unused Parameters

- Prefix unused parameters with underscore (`_`) to avoid linter warnings

```typescript
// ✅ Good
element.addEventListener('click', (_event) => {
  // Don't need to use the event parameter
  doSomething();
});
```

## TypeScript with Chrome Extensions

When working with the Chrome extension API:

- Use `@types/chrome` for type definitions (already included in this project)
- Create appropriate interfaces for message passing
- Document any browser-specific behavior

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Chrome Extension TypeScript Starter](https://github.com/chibat/chrome-extension-typescript-starter) 