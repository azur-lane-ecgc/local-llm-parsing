- In all interactions, **be extremely concise and sacrifice grammar for the sake of concision**.
- Prioritize using the edit tool to make changes to files. Do NOT first delete then rewrite the same file; instead, use the edit tool to make changes.

## File Loading

For any file search or grep in the current git indexed directory use fff tools.

## Git

- Do NOT commit any files unless otherwise instructed.
- Do NOT assume any file showing as modified on 'git status' (or similar commands) was modified by an Agent. Confirm all file changes with the user before restoring them.
- Do NOT add yourself to the Git History or anything related AT ALL.

## Typescript / Javascript

- Your primary method for interacting with anything Typescript / Javascript related should be **bun** (https://bun.sh/). **THIS IS IMPORTANT**.
- When running scripts, use **bun run <script_name>** instead of **node <script_name>**.
- In some projects, bun may not be used. If so, use **node <script_name>** instead.

## Markdown

- Avoid using `---` to separate sections. Prefer different heading levels and using subheadings instead to group content.

## Plan Mode

- Make the plan extremely concise. **Sacrifice grammar for the sake of concision**.
- At the end of each plan, give me a list of unresolved questions to answer, if any. Make the questions extremely concise. **Sacrifice grammar for the sake of concision**.
- Make all plans multi-phase.
- While working on the plan, ensure that tasks within the plan file are marked as completed once they are completed.
