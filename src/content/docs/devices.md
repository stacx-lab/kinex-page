---
title: Devices
description: What a device is — its type, profile and nodes — and how you load, stop and call devices.
group: Concepts
order: 20
sources: ["docs/devices.md", "docs/communication.md", "packages/core/README.md", "packages/core/assets/builtin/device/templates/joint/DEVICE.md", "packages/core/assets/builtin/device/templates/world/DEVICE.md", "packages/core/src/commands.ts", "packages/core/src/tool/device/device.txt"]
---

Kinex treats a robot as a collection of devices: arms, grippers, cameras, a mobile base, a VLA and a world clock. Every device is made of three things:

- a **type**, which says what kind of device it is;
- a **profile**, which describes its operations and physical facts;
- **nodes**, the ROS 2 programs that serve those operations.

## Types

| Type | For | Typical operations |
| --- | --- | --- |
| `joint` | Arms, lifts, torsos and dexterous hands described by a URDF | `joint_state`, `joint_target`, `stop` |
| `gripper` | Grippers with one actuated grip joint | `joint_state`, `target`, `grasped`, `stop` |
| `suction` | Suction cups | `target`, `grasped`, `stop` |
| `locomotion` | Wheeled bases, quadrupeds, humanoid walking controllers | `velocity`, `odometry`, `mode`, `stop` |
| `rgb`, `rgbd` | Color and RGB-D cameras | `image` (+ `depth`) |
| `imu`, `force_torque` | Inertial and force/torque sensors | `imu`, `wrench` |
| `model` | Detection, segmentation, policies and other inference services | Named after what they compute, e.g. `detect`, `infer` |
| `world` | The workspace clock and scene. Every workspace has one. | `time`, `wait`, `stop` (+ `reset` in simulators) |
| `other` | Anything else | Whatever the profile declares |

The operation names are recommendations from each type's setup guide. A device's own profile decides what it actually offers. Two types work differently from the rest:

### The world device

The `world` device owns time. Its `time` topic is the clock that device data, frames and recordings follow, and its `wait` service waits for a duration of world time:

- **On real hardware**, the world is system time.
- **In a realtime simulation**, the simulator's clock runs continuously.
- **In a stepped simulation**, the world advances only while a `wait` asks for more time. Reading cameras or joint states never advances it.

A program that waits through `world.wait` therefore runs unchanged on hardware and in either kind of simulation.

### Model devices

Detection, segmentation and policy models are `model` devices. Their operations are services that take and return JSON, with images passed as file paths. Loading the device puts the model on its CPU or GPU; unloading releases it. See [vision models](/docs/vision/) and [VLAs](/docs/vla/).

## Profiles

Each device lives in its own folder:

```text
.kinex/
├── workspace.yaml              # the robot as a whole: identity and keep-out zones
└── devices/<name>/
    ├── profile.yaml            # this device's profile
    ├── node.py                 # its node, when Kinex runs one
    └── arm.urdf                # geometry, for joint and gripper devices
```

A profile describes the device, its operations and its physical facts. Here is a shortened arm profile:

```yaml
name: arm
type: joint
description: 6-DoF arm on the table, driven by its ros2_control controller.
loaded: false                  # whether Kinex should load it on start
runtime:
  nodes: [{entry: node.py, factory: create}, {entry: links.py, factory: create}]
operations:
  joint_state:
    description: Measured joint positions and velocities in URDF units.
    transport: topic
    direction: output
    endpoint: /kinex/arm/joint_state
    type: sensor_msgs/msg/JointState
  joint_target:
    description: Joint trajectory over the commanded joints. A new trajectory replaces the active one.
    transport: topic
    direction: input
    endpoint: /kinex/arm/joint_target
    type: trajectory_msgs/msg/JointTrajectory
  stop:
    description: Stop motion and hold the measured posture.
    transport: service
    direction: input
    endpoint: /kinex/arm/stop
    type: std_srvs/srv/Trigger
model: {format: urdf, path: arm.urdf, base_link: base_link, tip_link: flange}
frames:
  base: {parent: world:base, translation_m: [0.4, 0, 0], rotation_xyzw: [0, 0, 0, 1]}
```

- **`operations`** are the device's ROS 2 topics and services. Their descriptions are what the agent reads, so they say what each operation does, in which units and frames.
- **Physical facts** such as `model` and `frames` sit at the top level. A value nobody knows yet is written as `???` and stays unknown until setup or calibration measures it.
- **`runtime`** lists the nodes Kinex starts for the device (see [Nodes](#nodes)).

Onboarding writes profiles for you, and during a session Kinex edits them with its `profile_write` tool rather than by hand. The full field list is in the [device contracts](https://github.com/stacx-lab/kinex/blob/ade9a7e971b31e0a9b3f284df02e019ecf8db67b/docs/devices.md).

### Frames

Every spatial device has a `base` frame and declares where it is mounted. Each frame names its parent as `device:frame`, for example `parent: world:base` for an arm on the table, or `parent: arm:flange` for a wrist camera. Joint and gripper devices add one frame per URDF link, which Kinex updates from measured joint states. Together these form one frame tree, which `helpers.relative_pose` uses to express a pose in any frame. Mounts you don't know yet stay `???` until [calibration](/docs/onboarding/#calibration) measures them; Kinex never assumes an unknown mount is the identity.

## Nodes

A node is the small ROS 2 program that implements a device's operations. Kinex ships a reference node for each type. Most adapt a robot's existing ROS driver, for example a ros2_control trajectory controller or a camera driver, to the device's operations. Joint and gripper devices also run a `links.py` node that publishes their URDF links as frames.

A device doesn't have to run a node of its own. With `nodes: []`, its operations point directly at topics and services an existing ROS stack already serves. Kinex starts only the nodes a device declares and never stops anyone else's. Simulator workspaces exported by [rosbridge](/docs/simulators/) work this way.

Nodes use the workspace's [Kinex Python](/docs/control-graph/#python-environment). A device whose SDK needs a separate Python environment can name its own interpreter in `runtime`.

## Using devices

### Loading and stopping

Devices are saved unloaded until you connect them:

```text
/devices            # list devices and whether each should be loaded
/load arm           # start its nodes and wait until it is ready
/ping arm           # check status without starting anything
/stop arm           # stop its motion right away (or /stop for every device)
/unload arm         # stop its nodes and release its resources
/unregister arm     # after confirmation, unload and delete its profile, node and files
```

After you edit a profile or a node, run `/unload` and then `/load` to apply the change. Kinex never restarts a failed device on its own; check it with `/ping`, then reload it.

`/stop` doesn't need approval and also cancels the agent's response. Each actuator documents what stopping does for it: an arm holds its posture, a base halts, and a gripper keeps holding what it has.

### Calling devices

The agent calls one operation directly with the `device` tool, or several at once with `devices`:

```json
{"deviceID": "arm", "action": "joint_state"}
```

Camera reads come back with the image attached. Anything longer than a single call, such as a feedback loop, a motion plan or perception followed by motion, goes in a program the agent runs with `exec`. See [Control graph](/docs/control-graph/).
