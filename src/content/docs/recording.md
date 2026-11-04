---
title: Recording
description: Record what your robot sees and does as rosbag2 bags, understand the files you get, and use recordings for self-improvement and training data.
group: Guides
order: 60
sources: ["docs/agent-integration.md", "packages/core/src/commands.ts", "packages/core/src/record/spec.ts", "packages/core/src/tool/record.txt", "packages/core/src/record/layout.ts", "packages/core/src/record/schema.ts", "packages/core/assets/python/kinex/host/recording.py", "packages/core/src/config/config.ts", "src/cli.ts", "src/arguments.ts"]
---

A recording captures what your devices observed and what they were commanded to do while Kinex works on a task, together with the conversation that drove it. Use it to review a run, compare trials, or collect demonstrations.

## How to record

### From the TUI

Load the devices and the world first (`/load all`); unloaded devices are refused. Then start a recording with the devices you want and the highest rate to record each one at (in Hz). Anything after the rates is the task instruction:

```text
/record start arm=10 gripper=10 wrist_cam=5 pick up the red mug and place it in the bin
```

Then let Kinex work, or steer it yourself. The recording keeps running across turns and while the agent is thinking. Along the way:

```text
/record snap wrist_cam grasp attempt     # mark a moment and save the camera's current image
/record status                           # check counts and any problems
```

When the task is done, stop and label how it went (`success`, `failure` or `partial`), with an optional note:

```text
/record stop success Mug placed in the bin on the first try
```

The device list and rates are fixed once a recording starts. To change them, stop and start a new one. `/record snap` without a running recording saves a standalone snapshot.

### In scripted runs

Pass the devices and rates to a headless run; the recording covers the whole task:

```sh
kinex -p --record "arm=10 gripper=10 wrist_cam=5" "Pick up the red mug and place it in the bin"
```

### Letting the agent record

Start Kinex with `--enable-recording` to give the agent the `record` tool. It can then start, snap and stop recordings itself, for example to capture each attempt in a series of trials.

## What you get

Each recording is a folder under `.kinex/recordings/`:

```text
.kinex/recordings/rec_00mv475jct0000ur/
├── recording.json          # summary: task, devices, rates, counts, outcome
├── timeline.jsonl          # what happened when: start, tool calls, notes (including snaps), stop
├── trace.json              # the conversation: messages and tool calls
├── profile/                # workspace.yaml and device profiles as they were at the start
├── devices/
│   ├── wrist_cam/
│   │   ├── stream/
│   │   │   ├── bag/              # rosbag2 bag: every recorded message
│   │   │   ├── operations.json   # the recorded operations and their ROS topics
│   │   │   └── samples.jsonl     # one line per recorded message
│   │   ├── frames/         # images saved by /record snap
│   │   └── events.jsonl    # calls made to this device through Kinex tools
│   └── arm/
│       └── ...
└── passive/                # other devices the agent used but you didn't list
```

Each device's stream is a standard [rosbag2](https://github.com/ros2/rosbag2) bag (SQLite storage, CDR serialization) with the full typed ROS messages of its topics: joint states, the commands sent to it, and color and depth images for cameras. The world clock and TF go into every bag, so you can line up streams and recover frame transforms afterwards. There are no video files; images stay as `sensor_msgs/Image` messages.

By default a recording covers all of a device's declared topics. Rates are in world time and cap how often each output topic is recorded; commands, the clock and TF are recorded in full. A paused simulation records nothing new.

### Checking a recording

`/record status` and `recording.json` report, for each device, how many messages were recorded and whether any were lost or failed. Check them before relying on a recording. A device that fails doesn't stop the others.

Recordings end when you stop them, when they reach the size limit (`record.max_mb` in `.kinex/kinex.json`, 4096 MB by default), or when Kinex shuts down. Unloading a device ends its part of the recording.

## Opening a recording

If you have ROS 2 installed, the usual tools work on each bag:

```sh
ros2 bag info .kinex/recordings/rec_00mv475jct0000ur/devices/arm/stream/bag
```

Kinex Python includes `rosbag2_py`, so the agent can also read bags with `exec`. This script reads the arm's joint states from a bag passed in `args`:

```python
import rosbag2_py
from rclpy.serialization import deserialize_message
from rosidl_runtime_py.utilities import get_message
from kinex import args, finish

reader = rosbag2_py.SequentialReader()
reader.open(rosbag2_py.StorageOptions(uri=args()["bag"], storage_id="sqlite3"),
            rosbag2_py.ConverterOptions("cdr", "cdr"))
types = {topic.name: get_message(topic.type) for topic in reader.get_all_topics_and_types()}
positions = []
while reader.has_next():
    topic, data, _ = reader.read_next()
    if topic == "/kinex/arm/joint_state":
        positions.append(list(deserialize_message(data, types[topic]).position))
finish({"topics": sorted(types), "joint_states": len(positions), "last": positions[-1:]})
```

Topics in the bag use each operation's ROS topic name, which `operations.json` lists next to the bag. Messages keep their original header stamps in world time; use those to line up streams.

## Using recordings

Each recording keeps the instruction, the outcome, the conversation and the exact device data, which makes it useful beyond review:

- **Refining skills and tools.** Point the agent at past recordings, for example "review the last three failed runs and update the pick-and-place skill". It can compare failed and successful attempts and turn what it finds into better skills, tools or parameters.
- **Training models.** Observations, commanded actions and outcome labels are already in the shape of robot-learning episodes, so recordings can be turned into training data for policies that then run through [`helpers.run_policy`](/docs/vla/).

To save just the conversation, use `/export` instead; see [Working with the agent](/docs/agent/).
