---
title: Skills
description: What skills are, how the agent uses them, and the skills that ship with Kinex.
group: Concepts
order: 40
sources: ["docs/architecture.md", "docs/tools-and-skills.md", "packages/core/src/skill/index.ts", "packages/core/src/tool/skill.txt", "packages/core/assets/builtin/skill/setup-device/SKILL.md", "packages/setup/assets/builtin/skill/*/SKILL.md", "packages/setup/README.md"]
---

A skill is a written procedure: what to do, in what order, what to check and what to watch out for. It is a `SKILL.md` file, optionally with notes or scripts beside it. Devices say what the robot can do and programs do it; a skill carries the know-how in between.

## How the agent uses skills

The agent always sees every skill's name and one-line description. When a description matches the task, it loads the full instructions with the `skill` tool and then does the work itself, through [programs](/docs/control-graph/) and device calls. A skill runs nothing by being loaded, and it grants no extra permissions.

You don't usually load skills yourself. [`/onboarding` and `/calibrate`](/docs/onboarding/) pick the ones the current task needs, and the agent loads others as tasks match them.

## Bundled skills

Kinex's own setup is written as skills:

| Skill | Purpose |
| --- | --- |
| `setup-device` | Add or repair a device: choose a device guide, set up its node, write its profile and verify it. Covers every device type, including robots that already run ROS 2. |
| `calibrate-camera-intrinsics` | A color camera's projection and distortion |
| `calibrate-camera-extrinsics` | Where a camera is mounted, from robot poses and board observations |
| `calibrate-tcp-offset` | Where the tool tip is, by touching one point from several poses |
| `calibrate-fixed-arm-mount` | Where an arm's base sits on its parent: a table, a mobile base or a torso |
| `calibrate-dual-arm` | How two arms sit relative to each other |
| `calibrate-joint-range` | Joint limits, from models or measurements |
| `calibrate-gripper-grip` | A gripper's grip joint and its open and closed positions |
| `calibrate-sensor-bias` | IMU or force/torque bias, from static readings |
| `calibrate-world-geometry` | Measured workspace bounds and surfaces |
| `verify-base-interface`, `verify-base-motion`, `verify-base-posture` | A mobile base's control interface, its motion and stop behavior, and its height and attitude |

The calibration skills measure and solve inside programs, with the functions in `kinex.lib.calibration`.

### Device guides

`setup-device` follows a **device guide**: one per device type, such as `joint` or `rgbd`, and one per bundled model (`sam3`, `grounding-dino`, `fastwam`). A guide explains how to write that device's profile, and all but the `other` guide ship a reference node.

To add your own, write `.kinex/device/<name>/DEVICE.md` for one device or `.kinex/device/templates/<type>/DEVICE.md` for a type. A device's own guide is used before its type's.

## Your own skills

A `SKILL.md` under `.kinex/skills/` teaches the agent your procedures the same way, and is picked up at its next step. A project skill with a bundled skill's name replaces it. See [Writing skills](/docs/writing-skills/).
