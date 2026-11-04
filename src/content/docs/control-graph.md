---
title: Control graph
description: How the agent acts — Python programs run with exec, the kinex.helpers library, saving programs as tools, and the Python environment and permissions they run under.
group: Concepts
order: 30
sources: ["docs/architecture.md", "docs/tools-and-skills.md", "docs/communication.md", "docs/overview.md", "packages/core/README.md", "packages/core/src/tool/registry.ts", "packages/core/src/tool/exec.txt", "packages/core/src/tool/device/device.txt", "packages/core/src/tool/python-catalog.ts", "packages/core/src/permission/index.ts", "packages/core/src/config/config.ts", "packages/core/src/python/environment.ts", "packages/core/assets/python/kinex/__init__.py", "packages/core/assets/python/kinex/runtime.py", "packages/core/assets/python/kinex/communication.py", "packages/core/assets/python/kinex/helpers/helpers.txt", "packages/setup/src/tool/setup_plan.txt"]
---

The control graph is how the agent turns a plan into action. Rather than choosing from fixed motion commands, the agent writes a Python program and runs it with the `exec` tool. The program wires device operations and helpers into a loop: observe, compute, command, wait for world time, check the result. Each `exec` call runs one such graph, for as long as the program takes; anything persistent stays in the device nodes.

This page covers how a program is written, how it is saved as a tool, and the environment it runs in. You rarely write these programs yourself; it helps to know what the agent is doing when it runs one.

## Writing a program

### Running it with `exec`

`exec` runs Python source, or a script file, in a fresh process. No manifest or `main()` function is needed:

```json
{
  "description": "list devices",
  "python": "from kinex import runtime, finish\nfinish(runtime.devices())"
}
```

| Input | Meaning |
| --- | --- |
| `python` or `file` | Exactly one: Python source, or a script path relative to the working directory |
| `description` | Optional short label shown for the call, such as `inspect arm state` |
| `args` | An object the script reads with `kinex.args()` |
| `argv` | A list that becomes `sys.argv[1:]` |
| `timeout_s` | Wall-clock limit, 120 seconds by default |

The result holds the script's printed output plus either the value it passed to `finish()` or the error it raised. `finish(result, file=[...])` also attaches saved camera images, so the agent can see them. One approval covers everything a script does. Scripts can't load or unload devices; load what a script needs with `/load` first.

### Reading and commanding devices

Scripts reach devices through `communication()`. Each operation is named `<device>.<operation>` and is a ROS 2 topic or service:

| Call | Use it for |
| --- | --- |
| `io.subscribe(op, depth=1)` | An output topic, such as `arm.joint_state`. Read it with `await stream.next(timeout_s=...)`, or take `stream.latest()` for the last message received. |
| `await io.request(op, **fields)` | A service, such as `world.wait` or a model's `detect`. JSON services take keyword fields and return a dict. |
| `await io.publish(op, message)` | An input topic, such as `gripper.target`. The message is a ROS message or a dict of its fields. |

This script commands a gripper position, waits one second of world time, then reads the gripper's measured state:

```python
import asyncio
from kinex import args, communication, finish

async def main():
    async with communication() as io:
        state = io.subscribe("gripper.joint_state", depth=1)
        await io.publish("gripper.target", {"data": args()["position"]})
        await io.request("world.wait", duration_s=1.0)
        sample = await state.next(timeout_s=2)
    finish({"names": sample.name, "positions": sample.position})

asyncio.run(main())
```

