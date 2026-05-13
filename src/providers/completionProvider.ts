
import * as vscode from 'vscode';

export function registerCompletionItemProvider(context: vscode.ExtensionContext) {

   const provider = vscode.languages.registerCompletionItemProvider(
      'sql',
      {
         provideCompletionItems(document, position) {

            const line = document.lineAt(position.line).text;
            const textUntilCursor = line.substring(0, position.character);

            /**
             * Casos aceitos:
             * --
             * --@
             * --@doc
             * --@DOC
             * @
             * @doc
             * @DOC
             */
            const match = textUntilCursor.match(/(?:--\s*)?@?(doc)?$/i);

            if (!match) return;

            const item = new vscode.CompletionItem(
               '@doc:',
               vscode.CompletionItemKind.Snippet
            );

            item.detail = 'SQL Doc';
            item.documentation = 'Insere o padrão de documentação SQL';

            /**
             * Resultado final:
             * @doc:NOME
             */
            item.insertText = new vscode.SnippetString('--@doc:${1:NOME}');

            /**
             * Substitui apenas o trecho digitado.
             *
             * Ex:
             * --@doc  -> --@doc:NOME
             * @DOC   -> @doc:NOME
             * @      -> @doc:NOME
             */
            const replaceMatch = textUntilCursor.match(/@?(doc)?$/i);

            if (replaceMatch) {
               const start = position.translate(0, -replaceMatch[0].length);
               item.range = new vscode.Range(start, position);
            }

            return [item];
         }
      },
      '@',
      'c',
      'C'
   );

   context.subscriptions.push(provider);
}