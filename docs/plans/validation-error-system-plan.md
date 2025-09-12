# Validation Error System Feature Plan (Нужна детальная проработка)

## Overview
Create a universal validation error handling system that automatically generates error messages based on validator names and field names, eliminating the need for hardcoded error messages in components.

## Goals
1. **DRY Principle**: Remove duplicate error message logic across components
2. **Maintainability**: Centralize error message generation
3. **Consistency**: Ensure uniform error messages across the application
4. **Extensibility**: Easy to add new validators and fields
5. **Internationalization Ready**: Structure for future i18n support

## Architecture

### 1. Validation Error Service (`shared/services/validation/`)
- **Location**: `src/shared/services/validation/validation-error.service.ts`
- **Purpose**: Generate error messages from validator names and field names
- **Method**: `getErrorMessage(validatorName: string, fieldName: string, errorValue?: any): string`

### 2. Validation Error Interface (`shared/lib/types/`)
- **Location**: `src/shared/lib/types/validation-error.types.ts`
- **Purpose**: Define types for validation error handling
- **Interfaces**:
  - `ValidationErrorConfig` - Configuration for error messages
  - `FieldErrorMap` - Mapping of field names to display names
  - `ValidatorErrorMap` - Mapping of validator names to error templates

### 3. Validation Utilities (`shared/lib/utils/`)
- **Location**: `src/shared/lib/utils/validation.utils.ts`
- **Purpose**: Helper functions for form validation
- **Functions**:
  - `getFirstFormError(form: FormGroup, fieldOrder: string[]): string | null`
  - `getFieldDisplayName(fieldName: string): string`

## Implementation Details

### Phase 1: Core Error Service
```typescript
// validation-error.service.ts
@Injectable({ providedIn: 'root' })
export class ValidationErrorService {
  private readonly fieldNames: Record<string, string> = {
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    // ... more fields
  };

  private readonly validatorMessages: Record<string, string> = {
    required: 'is required',
    email: 'must be a valid email address',
    pattern: 'has invalid format',
    minlength: 'must be at least {min} characters',
    maxlength: 'must be no more than {max} characters',
    min: 'must be at least {min}',
    max: 'must be no more than {max}',
    passwordMismatch: 'passwords do not match',
    // ... more validators
  };

  getErrorMessage(validatorName: string, fieldName: string, errorValue?: any): string {
    const fieldDisplayName = this.fieldNames[fieldName] || fieldName;
    const template = this.validatorMessages[validatorName] || validatorName;
    
    // Replace placeholders in template
    let message = template.replace('{min}', errorValue?.requiredLength || errorValue?.min);
    message = message.replace('{max}', errorValue?.requiredLength || errorValue?.max);
    
    return `${fieldDisplayName} ${message}`;
  }
}
```

### Phase 2: Validation Utilities
```typescript
// validation.utils.ts
export function getFirstFormError(
  form: FormGroup, 
  fieldOrder: string[], 
  errorService: ValidationErrorService
): string | null {
  for (const fieldName of fieldOrder) {
    const control = form.get(fieldName);
    if (control?.touched && control.errors) {
      const firstValidator = Object.keys(control.errors)[0];
      const errorValue = control.errors[firstValidator];
      return errorService.getErrorMessage(firstValidator, fieldName, errorValue);
    }
  }
  return null;
}

export function getFieldDisplayName(fieldName: string): string {
  return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
}
```

### Phase 3: Component Integration
```typescript
// In components (login/register)
export class LoginComponent {
  private readonly validationErrorService = inject(ValidationErrorService);
  
  protected getLastError(): string | null {
    // Backend error has priority
    const backendError = this.error();
    if (backendError) {
      return backendError;
    }

    // Use utility function for form errors
    return getFirstFormError(this.form, ['email', 'password'], this.validationErrorService);
  }
}
```

## File Structure
```
src/shared/
├── services/
│   └── validation/
│       ├── validation-error.service.ts
│       ├── validation-error.service.spec.ts
│       └── index.ts
├── lib/
│   ├── types/
│   │   ├── validation-error.types.ts
│   │   └── index.ts
│   └── utils/
│       ├── validation.utils.ts
│       ├── validation.utils.spec.ts
│       └── index.ts
```

## Migration Plan

### Step 1: Create Core Services
1. Create `ValidationErrorService` with basic validator support
2. Create validation utility functions
3. Add comprehensive tests

### Step 2: Update Components
1. Refactor `LoginComponent.getLastError()` to use new system
2. Refactor `RegisterComponent.getLastError()` to use new system
3. Remove hardcoded error messages

### Step 3: Extend Support
1. Add support for custom validators
2. Add field name configuration
3. Add error message templates for complex validators

### Step 4: Future Enhancements
1. Add i18n support
2. Add custom error message overrides
3. Add validation error styling utilities

## Benefits
- **Reduced Code Duplication**: Single source of truth for error messages
- **Easier Maintenance**: Update error messages in one place
- **Better UX**: Consistent error message formatting
- **Scalability**: Easy to add new validators and fields
- **Testability**: Centralized logic is easier to test

## Testing Strategy
- Unit tests for `ValidationErrorService`
- Unit tests for validation utilities
- Integration tests with form components
- Edge case testing for missing validators/fields

## Dependencies
- Angular Reactive Forms
- TypeScript strict mode
- Existing form validation patterns

## Success Criteria
1. All hardcoded error messages removed from components
2. Error messages are consistent across the application
3. Easy to add new validators without component changes
4. 100% test coverage for validation services
5. No performance impact on form validation
