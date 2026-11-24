---
title: Devices
description: What a device is — its type, profile and nodes — and how devices are loaded, stopped and called.
group: Concepts
order: 20
sources: ["docs/devices.md", "docs/communication.md", "packages/core/README.md", "packages/core/assets/builtin/device/templates/*/DEVICE.md", "packages/core/src/commands.ts", "packages/core/src/tool/device/device.txt"]
---

Kinex treats a robot as a set of independent devices: arms, grippers, cameras, a mobile base, a vision model, a clock. The agent composes whichever ones a task needs. If a camera is missing, it reads the ones that remain and plans around that.

Every device has three parts:

- a **type**, which says what kind of thing it is;
- a **profile**, which declares its operations and physical facts;
- **nodes**, the ROS 2 programs that serve those operations.

## Types

| Type | For | Typical operations |
| --- | --- | --- |
| `joint` | Arms, lifts, torsos and dexterous hands described by a URDF | `joint_state`, `joint_target` or `pose_target`, `stop` |
| `gripper` | Grippers with one actuated grip joint | `joint_state`, `target`, `grasped`, `stop` |
| `suction` | Suction tools | `target`, `grasped`, `stop` |
| `locomotion` | Wheeled bases, quadrupeds and humanoid walking controllers | `velocity`, `odometry`, `mode`, `stop` |
| `rgb`, `rgbd` | Color, stereo and RGB-D cameras | `image`, `depth` |
| `imu`, `force_torque` | Inertial and force/torque sensors | `imu`, `wrench` |
| `model` | Detectors, segmenters, policies and other inference services | Named for what they compute, such as `detect` or `infer` |
| `world` | The workspace clock. Every workspace has one. | `time`, `wait`, `stop` |
| `other` | Anything else | Whatever its profile declares |

These operation names are recommendations. A device's own profile decides what it offers, and the agent always reads the profile instead of assuming from the type.

### The world device

The `world` device owns time. Its `time` topic is the clock that device data, frames and recordings follow, and its `wait` service lets a program wait for a duration of world time:

- **On real hardware**, world time is system time.
- **In a realtime simulation**, the simulator's clock runs on its own.
- **In a stepped simulation**, the world advances only while a `wait` asks for more time. Reading a camera or a joint state never advances it.

A program that paces itself with `world.wait` therefore runs unchanged in all three. A simulator's world may also publish a `budget`: how much world time the episode has used and is allowed.

### Model devices

A detector, a segmenter or a policy is a `model` device. Its operations are services that take and return JSON, with images passed as file paths. Loading the device places the model on its CPU or GPU; unloading releases it. The model only computes. What to do with its output is the program's decision. See [Using models](/docs/models/).

## Profiles

Each device lives in its own folder:

```text
.kinex/devices/arm/
├── profile.yaml     # the device's profile
├── node.py          # its node, when Kinex runs one
└── arm.urdf         # geometry, for joint and gripper devices
```

A shortened arm profile:

```yaml
name: arm
type: joint
description: 6-DoF arm on the table, driven by its ros2_control trajectory controller.
loaded: true                   # connect when Kinex starts
runtime:
  nodes: [{entry: node.py, factory: create}]
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
model: {format: urdf, path: arm.urdf, base_link: base_link, tip_links: [flange]}
frames:
  base: {parent: world:base, translation_m: [0.4, 0, 0], rotation_xyzw: [0, 0, 0, 1]}
```

- **`operations`** are the device's ROS 2 endpoints. Each is a `topic`, a `service` or an `action`, with a standard ROS type. The descriptions are what the agent reads, so they state units, frames and effects.
- **Physical facts** such as `model` and `frames` sit at the top level. A value nobody knows yet is written `???` and stays unknown until setup or calibration measures it.
- **`runtime.nodes`** lists the nodes Kinex starts for the device.

You rarely write a profile by hand. Onboarding writes them, and the agent edits them with its `profile_write` tool, which validates every change. The full field list is in the [device contracts](https://github.com/stacx-lab/kinex/blob/e49da2e9a1158e8774f007e75adf9e41705f4e9b/docs/devices.md).

### Frames

Every spatial device has a `base` frame and says where it is mounted: `parent: world:base` for an arm on a table, `parent: arm:flange` for a wrist camera. Joint and gripper devices add one frame per URDF link, which Kinex keeps up to date from the measured joint state.

Together these form one frame tree. A program asks for any relationship in it, at any recent moment:

```python
# the camera's optical frame in the arm's base, at the moment the image was taken
camera_in_arm = await lib.frames.lookup_transform("arm:base", image.header.frame_id, image)
```

A mount nobody has measured stays `???` and is left out of the tree. Kinex never assumes it is the identity, so a lookup across it fails loudly until [calibration](/docs/onboarding/#calibration) fills it in.

## Nodes

A node is the small ROS 2 program that serves a device's operations. Kinex ships a reference node for every type except `other`. Most adapt a driver you already have, such as a ros2_control trajectory controller or a camera driver, to the device's operations.

A device doesn't need a node of its own. With `nodes: []`, its operations point directly at endpoints another ROS stack already serves. Simulator workspaces from [kinex-sim](/docs/simulators/) work this way. Kinex starts only the nodes a device declares, and never stops anyone else's.

## Using devices

### Loading and stopping

```text
/devices            # list devices and whether each is set to load
/load arm           # start its nodes and wait until it is ready
/ping arm           # check live status without starting anything
/stop arm           # stop its motion now (or /stop for every device)
/unload arm         # stop its nodes and release its resources
```

Devices set to `loaded` connect when Kinex starts. After editing a profile or a node, run `/unload` and `/load` to apply the change. Kinex never restarts a failed device by itself: check it with `/ping`, then reload it.

`/stop` needs no approval. It cancels the agent's response and any running program that commanded the device. Each actuator documents what stopping means for it: an arm holds its posture, a base halts, a gripper keeps holding what it has.

### Calling devices

The agent calls one operation directly with the `device` tool, or several at once with `devices`:

```json
{"deviceID": "camera_wrist", "action": "image"}
```

A camera read comes back with the image attached. Anything longer than one call, such as perception followed by motion or a feedback loop, goes into a program. See [Control graph](/docs/control-graph/).
