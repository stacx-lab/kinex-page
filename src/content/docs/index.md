---
title: Kinex documentation
description: A general harness for arbitrary robots with coding agents — skills, a control graph and ROS 2 devices on top of the Pi coding agent.
group: Get started
order: 10
label: Overview
sources: ["README.md", "install.sh", "docs/architecture.md", "docs/overview.md", "docs/communication.md", "packages/core/README.md", "packages/core/assets/python/pixi.toml", "packages/setup/README.md"]
---

Kinex is a general harness for arbitrary robots with coding agents, built on the [Pi](https://pi.dev) coding agent. It gives an agent three layers to work with:

| Layer | Gives the agent | Example |
| --- | --- | --- |
| **Skills** | Task procedures the agent loads on demand | `setup-device`, `calibrate-camera-extrinsics` |
| **Control graph** | Python programs the agent writes and runs with `exec` to perceive, compute and control | `exec`, `kinex.helpers` |
| **Devices** | Typed ROS 2 interfaces to hardware, simulators and model services | `arm`, `wrist_cam`, `world`, `fastwam` |

Kinex lets you work with real hardware the way you already work with a coding agent. Describe the task in plain language and the robot carries it out.

## Install and run

```sh
curl -fsSL https://raw.githubusercontent.com/stacx-lab/kinex/main/install.sh | bash
cd /path/to/robot-workspace
kinex
```

Then `/login` to connect a model provider and `/model` to choose a model.

| Need | For |
| --- | --- |
| Linux (x86-64) or macOS | Installing and running Kinex. Robot workspaces use ROS 2 and need Linux x86-64. |
| Node.js ≥ 22.19 + npm | Kinex itself (the installer can install them) |
| `curl` | The installer |
| [Pixi](https://pixi.sh) | Kinex Python, the workspace's own ROS 2 Python environment (Jazzy by default, or Humble). No system ROS install is needed. |

**Already use Pi, Claude Code or Codex?** Kinex plugins currently support these three harnesses: see [Plugin systems](/docs/plugins/).

## Pick a path

<nav class="doc-paths" aria-label="Choose your getting started guide">
  <a class="doc-path" href="/docs/simulators/">
    <span class="doc-path-copy">
      <strong>Playing with a simulator?</strong>
      <span>Run a LIBERO, RoboTwin, RoboCasa, RoboDojo, ABC or BEHAVIOR task with rosbridge and drive its robot with Kinex.</span>
    </span>
    <span class="doc-path-arrow" aria-hidden="true">→</span>
    <span class="doc-path-destination">Simulators</span>
  </a>
  <a class="doc-path" href="/docs/real-robots/">
    <span class="doc-path-copy">
      <strong>Working with real robots?</strong>
      <span>Describe your hardware and task with <code>/onboarding</code> to connect and calibrate your robot.</span>
    </span>
    <span class="doc-path-arrow" aria-hidden="true">→</span>
    <span class="doc-path-destination">Real robots</span>
  </a>
  <a class="doc-path" href="/docs/real-robots/#robots-that-already-run-ros-2">
    <span class="doc-path-copy">
      <strong>Already using ROS 2?</strong>
      <span>Kinex devices are ROS 2 nodes, so onboarding reuses your robot's existing drivers and topics.</span>
    </span>
    <span class="doc-path-arrow" aria-hidden="true">→</span>
    <span class="doc-path-destination">Real robots · ROS 2</span>
  </a>
</nav>

## Understand the design of Kinex

- [Design principles](/docs/design-principles/) — why Kinex is built on ROS 2, and its three layers: devices, the control graph and skills.
- [Devices](/docs/devices/) — types, profiles, nodes, frames and the world clock.
- [Control graph](/docs/control-graph/) — `exec`, the Python helpers, permissions and Kinex Python.
- [Skills](/docs/skills/) — the bundled skills, and how to write your own.

## Go further

| Task | Page |
| --- | --- |
| Choose a model and approval mode; manage conversations, compaction and sessions | [Working with the agent](/docs/agent/) |
| Set up new hardware and calibrate it | [Onboarding & calibration](/docs/onboarding/) |
| Teach the agent your own procedures | [Writing skills](/docs/writing-skills/) |
| Run VLA policies | [Using VLAs](/docs/vla/) |
| Find and locate objects with vision models | [Using vision models](/docs/vision/) |
| Record what the robot sees and does | [Recording](/docs/recording/) |
| Install Pi plugins, or use Kinex from other harnesses | [Plugin systems](/docs/plugins/) |

Reference: [CLI](/docs/cli/), [slash commands](/docs/slash-commands/), [troubleshooting](/docs/troubleshooting/).

## About this version

These pages describe **Kinex 1.1.0**, bundling the **Pi coding agent 1.2.0** (`@earendil-works/pi-coding-agent`). No separate Pi install is needed.

### What changed since 1.0

- **Devices are ROS 2 nodes.** Each device declares typed ROS 2 topics and services in its profile, and Kinex runs the nodes that serve them. Drivers are gone.
- **Simulators run through [rosbridge](https://github.com/stacx-lab/rosbridge)**, which replaces RoboEnv.
- **A new Python API.** Scripts talk to devices through `kinex.communication()` and `kinex.helpers`. The `servo` tool has been removed.
- **Recordings are rosbag2 bags.** ffmpeg is no longer needed.
- **Workspaces need setting up again.** Device profiles from 1.0 don't load in 1.1. Run `/onboarding` or `/register` again, or export a fresh simulator workspace.

The 1.0 documentation remains available under [v1.0.0 docs](/docs/v1.0/).

The documentation tracks source commit `ade9a7e` (2026-11-04). Source references are recorded in each page's metadata. Kinex and its core/setup packages use the [Apache License, Version 2.0](https://github.com/stacx-lab/kinex/blob/ade9a7e971b31e0a9b3f284df02e019ecf8db67b/LICENSE). Bundled third-party notices are listed in [THIRD_PARTY_NOTICES.txt](https://github.com/stacx-lab/kinex/blob/ade9a7e971b31e0a9b3f284df02e019ecf8db67b/THIRD_PARTY_NOTICES.txt).
