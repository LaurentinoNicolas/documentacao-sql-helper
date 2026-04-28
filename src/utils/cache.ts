export let docsCache: any = {};

export function clearCache() {
    Object.keys(docsCache).forEach(k => delete docsCache[k]);
}