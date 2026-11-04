// Single edit point for site-wide facts. Bump `version` on each release.
export const site = {
  name: 'kinex',
  version: '1.1.0',
  sourceRef: 'ade9a7e971b31e0a9b3f284df02e019ecf8db67b',
  tagline: 'A general harness that connects coding agents to any physical robot',
  description:
    'Kinex is a general harness for arbitrary robots with coding agents, built on the Pi coding agent. Devices run as ROS 2 nodes; agents control them with Python programs and skills, on robots, simulators and models.',
  repo: 'https://github.com/stacx-lab/kinex',
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
  moved: { architecture: 'design-principles', runtime: 'control-graph', 'tools-and-skills': 'control-graph', ros2: 'real-robots', 'custom-tools': 'control-graph' } as Record<string, string>,
};
