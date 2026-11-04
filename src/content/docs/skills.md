---
title: Skills
description: What skills are, how the agent uses them, and the skills bundled with Kinex.
group: Concepts
order: 40
sources: ["docs/architecture.md", "docs/tools-and-skills.md", "packages/core/src/tool/skill.txt", "packages/core/src/skill/index.ts", "packages/core/assets/builtin/skill/setup-device/SKILL.md", "packages/setup/assets/builtin/skill/*/SKILL.md", "packages/setup/README.md"]
---

A skill is a written procedure that tells the agent how to approach a kind of task: what to do, in what order, what to check and what to watch out for. It is a `SKILL.md` file, optionally with reference notes or scripts beside it.

## How the agent uses skills

The agent always sees each skill's name and description. When a description matches the task, it loads the full instructions with the `skill` tool, then does the work itself through the [control graph](/docs/control-graph/). Skills don't run anything, and loading one grants no extra permissions.

You don't usually load skills yourself. [`/onboarding`](/docs/onboarding/) and `/calibrate` pick the ones the current task needs, and the agent loads others when a task matches their description.

## Bundled skills

### Setup and calibration

Kinex's own setup is written as skills:

| Skill | Purpose |
| --- | --- |
| `setup-device` | Add a device or repair it: pick a device guide, set up its nodes, write its profile and verify it. Covers every device type, including robots that already run ROS 2. |
| `calibrate-camera-intrinsics` | A color camera's projection and distortion |
| `calibrate-camera-extrinsics` | Where a camera is mounted, from robot poses and board observations |
| `calibrate-tcp-offset` | The tool tip's position, by touching a point from several poses |
| `calibrate-fixed-arm-mount` | Where an arm's base sits on its parent, such as a table, mobile base or torso |
| `calibrate-dual-arm` | How two arms are positioned relative to each other |
| `calibrate-joint-range` | Joint limits, from models or measurements |
| `calibrate-gripper-grip` | A gripper's grip joint and its open and closed positions |
| `calibrate-sensor-bias` | IMU or force/torque sensor bias, from static readings |
| `calibrate-world-geometry` | Measured workspace bounds and surfaces |
| `verify-base-interface`, `verify-base-motion`, `verify-base-posture` | Checks for a mobile base's control interface, its motion and stop behavior, and its height and attitude |

### Device guides

`setup-device` follows a **device guide**: one for each device type, such as `joint` or `rgbd`, and one for each bundled model, such as `sam3`. You can add your own guide for one device at `.kinex/device/<name>/DEVICE.md`, or for a type at `.kinex/device/templates/<type>/DEVICE.md`; Kinex uses a device's own guide before its type's.

## Your own skills

You can teach the agent your own procedures the same way: a `SKILL.md` in `.kinex/skills/`, picked up at the agent's next step. A project skill with the same name as a bundled one replaces it. See [Writing skills](/docs/writing-skills/).
