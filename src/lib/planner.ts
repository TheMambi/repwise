import type { Exercise } from '../data/exercises';

export type Goal = 'growth' | 'definition';

export interface DayPlan {
  day: string;
  focus: string;
  exercises: Exercise[];
}

export interface PlanOptions {
  time: number;
  goal: Goal;
  daysPerWeek: number;
  equipment: string[];
  focusMuscles: string[];
}

export const BODYWEIGHT = 'None';

const MINUTES_PER_EXERCISE = 5;
const MIN_EXERCISES_PER_DAY = 2;

const PRESCRIPTION: Record<Goal, { sets: number; reps: string; rest: string }> = {
  growth: { sets: 3, reps: '8-12', rest: '90s' },
  definition: { sets: 4, reps: '15-20', rest: '45s' },
};

// Training days spaced so rest days fall between sessions where the week allows it.
const WEEK_LAYOUTS: Record<number, string[]> = {
  1: ['Monday'],
  2: ['Monday', 'Thursday'],
  3: ['Monday', 'Wednesday', 'Friday'],
  4: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
  5: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
  6: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  7: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
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
  if (!days) throw new RangeError(`daysPerWeek must be 1-7, got ${options.daysPerWeek}`);
  if (muscles.length === 0) return [];

  // Bodyweight work is always available, whatever else is owned.
  const owned = new Set([...options.equipment, BODYWEIGHT].map(e => e.toLowerCase()));
  const pools = new Map<string, Exercise[]>();
  const cursors = new Map<string, number>();
  for (const muscle of muscles) {
    const usable = catalog.filter(
      ex => ex.category === muscle && owned.has(ex.equipment.toLowerCase()),
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
    const exercises: Exercise[] = [];

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