A service that rejects a request raises `kinex.OperationError`. For the exact rules, see the [communication contract](https://github.com/stacx-lab/kinex/blob/ade9a7e971b31e0a9b3f284df02e019ecf8db67b/docs/communication.md).

### Finding devices

`kinex.runtime` tells a program what the workspace offers. Its calls work on unloaded devices and never move anything:

```python
from kinex import runtime, finish
names = runtime.devices()                    # names, types and readiness
ops = runtime.operations("arm")              # an arm's operations
spec = runtime.describe("arm.joint_target")  # the full ROS message schema
finish({"joint_target": spec})
```

### Helpers

`kinex.helpers` provides the common building blocks. Inside `communication()`, they share the script's connection:

| Area | Helper | Does |
| --- | --- | --- |
| Images | `await helpers.camera_frame(io, camera)` | The current image and, for an RGB-D camera, its depth |
| | `helpers.save_image(image)` | Save an image as a PNG and return its path, for `finish(file=...)` |
| | `helpers.image_array(image)` | The image's pixels as a NumPy array |
| Frames | `await helpers.relative_pose(io, child, parent)` | Express a pose in one frame relative to another, such as a camera point in `arm:base` |
| Kinematics | `helpers.joint_model(device)` | A joint device's joints, with forward and inverse kinematics from its URDF |
| Motion | `helpers.trajectory(joints, start, target, period_s)` | Plan a smooth joint trajectory, without touching the device |
| Perception | `await helpers.locate_object_3d(io, camera, model, prompt)` | Find an object with a vision model and return its 3D position. See [vision models](/docs/vision/). |
| Policy | `await helpers.run_policy(io, model, observation, command)` | Run a policy model once and send its actions. See [VLAs](/docs/vla/). |

The [helper index](https://github.com/stacx-lab/kinex/blob/ade9a7e971b31e0a9b3f284df02e019ecf8db67b/packages/core/assets/python/kinex/helpers/helpers.txt) lists every helper with its full signature.

## Saving a program as a tool

A program worth reusing can be saved as a custom tool, which the agent then calls by name, like any built-in tool. Kinex looks for custom tools in, in order:

1. the `.kinex/tools/` nearest the current directory;
2. `.kinex/tools/` folders in enclosing directories further up;
3. `~/.config/kinex/tools/`, for tools you want in every project.

The first tool found with a given name wins, and Kinex's own tools always take priority. Tools are rescanned on every agent step, so a tool the agent writes mid-task is available at its next step.

A Python tool is a folder holding a `tool.yaml` and a `tool.py`. `tool.yaml` gives the tool's `name`, `description` and `parameters` (a JSON Schema). With `async: true`, `tool.py` exports `async def main(args, io)`, where `io` is the same object `communication()` gives a program. The agent normally writes these itself, for example when you ask it to "save that as a tool".

## Where programs run

Every call the agent makes, and every device command you type (`/load`, `/stop`, `/record`…), goes through the Kinex runtime, `@kinex/core`. It manages the devices, runs `exec` programs in Kinex Python and checks each call against your permissions.

### Python environment

Programs, custom Python tools, device nodes and recording all use one Python environment per workspace, **Kinex Python**, in `.kinex/python/`. By default it is a [Pixi](https://pixi.sh) environment with ROS 2 Jazzy from RoboStack, and it includes NumPy, SciPy, OpenCV, Pillow, PyYAML, rclpy, tf2 and rosbag2_py. Choose another provider in `.kinex/kinex.json`:

```json
{ "python": { "provider": "ros-humble" } }
```

| `provider` | Kinex Python |
| --- | --- |
| `ros-jazzy` (default) | ROS 2 Jazzy, installed with Pixi |
| `ros-humble` | ROS 2 Humble, installed with Pixi |
| `uv` | Plain Python without ROS, installed with [uv](https://docs.astral.sh/uv/) |

- Install Pixi (or uv for the `uv` provider) before first use. The Pixi environments run on Linux x86-64 only.
- Kinex creates the environment the first time it is needed, which can take several minutes. If you change the provider, it is prepared again on next use.
- To build custom ROS message packages into it, list their source folders, relative to `.kinex/`, in `python.interfaces`.
- Put shared workspace code in `.kinex/lib/`, which programs, tools and nodes can import. Kinex never activates Kinex Python in your shells.

### Permissions

Every call the agent makes is checked before it runs. Your own slash commands are trusted and never checked. How often you're asked depends on the [approval mode](/docs/agent/#approval-modes). In the default `ask` mode:

| Permission | Covers | Default |
| --- | --- | --- |
| `device_read` | Reading a device's outputs, such as joint states and camera images | ask |
| `device_act` | Commands and services sent with `device` or `devices`, such as motion, model inference and world waits, and loading or unloading through the `device` tool | ask |
| `device_stop` | Stopping devices | always allowed |
| `python_tool` | `exec` programs and custom Python tools | ask |
| `record` | The agent starting or stopping a recording | ask |
| `profile_write` | Saving device and workspace facts | allow |
| `setup_plan` | Editing the setup plan | allow |
| `calib_compute` | Running calibration solvers | ask |
| `shell`, `write`, `edit` | Pi's shell and file-editing tools | ask |

To change the defaults, set rules in `.kinex/kinex.json` for one project or `~/.config/kinex/kinex.json` for all of them. Each value is `allow`, `ask` or `deny`; the project file wins.

```json
{
  "permission": {
    "device_read": "allow",
    "device_act": "ask",
    "shell": "ask"
  }
}
```

`/stop` and `device_stop` never need approval. Approvals are a safeguard, not a sandbox: they don't isolate the agent from your system or make motion safe on their own, so keep your hardware emergency stop within reach.

## All agent tools

The full set of tools the agent can call:

| Tool | Does |
| --- | --- |
| `exec` | Run a Python program against the devices. This is the main way the agent acts. |
| `device` | Call one of a device's operations directly, or load or unload the device |
| `devices` | Call several devices at once; each call reports its own result or error |
| `device_stop` | Stop one device, or every loaded device that can stop; never needs approval |
| `profile_write` | Validate and save workspace and device facts, including calibration requests |
| `skill` | Load a [skill's](/docs/skills/) instructions into the conversation |
| `record` | Start and stop [recordings](/docs/recording/); available only with `--enable-recording` |
| `setup_plan`, `calib_sample`, `calib_compute` | Plan setup, capture calibration samples and run calibration solvers, during [onboarding and calibration](/docs/onboarding/) |
| `question` | Ask you a structured question (standalone Kinex only) |

The agent also keeps the host's coding tools (`read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`), and can call [custom tools](#saving-a-program-as-a-tool) you or it have added.
