---
title: Onboarding real robots
description: Onboard hardware for a concrete task with /onboarding and /register.
group: Get started
order: 20
label: Onboarding real robots
sources: ["README.md", "packages/setup/README.md", "packages/setup/src/workflows/onboarding.txt", "packages/core/src/workflows/register.txt", "packages/core/assets/builtin/skill/setup-device/SKILL.md", "packages/core/src/context/robotics.txt", "docs/setup.md", "docs/overview.md"]
---

Kinex drives real hardware through the same device interface it uses for simulators. You describe your robot and what you want it to do; the agent writes the device profiles and their ROS 2 nodes, brings the hardware up and checks it, calibrating only what the task needs. Supported embodiments include arms, lifts, mobile bases, quadrupeds, humanoids, grippers, suction, dexterous hands, cameras, IMUs and F/T sensors (see [Devices](/docs/devices/)).

Assumes Kinex is installed (see [Install and run](/docs/#install-and-run)).

## 1. Start Kinex in a fresh workspace

```sh
mkdir -p robot-workspace
cd robot-workspace
kinex
```

If you haven't yet, connect a model with `/login` and `/model`.

## 2. Onboard your robot

Describe the hardware, how it connects, and the task:

```text
/onboarding Set up my robot arm, gripper, and overhead camera to pick objects from the table.
```

Onboarding is an interview. The agent inspects what is already there, asks only for missing facts, and records a plan in `.kinex/setup/plan.json`. Early on it settles which ROS 2 distribution your robot uses (Jazzy or Humble) and sets up the `world` device that keeps time. It then prepares each device's profile and node, loads the devices and verifies them, covering only what this task needs. Unknowns stay `???`; nothing is invented.

You can also register devices one at a time with `/register <type-or-template>`:

```text
/register rgbd
/register grounding-dino
```

Each prepares the device's node and writes an unloaded profile, validating it without touching the hardware; run `/load` to bring it up. If your robot already runs ROS 2, onboarding reuses its drivers (see [Robots that already run ROS 2](#robots-that-already-run-ros-2)).

## 3. Calibrate

Calibration pins down the physical facts the task depends on but the agent can't know yet, such as camera intrinsics, where a camera sits relative to the arm (extrinsics), the tool-tip (TCP) offset, or joint limits. It is handled by Kinex's calibration skills. Describe what you want calibrated, or leave it blank:

```text
/calibrate camera-to-arm transform for picking
/calibrate
```

The agent works out what needs calibrating and which procedure to follow, guides you through collecting samples, and writes the result into the device profile. See [Onboarding & calibration](/docs/onboarding/#calibration) for the bundled procedures.

## 4. Bring it up and give a task

```text
/devices
/load all
/ping all
```

Then give the task in plain language. Useful during work:

| Command | Effect |
| --- | --- |
| `/stop [device]` | Cancel the response, stop actuators in their stop scope |
| `/unload <device>` | Release a device |
| `/unregister <device>` | Confirm, then delete its profile, node and files |

## Robots that already run ROS 2

Kinex devices are ROS 2 nodes, so a ROS 2 robot needs nothing extra. Start the robot's ROS stack, then onboard it as above. Onboarding:

- **reuses the robot's drivers.** A small Kinex node adapts a driver's topics to the device's operations, or the device points straight at topics your stack already serves. Unloading a device never stops your stack.
- **matches your ROS setup.** It records the robot's ROS 2 distribution, Jazzy or Humble, in `.kinex/kinex.json`, and uses the same ROS domain as your robot.
- **builds custom messages.** If your robot uses its own message or service types, it lists their packages in `python.interfaces` so Kinex Python can use them.

Kinex keeps its own ROS 2 Python environment in `.kinex/python`, so your system ROS install is never changed. See [Python environment](/docs/control-graph/#python-environment).

## Workspace layout

Start Kinex from your project folder. Directories are created as needed.

```text
robot-workspace/
├── .kinex/                     # robotics workspace
│   ├── workspace.yaml          # robot and workspace settings
│   ├── kinex.json              # ROS distribution and permission rules
│   ├── devices/<name>/         # one folder per device
│   │   ├── profile.yaml        # operations, physical facts and calibration
│   │   ├── node.py             # its ROS 2 node, when Kinex runs one
│   │   └── arm.urdf            # geometry, for arms and grippers
│   ├── lib/                    # shared Python helpers
│   ├── tools/                  # callable agent tools
│   ├── skills/                 # task procedures (SKILL.md)
│   ├── setup/plan.json         # onboarding plan
│   ├── calib/<run>/            # calibration evidence
│   ├── python/                 # Kinex Python (ROS 2 environment)
│   ├── recordings/             # recorded runs (rosbag2)
│   └── agent/settings.json     # agent settings and packages
└── .pi/                        # Pi agent resources
```

- **`.kinex/`** holds robot configuration. **`devices/`** contains each device's profile, node and geometry. See [Devices](/docs/devices/#profiles).
- **`.kinex/lib/`** holds shared Python helpers that nodes, tools and scripts can import. **`tools/`** and **`skills/`** add callable operations and task procedures. See [Writing skills](/docs/writing-skills/).
- **`.pi/`** holds Pi agent resources; **`.kinex/agent/`** holds project agent settings and package choices. See [Plugin systems](/docs/plugins/).
- **`.kinex/recordings/`** holds recorded runs. See [Recording](/docs/recording/). Conversation sessions are stored separately, outside the workspace; see [Working with the agent](/docs/agent/).
