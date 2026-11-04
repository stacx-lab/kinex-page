import { getCollection, type CollectionEntry } from 'astro:content';
import { archive, docGroups } from '../config';
import { url } from './url';

export type DocCollection = 'docs' | 'docsV1_0';
export type Doc = CollectionEntry<DocCollection>;

/** Where each documentation tree is served and how its sidebar is grouped. */
export const trees: Record<DocCollection, { base: string; groups: readonly string[] }> = {
  docs: { base: '/docs/', groups: docGroups },
  docsV1_0: { base: archive.base, groups: archive.groups },
};

/** Docs in sidebar order: group (as listed in config), then `order`. */
export async function getDocs(collection: DocCollection = 'docs'): Promise<Doc[]> {
  const docs: Doc[] = await getCollection(collection);
  const { groups } = trees[collection];
  const g = (d: Doc) => groups.indexOf(d.data.group);
  return docs.sort((a, b) => g(a) - g(b) || a.data.order - b.data.order || a.id.localeCompare(b.id));
}

export const docSlug = (d: Doc) => (d.id === 'index' ? undefined : d.id);
export const docHref = (d: Doc) => url(trees[d.collection].base + (d.id === 'index' ? '' : `${d.id}/`));

/** The current page that replaces an archived slug, if any. */
export function successor(id: string, current: ReadonlySet<string>): string | undefined {
  const next = archive.moved[id] ?? id;
  if (!current.has(next)) return undefined;
  return url(next === 'index' ? '/docs/' : `/docs/${next}/`);
}
