---
title: Kinex documentation
description: Kinex connects a coding agent to robots, simulators and models. Install it, open a workspace and give the robot a task.
group: Get started
order: 10
label: Overview
sources: ["README.md", "install.sh", "docs/architecture.md", "docs/overview.md", "package.json"]
---

Kinex is an open-source robotics harness for coding agents. You describe a task in plain language. The agent reads what the robot offers, writes a Python program that perceives and moves, runs it, looks at the result and decides what to do next.

It works the same way on real hardware and in simulation, and it runs on its own or inside Pi, Claude Code and Codex.

| Layer | What it gives the agent | Examples |
| --- | --- | --- |
| [Devices](/docs/devices/) | Typed ROS 2 interfaces to hardware, simulators and models | `arm`, `gripper`, `camera_wrist`, `sam3`, `world` |
| [Control graph](/docs/control-graph/) | Python programs it writes and runs to perceive, compute and control | `exec`, `kinex.lib`, saved programs |
| [Skills](/docs/skills/) | Written procedures it loads when a task calls for them | `setup-device`, `calibrate-camera-extrinsics` |

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/stacx-lab/kinex/main/install.sh | bash
```

| You need | For |
| --- | --- |
| Linux x86-64 or macOS | Kinex itself. Robot workspaces use ROS 2, which needs Linux x86-64. |
| Node.js ≥ 22.19 | Kinex. The installer offers to install it. |
| [Pixi](https://pixi.sh) | Kinex Python, the workspace's own ROS 2 environment (Jazzy by default, or Humble). You don't need a system ROS install. |

## Start a session

```sh
cd /path/to/workspace
kinex
```

Connect a model provider with `/login`, pick a model with `/model`, then choose where the robot comes from:

<nav class="doc-paths" aria-label="Choose your getting started guide">
  <a class="doc-path" href="/docs/simulators/">
    <span class="doc-path-copy">
      <strong>Try it in simulation</strong>
      <span>Launch one of 890+ tasks across eight simulators with kinex-sim and let the agent solve it.</span>
    </span>
    <span class="doc-path-arrow" aria-hidden="true">→</span>
    <span class="doc-path-destination">Simulators</span>
  </a>
  <a class="doc-path" href="/docs/real-robots/">
    <span class="doc-path-copy">
      <strong>Connect a real robot</strong>
      <span>Describe your hardware and task with <code>/onboarding</code>. Robots that already run ROS 2 keep their drivers.</span>
    </span>
    <span class="doc-path-arrow" aria-hidden="true">→</span>
    <span class="doc-path-destination">Real robots</span>
  </a>
  <a class="doc-path" href="/docs/plugins/#using-kinex-from-other-harnesses">
    <span class="doc-path-copy">
      <strong>Stay in your own agent</strong>
      <span>Install the Kinex plugin for Pi, Claude Code or Codex and ask it to “Start Kinex”.</span>
    </span>
    <span class="doc-path-arrow" aria-hidden="true">→</span>
    <span class="doc-path-destination">Plugins</span>
  </a>
</nav>

## Where to go next

| I want to… | Read |
| --- | --- |
| Understand the design | [Architecture](/docs/architecture/), then [Devices](/docs/devices/), [Control graph](/docs/control-graph/) and [Skills](/docs/skills/) |
| Choose a model, set approvals, manage sessions | [Working with the agent](/docs/agent/) |
| Bring up new hardware and calibrate it | [Onboarding & calibration](/docs/onboarding/) |
| Keep a program that worked and run it again | [Programs and the library](/docs/programs/) |
| Use a detector, a segmenter or a VLA | [Using models](/docs/models/) |
| Teach the agent my lab's way of doing a task | [Writing skills](/docs/writing-skills/) |
| Record what the robot saw and did | [Recording](/docs/recording/) |
| Look something up | [CLI](/docs/cli/), [slash commands](/docs/slash-commands/), [Python API](/docs/python-api/), [workspace and configuration](/docs/workspace/), [troubleshooting](/docs/troubleshooting/) |

## About this version

These pages describe **Kinex 1.1.1**, which bundles the Pi coding agent 1.6.0. They track source commit [`e49da2e`](https://github.com/stacx-lab/kinex/tree/e49da2e9a1158e8774f007e75adf9e41705f4e9b) (2026-11-23).

### New in 1.1.1

- **Programs and a function library.** The agent's Python is now a *program* that ends with `finish`, and reusable code lives in `kinex.lib`, which replaces `kinex.helpers`. Save a program and run it again with `/exec`. See [Programs and the library](/docs/programs/).
- **One communication scope.** Programs import `io` and call `io.read`, `io.publish`, `io.request` and `io.act`. `communication()` is no longer needed inside a program.
- **Actions.** Devices can serve ROS 2 actions, and a world wait can wait for their goals.
- **Subagents and flow charts.** A program can ask a model for a judgment with `subagent`, and `/visualize` draws any program as a flow chart.
- **kinex-sim.** The simulator project rosbridge is now [kinex-sim](/docs/simulators/), with eight simulators. It exports one workspace per task.
- **Calibration in programs.** Sampling and solving run in `exec` through `kinex.lib.calibration`. The `calib_sample` and `calib_compute` tools are gone.

Coming from 1.1.0: the service types moved from `kinex_interfaces` to `custom_interfaces`, so re-export simulator workspaces and update device profiles that name the old package. `helpers.locate_object_3d` and `helpers.run_policy` were removed; programs call model devices directly, as [Using models](/docs/models/) shows.

Coming from 1.0: devices are now ROS 2 nodes and 1.0 profiles don't load. Set your devices up again with `/onboarding`. The 1.0 documentation remains at [v1.0.0 docs](/docs/v1.0/).

Kinex is licensed under the [Apache License 2.0](https://github.com/stacx-lab/kinex/blob/main/LICENSE). Bundled components keep their own licenses, listed in the [third-party notices](https://github.com/stacx-lab/kinex/blob/main/THIRD_PARTY_NOTICES.txt).
