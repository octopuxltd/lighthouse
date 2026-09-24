# Working rules for this project

How to work in this repo. Follow these unless the user says otherwise.

- Before changing behaviour, write a failing test first, then make it pass.
- Before saying a change is done, run the tests, the linter and the type check:
  `npm test`, `npm run lint`, `npm run typecheck`.
- If any of those fails, don't push.
- Commit after each small change, rather than batching lots together.
- Ask before adding a library.
- Before you push, run the app locally (`npm run dev`) and wait for the user to
  check it.
