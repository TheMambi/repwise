import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exercisesData } from '../src/data/exercises.ts';
import { DAY_COUNTS, EQUIPMENT, FOCUS_AREAS, LEVELS, SESSION_LENGTHS } from '../src/data/options.ts';
import { buildWeeklyPlan, type PlanOptions } from '../src/lib/planner.ts';

const base: PlanOptions = { time: 30, goal: 'growth', daysPerWeek: 3, equipment: [], focusMuscles: FOCUS_AREAS };

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
      { ...base, time: 60, daysPerWeek: 6, equipment: ex.equipment, focusMuscles: [ex.category] },
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
            assert.ok(day.exercises.length <= Math.max(2, time / 5, focusMuscles.length), `${day.day} exceeds the time budget`);
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
  const growth = buildWeeklyPlan(exercisesData, base)[0].exercises[0];
  assert.deepEqual([growth.sets, growth.reps, growth.rest], [3, '8-12', '90s']);
  const def = buildWeeklyPlan(exercisesData, { ...base, goal: 'definition' })[0].exercises[0];
  assert.deepEqual([def.sets, def.reps, def.rest], [4, '15-20', '45s']);
});

test('training days are spread across the week and labelled by focus', () => {
  const plan = buildWeeklyPlan(exercisesData, base);
  assert.deepEqual(plan.map(d => d.day), ['Monday', 'Wednesday', 'Friday']);
  assert.deepEqual(plan.map(d => d.focus), ['Push & Core Day', 'Pull Day', 'Legs Day']);
});

test('no focus areas gives an empty plan; bad day counts are rejected', () => {
  assert.deepEqual(buildWeeklyPlan(exercisesData, { ...base, focusMuscles: [] }), []);
  // The form offers 2 to 6 days, so the planner has no layout for anything else.
  for (const daysPerWeek of [0, 1, 7]) {
    assert.throws(() => buildWeeklyPlan(exercisesData, { ...base, daysPerWeek: daysPerWeek as never }), RangeError);
  }
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
