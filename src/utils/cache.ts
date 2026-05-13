import * as vscode from 'vscode';

export let docsCache: any = {};

export function clearCache() {
   Object.keys(docsCache).forEach(k => delete docsCache[k]);
}

export function getDocCacheKey(fileName: string, docId: string): string {

   const config = vscode.workspace.getConfiguration('documentacaoSql');

   const server = config.get<string>('db.server') || '';
   const database = config.get<string>('db.database') || '';

   return `${server.toLowerCase()}|${database.toLowerCase()}|${fileName.toLowerCase()}|${docId.toUpperCase()}`;
}