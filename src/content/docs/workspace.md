---
title: Workspace and configuration
description: What lives in .kinex/, how Kinex finds it, the settings in kinex.json, the Kinex Python environment and the permissions the agent works under.
group: Reference
order: 40
label: Workspace & configuration
sources: ["docs/overview.md", "docs/communication.md", "docs/agent-integration.md", "packages/core/src/config/config.ts", "packages/core/src/permission/index.ts", "packages/core/src/python/project.txt", "packages/core/src/python/ros-project.txt", "packages/core/src/context/robotics.txt", "src/integration/interaction.ts", "src/integration/extension.ts"]
---

A Kinex workspace is a `.kinex/` folder. It holds everything about one robot: its devices, the code and know-how built for it, and the records of what it did. Start `kinex` in the folder that contains it, or in any folder below.

## Layout

```text
robot-workspace/
└── .kinex/
    ├── workspace.yaml          # the robot as a whole: identity and keep-out zones
    ├── kinex.json              # settings: ROS distribution, permissions, recording
    ├── devices/<name>/         # one folder per device
    │   ├── profile.yaml        #   operations, physical facts and calibration
    │   ├── node.py             #   its ROS 2 node, when Kinex runs one
    │   └── arm.urdf            #   geometry, for joint and gripper devices
    ├── programs/               # saved programs, run with /exec
    ├── lib/                    # your modules of the kinex.lib function library
    ├── skills/<name>/SKILL.md  # your skills
    ├── device/                 # your device guides, for setup-device
    ├── setup/plan.json         # the onboarding and calibration plan
    ├── calib/<run>/            # calibration evidence
    ├── recordings/             # recorded runs (rosbag2)
    ├── flow/                   # flow charts written by /visualize
    └── python/                 # Kinex Python
```

Folders appear as they are needed; an empty directory is a valid place to start. Conversation sessions are stored outside the workspace, under `~/.local/share/kinex/`.

### Where Kinex looks

The nearest `.kinex/` at or above the current directory is the workspace, and its `devices/` are the robot. Reusable content is searched more widely, nearest first:

1. the workspace's `.kinex/`;
2. `.kinex/` folders in the directories above it;
3. `~/.config/kinex/`, for content you want in every workspace;
4. what ships with Kinex.

This applies to `lib/`, `skills/` and `device/`. The first match for a name wins, so a workspace can replace a built-in skill or library module by defining one with the same name.

## Settings: `kinex.json`

Settings live in `.kinex/kinex.json` for one workspace and `~/.config/kinex/kinex.json` for all of them. The workspace file wins.

```json
{
  "python": { "provider": "ros-humble", "interfaces": ["../vendor/my_robot_msgs"] },
  "permission": { "device_read": "allow" },
  "record": { "max_mb": 8192 }
}
```

| Setting | Meaning | Default |
| --- | --- | --- |
| `python.provider` | Which Kinex Python to build: `ros-jazzy`, `ros-humble` or `uv` | `ros-jazzy` |
| `python.interfaces` | Source folders of custom ROS message packages to build in, relative to `.kinex/` | none |
| `permission.<name>` | `allow`, `ask` or `deny` for one [permission](#permissions) | see below |
| `record.max_mb` | Size at which a [recording](/docs/recording/) ends | `4096` |

## Kinex Python

Programs, library functions, device nodes and recording all run in one Python environment per workspace, in `.kinex/python/`. Kinex never activates it in your shell, and it never touches a system ROS install.

| `python.provider` | Environment |
| --- | --- |
| `ros-jazzy` (default) | ROS 2 Jazzy from RoboStack, installed with [Pixi](https://pixi.sh) |
| `ros-humble` | ROS 2 Humble from RoboStack, installed with Pixi |
| `uv` | Plain Python without ROS, installed with [uv](https://docs.astral.sh/uv/) |

- **Install Pixi first** (or uv, for the `uv` provider). The ROS environments run on Linux x86-64.
- **The first program builds it.** Kinex creates the environment the first time one is needed, which takes several minutes. Changing the provider or the interface sources rebuilds it on next use.
- **What's inside.** NumPy, SciPy, OpenCV, Pillow and PyYAML, plus rclpy, tf2, rosbag2 and the standard message packages in the ROS environments.
- **A device with its own SDK** can add it to its node alone, or name a separate interpreter in its profile. That never changes the Python your programs use.

## Permissions

Every call the agent makes is checked before it runs. Commands you type yourself are trusted and never checked.

| Permission | Covers | Default |
| --- | --- | --- |
| `device_read` | Reading device outputs with `device` or `devices`: joint states, camera images | ask |
| `device_act` | Commands and requests sent with `device` or `devices`, and loading or unloading a device | ask |
| `python_tool` | Running a program with `exec`. One approval covers everything the program reads and commands. | ask |
| `device_stop` | Stopping devices | always allowed |
| `profile_write` | Saving device and workspace facts | allow |
| `setup_plan` | Updating the setup plan | allow |
| `record` | The agent starting or stopping a recording | ask |
| `shell`, `write`, `edit` | The agent's shell and file-editing tools | ask |

When asked, you can allow once, allow for the rest of the session, or deny. How often you are asked depends on the [approval mode](/docs/agent/#approval-modes): `ask` follows these rules, while `auto` and `yolo` allow everything.

To change a default, set a rule under `permission` in `kinex.json`:

```json
{ "permission": { "device_read": "allow", "python_tool": "ask", "shell": "deny" } }
```

Permissions are a safeguard, not a sandbox. They don't isolate the agent from your system, and they don't make motion safe. Keep a hardware emergency stop within reach.
