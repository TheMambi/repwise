# Known pitfalls

Read this before changing the catalog, the planner or the tests. Add a row when a fix teaches something that is not obvious from the code.

| Symptom | Cause | Fix |
| --- | --- | --- |
| A plan lists a movement that needs gear the user did not select, such as band pull-ups without a pull-up bar. | Each catalog entry could name only one piece of equipment, so a second requirement lived only in the description. | `equipment` is a list of everything the movement needs and the planner requires every item. Bodyweight movements have an empty list. When you add a movement, read its description for a bench, bar or band and list each one. |
| A catalog entry never shows up in any plan. | Its equipment or focus area was spelled in a way the form does not offer, and plain `string` fields let that through. | The form, catalog, planner and tests all read the lists in `src/data/options.ts`, and the catalog fields are typed from them, so a value that is not an option fails the typecheck. Add the option there first. |
| `npm test` fails with a module-not-found error after a change under `src/lib` or `src/data`. | Node runs `tests/planner.test.ts` and the files it imports directly, with types stripped and no bundler. It does not know the `@/` alias and does not add file extensions. | In files the tests import, write run-time imports as relative paths ending in `.ts`. Type-only imports are erased and can stay as they are. |
