---
title: Plugin systems
description: Install and manage Pi plugins in Kinex, and use Kinex itself as a plugin in Pi, Claude Code or Codex.
group: Guides
order: 70
label: Plugin systems
sources: ["README.md", "src/cli.ts", "src/packages.ts", "src/integration/default-extensions.ts", "packages/setup/README.md", "docs/overview.md", "docs/distribution.md"]
---

Plugins work in two directions with Kinex:

- **Into Kinex.** Kinex is built on [Pi](https://pi.dev), so it can install and run plugins from Pi's ecosystem: extensions, skills, prompt templates and themes.
- **Out of Kinex.** Kinex's robotics layer is itself packaged as plugins, so you can use your devices, tools and skills from Pi, Claude Code or Codex instead of the Kinex app.

## Installing Pi plugins

Pi plugins are distributed as packages, from npm, a Git repository or a local folder. Kinex manages them with the same commands as Pi. Browse what's available at [pi.dev/packages](https://pi.dev/packages).

Kinex already bundles two: [pi-web-search](https://www.npmjs.com/package/pi-web-search) for web search and [pi-btw](https://www.npmjs.com/package/pi-btw) for side conversations.

```sh
kinex install npm:pi-web-search         # install it yourself, replacing the bundled copy
kinex install ./my-pi-package -l        # add a package to this project only
kinex list                              # see installed and bundled packages
kinex update --extensions               # update installed packages, keeping version pins
kinex update npm:pi-web-search          # update a single package
kinex remove npm:pi-web-search          # remove it; the bundled version takes over again
```

Packages install for your user by default; add `-l` to install for the current project only. **Restart Kinex** after installing, updating or removing a package so the change takes effect. See Pi's [package documentation](https://github.com/earendil-works/pi/blob/v1.2.0/packages/coding-agent/docs/packages.md) to write your own.

## Using Kinex from other harnesses

The [kinex-plugins](https://github.com/stacx-lab/kinex-plugins) repository brings Kinex's devices, control graph, robotics skills, onboarding and calibration to **Pi, Claude Code and Codex**. Your harness keeps its own coding tools, conversations, credentials and approvals, and you don't need the standalone Kinex app. OpenCode is not supported.

Plugin releases are versioned separately and bundle their own copy of Kinex, so updating standalone Kinex doesn't update a plugin.

### Installing a plugin

You need Linux or macOS with Node.js 22.22.2 or newer, your host installed, and Pixi or uv for [Kinex Python](/docs/control-graph/#python-environment). Build the plugins from a local checkout and install them into your host:

```sh
git clone https://github.com/stacx-lab/kinex-plugins.git
cd kinex-plugins
nvm use
npm ci
npm run build
npm run install-plugins -- --host claude   # or pi, codex, all
```

Keep the checkout in place; the installed plugins run its built files. To update later, end Kinex, close your host sessions and run `npm run update` in the checkout. See the [kinex-plugins README](https://github.com/stacx-lab/kinex-plugins#install) for options.

### Using it

Open your robot workspace and launch a new host session:

```sh
cd /path/to/robot-workspace
export KINEX_WORKSPACE="$PWD"
# Launch pi, claude, or codex.
```

The plugin starts inactive. Start and end robotics with these commands or requests:

| Action | Pi | Claude Code or Codex |
| --- | --- | --- |
| Start robotics and load the devices set to load | `/kinex-start` | “Start Kinex” |
| Show state, versions, permission mode and recordings | `/kinex-status` | “Show Kinex status” |
| Cancel work, finish recordings and release devices | `/kinex-end` | “End Kinex” |

In Codex, explicitly ask “Start Kinex”; installing or enabling the plugin doesn't start robotics. Ending Kinex keeps your coding session open, and ROS topics and services Kinex only connected to keep running.

Approvals are handled by your host by default, so Kinex doesn't ask a second time. Explicit `allow`, `ask` and `deny` rules in `.kinex/kinex.json` still apply, and setup questions still need your answers. See the [plugin permissions](https://github.com/stacx-lab/kinex-plugins#permissions) to switch back to Kinex's own approval dialogs.

Letting the agent record is opt-in, as in standalone Kinex: start Pi with `--kinex-recording`, or add `--enable-recording` to the Kinex server's arguments in the Claude Code or Codex MCP configuration.

## Building your own integration

To bring Kinex to a host that isn't covered, build on `@kinex/core` directly. It has no agent, UI or model dependency: you create a runtime for a workspace, register its tools with your host, and supply a callback that asks the user for permission. Add `@kinex/setup` for onboarding and calibration:

```ts
import { createKinexRuntime } from "@kinex/core"
import { coreContribution, composeContributions } from "@kinex/core/integration"
import { createKinexSetup, setupContribution, setupSkillRoots, setupToolNames } from "@kinex/setup"

const runtime = createKinexRuntime({
  directory: process.cwd(),
  builtinSkillRoots: setupSkillRoots,
  reservedToolNames: setupToolNames,
  host: { ask: async request => { /* authorize or throw */ } },
})
const setup = createKinexSetup(runtime)
const capabilities = composeContributions([coreContribution(runtime), setupContribution(setup)])
try {
  const tools = await capabilities.tools.list()
  const skills = await capabilities.skills.list()
  const plan = await setup.plan.inspect()
  // Register tools, skills and capabilities.commands with your host.
} finally {
  await runtime.dispose()
}
```

The [core README](https://github.com/stacx-lab/kinex/blob/ade9a7e971b31e0a9b3f284df02e019ecf8db67b/packages/core/README.md) and [setup README](https://github.com/stacx-lab/kinex/blob/ade9a7e971b31e0a9b3f284df02e019ecf8db67b/packages/setup/README.md#composition) cover the API.
