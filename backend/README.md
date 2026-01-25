# GoodHealth Python Backend

FastAPI backend for GoodHealth providing all CRUD operations, AI services, and business logic.

[![Python 3.13](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688.svg)](https://fastapi.tiangolo.com)

## Features

- **Full CRUD API** - Workouts, goals, measurements, profiles, selfies
- **AI Plan Generator** - Personalized workout plans using Google Gemini
- **Weekly Analyzer** - AI-powered performance insights
- **Goal Sync** - Automatic goal progress tracking
- **JWT Authentication** - Validates Supabase tokens

## Quick Start

### Prerequisites

- Python 3.13+
- Supabase project
- Google Gemini API key

### Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### Run

```bash
# Development (with auto-reload)
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Access

- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Google Gemini AI
GEMINI_API_KEY=your-api-key
GEMINI_MODEL=gemini-3.0-flash
```

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update profile |

### Workouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workouts` | List workouts |
| POST | `/api/workouts` | Create workout |
| GET | `/api/workouts/{id}` | Get workout |
| PUT | `/api/workouts/{id}` | Update workout |
| DELETE | `/api/workouts/{id}` | Delete workout |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | List goals |
| POST | `/api/goals` | Create goal |
| PUT | `/api/goals/{id}` | Update goal |
| DELETE | `/api/goals/{id}` | Delete goal |
| PUT | `/api/goals/{id}/progress` | Update progress |

### Measurements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/measurements` | List measurements |
| POST | `/api/measurements` | Create measurement |
| GET | `/api/measurements/latest` | Get latest |
| PUT | `/api/measurements/{id}` | Update |
| DELETE | `/api/measurements/{id}` | Delete |

### Workout Plans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workout-plans` | List plans |
| POST | `/api/workout-plans` | Create plan |
| GET | `/api/workout-plans/{id}` | Get plan |
| PUT | `/api/workout-plans/{id}` | Update plan |
| DELETE | `/api/workout-plans/{id}` | Delete plan |
| POST | `/api/workout-plans/{id}/activate` | Activate |
| POST | `/api/workout-plans/{id}/complete` | Complete |

### Weekly Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weekly-analysis/latest` | Get latest |
| POST | `/api/weekly-analysis` | Generate analysis |

## Testing

```bash
# Run all tests (80 tests)
pytest

# With coverage
pytest --cov=app --cov-report=html

# Verbose output
pytest -v

# Specific test file
pytest tests/test_api_workouts.py

# Run workout plans tests
pytest tests/test_api_workout_plans.py

# Run selfies tests
pytest tests/test_api_selfies.py
```

### Test Coverage

Tests cover all major API endpoints:
- `test_api_workouts.py` - Workout CRUD operations
- `test_api_goals.py` - Goals management
- `test_api_measurements.py` - Body measurements
- `test_api_profiles.py` - User profiles
- `test_api_workout_plans.py` - Workout plans, preferences, templates
- `test_api_selfies.py` - Selfie uploads and signed URLs
- `test_goal_sync.py` - Goal progress synchronization
- `test_unit_converter.py` - Unit conversion utilities

## Code Quality

```bash
# Lint
ruff check .

# Format
black .

# Type check
mypy app
```

## Docker

### Build

```bash
docker build -t goodhealth-backend .
```

### Run

```bash
docker run -p 8000:8000 --env-file .env goodhealth-backend
```

## Deployment (Railway)

### Option 1: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd backend
railway up
```

### Option 2: GitHub Integration

1. Connect GitHub repo to Railway
2. Set root directory to `backend`
3. Add environment variables
4. Railway auto-deploys on push

### Configuration

Railway uses `railway.json`:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health"
  }
}
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Pydantic settings
│   ├── dependencies.py      # FastAPI dependencies
│   ├── middleware/
│   │   └── auth.py          # JWT authentication
│   ├── models/              # Pydantic schemas
│   │   ├── goal.py
│   │   ├── measurement.py
│   │   ├── profile.py
│   │   ├── selfie.py
│   │   ├── workout.py
│   │   ├── workout_plan.py
│   │   └── weekly_analysis.py
│   ├── routers/             # API endpoints
│   │   ├── goals.py
│   │   ├── measurements.py
│   │   ├── profiles.py
│   │   ├── selfies.py
│   │   ├── workouts.py
│   │   ├── workout_plans.py
│   │   └── weekly_analysis.py
│   ├── services/            # Business logic
│   │   ├── ai_plan_generator.py
│   │   ├── gemini_client.py
│   │   ├── goal_sync.py
│   │   ├── goals_crud.py
│   │   ├── measurements.py
│   │   ├── profiles.py
│   │   ├── selfies.py
│   │   ├── weekly_analyzer.py
│   │   ├── workout_plans_crud.py
│   │   └── workouts.py
│   └── utils/
│       ├── supabase_client.py
│       └── unit_converter.py
├── migrations/              # SQL migrations
├── scripts/                 # Utility scripts
├── tests/                   # Pytest tests
├── Dockerfile
├── railway.json             # Railway config
├── requirements.txt
├── pyproject.toml
└── .python-version          # Python 3.13
```

## License

MIT
