# OiTesla | Agent Instructions

## To-Do Execution Mode
When I explicitly ask you to "work on todos" or "do the next task":
* **Check Status:** Read `todo.md`. If the file is empty or all tasks are marked `[x]`, ignore these steps and reply normally.
* **Execute One Step:** Find the *first* unchecked `[ ]` task. Follow its implementation notes exactly without over-engineering.
* **Update & Stop:** Once completed and verified, update `todo.md` to mark the task as `[x]`. Stop and report what you did. Do not proceed to the next task until asked.
