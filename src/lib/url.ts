/** Kinex is served at the root of kinex-agent.org. */
export function url(path = '/'): string {
  return path.startsWith('/') ? path : '/' + path;
}
