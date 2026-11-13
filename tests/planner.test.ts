import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exercisesData, type Exercise } from '../src/data/exercises.ts';
import { DAY_COUNTS, EQUIPMENT, FOCUS_AREAS, GOALS, LEVELS, SESSION_LENGTHS } from '../src/data/options.ts';
import { sessionLengthText, volumeText } from '../src/lib/plan-text.ts';
import { buildWeeklyPlan, type DayPlan, type PlanOptions } from '../src/lib/planner.ts';

const base: PlanOptions = {
  time: 30,
  goal: 'growth',
  level: 'Beginner',
  daysPerWeek: 3,
  equipment: [],
  focusMuscles: FOCUS_AREAS,
};
// Enough gear and a high enough level that a short session is always full.
const wellEquipped: PlanOptions = { ...base, level: 'Advanced', equipment: EQUIPMENT };

// The time model the planner promises, restated here so the tests do not reuse its code:
// every set at the top of its range, 3 seconds a rep, and the rest after every set.
function estimatedSeconds(day: DayPlan) {
  return day.exercises.reduce(
    (total, ex) => total + ex.sets * ((ex.unit === 'seconds' ? ex.perSet[1] : ex.perSet[1] * 3) + ex.rest),
    0,
  );
}

function seeded(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

function dayOf(plan: DayPlan[], index: number): DayPlan {
  const day = plan[index];
  assert.ok(day, `the plan has no day ${index + 1}`);
  return day;
}

test('every focus area has a bodyweight exercise, so no day can be empty', () => {
  for (const muscle of FOCUS_AREAS) {
    assert.ok(exercisesData.some(ex => ex.category === muscle && ex.equipment.length === 0), muscle);
  }
});

test('every equipment option unlocks at least one exercise', () => {
  for (const eq of EQUIPMENT) assert.ok(exercisesData.some(ex => ex.equipment.includes(eq)), eq);
});

test('every catalog entry can be reached from the form options', () => {
  for (const ex of exercisesData) {
    assert.ok(FOCUS_AREAS.includes(ex.category), `${ex.name} has a focus area the form does not offer`);
    assert.ok(LEVELS.includes(ex.difficulty), `${ex.name} has an unknown level`);
    for (const item of ex.equipment) assert.ok(EQUIPMENT.includes(item), `${ex.name} needs ${item}, which the form does not offer`);
    const plan = buildWeeklyPlan(
      exercisesData,
      { ...base, time: 60, daysPerWeek: 6, level: ex.difficulty, equipment: ex.equipment, focusMuscles: [ex.category] },
      seeded(1),
    );
    assert.ok(plan.some(day => day.exercises.some(planned => planned.name === ex.name)), `${ex.name} never appears in a plan`);
  }
});

test('exercise names are unique', () => {
  const names = exercisesData.map(ex => ex.name);
  assert.equal(new Set(names).size, names.length);
});

// Every setting the form can send: 4 lengths x 2 goals x 3 levels x 5 day counts x 32 gear sets x 15 focus sets.
function* everyFormInput(): Generator<PlanOptions> {
  const subsets = <T>(items: readonly T[]) =>
    Array.from({ length: 1 << items.length }, (_, mask) => items.filter((_, i) => mask & (1 << i)));
  for (const time of SESSION_LENGTHS)
    for (const goal of GOALS)
      for (const level of LEVELS)
        for (const daysPerWeek of DAY_COUNTS)
          for (const equipment of subsets(EQUIPMENT))
            for (const focusMuscles of subsets(FOCUS_AREAS))
              if (focusMuscles.length > 0) yield { time, goal, level, daysPerWeek, equipment, focusMuscles };
}

// What each goal prescribes, written out again so a change to the planner's table has to be repeated here on purpose.
const PRESCRIBED = {
  growth: { sets: 3, reps: [8, 12], seconds: [20, 30], rest: 90 },
  definition: { sets: 4, reps: [15, 20], seconds: [30, 45], rest: 45 },
} as const;
const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Checks one plan against everything the planner promises. Returns how many movements sit above the
// chosen level because nothing easier existed for that area and gear.
function checkPlan(catalog: readonly Exercise[], options: PlanOptions, plan: DayPlan[]): number {
  const fail = (what: string) => assert.fail(`${what} with ${JSON.stringify(options)}`);
  const { time, goal, level, equipment, focusMuscles } = options;
  const owned = new Set<string>(equipment);
  const rank = (ex: Exercise) => LEVELS.indexOf(ex.difficulty);
  const want = PRESCRIBED[goal];
  const oneMore = want.sets * (Math.max(want.reps[1] * 3, want.seconds[1]) + want.rest);

  // The movements each area can draw on, worked out here without the planner's help.
  const pools = new Map<string, Exercise[]>(focusMuscles.map(area => {
    const usable = catalog.filter(ex => ex.category === area && ex.equipment.every(item => owned.has(item)));
    const easyEnough = usable.filter(ex => rank(ex) <= LEVELS.indexOf(level));
    const easiest = Math.min(...usable.map(rank));
    return [area, easyEnough.length > 0 ? easyEnough : usable.filter(ex => rank(ex) === easiest)];
  }));

  if (plan.length !== options.daysPerWeek) fail(`${plan.length} days planned`);
  const order = plan.map(day => WEEK.indexOf(day.day));
  if (order.some((position, i) => position < 0 || position <= (order[i - 1] ?? -1))) fail('days out of order');

  let aboveLevel = 0;
  const usedByArea = new Map<string, string[]>();
  for (const day of plan) {
    const names = day.exercises.map(ex => ex.name);
    if (names.length === 0) fail(`${day.day} is empty`);
    if (new Set(names).size !== names.length) fail(`${day.day} repeats an exercise`);
    const labelled = day.focus.replace(/ Day$/, '').split(' & ');

    for (const ex of day.exercises) {
      const pool = pools.get(ex.category);
      if (!pool || !labelled.includes(ex.category)) fail(`${ex.name} is outside the focus of ${day.day}`);
      if (!ex.equipment.every(item => owned.has(item))) fail(`${ex.name} needs gear that was not selected`);
      if (!pool?.some(candidate => candidate.name === ex.name && candidate.unit === ex.unit)) {
        fail(`${ex.name} (${ex.difficulty}) is not among the ${ex.category} movements for ${level}`);
      }
      if (rank(ex) > LEVELS.indexOf(level)) aboveLevel++;

      const range = ex.unit === 'seconds' ? want.seconds : want.reps;
      if (ex.perSet[0] !== range[0] || ex.perSet[1] !== range[1] || ex.rest !== want.rest) {
        fail(`${ex.name} is counted in ${ex.unit} but prescribed ${ex.perSet.join(' to ')}`);
      }
      if (ex.sets < want.sets || ex.sets > 5) fail(`${ex.name} has ${ex.sets} sets`);
      if (!volumeText(ex).endsWith(` ${ex.unit}`)) fail(`${ex.name} reads "${volumeText(ex)}"`);
      usedByArea.set(ex.category, [...(usedByArea.get(ex.category) ?? []), ex.name]);
    }

    const seconds = estimatedSeconds(day);
    const spare = time * 60 - seconds;
    if (spare < 0) fail(`${day.day} runs past ${time} minutes`);
    if (day.minutes !== Math.round(seconds / 60)) fail(`${day.day} reports ${day.minutes} minutes`);
    if (day.short !== spare >= oneMore) fail(`${day.day} has ${spare} seconds spare but short is ${day.short}`);
    const shown = sessionLengthText(day, time);
    if (!shown.startsWith(`About ${day.minutes} minutes`)) fail(`${day.day} shows "${shown}"`);
    if (shown.includes(`shorter than the ${time} you picked`) !== day.short) fail(`${day.day} shows "${shown}"`);
    // A day may only be short because its areas have nothing left to give.
    const usedAll = (area: string) => day.exercises.filter(ex => ex.category === area).length === pools.get(area)?.length;
    if (day.short && !labelled.every(usedAll)) fail(`${day.day} is short but did not use every movement it could`);
  }

  for (const area of focusMuscles) {
    const used = usedByArea.get(area) ?? [];
    const size = pools.get(area)?.length ?? 0;
    if (used.length === 0) fail(`${area} is never trained`);
    // Fresh movements before any repeat: no window as long as the pool holds the same movement twice.
    for (let i = 0; i + size <= used.length; i++) {
      if (new Set(used.slice(i, i + size)).size !== size) fail(`${area} repeats a movement before the others had a turn`);
    }
  }
  return aboveLevel;
}

test('every setting the form can send gives a plan that keeps its promises', t => {
  let combinations = 0;
  let days = 0;
  let shortDays = 0;
  const seen = new Set<string>();
  for (const options of everyFormInput()) {
    combinations++;
    const plan = buildWeeklyPlan(exercisesData, options, seeded(combinations));
    assert.equal(checkPlan(exercisesData, options, plan), 0, `a movement is above ${options.level} with ${JSON.stringify(options)}`);
    assert.deepEqual(buildWeeklyPlan(exercisesData, options, seeded(combinations)), plan, 'the same seed should give the same plan');
    for (const day of plan) {
      days++;
      if (day.short) shortDays++;
      for (const ex of day.exercises) seen.add(ex.name);
    }
  }
  assert.deepEqual([...seen].sort(), exercisesData.map(ex => ex.name).sort(), 'every catalog entry should appear somewhere');
  t.diagnostic(`${combinations} combinations, ${days} days, ${shortDays} marked short, none short without saying so`);
});

test('the same promises hold when an area has nothing easy enough', () => {
  // Without these three, beginner core work and bodyweight beginner push work have to fall back to harder movements.
  const sparse = exercisesData.filter(ex => !['Plank', 'Hollow Holds', 'Push-up'].includes(ex.name));
  let combinations = 0;
  let aboveLevel = 0;
  for (const options of everyFormInput()) {
    combinations++;
    aboveLevel += checkPlan(sparse, options, buildWeeklyPlan(sparse, options, seeded(combinations)));
  }
  assert.ok(aboveLevel > 0, 'the fallback should have been needed');
});

test('goal sets the prescription', () => {
  const first = (goal: PlanOptions['goal'], unit: Exercise['unit']) =>
    buildWeeklyPlan(exercisesData, { ...wellEquipped, time: 15, daysPerWeek: 6, goal }, seeded(1))
      .flatMap(day => day.exercises)
      .find(ex => ex.unit === unit);
  const growth = first('growth', 'reps');
  assert.deepEqual([growth?.sets, growth?.perSet, growth?.rest], [3, [8, 12], 90]);
  const def = first('definition', 'reps');
  assert.deepEqual([def?.sets, def?.perSet, def?.rest], [4, [15, 20], 45]);
});

test('timed holds are prescribed in seconds, everything else in reps', () => {
  const holds = exercisesData.filter(ex => ex.unit === 'seconds').map(ex => ex.name).sort();
  assert.deepEqual(holds, ['Back Lever', 'Front Lever', 'Handstand', 'Hollow Holds', 'L-Sit', 'Plank']);
  const expected = { growth: [3, [20, 30], 90], definition: [4, [30, 45], 45] } as const;
  for (const goal of GOALS) {
    const exercises = buildWeeklyPlan(exercisesData, { ...wellEquipped, time: 15, daysPerWeek: 6, goal }, seeded(2))
      .flatMap(day => day.exercises);
    assert.ok(exercises.some(ex => ex.unit === 'seconds'), 'the plan should include a hold');
    for (const ex of exercises) {
      if (ex.unit === 'seconds') assert.deepEqual([ex.sets, ex.perSet, ex.rest], expected[goal], ex.name);
      assert.ok(volumeText(ex).endsWith(` ${ex.unit}`), `${ex.name} reads "${volumeText(ex)}"`);
    }
  }
  const plank = buildWeeklyPlan(exercisesData, { ...base, time: 15, focusMuscles: ['Core'] }, seeded(1))
    .flatMap(day => day.exercises)
    .find(ex => ex.name === 'Plank');
  assert.ok(plank, 'a beginner core plan includes Plank');
  assert.equal(volumeText(plank), '3 sets of 20 to 30 seconds');
});

test('a plan only uses movements at or below the chosen level', () => {
  const rank = (ex: Exercise) => LEVELS.indexOf(ex.difficulty);
  for (const level of LEVELS)
    for (const equipment of [[], EQUIPMENT] as const)
      for (let seed = 1; seed <= 50; seed++) {
        const plan = buildWeeklyPlan(exercisesData, { ...base, level, equipment, time: 60 }, seeded(seed));
        const trained = new Set(plan.flatMap(day => day.exercises.map(ex => ex.category)));
        assert.deepEqual([...trained].sort(), [...FOCUS_AREAS].sort());
        for (const ex of plan.flatMap(day => day.exercises)) {
          assert.ok(rank(ex) <= LEVELS.indexOf(level), `${ex.name} is ${ex.difficulty}, above ${level}`);
        }
      }
});

test('when nothing is easy enough, the easiest movements stand in', () => {
  // A catalog whose only core movements are above Beginner.
  const hardCore = exercisesData.filter(ex => ex.category !== 'Core' || ex.difficulty !== 'Beginner');
  hardCore.push({ name: 'Dragon Flag', category: 'Core', equipment: [], primary_muscle: 'Abs', difficulty: 'Advanced', unit: 'reps', description: '' });
  const plan = buildWeeklyPlan(hardCore, { ...base, time: 60, focusMuscles: ['Core'] }, seeded(1));
  const names = new Set(plan.flatMap(day => day.exercises.map(ex => ex.name)));
  assert.deepEqual([...names], ['L-Sit']);
});

test('a session never runs past the time picked, and reports its real length', () => {
  for (const goal of GOALS)
    for (const time of SESSION_LENGTHS)
      for (const options of [base, wellEquipped])
        for (const day of buildWeeklyPlan(exercisesData, { ...options, goal, time, daysPerWeek: 6 }, seeded(time))) {
          assert.equal(day.minutes, Math.round(estimatedSeconds(day) / 60), `${day.day} reports the wrong length`);
          assert.ok(estimatedSeconds(day) <= time * 60, `${day.day} runs ${day.minutes} minutes of ${time}`);
        }
  // Growth takes about 6 minutes an exercise and definition about 7.
  const counts = (goal: PlanOptions['goal']) =>
    SESSION_LENGTHS.map(time => dayOf(buildWeeklyPlan(exercisesData, { ...wellEquipped, goal, time, focusMuscles: ['Pull'] }), 0).exercises.length);
  assert.deepEqual(counts('growth'), [2, 4, 7, 9]);
  assert.deepEqual(counts('definition'), [2, 4, 6, 8]);
});

test('a day that cannot fill the time gets extra sets and says it is short', () => {
  // The default form: bodyweight, beginner, three days, all four areas.
  for (const goal of GOALS)
    for (const time of SESSION_LENGTHS)
      for (const day of buildWeeklyPlan(exercisesData, { ...base, goal, time }, seeded(time))) {
        const spare = time * 60 - estimatedSeconds(day);
        const oneMore = goal === 'growth' ? 3 * (12 * 3 + 90) : 4 * (20 * 3 + 45);
        assert.equal(day.short, spare >= oneMore, `${day.day} at ${time} minutes: short flag does not match the spare time`);
        const text = sessionLengthText(day, time);
        assert.ok(text.startsWith(`About ${day.minutes} minutes`), text);
        assert.equal(text.includes(`shorter than the ${time} you picked`), day.short, text);
        for (const ex of day.exercises) assert.ok(ex.sets <= 5, `${ex.name} has ${ex.sets} sets`);
      }

  const pull = dayOf(buildWeeklyPlan(exercisesData, { ...base, time: 60 }, seeded(1)), 1);
  assert.equal(pull.focus, 'Pull Day');
  assert.equal(pull.short, true);
  assert.ok(pull.exercises.every(ex => ex.sets === 5), 'a short day is filled with sets up to the limit');
  assert.equal(pull.minutes, 21);
  assert.equal(
    sessionLengthText(pull, 60),
    'About 21 minutes, shorter than the 60 you picked. Too few movements match this focus, equipment and level.',
  );

  // A full day keeps the goal's own sets and shows only its length.
  const full = dayOf(buildWeeklyPlan(exercisesData, { ...wellEquipped, time: 30 }, seeded(1)), 0);
  assert.equal(full.short, false);
  assert.ok(full.exercises.every(ex => ex.sets === 3));
  assert.equal(sessionLengthText(full, 30), `About ${full.minutes} minutes`);

  // Picking 60 instead of 45 may not add movements, but the plan no longer hides that.
  const at45 = buildWeeklyPlan(exercisesData, { ...base, time: 45 }, seeded(1));
  const at60 = buildWeeklyPlan(exercisesData, { ...base, time: 60 }, seeded(1));
  at60.forEach((day, i) => {
    if (JSON.stringify(day.exercises) === JSON.stringify(dayOf(at45, i).exercises)) assert.equal(day.short, true, day.day);
  });
});

test('an area left with spare slots hands them to the other area of the day', () => {
  // Beginner bodyweight has one push movement, so legs should take the slots push cannot use.
  const monday = dayOf(buildWeeklyPlan(exercisesData, { ...base, daysPerWeek: 2 }, seeded(1)), 0);
  assert.equal(monday.focus, 'Push & Legs Day');
  assert.deepEqual(monday.exercises.map(ex => ex.category), ['Push', 'Legs', 'Legs', 'Legs']);
});

test('training days are spread across the week and labelled by focus', () => {
  const plan = buildWeeklyPlan(exercisesData, base);
  assert.deepEqual(plan.map(d => d.day), ['Monday', 'Wednesday', 'Friday']);
  assert.deepEqual(plan.map(d => d.focus), ['Push & Core Day', 'Pull Day', 'Legs Day']);
});

test('no focus areas gives an empty plan', () => {
  assert.deepEqual(buildWeeklyPlan(exercisesData, { ...base, focusMuscles: [] }), []);
});

test('bad input is rejected with a clear error instead of a broken plan', () => {
  const rejects = (options: object, message: RegExp, catalog = exercisesData) =>
    assert.throws(() => buildWeeklyPlan(catalog, { ...base, ...options } as PlanOptions, seeded(7)), { name: 'RangeError', message });

  for (const time of [0, -30, NaN, Infinity, undefined, '30', 'abc']) rejects({ time }, /^time must be/);
  // The form offers 2 to 6 days, so the planner has no layout for anything else.
  for (const daysPerWeek of [0, 1, 7, 8, 2.5, NaN, '3', 'constructor', '__proto__']) rejects({ daysPerWeek }, /^daysPerWeek must be/);
  for (const goal of ['strength', undefined, 'constructor']) rejects({ goal }, /^goal must be/);
  for (const level of ['Expert', undefined, 'beginner']) rejects({ level }, /^level must be/);
  for (const focusMuscles of [['push'], ['Arms'], ['Push', 'Arms']]) rejects({ focusMuscles }, /^focusMuscles must be/);
  for (const equipment of [['dumbbells'], ['Dumbbell'], ['Kettlebell'], ['None']]) rejects({ equipment }, /^equipment must be/);

  // 5 minutes cannot hold one exercise for each of the two areas trained on Monday.
  rejects({ time: 5, daysPerWeek: 2 }, /too short/);
  rejects({}, /no Core movements/, exercisesData.filter(ex => ex.category !== 'Core'));
  rejects({}, /no Push movements/, []);
  // A random source must stay below 1. One that does not is caught instead of leaving holes in the plan.
  assert.throws(() => buildWeeklyPlan(exercisesData, base, () => 1), RangeError);
});

test('does not mutate the catalog', () => {
  const before = JSON.stringify(exercisesData);
  buildWeeklyPlan(exercisesData, { ...base, equipment: EQUIPMENT, daysPerWeek: 6, time: 60 });
  assert.equal(JSON.stringify(exercisesData), before);
});

test('a movement is only planned when every piece of gear it needs is owned', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const band = buildWeeklyPlan(exercisesData, { ...base, equipment: ['Resistance Band'], focusMuscles: ['Pull'] }, seeded(seed));
    const bandNames = band.flatMap(day => day.exercises.map(ex => ex.name));
    assert.ok(!bandNames.includes('Resistance Band Pull-Ups'), 'band pull-ups need a pull-up bar');
    assert.ok(!bandNames.includes('Resistance Band Chin-Ups'), 'band chin-ups need a pull-up bar');
    const dumbbells = buildWeeklyPlan(exercisesData, { ...base, equipment: ['Dumbbells'], focusMuscles: ['Legs'] }, seeded(seed));
    assert.ok(!dumbbells.some(day => day.exercises.some(ex => ex.name === 'Hip Thrust')), 'hip thrust needs a bench');
  }
});
