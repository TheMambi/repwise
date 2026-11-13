import type { Exercise } from '../data/exercises';
// Node runs the tests on this file as it is, so an import that is used at run time needs its extension.
import { DAY_COUNTS } from '../data/options.ts';
import type { DayCount, Equipment, FocusArea, Goal } from '../data/options.ts';

export interface Prescription {
  sets: number;
  reps: string;
  rest: string;
}

export type PlannedExercise = Exercise & Prescription;

export interface DayPlan {
  day: string;
  focus: string;
  exercises: PlannedExercise[];
}

export interface PlanOptions {
  time: number;
  goal: Goal;
  daysPerWeek: DayCount;
  equipment: readonly Equipment[];
  focusMuscles: readonly FocusArea[];
}

const MINUTES_PER_EXERCISE = 5;
const MIN_EXERCISES_PER_DAY = 2;

const PRESCRIPTION: Record<Goal, Prescription> = {
  growth: { sets: 3, reps: '8-12', rest: '90s' },
  definition: { sets: 4, reps: '15-20', rest: '45s' },
};

// Training days spaced so rest days fall between sessions where the week allows it.
const WEEK_LAYOUTS: Record<DayCount, string[]> = {
  2: ['Monday', 'Thursday'],
  3: ['Monday', 'Wednesday', 'Friday'],
  4: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
  5: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
  6: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function buildWeeklyPlan(
  catalog: readonly Exercise[],
  options: PlanOptions,
  random: () => number = Math.random,
): DayPlan[] {
  const muscles = [...new Set(options.focusMuscles)];
  const days = WEEK_LAYOUTS[options.daysPerWeek];
  if (!days) throw new RangeError(`daysPerWeek must be ${DAY_COUNTS.join(', ')}, got ${options.daysPerWeek}`);
  if (muscles.length === 0) return [];

  const owned = new Set<Equipment>(options.equipment);
  const pools = new Map<string, Exercise[]>();
  const cursors = new Map<string, number>();
  for (const muscle of muscles) {
    // Bodyweight movements need nothing, so they are in every pool whatever is owned.
    const usable = catalog.filter(
      ex => ex.category === muscle && ex.equipment.every(item => owned.has(item)),
    );
    pools.set(muscle, shuffle(usable, random));
    cursors.set(muscle, 0);
  }

  // Every chosen muscle is trained at least once; spare days repeat the rotation.
  const slots = Math.max(days.length, muscles.length);
  const musclesByDay: string[][] = days.map(() => []);
  for (let i = 0; i < slots; i++) {
    musclesByDay[i % days.length].push(muscles[i % muscles.length]);
  }

  const perDay = Math.max(MIN_EXERCISES_PER_DAY, Math.floor(options.time / MINUTES_PER_EXERCISE));
  const prescription = PRESCRIPTION[options.goal];

  return days.map((day, dayIndex) => {
    const dayMuscles = musclesByDay[dayIndex];
    const base = Math.floor(perDay / dayMuscles.length);
    const extra = perDay % dayMuscles.length;
    const exercises: PlannedExercise[] = [];

    dayMuscles.forEach((muscle, i) => {
      const pool = pools.get(muscle) ?? [];
      const wanted = Math.min(pool.length, Math.max(1, base + (i < extra ? 1 : 0)));
      const start = cursors.get(muscle) ?? 0;
      // Continue through the pool so a muscle repeated later in the week gets fresh movements.
      for (let n = 0; n < wanted; n++) {
        exercises.push({ ...pool[(start + n) % pool.length], ...prescription });
      }
      cursors.set(muscle, start + wanted);
    });

    return { day, focus: `${dayMuscles.join(' & ')} Day`, exercises };
  });
}
