// Single edit point for site-wide facts. Bump `version` on each release.
export const site = {
  name: 'kinex',
  version: '1.1.1',
  sourceRef: 'e49da2e9a1158e8774f007e75adf9e41705f4e9b',
  tagline: 'A robotics harness for coding agents',
  description:
    'Kinex is an open-source robotics harness for coding agents. Robots, simulators and models become ROS 2 devices; the agent controls them by writing and running Python programs, guided by skills.',
  repo: 'https://github.com/stacx-lab/kinex',
  sim: 'https://github.com/stacx-lab/kinex-sim',
  plugins: 'https://github.com/stacx-lab/kinex-plugins',
  install: 'curl -fsSL https://raw.githubusercontent.com/stacx-lab/kinex/main/install.sh | bash',
};

export const nav = [
  { label: 'Docs', href: '/docs/' },
];

// Sidebar group order. Every doc's `group` frontmatter must be one of these.
export const docGroups = ['Get started', 'Concepts', 'Guides', 'Reference'] as const;

// Frozen documentation for an earlier release, served under `base`. Never edit
// its pages; map a removed or renamed v1.0 slug to its current slug in `moved`.
export const archive = {
  version: '1.0.0',
  base: '/docs/v1.0/',
  groups: ['Get started', 'Concepts', 'Guides', 'Reference'] as const,
  moved: { runtime: 'control-graph', 'tools-and-skills': 'control-graph', ros2: 'real-robots', 'custom-tools': 'programs', vision: 'models', vla: 'models' } as Record<string, string>,
};
