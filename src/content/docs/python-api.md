---
title: Python API
description: What a program can import from kinex — io, runtime, the function library, values and errors.
group: Reference
order: 30
sources: ["docs/communication.md", "docs/tools-and-skills.md", "packages/core/README.md", "packages/core/assets/python/kinex/__init__.py", "packages/core/assets/python/kinex/communication.py", "packages/core/assets/python/kinex/runtime.py", "packages/core/assets/python/kinex/values.py", "packages/core/assets/python/kinex/lib/*.py"]
---

This is the API that [programs](/docs/control-graph/) and [library functions](/docs/programs/) use. Everything is imported from `kinex`:

```python
from kinex import args, finish, io, lib, runtime, subagent, pose
```

The agent browses the same library with its `lib` tool, and you can with `/lib`. Docstrings in the source are the authority; this page is the map.

## Program

| Call | Does |
| --- | --- |
| `args()` | The arguments this run was given, as a dict |
| `finish(result=None, file=None)` | End the program. `result` is JSON-ready data; `file` is an image message, an image path or a list of them to attach for the agent. |
| `await subagent(instruction, show=None, model=None, thinking=None, timeout_s=60)` | Ask a model for a judgment and return its reply as text. `show` maps names to images or values. |
| `profile(device)` | The device's parsed `profile.yaml`: calibration, frames and typed facts |
| `robot()` | The workspace manifest: identity and keep-out zones |

`finish` is the only way a program returns. Without it the result is `null`; an uncaught exception is the failure. Printed text comes back as bounded output. Images are never data: an image inside `result` is an error.

## Devices: `io`

Operations are named `<device>.<operation>`, as the profile declares them.

| Call | Does |
| --- | --- |
| `await io.read(op, timeout_s=None)` | The next message on an output topic |
| `io.subscribe(op, depth=None)` | Follow an output topic. The stream has `await stream.next(timeout_s=...)`, `stream.latest(max_age_s=...)` and `stream.close()`, and works as a `with` block. |
| `await io.publish(op, message)` | Send one message to an input topic. The message is a ROS message or a dict of its fields. |
| `await io.request(op, **fields)` | Call a service and return its response. JSON services take keyword fields and return a dict. |
| `await io.act(op, goal)` | Send an action goal and return a `Goal` once the device accepts it |

A `Goal` has `status` (`executing`, then `succeeded`, `canceled` or `aborted`), `feedback`, `result`, `done`, `await goal.cancel()` and `await goal.wait()`. To wait for goals in a stepped simulation, pass them to the world: `await io.request("world.wait", goals=[goal], goal_timeout_s=5.0)`.

### World time

```python
reply = await io.request("world.wait", duration_s=0.5)   # reply.time_s, reply.waited_s
```

One wait at a time. A wait of zero is an observation barrier: it returns once the world has caught up, without advancing it. Reading a topic never advances the world.

## Discovery: `runtime`

These work on unloaded devices and never move anything.

| Call | Returns |
| --- | --- |
| `runtime.devices()` | Every configured device with its type and readiness |
| `runtime.device(name)` | One device's description and state |
| `runtime.operations(device)` | The device's declared operations |
| `runtime.describe("arm.joint_target")` | One operation's transport and full ROS message definition |

## Values

Each value has one form in a program, one when written down and one on the wire. Kinex converts between them at the edges.

| Value | In a program | Written down | On the wire |
| --- | --- | --- | --- |
| Vector | NumPy array | List of numbers | The declared ROS array field |
| Pose | SciPy `RigidTransform` | `[x, y, z, qx, qy, qz, qw]` | `Pose`, `Transform` |
| Time | Seconds on the world clock | Seconds | `Time`, `Duration` |
| Frame | `device:frame` or `device/frame` | The same | `frame_id` |

| Call | Does |
| --- | --- |
| `pose(value)` | A `RigidTransform` from seven numbers, rows of them or a ROS pose message. Poses compose with `*`. |
| `seconds(value)` | Seconds from a ROS time, a duration or a stamped message |
| `plain(value)` | The JSON-ready form of any value, for a program that writes its own file |

`io.publish` and `io.request` accept these forms in a field mapping: seconds for a `Duration`, a pose for a `Pose`, an array for a numeric field.

## Function library: `lib`

### `lib.frames`

| Function | Returns |
| --- | --- |
| `await lookup_transform(target, source, stamp=None, timeout_s=5)` | The pose of `source` in `target`. Multiply it by a pose, or `apply` it to points, to express them in `target`. `stamp` is seconds or a stamped message; omit it for the latest. |

### `lib.images`

| Function | Returns |
| --- | --- |
| `await camera_frame(camera, timeout_s=None, eye=None)` | The current image and, for RGB-D, the depth from the same acquisition |
| `await stereo_frame(camera, timeout_s=None)` | A stereo camera's left and right images |
| `image_array(image)` | Pixels as a NumPy array: H×W×3 RGB, or H×W for depth |
| `save_image(image)` | The path of a temporary PNG, as model devices take images |
| `await camera_geometry(camera)` | The camera's geometry, with `await geometry.unproject(pixels)` to optical rays and `await geometry.project(points)` to pixels |

### `lib.kinematics`

| Function | Returns |
| --- | --- |
| `joint_model(device)` | The device's kinematic model from its URDF: `model.names`, `model.joints`, `model.tips` |
| `model.fk(positions, link=None)` | The link's pose in `<device>/base` |
| `model.ik(target, seed, link=None)` | Joint positions near `seed` that reach the target pose. Options include `free_axis=[x, y, z]` and `position_only=True`. |

IK searches near the seed, so it never answers with a distant posture. When it fails it raises `IKError`, whose `details.reason` is `posture_change`, `out_of_reach` or `not_found`.

### `lib.motion`

| Function | Returns |
| --- | --- |
| `trajectory(joints, start, target, period_s, fraction=1.0, max_velocity=None, max_acceleration=None)` | A synchronized rest-to-rest joint move: `plan.actions`, one row per sample, and `plan.duration_s` |
| `cartesian(model, start, poses, period_s, ...)` | A straight tool path through one or more poses, solved by IK at each waypoint |
| `planning_limits(joints, max_velocity=None, max_acceleration=None)` | The velocity and acceleration limits a plan would use |

These plan and never touch a device. The program sends the plan through the device's command operation, waits and verifies arrival.

### `lib.calibration`

Calibration runs, sampling and the solvers `rigid`, `tcp`, `camera`, `sensor` and `base`, used by the [calibration skills](/docs/skills/#bundled-skills). Browse it with `/lib calibration`.

## Errors

| Exception | Raised when |
| --- | --- |
| `kinex.OperationError` | A device rejects a request. It carries `operation`, `response` and `details`. |
| `kinex.RPCError` | A call to the Kinex host fails; `code` says why, such as `subagent_failed` |
| `lib.kinematics.IKError` | IK finds no nearby solution |
| `TimeoutError` | A read, a request or a lookup runs out of time |

An exception a program doesn't catch ends it as a failure, and Kinex then stops every device the program commanded.
