import * as vscode from 'vscode';
import { openDocWebview } from '../webview/docWebview';

export function registerCodeLens(context: vscode.ExtensionContext) {

    const provider = vscode.languages.registerCodeLensProvider('sql', {
        provideCodeLenses(document: vscode.TextDocument) {

            const lenses: vscode.CodeLens[] = [];

            for (let i = 0; i < document.lineCount; i++) {

                const line = document.lineAt(i).text;

                if (!line.includes('@doc')) continue;

                const match = line.match(/--\s*@doc:\s*([^\s]+)/i);
                if (!match) continue;

                const docId = match[1];
                const range = new vscode.Range(i, 0, i, line.length);

                lenses.push(new vscode.CodeLens(range, {
                    title: '✏️ Editar / Criar Doc',
                    command: 'documentacao-sql.editDoc',
                    arguments: [docId, document.fileName]
                }));
            }

            return lenses;
        }
    });

    const editCommand = vscode.commands.registerCommand(
        'documentacao-sql.editDoc',
        (docId: string, fileName: string) => {
            openDocWebview(context, docId, fileName);
        }
    );

    context.subscriptions.push(provider, editCommand);
}