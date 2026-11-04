---
title: Writing skills
description: Teach Kinex how to approach your tasks by writing a skill — what to put in it, where it goes, and how to improve it from real runs.
group: Guides
order: 30
sources: ["docs/architecture.md", "packages/core/src/skill/index.ts", "packages/core/src/tool/skill.ts", "packages/core/src/tool/skill.txt", "packages/setup/assets/builtin/skill/calibrate-tcp-offset/SKILL.md"]
---

The agent writes and runs its own control programs. What you teach it is how to approach your tasks, and a skill is how you do that: a short written procedure the agent loads whenever a task matches it. Write one when you keep giving the agent the same guidance, when your lab has a set way of doing a task, or when a run went wrong and you want the lesson remembered.

## Create a skill

A skill is a folder under `.kinex/skills/` with a `SKILL.md` file, plus any supporting files:

```text
.kinex/skills/
└── pick-and-place/
    ├── SKILL.md
    └── bin-layout.md          # optional supporting notes
```

`SKILL.md` starts with a short frontmatter block, followed by the instructions in plain Markdown:

```markdown
---
name: pick-and-place
description: Pick an object from the table and drop it in one of the bins, using the wrist camera to find both.
requires: profile:wrist_cam
---

# Pick and place

1. Find the object with the wrist camera, and check the detection image before moving.
2. Look up the target bin in `bin-layout.md`.
3. Approach from 10 cm above the object, then descend, grasp and lift.
   Check that the gripper reports `grasped` before moving on; if not, open,
   back off and look again.
4. Drop the object 5 cm above the bin.
5. Confirm from the overhead camera that the object is in the bin.
```

| Field | Meaning |
| --- | --- |
| `name` | The skill's name. Defaults to the folder name. |
| `description` | When the skill applies. The agent always sees this line, and uses it to decide whether to load the skill. |
| `requires` | Optional. Calibration the skill depends on, such as `profile:wrist_cam`. The agent is warned when it is missing. |

Keep each frontmatter value on a single line.

## What to write

A good skill reads like instructions to a capable colleague who knows robots and Python but not your setup:

- **Say when it applies** in the `description`, in the words a task would use.
- **Give the steps in order**, naming the devices, frames and objects that matter.
- **Say how to check each step**, and how to tell success from failure, for example "confirm from the overhead camera".
- **Say what to do when something goes wrong**, such as a missed grasp or an object out of reach.
- **Leave out what the agent already knows.** It reads device profiles and writes its own programs, so don't repeat device operations or Python code.

Short skills work best. Put long reference material, such as a bin layout, part list or example images, in separate files next to `SKILL.md` and mention them by relative path. When the skill loads, the agent is told the skill's folder, so it can read those files or run scripts kept there.

## Try it and improve it

Kinex picks up new and edited skills at the agent's next step, with no restart. Give the agent a task that matches the description and watch for the `skill` call that loads it. To make sure it is used, name it: "use the pick-and-place skill to put the red block in bin 2".

The quickest way to improve a skill is from real runs:

- **Let the agent draft it.** After a task goes well, ask "write a skill for what we just did".
- **Learn from failures.** [Record](/docs/recording/) your runs, then ask "review the last three failed runs and update the pick-and-place skill".

## Where skills go

Kinex finds every `SKILL.md` under a `skills/` folder, at any depth. It searches, in order:

1. the `.kinex/skills/` nearest the current directory;
2. `.kinex/skills/` folders in enclosing directories further up;
3. `~/.config/kinex/skills/`, for skills you want in every project;
4. the skills built into Kinex.

When two skills share a name, the first one found wins, so a project can override a [bundled skill](/docs/skills/#bundled-skills) by defining its own with the same name.
