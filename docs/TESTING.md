# Testing

## Frontend Tests

```bash
cd frontend
yarn test              # Run all tests
yarn test:watch        # Watch mode
yarn test:coverage     # Coverage report
```

### Frontend Coverage

- **437 tests** across 27 suites
- Unit tests for components, services, and utilities
- Mocked Supabase and AI calls

## Backend Tests

```bash
cd backend
source venv/bin/activate

pytest                      # Run all tests (80 tests)
pytest -v                   # Verbose output
pytest --cov=app            # With coverage
pytest --cov=app --cov-report=html  # HTML coverage report
```

### Backend Test Files

| Test File | Description |
|-----------|-------------|
| `test_api_workouts.py` | Workout CRUD operations |
| `test_api_goals.py` | Goals management |
| `test_api_measurements.py` | Body measurements |
| `test_api_profiles.py` | User profiles |
| `test_api_workout_plans.py` | Workout plans, preferences, templates |
| `test_api_selfies.py` | Selfie uploads and signed URLs |
| `test_goal_sync.py` | Goal progress synchronization |
| `test_unit_converter.py` | Unit conversion utilities |

### Backend Coverage

- **80 tests** across 8 test files
- Uses FastAPI TestClient with dependency overrides
- Mocked Supabase client and service classes
- Complete mock data matching Pydantic models

## Best Practices

### Frontend
- Test behavior, not implementation
- Use Testing Library queries (`getByRole`, `getByText`)
- Mock external dependencies
- Keep tests isolated

### Backend
- Use FastAPI's `dependency_overrides` for mocking
- Provide complete mock data matching Pydantic models
- Mock service classes, not database directly
- Test both success and error cases
