---
title: Programs and the library
description: Keep a program that worked, run it again without the agent, share functions through kinex.lib, ask a model for a judgment mid-program, and read a program as a flow chart.
group: Guides
order: 30
label: Programs & library
sources: ["docs/tools-and-skills.md", "docs/commands.md", "docs/overview.md", "packages/core/README.md", "packages/core/src/commands.ts", "packages/core/src/tool/lib.txt", "packages/core/assets/python/kinex/lib/__init__.py", "src/integration/extension.ts"]
---

Most [programs](/docs/control-graph/) are written for one moment and thrown away. Some are worth keeping: a pick-and-place that works, a routine that homes both arms. Kinex gives that code two homes in the workspace:

```text
.kinex/
├── programs/        # saved programs: complete scripts, run by path
└── lib/             # the function library: functions that programs import
```

A **program** is an entry point. A **library function** is a part of one.

## Save a program and run it again

Ask the agent to keep what it just ran:

> Save that as a program that takes the object and the target as arguments.

It writes the script to `.kinex/programs/`, reading its inputs with `args()`. From then on, anyone can run it:

| Caller | How |
| --- | --- |
| You | `/exec .kinex/programs/pick_place.py object="red block" target="blue pad"` |
| The shell | `kinex run '/exec .kinex/programs/pick_place.py object="red block" target="blue pad"'` |
| The agent | `exec` with `file` and `args` |

`/exec` runs the program directly; no model is involved. It asks for no approval, since you typed it. `/stop` cancels it, and the usual rule applies: a program that fails or is cancelled stops the devices it commanded. The result shows in the session, images included, and the agent can read it afterwards.

Arguments are `name=value` pairs. A value is read as JSON when it parses (`attempts=3`, `pose=[0.1,0.2]`, `object="red block"`) and as text otherwise. One JSON object can replace the pairs.

## The function library

`kinex.lib` is one Python package assembled from several places. A module nearer the workspace replaces one of the same name farther away:

1. the workspace's `.kinex/lib/`;
2. `.kinex/lib/` in the directories above it;
3. `~/.config/kinex/lib/`, for functions you want everywhere;
4. the modules built into Kinex.

| Built-in module | Covers |
| --- | --- |
| `lib.frames` | Poses between frames at a given time |
| `lib.images` | Camera frames, pixel arrays, image files and camera geometry |
| `lib.kinematics` | Forward and inverse kinematics from a device's URDF |
| `lib.motion` | Joint trajectories and straight tool paths within velocity and acceleration limits |
| `lib.calibration` | Sampling and solvers for [calibration](/docs/onboarding/#calibration) |

### Add your own functions

A library module is an ordinary Python file: a docstring that says what it holds, then functions with typed signatures and docstrings. Functions that touch devices are `async` and import `io` themselves.

```python
# .kinex/lib/tabletop.py
"""Tabletop manipulation for this cell. Poses are in arm/base."""
from kinex import io

async def grasp(position: float, settle_s: float = 0.5) -> bool:
    """Command the grip joint to position, wait settle_s and say whether it holds something."""
    await io.publish("gripper.target", {"data": position})
    await io.request("world.wait", duration_s=settle_s)
    return (await io.read("gripper.grasped")).data
```

A program calls it as `await lib.tabletop.grasp(0.02)`. There is nothing to register: the signature and the docstring are the interface, and a new module is usable at the agent's next step.

### Browse it

`/lib` shows the library one level at a time, and the agent's `lib` tool does the same. Both read source files, so nothing runs.

```text
/lib                      # modules, with where each comes from
/lib images               # a module's docstring and function names
/lib images.camera_frame  # a function's signature and docstring
```

Good docstrings matter here. They are how the agent finds your function and learns to call it.

## Ask a model mid-program

Some decisions need eyes: is the object centered, did the lid close? A program can ask a model with `subagent`, so a saved routine can judge what it sees without handing control back to the main agent.

```python
# .kinex/lib/judge.py
"""Judgments a model makes for a program."""
from kinex import subagent
from kinex.lib import images

async def upright(camera: str = "camera_wrist") -> bool:
    """Whether the mug in the camera's view stands upright."""
    image, _ = await images.camera_frame(camera)
    reply = await subagent("Is the mug upright? Answer yes or no.", show={"view": image})
    answer = reply.strip().lower()
    if answer not in ("yes", "no"):
        raise ValueError(f"unusable reply: {reply!r}")
    return answer == "yes"
```

The subagent sees only the instruction and what `show` names. It has no tools and no memory of other calls, so the program states the form of the reply and checks it before acting. The robot doesn't pause while the model thinks, so ask when it is at rest.

Subagents use the session's model unless you choose another:

```text
/subagent                              # show the current choice
/subagent provider/model [thinking]    # use this model for every later call
/subagent session                      # go back to the session's model
```

The choice persists across sessions. Subagents are available in standalone Kinex; the plugins don't provide them yet.

## Read a program as a flow chart

`/visualize` draws a program as a self-contained HTML page:

```text
/visualize .kinex/programs/pick_place.py     # a whole program
/visualize tabletop.grasp                    # one library function
```

Each device operation, wait, subagent call and function call is a node. Click a call to open that function's chart in place, or any node to see its source lines. The chart is derived from source alone: nothing runs and no device is touched. Pages are written to `.kinex/flow/` unless you give another path.

Use it to review a program before you let it move a robot, or to explain one to a colleague.
