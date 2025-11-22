# Testing

```bash
yarn test              # Run all tests
yarn test:watch        # Watch mode
yarn test:coverage     # Coverage report
```

## Coverage

- **437 tests** across 27 suites
- Unit tests for components, services, and utilities
- Mocked Supabase and AI calls

## Best Practices

- Test behavior, not implementation
- Use Testing Library queries (`getByRole`, `getByText`)
- Mock external dependencies
- Keep tests isolated
