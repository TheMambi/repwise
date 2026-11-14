import type { Exercise } from '../data/exercises';
// Node runs the tests on this file as it is, so an import that is used at run time needs its extension.
import { DAY_COUNTS, EQUIPMENT, FOCUS_AREAS, GOALS, LEVELS, SESSION_LENGTHS } from '../data/options.ts';
import { buildWeeklyPlan, seeded } from './planner.ts';
import type { DayPlan, PlanOptions } from './planner.ts';

// A generated week is kept in the page address after the #, as the form settings plus the seed that
// ordered the movements. Nothing is stored: opening the same address builds the same week again.

export interface PlanLink {
  options: PlanOptions;
  seed: number;
}

export function encodePlanLink(options: PlanOptions, seed: number): string {
  const params = new URLSearchParams({
    time: String(options.time),
    goal: options.goal,
    level: options.level,
    days: String(options.daysPerWeek),
  });
  for (const item of EQUIPMENT) if (options.equipment.includes(item)) params.append('gear', item);
  for (const area of FOCUS_AREAS) if (options.focusMuscles.includes(area)) params.append('focus', area);
  params.append('seed', String(seed));
  return `#${params.toString()}`;
}

// The option written exactly as `text`, if the form offers it.
function pick<T extends string | number>(allowed: readonly T[], text: string | null): T | undefined {
  return allowed.find(option => String(option) === text);
}

// Reads a link back. Null when any part is missing or is not something the form offers.
export function decodePlanLink(hash: string): PlanLink | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const time = pick(SESSION_LENGTHS, params.get('time'));
  const goal = pick(GOALS, params.get('goal'));
  const level = pick(LEVELS, params.get('level'));
  const daysPerWeek = pick(DAY_COUNTS, params.get('days'));
  const gear = params.getAll('gear');
  const focus = params.getAll('focus');
  const seed = params.get('seed') ?? '';

  if (time === undefined || goal === undefined || level === undefined || daysPerWeek === undefined) return null;
  if (gear.some(item => pick(EQUIPMENT, item) === undefined)) return null;
  if (focus.length === 0 || focus.some(area => pick(FOCUS_AREAS, area) === undefined)) return null;
  if (!/^\d{1,10}$/.test(seed) || Number(seed) > 4294967295) return null;

  return {
    options: {
      time,
      goal,
      level,
      daysPerWeek,
      equipment: EQUIPMENT.filter(item => gear.includes(item)),
      focusMuscles: FOCUS_AREAS.filter(area => focus.includes(area)),
    },
    seed: Number(seed),
  };
}

// The week a link points to. Null when the link cannot be read or the planner turns its settings down,
// so the caller can show the form instead.
export function planFromLink(catalog: readonly Exercise[], hash: string): (PlanLink & { days: DayPlan[] }) | null {
  const link = decodePlanLink(hash);
  if (!link) return null;
  try {
    return { ...link, days: buildWeeklyPlan(catalog, link.options, seeded(link.seed)) };
  } catch (error) {
    // RangeError is how the planner says no, for example when the catalog has nothing for an area.
    if (error instanceof RangeError) return null;
    throw error;
  }
}
