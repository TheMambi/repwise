# Project Constitution (gemini.md)

## Goal
Build Repwise, a home workout plan website matching user constraints (equipment, time, muscle groups, goals) to a weekly schedule mixing calisthenics and weight training. The final payload is an interactive, visually stunning single-page HTML application.

## Data Schemas

### Input Payload (User Preferences)
```json
{
  "available_equipment": ["dumbbells", "pull-up bar", "none"],
  "available_time_minutes": 45,
  "focus_muscle_groups": ["chest", "back", "legs", "core"],
  "goal": "muscle definition",
  "fitness_level": "beginner"
}
```

### Output Payload (Weekly Plan)
```json
{
  "weekly_plan": [
    {
      "day_name": "Monday",
      "focus": "Chest & Back",
      "exercises": [
        {
          "name": "Push-up",
          "sets": 3,
          "reps": "10-15",
          "rest_seconds": 60,
          "equipment": "None",
          "description": "Start in a high plank position...",
          "image_url": "images/pushup.jpg"
        }
      ]
    }
  ]
}
```

## Behavioral Rules
- System Pilot ensures deterministic, self-healing automation.
- Priority: Reliability > Speed.
- No guessing at business logic.
- B.L.A.S.T protocol strictly followed.

## Architectural Invariants
- 3-Layer Architecture (Architecture/SOPs, Navigation/Brain, Tools/Scripts).
- Tools are atomic, testable Python scripts.
- No scripts to be written until Discovery Questions and Schema are confirmed.
