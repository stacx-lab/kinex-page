---
title: Troubleshooting
description: Fixes for common problems with installation, models, approvals, devices, simulators and programs.
group: Reference
order: 50
sources: ["install.sh", "src/cli.ts", "src/arguments.ts", "src/auth.ts", "docs/overview.md", "docs/devices.md", "docs/communication.md", "docs/setup.md", "packages/core/README.md", "packages/core/src/tool/exec.txt", "kinex-sim: docs/README.md"]
---

Start by checking which version you run and what Kinex sees in the workspace:

```sh
kinex --version
kinex run "/devices"
kinex run "/ping all"
```

## Installation and startup

| Problem | Fix |
| --- | --- |
| `kinex: command not found` | Add `~/.local/bin` to your `PATH`; the installer prints the exact line. |
| `Another Kinex is on PATH` | Another `kinex` comes first on your `PATH`. Keep it and run `kinex update`, or remove it and rerun the installer. |
| `Refusing to replace ~/.local/bin/kinex` | A file the installer didn't create is in the way. Move it, then reinstall. |
| Syntax errors on start | Kinex needs Node.js 22.19 or newer. Rerun the installer to get one. |
| `Unsupported option`, or an option `was removed` | The message names the replacement; `kinex --help` lists every option. |
| `--resume requires a terminal` | In scripts, use `--continue` or `--session <id>`. |
| `AuthPathConflict` | `~/.config/kinex/agent/auth.json` holds credentials Kinex expects in `~/.local/share/kinex/agent/auth.json`. Merge them into the latter, delete the former and restart. |

## Models and approvals

| Problem | Fix |
| --- | --- |
| Model not found | Check the exact name in `/model`. `--provider` only works together with `--model`. |
| Authentication errors | Run `/login` again, or check the provider's API-key environment variable. |
| Local model doesn't respond | Start the model server before you start Kinex. |
| Calls are denied in a scripted run | Without a terminal, `ask` mode can't prompt, so it denies. Allow specific [permissions](/docs/workspace/#permissions) in `kinex.json`, or run with `--auto`. |

## Devices

| Problem | Fix |
| --- | --- |
| `device "x" is unloaded` | Run `/load x`. |
| A device doesn't become ready | `/ping x` shows its status. Check that the robot's own ROS stack is running on the device's ROS domain and that the node's dependencies are installed, then `/unload x` and `/load x`. Kinex never restarts a failed device by itself. |
| Loaded, but not responding | `loaded` means "should be connected", not "is ready". `/ping x`, then reload it. |
| A profile or node edit has no effect | `/unload x`, then `/load x`. |
| A frame lookup fails | The error names the cause: an unloaded device, a frame its device hasn't published, or two frames with no measured connection. A mount still marked `???` needs [calibration](/docs/onboarding/#calibration). |
| `No robot is configured` | No valid `.kinex/workspace.yaml` was found. Check that you are in the right directory. |
| The wrong devices show up | A `.kinex/` nearer your current directory hides the one you meant. |
| One entry of a `devices` call failed | Each call reports its own result, so the others may have succeeded. Check every entry before retrying. |
| `DeviceProfileError` after upgrading from 1.0 | Profiles from Kinex 1.0 don't load. Move `.kinex/devices` aside and set the devices up again with `/onboarding`. |
| A device stopped loading after upgrading from 1.1.0 | Its profile may name a `kinex_interfaces` type; the package is now `custom_interfaces`. Re-export simulator workspaces. For a real robot, ask the agent to update the profile and node. |

## Simulators

| Problem | Fix |
| --- | --- |
| Simulator devices don't respond | The simulator must be running on the workspace's ROS domain. Pass the same `--domain-id` to `kinex-sim setup` and `kinex-sim launch`, then `/unload all` and `/load all`. |
| Devices don't match the running task | A workspace belongs to one task, seed and configuration. Export another with `kinex-sim setup`. |
| Commands are rejected after a while | The episode ended. Stop the run and launch a new one; there is no reset. |
| The world never advances | In stepped mode the world moves only while a program waits on `world.wait`. |

## Programs

| Problem | Fix |
| --- | --- |
| `Install Pixi to prepare…` | Install [Pixi](https://pixi.sh). Kinex Python needs it for ROS, on Linux x86-64. See [Kinex Python](/docs/workspace/#kinex-python). |
| The first program takes minutes | Kinex Python is being built. This happens once per workspace. |
| Wrong ROS distribution | Set `python.provider` to `ros-jazzy` or `ros-humble` in `.kinex/kinex.json`. The environment is rebuilt on next use. |
| A program returns `null` | It ended without calling `finish`. |
| Camera images aren't shown to the agent | Images are attached only through `finish(result, file=[...])`. Printing a path attaches nothing. |
| A program is cut off | The default limit is 120 seconds. The agent can pass a longer `timeout_s`, or split the work. |
| Motion continues after a program ends | A successful program leaves motion running. Have it call the device's `stop` when it must end at rest, or use `/stop`. |
| `subagent_unavailable` | Subagents run in standalone Kinex only. |
| A library function or skill is missing | Library modules go in `.kinex/lib/`, skills in `.kinex/skills/<name>/SKILL.md`. `/lib` lists modules and reports files it couldn't import. |
| Old behavior after an update | A skill, library module or device guide copied into the workspace overrides the updated built-in. Refresh or delete the copy. |

## Reporting an issue

Open an issue at [stacx-lab/kinex](https://github.com/stacx-lab/kinex/issues) with:

- the output of `kinex --version`, your OS, your Node.js version and your `python.provider`;
- the command you ran, what you expected and what happened, including the error;
- whether the device is simulated or real.

Remove credentials and private images first.
