import * as vscode from 'vscode';
import { buscarDocBanco } from '../database/repository';
import { docsCache } from '../utils/cache';
import * as path from 'path';

export function registerHover(context: vscode.ExtensionContext) {

   const hoverProvider = vscode.languages.registerHoverProvider('sql', {
      async provideHover(document, position) {

         const line = document.lineAt(position.line).text;

         if (!line.includes('@doc')) return;

         const match = line.match(/--\s*@doc:(\w+)/);
         if (!match) return;

         const docId = match[1];

         const nomeArquivo = path.basename(document.fileName);
         const cacheKey = `${nomeArquivo}:${docId}`;

         let doc = docsCache[cacheKey];

         if (!doc) {
            try {
               doc = await buscarDocBanco(document.fileName, docId, context);
               if (doc) docsCache[cacheKey] = doc;
            } catch(e) {
               console.log(e)
               return;
            }
         }

         const data = doc?.dataAtualizacao;
         let dataFormatada = 'N/A';

         if (data) {
            const d = new Date(data);

            dataFormatada = d.toLocaleString('pt-BR', {
               day: '2-digit',
               month: '2-digit',
               year: 'numeric',
               hour: '2-digit',
               minute: '2-digit'
            });
         }

         const md = new vscode.MarkdownString();

         if (!doc) {
            md.appendMarkdown(`### ⚠️ ${docId}\n\nDoc não encontrado.`);
            return new vscode.Hover(md);
         }

         md.appendMarkdown(`### 📘 ${docId}\n\n`);
         md.appendMarkdown(`${doc.descricao.replace(/\n/g, '  \n')}\n\n`);
         md.appendMarkdown(`---\n`);
         md.appendMarkdown(`👤 ${doc.autor}  \n`);
         md.appendMarkdown(`🕒 ${dataFormatada}`);

         return new vscode.Hover(md);
      }
   });

   context.subscriptions.push(hoverProvider);
}