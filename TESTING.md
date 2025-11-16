# Testing Guide

## Overview

GoodHealth uses Jest and React Testing Library for comprehensive unit testing.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
lib/
  __tests__/
    utils.test.ts                    # Utility function tests
  data/
    __tests__/
      gym-equipment.test.ts          # Equipment data tests
components/
  ui/
    __tests__/
      button.test.tsx                # Button component tests
```

## Test Coverage

Current test coverage includes:

### Utility Functions (`lib/__tests__/utils.test.ts`)
- ✅ `cn()` class name merging
- ✅ Conditional class names
- ✅ Tailwind merge conflicts resolution
- ✅ Falsy value filtering

### Gym Equipment Data (`lib/data/__tests__/gym-equipment.test.ts`)
- ✅ All 9 equipment categories exist
- ✅ Cardio equipment has correct type
- ✅ Strength equipment has correct type
- ✅ At least 68 equipment items total
- ✅ Category structure validation
- ✅ `allEquipment` flattening
- ✅ `getEquipmentType()` function
- ✅ Display name formatting

### UI Components (`components/ui/__tests__/button.test.tsx`)
- ✅ Button renders with text
- ✅ Default variant styling
- ✅ Outline variant styling
- ✅ Ghost variant styling
- ✅ Small size styling
- ✅ Large size styling
- ✅ Disabled state
- ✅ Custom className support

## Writing New Tests

### Test File Naming

- Component tests: `ComponentName.test.tsx`
- Utility tests: `functionName.test.ts`
- Place tests in `__tests__/` directory next to source files

### Example Test

```typescript
import { render, screen } from '@testing-library/react'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<MyComponent onClick={handleClick} />)

    const button = screen.getByRole('button')
    button.click()

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## Test Configuration

### jest.config.js

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

### jest.setup.js

```javascript
import '@testing-library/jest-dom'
```

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Every push to `main` or `develop`
- Every pull request to `main` or `develop`

See `.github/workflows/ci.yml` for details.

## Coverage Reports

Coverage reports show:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

View reports:
- Locally: `coverage/lcov-report/index.html`
- CI: Uploaded to Codecov (if configured)

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the component does, not how it does it
   - Test user interactions and visible output

2. **Use Testing Library Queries**
   - Prefer `getByRole`, `getByLabelText`, `getByText`
   - Avoid `querySelector` or `getElementsByClassName`

3. **Keep Tests Isolated**
   - Each test should be independent
   - Don't rely on test execution order

4. **Mock External Dependencies**
   - Mock API calls and external services
   - Use Jest mocks for Supabase calls

5. **Write Meaningful Assertions**
   - Test the actual behavior users care about
   - Include edge cases and error states

## Future Test Coverage

### To Be Added

- [ ] Auth action tests (with Supabase mocks)
- [ ] Workout action tests
- [ ] Goal action tests
- [ ] Form validation tests
- [ ] Navigation tests
- [ ] Integration tests
- [ ] E2E tests with Playwright/Cypress

## Troubleshooting

### Tests Failing Locally

```bash
# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
rm -rf node_modules
npm install

# Ensure all dependencies are installed
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest
```

### TypeScript Errors in Tests

Make sure `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "types": ["jest", "@testing-library/jest-dom"]
  }
}
```

### Module Resolution Issues

Check that `moduleNameMapper` in `jest.config.js` matches your `tsconfig.json` paths.

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Next.js Testing](https://nextjs.org/docs/testing)
