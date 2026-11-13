import type { DayPlan, PlannedExercise } from './planner';

// The wording the plan view shows, kept out of the component so the tests can read it.

export function volumeText(ex: PlannedExercise): string {
  return `${ex.sets} sets of ${ex.perSet[0]} to ${ex.perSet[1]} ${ex.unit}`;
}

export function sessionLengthText(day: DayPlan, picked: number): string {
  const length = `About ${day.minutes} minutes`;
  if (!day.short) return length;
  return `${length}, shorter than the ${picked} you picked. Too few movements match this focus, equipment and level.`;
}
