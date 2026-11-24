---
title: Control graph
description: How the agent acts — Python programs run with exec that wire device operations and library functions into perception and control.
group: Concepts
order: 30
sources: ["docs/architecture.md", "docs/tools-and-skills.md", "docs/communication.md", "packages/core/README.md", "packages/core/src/tool/exec.txt", "packages/core/src/tool/lib.txt", "packages/core/src/tool/registry.ts", "packages/core/src/context/robotics.txt", "packages/core/assets/python/kinex/__init__.py"]
---

Kinex has no fixed menu of motion commands. For each step of a task, the agent writes a Python **program** and runs it with the `exec` tool. The program wires device operations and library functions together: read a camera, compute a target, command an arm, wait, check what happened. That wiring is the control graph.

You rarely write these programs yourself. This page explains what the agent is doing when it runs one, and what Kinex guarantees while it runs.

## A program

This one moves an arm to a joint target and reports how close it got:

```python
import asyncio
import numpy as np
from kinex import args, finish, io, lib

async def main():
    target = args()["target"]
    arm = lib.kinematics.joint_model("arm")

    state = await io.read("arm.joint_state")                              # observe
    plan = lib.motion.trajectory(arm.joints, state.position, target,      # compute
                                 period_s=0.02)
    step = plan.duration_s / len(plan.actions)
    await io.publish("arm.joint_target", {"joint_names": arm.names, "points": [
        {"positions": q, "time_from_start": (i + 1) * step}               # command
        for i, q in enumerate(plan.actions)]})
    await io.request("world.wait", duration_s=plan.duration_s + 0.2)      # wait

    reached = await io.read("arm.joint_state")                            # verify
    error = float(np.abs(np.asarray(reached.position) - target).max())
    image, _ = await lib.images.camera_frame("camera_wrist")
    finish({"max_error_rad": error}, file=[image])                        # report

asyncio.run(main())
```

Every program follows the same shape:

1. **Observe.** `io.read` takes the next message of an output topic. Messages are the ROS types the profile declares.
2. **Compute.** Library functions and ordinary Python do the thinking. `kinex.lib` covers frames, cameras, kinematics and motion planning; NumPy, SciPy and OpenCV are installed.
3. **Command.** `io.publish` sends to a topic, `io.request` calls a service and `io.act` sends an action goal.
4. **Wait.** `world.wait` lets world time pass. In a stepped simulation, this is the only thing that advances it.
5. **Verify.** A sent command is not an arrival. The program reads fresh feedback and checks it.
6. **Report.** `finish` ends the program with a small JSON result and the images the agent needs to see.

The agent reads the result, looks at the images and decides what to run next. A program ends wherever the next move depends on something the agent has to see for itself.

## What a program works with

| Name | Purpose |
| --- | --- |
| `io` | Read, subscribe, publish, request and act on device operations, named `<device>.<operation>` |
| `runtime` | Discover devices and operations without touching them: `runtime.devices()`, `runtime.operations("arm")`, `runtime.describe("arm.joint_target")` |
| `lib` | The [function library](/docs/programs/#the-function-library): `lib.frames`, `lib.images`, `lib.kinematics`, `lib.motion`, plus your own modules |
| `subagent` | Ask a model for a judgment in the middle of a program, such as "is the mug upright?" |
| `args`, `finish` | The program's arguments, and its only way to return |

The [Python API](/docs/python-api/) lists every call.

### Motions that take time

Some devices serve ROS 2 actions: a goal is accepted at once, then runs as world time passes. A program sends the goals, then waits for them through the world:

```python
left = await io.act("left_arm.move", left_goal)
right = await io.act("right_arm.move", right_goal)
await io.request("world.wait", goals=[left, right], goal_timeout_s=5.0)
print(left.status, right.status)       # succeeded, canceled or aborted
```

Both arms move at the same time, and the wait returns when both have finished or the timeout cancels them.

## What Kinex guarantees

- **One approval per program.** A single approval covers everything a program reads and commands. See [permissions](/docs/workspace/#permissions).
- **A fresh process each time.** Programs keep no state between runs. Anything long-lived, such as a connection or a loaded model, belongs to a device node. A program is stopped after 120 seconds unless the agent sets another `timeout_s`.
- **Failure stops the robot.** If a program fails, times out or is cancelled, Kinex stops every device it commanded. A program that succeeds leaves motion running, so one that must end at rest calls the device's `stop`.
- **`/stop` always works.** Stopping a device also cancels the programs that were commanding it.
- **Lifecycle stays with you.** A program can't load or unload devices, and it can't start a recording.

Approvals are a safeguard, not a sandbox. Keep a hardware emergency stop within reach.

## The agent's tools

| Tool | Does |
| --- | --- |
| `exec` | Run a program, given as source or as a saved file |
| `lib` | Browse the function library: modules, then functions, then a signature and docstring |
| `device`, `devices` | Call one device operation directly, or several at once; load and unload devices |
| `device_stop` | Stop one device or all of them. Never needs approval. |
| `profile_write` | Validate and save device and workspace facts |
| `skill` | Load a [skill's](/docs/skills/) instructions |
| `setup_plan` | Track what [onboarding and calibration](/docs/onboarding/) still owe the current task |
| `record` | Start and stop [recordings](/docs/recording/), when started with `--enable-recording` |
| `question` | Ask you for a missing fact or a choice |

The agent also keeps its coding tools: `read`, `write`, `edit`, `bash`, `grep`, `find` and `ls`.

## From one-off to reusable

A program that worked is worth keeping. Saved under `.kinex/programs/`, it runs again with `/exec`, without the agent. Functions that several programs share move into `.kinex/lib/`. See [Programs and the library](/docs/programs/).
