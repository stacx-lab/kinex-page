/** Kinex is served at the root of kinex-agent.com. */
export function url(path = '/'): string {
  return path.startsWith('/') ? path : '/' + path;
}
