---
title: Try it in simulation
description: Launch a simulator task with kinex-sim, open its exported workspace in Kinex and let the agent solve it.
group: Get started
order: 20
label: Simulators
sources: ["README.md", "docs/setup.md", "kinex-sim: README.md", "kinex-sim: docs/README.md", "kinex-sim: docs/devices.md", "kinex-sim: docs/kinex.md", "kinex-sim: src/kinex_sim/cli/main.py"]
---

[kinex-sim](https://github.com/stacx-lab/kinex-sim) runs public robotics simulators as ROS 2 graphs and exports a ready-made Kinex workspace for each task. A simulated arm, gripper or camera is the same kind of [device](/docs/devices/) as a real one, so what the agent learns in simulation carries over.

| Simulator | Robot | Tasks | Example task |
| --- | --- | ---: | --- |
| [ABC](https://github.com/stacx-lab/kinex-sim/blob/main/docs/abc.md) | Two YAM arms | 33 | `abc/ball-tray-balancing` |
| [LIBERO](https://github.com/stacx-lab/kinex-sim/blob/main/docs/libero.md) | Franka Panda | 130 | `libero/libero-spatial-01` |
| [RoboTwin 2.0](https://github.com/stacx-lab/kinex-sim/blob/main/docs/robotwin.md) | ALOHA AgileX, two arms | 50 | `robotwin/beat-block-hammer-aloha-agilex` |
| [RoboDojo](https://github.com/stacx-lab/kinex-sim/blob/main/docs/robodojo.md) | Two ARX X5 arms | 42 | `robodojo/align-blocks` |
| [RoboCasa](https://github.com/stacx-lab/kinex-sim/blob/main/docs/robocasa.md) | Panda on an Omron mobile base | 365 | `robocasa/add-ice-cubes` |
| [BEHAVIOR](https://github.com/stacx-lab/kinex-sim/blob/main/docs/behavior.md) | R1Pro mobile manipulator | 100 | `behavior/assembling-gift-baskets` |
| [HandsOn](https://github.com/stacx-lab/kinex-sim/blob/main/docs/handson.md) | Two ROKAE AR5 arms with Wuji hands | 66 | `handson/t24-place-ball-in-bowl` |
| [BiDex-100](https://github.com/stacx-lab/kinex-sim/blob/main/docs/bidex.md) | Two Franka FR3v2 arms or an Astribot S1, with Sharpa Wave hands | 106 | `bidex/make-espresso` |

This guide uses LIBERO; every simulator follows the same steps. Install Kinex first (see [Install](/docs/#install)).

## 1. Install kinex-sim

You need Linux x86-64, Git, [uv](https://docs.astral.sh/uv/), [Pixi](https://pixi.sh) and an EGL-capable graphics driver. RoboDojo, BEHAVIOR and HandsOn run on Isaac Sim and need an NVIDIA GPU. ROS 2 comes with the Pixi environment.

```sh
git clone https://github.com/stacx-lab/kinex-sim.git
cd kinex-sim
bash tools/bootstrap.sh
source .venv/bin/activate
kinex-sim prepare libero                 # download the simulator and its assets, once
kinex-sim tasks list --simulator libero  # see what you can launch
```

## 2. Export the task's workspace

```sh
kinex-sim setup libero/libero-spatial-01 --directory ~/kinex-libero --domain-id 83
```

This writes `~/kinex-libero/.kinex/` with the task's devices: here `arm`, `gripper`, `camera_agentview`, `camera_wrist` and `world`. Their profiles carry the simulator's calibration and point straight at the simulator's own topics and services. Setup is offline; it starts neither the simulator nor Kinex, and it won't overwrite an existing workspace.

Export one workspace per task. Tasks can differ in robot, cameras and mounts, and `setup` exports exactly what a launch of that task serves.

## 3. Launch the task

Launch the same task on the **same ROS domain**:

```sh
kinex-sim launch libero/libero-spatial-01 --execution-mode stepped --domain-id 83
```

Leave it running; Ctrl-C stops the simulator.

| `--execution-mode` | The simulation… |
| --- | --- |
| `realtime` (default) | runs continuously, paced by the wall clock. |
| `stepped` | advances only while a program waits on the world clock, so it is paused while the agent thinks. |

Stepped mode suits agents: the time the agent spends thinking costs no simulation time.

## 4. Give the agent the task

In a second terminal, print the task's instruction, then open Kinex in the exported workspace:

```sh
kinex-sim describe --domain-id 83      # from the kinex-sim checkout
cd ~/kinex-libero
kinex
```

The workspace's devices connect as Kinex starts. Paste the instruction as your prompt:

> Pick up the black bowl between the plate and the ramekin and place it on the plate.

The first program the agent runs also prepares [Kinex Python](/docs/workspace/#kinex-python), which takes a few minutes once. Approve device reads and programs as they come up, or switch [approval mode](/docs/agent/#approval-modes) with `/mode`. Camera images come back attached to the tool results; Ctrl+O expands a tool call.

## 5. Check the outcome

kinex-sim judges the episode with the benchmark's own success criteria. The agent never sees the verdict:

```sh
kinex-sim judge --json
```

A run is one episode. There is no reset: to try again, stop the run and launch another. When an episode ends, at its step limit or with `--early-stop` at the evaluator's success or failure, physics pauses and new commands are rejected. Cameras and the clock stay readable.

## Useful options

| Option | Effect |
| --- | --- |
| `launch --detach` | Return once the simulator is ready and print the run ID. Manage it with `kinex-sim status`, `judge` and `stop`. |
| `launch --record DIR` | Save spectator videos of the scene. `--record-type bag` saves an MCAP bag instead, and `both` saves both. |
| `launch --seed N`, `setup --seed N` | Choose the episode's seed. Use the same seed for both. |
| `launch --config NAME`, `setup --config NAME` | Serve an alternative device set, such as RoboDojo's `depth` (RGB-D cameras) or `move` (arm move actions). Use the same configuration for both. |

To record what the agent's devices saw and did, use Kinex's own [`/record`](/docs/recording/). If you restart the simulator while Kinex is open, reconnect with `/unload all` and `/load all`.

For each simulator's devices, assets and options, see the [kinex-sim documentation](https://github.com/stacx-lab/kinex-sim/blob/main/docs/README.md).
