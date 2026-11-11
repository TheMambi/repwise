import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exercisesData } from '../src/data/exercises.ts';
import { buildWeeklyPlan, BODYWEIGHT, type PlanOptions } from '../src/lib/planner.ts';

const MUSCLES = ['Push', 'Pull', 'Legs', 'Core'];
const EQUIPMENT = ['None', 'Dumbbells', 'Pull-up Bar', 'Resistance Band', 'TRX', 'Bench'];
const base: PlanOptions = { time: 30, goal: 'growth', daysPerWeek: 3, equipment: ['None'], focusMuscles: MUSCLES };

function seeded(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

test('every focus area has a bodyweight exercise, so no day can be empty', () => {
  for (const muscle of MUSCLES) {
    assert.ok(exercisesData.some(ex => ex.category === muscle && ex.equipment === BODYWEIGHT), muscle);
  }
});

test('every equipment option unlocks at least one exercise', () => {
  for (const eq of EQUIPMENT) assert.ok(exercisesData.some(ex => ex.equipment === eq), eq);
});

test('exercise names are unique', () => {
  const names = exercisesData.map(ex => ex.name);
  assert.equal(new Set(names).size, names.length);
});

test('all input combinations give full, valid plans', () => {
  for (const time of [15, 30, 45, 60])
    for (const daysPerWeek of [2, 3, 4, 5, 6])
      for (let mask = 1; mask < 16; mask++)
        for (const equipment of [[], ['None'], ['Dumbbells'], EQUIPMENT]) {
          const focusMuscles = MUSCLES.filter((_, i) => mask & (1 << i));
          const plan = buildWeeklyPlan(exercisesData, { ...base, time, daysPerWeek, equipment, focusMuscles }, seeded(mask));
          assert.equal(plan.length, daysPerWeek);
          const owned = new Set([...equipment, 'None']);
          const trained = new Set<string>();
          for (const day of plan) {
            assert.ok(day.exercises.length >= 1, `${day.day} is empty`);
            assert.ok(day.exercises.length <= Math.max(2, time / 5, focusMuscles.length), `${day.day} exceeds the time budget`);
            const names = day.exercises.map(ex => ex.name);
            assert.equal(new Set(names).size, names.length, `${day.day} repeats an exercise`);
            for (const ex of day.exercises) {
              assert.ok(owned.has(ex.equipment), `${ex.name} needs ${ex.equipment}`);
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
  assert.throws(() => buildWeeklyPlan(exercisesData, { ...base, daysPerWeek: 0 }), RangeError);
});

test('does not mutate the catalog', () => {
  const before = JSON.stringify(exercisesData);
  buildWeeklyPlan(exercisesData, { ...base, equipment: EQUIPMENT, daysPerWeek: 6, time: 60 });
  assert.equal(JSON.stringify(exercisesData), before);
});
