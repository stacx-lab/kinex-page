---
title: Onboarding & calibration
description: How Kinex brings up new hardware and measures the physical facts a task depends on.
group: Guides
order: 20
label: Onboarding & calibration
sources: ["docs/setup.md", "packages/setup/README.md", "packages/setup/src/workflows/onboarding.txt", "packages/setup/src/workflows/calibrate.txt", "packages/core/assets/builtin/skill/setup-device/SKILL.md", "packages/core/assets/builtin/device/templates/world/DEVICE.md"]
---

Getting a robot ready means two things: describing the hardware so Kinex can talk to it (**onboarding**), and measuring the physical facts a task depends on (**calibration**). The agent guides both, and both are driven by your task. Kinex prepares and measures what that task needs, and defers the rest.

<div class="caveat">
<p class="caveat-title">Before you start</p>
<ul>
<li><b>It is not hands-off.</b> You still need to:
<ul>
<li>share what you know about the hardware: its SDK, vendor ROS drivers, manuals and URDFs;</li>
<li>provide calibration targets, such as an AprilTag or checkerboard;</li>
<li>watch the robot whenever it moves, ready to stop it.</li>
</ul>
</li>
<li><b>Tested embodiments.</b> The workflow has been tested on fixed-base manipulators, wheeled mobile manipulators and quadrupeds with arms. Other embodiments may need extra work; contributions are welcome.</li>
</ul>
</div>

## Onboarding

Start Kinex in your [robot workspace](/docs/real-robots/#1-open-a-workspace), then describe the hardware and the goal in your own words, with or without the `/onboarding` command:

> I have a robot arm, a gripper and an overhead camera. Help me set them up to pick objects from the table.

The agent first checks what the workspace already holds and reuses it. Then it:

1. **Settles the ROS 2 distribution**, Jazzy or Humble, asking only if it can't tell.
2. **Sets up a world device.** Every workspace needs one to keep time. On real hardware it runs a node that publishes system time.
3. **Prepares each device** with the `setup-device` skill: writes its profile, sets up its node, loads it and verifies that it reads, rejects bad commands and stops.
4. **Plans the calibration** this task depends on.

It asks for missing facts in small batches and always offers "unknown" as an answer. Unknown facts are recorded as unknown, never guessed. It also never invents a speed cap: it uses the limits your hardware declares and asks before adding a lower one.

You can onboard before choosing a task. Kinex then prepares the devices and tells you what could be calibrated next. When you add a goal later, the setup and measurements that still apply are reused.

### Adding and removing devices

Tell the agent what changed:

> Add this depth camera to my robot. Here is its connection information and documentation.

> I no longer use the wrist camera. Remove it from this workspace.

A new device is prepared and checked before use. Removing one asks for your confirmation, because it deletes the device's profile, node and local files.

## Calibration

Calibration measures facts such as where a camera sits, where the tool tip is, or how two arms relate. Say what you want the robot to do, or what changed:

> Help the arm pick objects using the overhead camera. Check what needs calibrating first.

> I moved the wrist camera. Update its calibration before we continue.

The agent chooses a procedure and takes you through it:

1. **Prepare.** Reuse reliable facts from the manufacturer, the URDF or the simulator, and list what still has to be measured.
2. **Measure.** Move the robot or ask you to place a target, wait until the robot is at rest, then sample images and readings.
3. **Check.** Solve, and judge whether the result is good enough for the task.
4. **Apply.** Save an accepted result to the device's profile. If the data falls short, say what to improve and collect only that.

If you decide to keep an approximate result, it is saved together with its measured error. A result that failed its quality check stays marked as such.

### What can be calibrated

Describe the outcome you need; the agent selects the procedure.

| Calibration | What it determines |
| --- | --- |
| Camera intrinsics | Lens projection and distortion |
| Camera extrinsics | Where a camera sits on the robot or in the scene |
| Tool tip | Where the working tip is relative to the arm |
| Arm mount | Where an arm sits on a table, a mobile base or a torso |
| Dual-arm alignment | How two arms sit relative to each other |
| Joint range | Each joint's limits |
| Gripper grip | The grip joint and its open and closed positions |
| Sensor bias | The bias of an IMU or a force/torque sensor |
| World geometry | Bounds and surfaces around the robot |
| Mobile base checks | Whether a wheeled or legged base responds as commanded |

For a procedure of your own, see [Writing skills](/docs/writing-skills/).

### Where the evidence goes

| Path | Holds |
| --- | --- |
| `.kinex/setup/plan.json` | The setup plan: what the task needs, what is done and what is deferred |
| `.kinex/calib/<run>/` | One calibration run: its samples, archived images, solver results and quality assessment |
| `.kinex/devices/<name>/profile.yaml` | The accepted result, with how and when it was measured |

Every image and reading is archived before it is used, so a result can be reviewed or re-solved later. When hardware moves or changes, the agent reassesses the measurements that depend on it.

### Calibration in practice

These recordings were made with Kinex 1.0 and show it calibrating a simulated YAM dual-arm robot. Each plays at 5× speed.

<figure>
  <video src="/video/calib-wrist-cameras.mp4" poster="/video/calib-wrist-cameras.jpg" controls muted playsinline preload="none"></video>
  <figcaption><b>Wrist cameras.</b> Each arm moves its wrist camera around a fixed calibration board to find where the camera sits on the flange.</figcaption>
</figure>

<figure>
  <video src="/video/calib-overhead-camera.mp4" poster="/video/calib-overhead-camera.jpg" controls muted playsinline preload="none"></video>
  <figcaption><b>Overhead camera.</b> The left arm holds a calibration board up to the fixed overhead camera in several poses to find the camera's position in the scene.</figcaption>
</figure>

<figure>
  <video src="/video/calib-dual-arm.mp4" poster="/video/calib-dual-arm.jpg" controls muted playsinline preload="none"></video>
  <figcaption><b>Dual arm.</b> Both arms touch the same reference points on the table, which gives the right arm's base relative to the left.</figcaption>
</figure>

## Ready

Ask the agent to check the devices, then describe your first task:

> Check that the arm, gripper and camera are ready, then pick up the blue block from the table.

If you prefer commands, see [Slash commands](/docs/slash-commands/).
