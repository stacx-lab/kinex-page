---
title: Onboarding & calibration
description: How Kinex brings up new hardware and calibrates what a task needs.
group: Guides
order: 20
label: Onboarding & calibration
sources: ["packages/setup/README.md", "packages/setup/src/workflows/onboarding.txt", "packages/setup/src/workflows/calibrate.txt", "packages/core/assets/builtin/skill/setup-device/SKILL.md", "packages/core/assets/builtin/device/templates/world/DEVICE.md", "packages/setup/assets/builtin/skill/calibrate-gripper-grip/SKILL.md", "packages/setup/assets/builtin/skill/calibrate-sensor-bias/SKILL.md", "packages/core/src/commands.ts", "docs/setup.md"]
---

Getting a new robot ready means two things: describing the hardware so Kinex can talk to it (**onboarding**), and measuring the physical facts a task depends on (**calibration**). Both are guided by the agent, and both are driven by your task: Kinex prepares and measures only what that task needs.

<div class="caveat">
<p class="caveat-title">Before you start</p>
<ul>
<li><b>Not fully hands-off.</b> Onboarding and calibration still need you to:
<ul>
<li>share as much as you can about your hardware, such as its SDK, vendor ROS drivers and documentation;</li>
<li>provide physical calibration targets, such as AprilTags or a checkerboard;</li>
<li>watch the robot while it moves and be ready to stop it, to keep everyone safe.</li>
</ul>
</li>
<li><b>Tested embodiments.</b> The current workflow has been tested on fixed-base manipulators, wheeled mobile manipulators and quadruped loco-manipulators. Other embodiments may need extra work, and contributions that extend support are welcome.</li>
</ul>
</div>

## Onboarding

Start Kinex in your [robot workspace](/docs/real-robots/#1-start-kinex-in-a-fresh-workspace), then describe your hardware and goal in your own words. For example:

> I have a robot arm, a gripper, and an overhead camera. Help me set them up to pick objects from the table.

Share any connection details, manuals, or SDKs you already have. The agent first checks what's already in the workspace and reuses existing device profiles and calibration. Then it:

1. **Asks for your robot's ROS 2 distribution**, Jazzy or Humble, unless it can tell, and records it for [Kinex Python](/docs/control-graph/#python-environment).
2. **Sets up a world device.** Every workspace needs one for motion timing. On real hardware it runs a node that keeps system time.
3. **Prepares each device** with the `setup-device` skill: it writes the device's profile, sets up its nodes and checks that the device responds.
4. **Identifies the calibration** the task needs.

The agent asks for missing information in small batches. Facts nobody knows stay unknown rather than guessed, and it never presets speed caps: it uses the limits your hardware declares and asks you before adding a lower one.

You can also ask it to prepare the hardware before choosing a task. When you add a new goal later, it reuses the setup and measurements that still apply.

Coming from Kinex v1.0? Its device profiles don't load in v1.1, so run onboarding again to set your devices up.

### One device at a time

To add or remove a device, tell the agent what changed:

> Add this depth camera to my robot. Here is its connection information and documentation.

> I no longer use the wrist camera. Remove it from this workspace.

The agent prepares and checks new devices before use. Removing a device requires your confirmation because it deletes the device's profile, node and local files. See [Devices](/docs/devices/) for more detail.

## Calibration

Calibration measures facts such as where a camera sits, where the tool tip is, or how two arms are positioned relative to each other. Explain what you want the robot to do, or what has changed:

> Help the arm pick objects using the overhead camera. Check what needs calibrating first.

> I moved the wrist camera. Update its calibration before we continue.

The agent chooses a suitable procedure and guides you through it:

1. **Prepare.** Reuse reliable manufacturer or robot-model information and identify the measurements still needed.
2. **Measure.** Guide robot movements or ask you to position a target, then collect images and readings.
3. **Check.** Calculate the result and assess whether it meets the task's accuracy needs.
4. **Apply.** Save an accepted result to the device configuration. If the measurements are insufficient, explain what needs improving.

If you choose to keep an approximate result, the agent retains its measured error and quality assessment. A result that failed a quality check is still recorded as such.

### Sampling and evidence

The agent checks that the robot has reached the intended position before collecting measurements. It saves calibration images, readings, and results so they can be reviewed later. When hardware moves or changes, it reassesses the affected measurements.

### Bundled calibration skills

Describe the outcome you need; the agent selects the procedure.

| Calibration | What it determines |
| --- | --- |
| Camera geometry | Lens parameters and image geometry |
| Camera position | Where a camera sits on the robot or in the scene |
| Tool tip | Where the working tip is relative to the arm |
| Arm mounting | Where an arm sits on a table, mobile base, or torso |
| Two-arm alignment | How the two arms are positioned relative to each other |
| Joint limits | Each joint's range of motion |
| Gripper grip | The gripper's grip joint and its open and closed positions |
| Sensor bias | The bias of an IMU or force/torque sensor, from static readings |
| Workspace geometry | Positions and dimensions in the surrounding environment |
| Mobile base checks | Whether a wheeled or legged base responds as expected |

For custom procedures, see [Writing skills](/docs/writing-skills/).

### Calibration in practice

These recordings were made with Kinex v1.0 and show it calibrating a simulated YAM dual-arm robot in Isaac Lab. Each plays at 5× speed.

<figure>
  <video src="/video/calib-wrist-cameras.mp4" poster="/video/calib-wrist-cameras.jpg" controls muted playsinline preload="none"></video>
  <figcaption><b>Wrist cameras.</b> Each arm moves its wrist camera around a fixed calibration board on the table to find where the camera sits on the flange.</figcaption>
</figure>

<figure>
  <video src="/video/calib-overhead-camera.mp4" poster="/video/calib-overhead-camera.jpg" controls muted playsinline preload="none"></video>
  <figcaption><b>Overhead camera.</b> The left arm holds a calibration board up to the fixed overhead camera in several poses to find the camera's position in the scene.</figcaption>
</figure>

<figure>
  <video src="/video/calib-dual-arm.mp4" poster="/video/calib-dual-arm.jpg" controls muted playsinline preload="none"></video>
  <figcaption><b>Dual arm.</b> Both arms touch the same set of reference points on the table, which lets the agent work out where the right arm's base is relative to the left.</figcaption>
</figure>

## All set!

Ask the agent to connect the devices and check that they respond, then describe your first task. For example:

> Check that the arm, gripper, and camera are ready, then pick up the blue block from the table.

If you prefer command shortcuts, see [Slash commands](/docs/slash-commands/).
