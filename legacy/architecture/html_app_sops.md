# Technical SOPs (Layer 1)

## Architecture Overview
The Repwise application is a single-page HTML/JS application (SPA) acting as the UI, Navigation, and Client-Side Tool layer combined.

## Goal
Generate a structured weekly workout plan based on user inputs:
- Available Equipment: (e.g., None, Dumbbells, Pull-up Bar, Resistance Band, TRX)
- Available Time: (e.g., 15, 30, 45, 60 minutes)
- Focus Muscle Groups: (e.g., Full Body, Upper Body, Lower Body, Core)
- Goal: (Muscle Growth vs Muscle Definition)

## Logic (Navigation/Brain)
- Calculate the total number of sets and exercises per session based on 'Available Time' (assumes 1 exercise takes ~5 min including rest).
- Filter the `exercises.json` catalog down to matching 'Equipment' constraints.
- Build daily splits depending on 'Focus Muscle Groups' and total frequency intended for a week.
- For "Muscle Growth", assign a repetition scheme favoring 8-12 reps with longer rest.
- For "Muscle Definition" (Endurance/Burn), assign a repetition scheme favoring 15-20 reps or circuit training.

## Edge Cases
- **No exercises match equipment and muscle group:** Fallback to a "None" equipment exercise targeting the same muscle group.
- **Short Time (e.g., 15 mins):** Compress rest times and prioritize Compound Movements over Isolation.
