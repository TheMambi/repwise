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

test('all input combinations give full, valid plans', () => {
  for (const time of SESSION_LENGTHS)
    for (const daysPerWeek of DAY_COUNTS)
      for (let mask = 1; mask < 16; mask++)
        for (const equipment of [[], ['Dumbbells'], EQUIPMENT] as const) {
          const focusMuscles = FOCUS_AREAS.filter((_, i) => mask & (1 << i));
          const plan = buildWeeklyPlan(exercisesData, { ...base, time, daysPerWeek, equipment, focusMuscles }, seeded(mask));
          assert.equal(plan.length, daysPerWeek);
          const owned = new Set<string>(equipment);
          const trained = new Set<string>();
          for (const day of plan) {
            assert.ok(day.exercises.length >= 1, `${day.day} is empty`);
            assert.ok(day.minutes <= time, `${day.day} exceeds the time budget`);
            const names = day.exercises.map(ex => ex.name);
            assert.equal(new Set(names).size, names.length, `${day.day} repeats an exercise`);
            for (const ex of day.exercises) {
              for (const item of ex.equipment) assert.ok(owned.has(item), `${ex.name} needs ${item}`);
              assert.ok(focusMuscles.includes(ex.category));
              trained.add(ex.category);
            }
          }
          assert.deepEqual([...trained].sort(), [...focusMuscles].sort());
        }
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
  hardCore.push({ ...hardCore[0], name: 'Dragon Flag', category: 'Core', equipment: [], difficulty: 'Advanced' });
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
    SESSION_LENGTHS.map(time => buildWeeklyPlan(exercisesData, { ...wellEquipped, goal, time, focusMuscles: ['Pull'] })[0].exercises.length);
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

  const [, pull] = buildWeeklyPlan(exercisesData, { ...base, time: 60 }, seeded(1));
  assert.equal(pull.focus, 'Pull Day');
  assert.equal(pull.short, true);
  assert.ok(pull.exercises.every(ex => ex.sets === 5), 'a short day is filled with sets up to the limit');
  assert.equal(pull.minutes, 21);
  assert.equal(
    sessionLengthText(pull, 60),
    'About 21 minutes, shorter than the 60 you picked. Too few movements match this focus, equipment and level.',
  );

  // A full day keeps the goal's own sets and shows only its length.
  const [full] = buildWeeklyPlan(exercisesData, { ...wellEquipped, time: 30 }, seeded(1));
  assert.equal(full.short, false);
  assert.ok(full.exercises.every(ex => ex.sets === 3));
  assert.equal(sessionLengthText(full, 30), `About ${full.minutes} minutes`);

  // Picking 60 instead of 45 may not add movements, but the plan no longer hides that.
  const at45 = buildWeeklyPlan(exercisesData, { ...base, time: 45 }, seeded(1));
  const at60 = buildWeeklyPlan(exercisesData, { ...base, time: 60 }, seeded(1));
  at60.forEach((day, i) => {
    if (JSON.stringify(day.exercises) === JSON.stringify(at45[i].exercises)) assert.equal(day.short, true, day.day);
  });
});

test('an area left with spare slots hands them to the other area of the day', () => {
  // Beginner bodyweight has one push movement, so legs should take the slots push cannot use.
  const [monday] = buildWeeklyPlan(exercisesData, { ...base, daysPerWeek: 2 }, seeded(1));
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
