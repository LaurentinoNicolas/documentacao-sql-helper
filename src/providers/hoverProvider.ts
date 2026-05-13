import * as vscode from 'vscode';
import { buscarDocBanco } from '../database/repository';
import { docsCache, getDocCacheKey } from '../utils/cache';
import * as path from 'path';

export function registerHover(context: vscode.ExtensionContext) {

   const hoverProvider = vscode.languages.registerHoverProvider('sql', {
      async provideHover(document, position) {

         const line = document.lineAt(position.line).text;

         if (!line.includes('@doc')) return;

         const match = line.match(/--\s*@doc:\s*([^\s]+)/i);
         if (!match) return;

         const docId = match[1];

         const nomeArquivo = path.basename(document.fileName);
         const cacheKey = getDocCacheKey(nomeArquivo, docId);

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

         md.isTrusted = true;
         md.supportHtml = true;

         md.appendMarkdown(`### 📘 ${docId}\n\n`);
         md.appendMarkdown(formatarMarkdownHover(doc.descricao) + '\n\n');
         md.appendMarkdown(`---\n`);
         md.appendMarkdown(`👤 ${doc.autor}  \n`);
         md.appendMarkdown(`🕒 ${dataFormatada}`);

         return new vscode.Hover(md);
      }
   });

   context.subscriptions.push(hoverProvider);

   
}

function formatarMarkdownHover(texto: string): string {
   if (!texto) return '';

   const linhas = texto.split('\n');
   let dentroCodeBlock = false;

   return linhas.map(linha => {

      if (linha.trim().startsWith('```')) {
         dentroCodeBlock = !dentroCodeBlock;
         return linha;
      }

      if (dentroCodeBlock) {
         return linha;
      }

      return linha + '  ';
   }).join('\n');
}