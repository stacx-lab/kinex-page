---
title: Connect a real robot
description: Describe your hardware and task with /onboarding; Kinex writes the device profiles and nodes, brings the hardware up and calibrates what the task needs.
group: Get started
order: 30
label: Real robots
sources: ["README.md", "docs/setup.md", "packages/setup/README.md", "packages/setup/src/workflows/onboarding.txt", "packages/core/src/workflows/register.txt", "packages/core/assets/builtin/skill/setup-device/SKILL.md"]
---

On a real robot, the agent sets up its own interface. You describe the hardware and what you want it to do. The agent writes a [device](/docs/devices/) profile and a small ROS 2 node for each part, brings them up, checks them and calibrates only what the task depends on.

Kinex has been used with fixed arms, dual arms, wheeled mobile manipulators and quadrupeds with arms. Install Kinex first (see [Install](/docs/#install)).

<div class="caveat">
<p class="caveat-title">You are responsible for safe operation</p>
<p>Supervise the robot whenever it can move, keep a hardware emergency stop within reach and check motion limits before running a task. <code>/stop</code> does not replace an emergency stop.</p>
</div>

## 1. Open a workspace

```sh
mkdir robot-workspace && cd robot-workspace
kinex
```

Connect a model with `/login` and `/model` if you haven't yet.

## 2. Onboard the robot

Say what you have, how it connects and what it is for:

```text
/onboarding Set up my robot arm, gripper and overhead camera to pick objects from the table.
```

Onboarding is a short interview. The agent looks at what is already there, asks only for the facts it is missing and then, device by device:

1. settles the robot's ROS 2 distribution (Jazzy or Humble) and sets up the `world` device that keeps time;
2. writes each device's profile and node, loads it and verifies that it responds and stops;
3. works out which calibration this task needs, and leaves the rest for later.

Hand over whatever you have: SDKs, vendor ROS packages, manuals, URDFs. Facts nobody knows stay marked unknown instead of being guessed. See [Onboarding & calibration](/docs/onboarding/) for the details.

## 3. Calibrate what the task needs

```text
/calibrate camera-to-arm transform for picking
```

The agent picks a procedure, guides you through collecting samples, checks the quality of the result and saves it to the device's profile. A bare `/calibrate` continues the current task's calibration.

## 4. Give it a task

```text
/devices          # what is in the workspace
/ping all         # is everything responding?
```

Then describe the task in plain language. While it works:

| Command | Effect |
| --- | --- |
| `/stop [device]` | Cancel the agent's response and stop the actuators |
| `/load <device>`, `/unload <device>` | Connect or release a device |
| `/unregister <device>` | After confirmation, delete a device's profile, node and files |

## Robots that already run ROS 2

A Kinex device is a set of ROS 2 topics, services and actions, so a robot that already runs ROS 2 needs very little. Start its ROS stack, then onboard as above. Onboarding:

- **reuses your drivers.** A device either points straight at endpoints your stack already serves, or runs a small node that adapts a driver to the device's operations. Unloading a device never stops your stack.
- **matches your setup.** It records your distribution in `.kinex/kinex.json` and uses your robot's ROS domain.
- **builds your message types.** Packages with custom messages are listed in `python.interfaces`, so the agent's programs can use them.

Kinex keeps its own ROS 2 environment in `.kinex/python`; your system ROS install is never changed. See [Kinex Python](/docs/workspace/#kinex-python).

## Adding a device later

Tell the agent what changed, or register one device directly:

```text
/register rgbd
/register sam3 on cuda:0
```

`/register` takes a device type or a bundled template. It prepares the node and writes the profile without touching the hardware; `/load` brings it up.
