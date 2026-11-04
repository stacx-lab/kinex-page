---
title: Playing with simulators
description: Run a simulator task with rosbridge and drive its robot as Kinex devices.
group: Get started
order: 30
label: Simulators
sources: ["README.md", "docs/communication.md", "docs/commands.md", "rosbridge: README.md", "rosbridge: docs/README.md", "rosbridge: docs/kinex.md", "rosbridge: src/rosbridge/cli/main.py", "rosbridge: simulators/*/tasks.toml"]
---

[rosbridge](https://github.com/stacx-lab/rosbridge) runs public robotics simulators as ROS 2 graphs that speak the Kinex device contract. It also exports a ready-made Kinex workspace for each simulated robot. The agent drives a simulated robot through the same device interfaces as real hardware, so whatever works in simulation carries over.

| Simulator | Robot ID (`rosbridge setup`) | Example task (`rosbridge launch`) |
| --- | --- | --- |
| LIBERO | `libero/libero-panda-tabletop` (also `-floor`, `-kitchen`, `-living-room`, `-study`) | `libero/libero-spatial-01` |
| RoboTwin | `robotwin/robotwin-aloha-agilex` | `robotwin/handover-block-aloha-agilex` |
| RoboCasa | `robocasa/robocasa-panda-omron` | `robocasa/pick-place-counter-to-cabinet` |
| RoboDojo | `robodojo/robodojo-arx-x5` | `robodojo/stack-bowls` |
| ABC | `abc/abc-yam` | `abc/hang-mug-on-mug-rack` |
| BEHAVIOR | `behavior/behavior-r1pro`, `behavior-g1/behavior-g1-sharpa`, `behavior-dex/behavior-r1pro-sharpa` | `behavior/turning-on-radio` |

This guide uses LIBERO. The steps are the same for every simulator. Kinex needs to be installed first (see [Install and run](/docs/#install-and-run)).

## 1. Install rosbridge

You need Linux x86-64, Git, [uv](https://docs.astral.sh/uv/), [Pixi](https://pixi.sh) and an EGL-capable graphics driver. RoboDojo and BEHAVIOR run on Isaac Sim and need an NVIDIA GPU. No system ROS install is needed.

```sh
git clone https://github.com/stacx-lab/rosbridge.git
cd rosbridge
bash tools/bootstrap.sh
source .venv/bin/activate
rosbridge prepare libero          # download the simulator and its assets, once
```

To browse what is available:

```sh
rosbridge robots list
rosbridge tasks list --simulator libero --robot libero/libero-panda-tabletop
```

## 2. Export a Kinex workspace

Each task runs on one robot. Export a workspace for that robot, on a ROS domain of your choice:

```sh
rosbridge setup libero/libero-panda-tabletop --directory ~/kinex-libero --domain-id 83
```

This writes `~/kinex-libero/.kinex/`. It contains the robot's devices (`arm`, `gripper`, `camera_agentview`, `camera_wrist` and `world`), already calibrated, and a `kinex.json` that selects ROS 2 Jazzy. The devices use the simulator's own topics and services directly. Setup runs offline; it doesn't start the simulator or Kinex.

## 3. Launch the task

Launch a task for the same robot, **on the same domain**:

```sh
rosbridge launch libero/libero-spatial-01 --execution-mode stepped --domain-id 83
```

Leave it running. Press Ctrl-C to stop the simulator.

| `--execution-mode` | The simulation… |
| --- | --- |
| `realtime` (default) | runs continuously, paced by the wall clock. |
| `stepped` | advances only while the agent waits on the world clock, so it is paused while the agent thinks. |

If you leave out `--domain-id`, `launch` picks a domain on its own and Kinex won't find the simulator. Always pass the same `--domain-id` to `setup` and `launch`.

## 4. Drive the robot with Kinex

In a second terminal:

```sh
cd ~/kinex-libero
kinex
```

Load and check the devices. The first load also prepares Kinex Python, which takes a few minutes:

```text
/load all
/ping all
```

Then give the task. rosbridge doesn't pass the task's instruction to Kinex; you write the objective in your prompt. The task name tells you the goal. For LIBERO, `simulators/libero/tasks.toml` lists each task's `task_name`.

> Pick up the black bowl between the plate and the ramekin and place it on the plate.

Approve the device reads and scripts as they come up, or switch approval modes with `/mode` (see [approval modes](/docs/agent/#approval-modes)). Camera images come back attached to the tool results, and Ctrl+O expands the tool calls.

## 5. Check the outcome

rosbridge judges the episode with the benchmark's own success criteria. The agent never sees the result. From the rosbridge checkout, with its `.venv` active:

```sh
rosbridge judge --json
```

A successful episode, or one that hits its step limit, pauses the simulation and rejects new commands until the world is reset.

## Recording

- `rosbridge launch … --record ./recordings/episode-1` saves spectator videos of the scene. `--record-type bag` or `both` also saves a ROS bag.
- Kinex's [`/record`](/docs/recording/) records what the agent's devices see and do in the Kinex workspace.

## Running in the background and reconnecting

`rosbridge launch … --detach` returns once the simulator is ready and prints its run ID. Use `rosbridge status`, `rosbridge judge` and `rosbridge stop` with that ID.

If you restart the simulator, reconnect Kinex with `/unload all` followed by `/load all`. A workspace belongs to one robot. To use a different robot, export another workspace with `rosbridge setup`.

For each simulator's devices, assets and options, see the [rosbridge documentation](https://github.com/stacx-lab/rosbridge/blob/main/docs/README.md).
