import type { Exercise, Unit } from '../data/exercises';
// Node runs the tests on this file as it is, so an import that is used at run time needs its extension.
import { DAY_COUNTS, EQUIPMENT, FOCUS_AREAS, GOALS, LEVELS } from '../data/options.ts';
import type { DayCount, Equipment, FocusArea, Goal, Level } from '../data/options.ts';

export interface Prescription {
  sets: number;
  // The low and high end of one set, counted in the exercise's unit.
  perSet: readonly [number, number];
  // Seconds of rest after each set.
  rest: number;
}

export type PlannedExercise = Exercise & Prescription;

export interface DayPlan {
  day: string;
  focus: string;
  exercises: PlannedExercise[];
  // Estimated length of the session as planned, in whole minutes.
  minutes: number;
  // True when the movements ran out while there was still time for another exercise.
  short: boolean;
}

export interface PlanOptions {
  time: number;
  goal: Goal;
  level: Level;
  daysPerWeek: DayCount;
  equipment: readonly Equipment[];
  focusMuscles: readonly FocusArea[];
}

const SECONDS_PER_REP = 3;
const MAX_SETS = 5;

const PRESCRIPTION: Record<Goal, Record<Unit, Prescription>> = {
  growth: {
    reps: { sets: 3, perSet: [8, 12], rest: 90 },
    seconds: { sets: 3, perSet: [20, 30], rest: 90 },
  },
  definition: {
    reps: { sets: 4, perSet: [15, 20], rest: 45 },
    seconds: { sets: 4, perSet: [30, 45], rest: 45 },
  },
};

// Training days spaced so rest days fall between sessions where the week allows it.
const WEEK_LAYOUTS: Record<DayCount, string[]> = {
  2: ['Monday', 'Thursday'],
  3: ['Monday', 'Wednesday', 'Friday'],
  4: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
  5: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
  6: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

// For lookups the planner expects to be in range. Fails loudly if one is not, instead of passing undefined along.
function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new RangeError(`nothing at position ${index} of ${items.length}`);
  return item;
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [at(result, j), at(result, i)];
  }
  return result;
}

function requireOption<T>(name: string, value: T, allowed: readonly T[]): void {
  if (!allowed.includes(value)) {
    throw new RangeError(`${name} must be one of ${allowed.join(', ')}, got ${String(value)}`);
  }
}

// Counts every set at the top of its range plus the rest after it, so a session should not run past the estimate.
function exerciseSeconds(unit: Unit, { sets, perSet, rest }: Prescription): number {
  const work = unit === 'seconds' ? perSet[1] : perSet[1] * SECONDS_PER_REP;
  return sets * (work + rest);
}

function sessionSeconds(exercises: readonly PlannedExercise[]): number {
  return exercises.reduce((total, ex) => total + exerciseSeconds(ex.unit, ex), 0);
}

export function buildWeeklyPlan(
  catalog: readonly Exercise[],
  options: PlanOptions,
  random: () => number = Math.random,
): DayPlan[] {
  if (!Number.isFinite(options.time) || options.time <= 0) {
    throw new RangeError(`time must be a positive number of minutes, got ${String(options.time)}`);
  }
  requireOption('goal', options.goal, GOALS);
  requireOption('level', options.level, LEVELS);
  requireOption('daysPerWeek', options.daysPerWeek, DAY_COUNTS);
  for (const item of options.equipment) requireOption('equipment', item, EQUIPMENT);
  for (const muscle of options.focusMuscles) requireOption('focusMuscles', muscle, FOCUS_AREAS);

  const muscles = [...new Set(options.focusMuscles)];
  const days = WEEK_LAYOUTS[options.daysPerWeek];
  if (muscles.length === 0) return [];

  const prescription = PRESCRIPTION[options.goal];
  const owned = new Set<Equipment>(options.equipment);
  const rank = (ex: Exercise) => LEVELS.indexOf(ex.difficulty);
  const pools = new Map<FocusArea, PlannedExercise[]>();
  for (const muscle of muscles) {
    // Bodyweight movements need nothing, so they are in every pool whatever is owned.
    const usable = catalog.filter(
      ex => ex.category === muscle && ex.equipment.every(item => owned.has(item)),
    );
    if (usable.length === 0) {
      throw new RangeError(`the catalog has no ${muscle} movements for the selected equipment`);
    }
    // If nothing is at or below the chosen level, the easiest movements stand in so the area is still trained.
    const ceiling = Math.max(LEVELS.indexOf(options.level), Math.min(...usable.map(rank)));
    const pool = shuffle(usable.filter(ex => rank(ex) <= ceiling), random);
    pools.set(muscle, pool.map(ex => ({ ...ex, ...prescription[ex.unit] })));
  }

  // Every chosen muscle is trained at least once; spare days repeat the rotation.
  const slots = Math.max(days.length, muscles.length);
  const musclesByDay: FocusArea[][] = days.map(() => []);
  for (let i = 0; i < slots; i++) {
    at(musclesByDay, i % days.length).push(at(muscles, i % muscles.length));
  }

  const limit = options.time * 60;
  // The time one more exercise would need, whichever unit it is counted in.
  const oneMore = Math.max(exerciseSeconds('reps', prescription.reps), exerciseSeconds('seconds', prescription.seconds));

  return days.map((day, dayIndex) => {
    const areas = at(musclesByDay, dayIndex).map(muscle => ({
      muscle,
      queue: pools.get(muscle) ?? [],
      picked: [] as PlannedExercise[],
    }));

    // Deal one exercise at a time across the day's areas. An area drops out when its pool is used up
    // or its next movement no longer fits, and the others carry on with the time that is left.
    let seconds = 0;
    let open = areas;
    while (open.length > 0) {
      open = open.filter(area => {
        const next = area.queue[area.picked.length];
        if (!next || seconds + exerciseSeconds(next.unit, next) > limit) return false;
        area.picked.push(next);
        seconds += exerciseSeconds(next.unit, next);
        return true;
      });
    }

    for (const { muscle, queue, picked } of areas) {
      if (picked.length === 0) {
        throw new RangeError(`${options.time} minutes is too short to train ${muscle} on ${day}`);
      }
      // Send what was used to the back, so a muscle repeated later in the week gets fresh movements.
      pools.set(muscle, [...queue.slice(picked.length), ...picked]);
    }

    // A day that used up every pool gets extra sets, one round at a time, while the round still fits.
    let exercises = areas.flatMap(area => area.picked);
    const ranOut = areas.every(area => area.picked.length === area.queue.length);
    while (ranOut && exercises.every(ex => ex.sets < MAX_SETS)) {
      const longer = exercises.map(ex => ({ ...ex, sets: ex.sets + 1 }));
      if (sessionSeconds(longer) > limit) break;
      exercises = longer;
    }

    seconds = sessionSeconds(exercises);
    return {
      day,
      focus: `${areas.map(area => area.muscle).join(' & ')} Day`,
      exercises,
      minutes: Math.round(seconds / 60),
      short: limit - seconds >= oneMore,
    };
  });
}
