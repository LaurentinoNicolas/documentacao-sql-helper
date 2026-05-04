
import * as vscode from 'vscode';

export function registerCompletionItemProvider(context: vscode.ExtensionContext) {

  const provider = vscode.languages.registerCompletionItemProvider(
        'sql',
        {
            provideCompletionItems(document, position) {

                const line = document.lineAt(position.line).text;
                const textUntilCursor = line.substring(0, position.character);

                // pega a última palavra digitada
                const match = textUntilCursor.match(/@d$/i);

                if (!match) return;

                const item = new vscode.CompletionItem(
                    '@doc',
                    vscode.CompletionItemKind.Snippet
                );

                item.insertText = new vscode.SnippetString('-- @doc:${1:NOME}');

                // 🔥 substitui exatamente o "@doc" digitado
                const start = position.translate(0, -match[0].length);
                const range = new vscode.Range(start, position);

                item.range = range;

                item.detail = 'Inserir documentação SQL';

                return [item];
            }
        },
        'c' // trigger (última letra de doc)
    );

    context.subscriptions.push(provider);
}