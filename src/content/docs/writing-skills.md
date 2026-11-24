---
title: Writing skills
description: Teach the agent how your lab approaches a task — what goes in a skill, where it lives and how to improve it from real runs.
group: Guides
order: 40
sources: ["docs/architecture.md", "docs/overview.md", "packages/core/src/skill/index.ts", "packages/core/src/tool/skill.txt"]
---

The agent writes its own control programs. What it can't know is how *you* want a task approached. A skill tells it: a short written procedure that it loads whenever a task matches.

Write one when you keep giving the same guidance, when your lab has a set way of doing something, or when a run went wrong and the lesson should stick.

## Create a skill

A skill is a folder under `.kinex/skills/` holding a `SKILL.md` and any supporting files:

```text
.kinex/skills/
└── pick-and-place/
    ├── SKILL.md
    └── bin-layout.md          # optional notes the skill refers to
```

`SKILL.md` starts with two lines of frontmatter, then plain Markdown:

```markdown
---
name: pick-and-place
description: Pick an object from the table and drop it in one of the bins, using the wrist camera to find both.
---

# Pick and place

1. Find the object with the wrist camera. Check the image before moving.
2. Look up the target bin in `bin-layout.md`.
3. Approach from 10 cm above, descend, grasp and lift. Confirm that the
   gripper reports `grasped`; if it doesn't, open, back off and look again.
4. Release 5 cm above the bin.
5. Confirm from the overhead camera that the object is in the bin.
```

| Field | Meaning |
| --- | --- |
| `name` | The skill's name. Defaults to the folder name. |
| `description` | When the skill applies. The agent always sees this line and uses it to decide whether to load the skill. |

Keep each value on one line.

## What to write

Write for a capable colleague who knows robots and Python but has never seen your setup:

- **Say when it applies** in the `description`, in the words a task would use.
- **Give the steps in order**, naming the devices, frames and objects that matter.
- **Say how to check each step**: "confirm from the overhead camera" beats "make sure it worked".
- **Say what to do when it goes wrong**: a missed grasp, an object out of reach.
- **Leave out what the agent already knows.** It reads device profiles and writes its own programs, so don't restate operations or paste Python.

Short skills work best. Put long reference material, such as a bin layout or a parts list, in files beside `SKILL.md` and mention them by relative path. If the procedure has a step worth running the same way every time, save that step as a [program](/docs/programs/) and have the skill name it.

## Try it and improve it

New and edited skills are picked up at the agent's next step, with no restart. Give a task that matches the description and watch for the `skill` call. To be sure it is used, name it: *"use the pick-and-place skill to put the red block in bin 2"*.

Real runs are the fastest way to a good skill:

- **Let the agent draft it.** After a task goes well: *"write a skill for what we just did"*.
- **Learn from failures.** [Record](/docs/recording/) your runs, then: *"review the last three failed runs and update the pick-and-place skill"*.

## Where skills live

Kinex finds every `SKILL.md` under a `skills/` folder, at any depth, searching in this order:

1. the `.kinex/skills/` nearest the current directory;
2. `.kinex/skills/` in the directories above it;
3. `~/.config/kinex/skills/`, for skills you want everywhere;
4. the skills built into Kinex.

The first skill found with a given name wins, so a project can replace a [bundled skill](/docs/skills/#bundled-skills) by defining one with the same name.
