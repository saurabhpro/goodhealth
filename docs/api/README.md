# GoodHealth API Documentation

This directory contains the OpenAPI specification for the GoodHealth REST API.

## Viewing the API Documentation

### Option 1: GitHub (Recommended)
GitHub automatically renders OpenAPI specs with a nice UI. Simply view the file on GitHub:
- [openapi.yaml](./openapi.yaml)

### Option 2: Swagger UI (Local)
Install and run Swagger UI locally:

```bash
# Install Swagger UI globally
npm install -g swagger-ui-watcher

# Run from project root
swagger-ui-watcher docs/api/openapi.yaml
```

Then open http://localhost:8000 in your browser.

### Option 3: Swagger Editor (Online)
1. Go to https://editor.swagger.io
2. File → Import File
3. Select `docs/api/openapi.yaml`

### Option 4: Postman
1. Open Postman
2. Import → Upload Files
3. Select `docs/api/openapi.yaml`
4. The API will be available with all endpoints ready to test

### Option 5: VS Code Extension
Install the "OpenAPI (Swagger) Editor" extension in VS Code for inline documentation and validation.

## API Overview

### Authentication
All API endpoints require authentication via Supabase Auth. Include your session token in the Authorization header:

```
Authorization: Bearer <your-supabase-session-token>
```

### Base URLs
- **Development**: `http://localhost:3000/api`
- **Production**: `https://goodhealth-three.vercel.app/api`

### Key Endpoints

#### Workout Plans
- `POST /workout-plans/generate` - **AI Plan Generation** (Main feature)
- `GET /workout-plans` - List all plans
- `GET /workout-plans/{id}` - Get plan details with sessions
- `PATCH /workout-plans/{id}` - Update plan
- `DELETE /workout-plans/{id}` - Delete plan

#### Workout Sessions
- `GET /workout-plans/sessions/{id}/details` - Get session with template exercises
- `POST /workout-plans/sessions/{id}/complete` - Mark session complete
- `GET /workout-plans/{id}/week/{weekNumber}` - Get weekly schedule

#### Templates
- `GET /workout-templates` - List all templates (user + public)

#### Goals
- `GET /goals` - List user goals

## Testing the API

### Using cURL

**Generate AI Workout Plan:**
```bash
curl -X POST http://localhost:3000/api/workout-plans/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goalId": "123e4567-e89b-12d3-a456-426614174000",
    "weeksCount": 4,
    "workoutsPerWeek": 5
  }'
```

**Get Workout Plans:**
```bash
curl http://localhost:3000/api/workout-plans \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Session Details (for starting a workout):**
```bash
curl http://localhost:3000/api/workout-plans/sessions/SESSION_ID/details \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using JavaScript/TypeScript

```typescript
// Generate AI Workout Plan
const response = await fetch('/api/workout-plans/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`
  },
  body: JSON.stringify({
    goalId: 'your-goal-id',
    weeksCount: 4,
    workoutsPerWeek: 5
  })
});

const result = await response.json();
console.log('Generated plan:', result);
```

## AI Plan Generation Deep Dive

The `/workout-plans/generate` endpoint is the centerpiece of the API. It:

1. **Analyzes Your Goal**
   - Fetches goal details
   - Determines goal type (weight_loss, muscle_building, endurance, general_fitness)

2. **Evaluates Your Fitness Level**
   - Analyzes your workout history
   - Determines intensity level (beginner, intermediate, advanced)

3. **Generates Personalized Plan**
   - Selects appropriate workout templates
   - Creates weekly schedules with smart rotation
   - Distributes rest days strategically
   - Applies progressive overload

4. **Creates Database Records**
   - Saves workout plan
   - Creates all scheduled sessions (week by week, day by day)

5. **Returns Complete Schedule**
   - Plan details
   - Weekly breakdown
   - Summary statistics

### Request Example

```json
{
  "goalId": "123e4567-e89b-12d3-a456-426614174000",
  "weeksCount": 4,
  "workoutsPerWeek": 5,
  "preferences": {
    "preferredDays": [1, 3, 5],
    "focusAreas": ["upper_body", "cardio"]
  }
}
```

### Response Example

```json
{
  "success": true,
  "planId": "plan-uuid",
  "plan": {
    "id": "plan-uuid",
    "name": "Weight Loss - 4 Week Plan",
    "goal_type": "weight_loss",
    "weeks_duration": 4,
    "workouts_per_week": 5,
    "status": "draft"
  },
  "schedule": {
    "week1": [/* 7 sessions */],
    "week2": [/* 7 sessions */],
    "week3": [/* 7 sessions */],
    "week4": [/* 7 sessions */]
  },
  "summary": {
    "totalWorkouts": 20,
    "avgWorkoutsPerWeek": 5,
    "cardioSessions": 14,
    "strengthSessions": 6,
    "estimatedTotalTime": 1200
  }
}
```

## Schema Definitions

All data types are fully documented in the OpenAPI spec with:
- Request/response schemas
- Field types and constraints
- Validation rules
- Example values
- Descriptions

Key schemas:
- `WorkoutPlan`
- `WorkoutPlanSession`
- `WorkoutTemplate`
- `Exercise`
- `Goal`

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `204` - No Content (successful delete)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a descriptive message:
```json
{
  "error": "Goal not found"
}
```

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## Versioning

The API is currently at version 1.0.0. Future breaking changes will be versioned (v2, v3, etc.).

## Contributing

When adding new endpoints:
1. Update `openapi.yaml`
2. Test the endpoint
3. Document request/response examples
4. Add to this README if it's a major feature

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Postman Documentation](https://www.postman.com/)
- [GoodHealth Main Docs](../README.md)
