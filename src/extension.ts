import * as vscode from 'vscode';
import { registerHover } from './providers/hoverProvider';
import { registerCodeLens } from './providers/codeLensProvider';
import { openConnectionWebview } from './webview/connectionWebview';
import { getConnection } from './database/connection';
import {registerCompletionItemProvider} from './providers/completionProvider'

export async function activate(context: vscode.ExtensionContext) {

   const config = vscode.workspace.getConfiguration('documentacaoSql');
   const server = config.get('db.server');

   if (!server) {
      openConnectionWebview(context);
   }

   const configurar = vscode.commands.registerCommand('documentacaoSql.configurar', () => {
      openConnectionWebview(context);
   });

   registerHover(context);
   registerCodeLens(context);
   registerCompletionItemProvider(context)

   const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

   statusBar.command = 'documentacaoSql.configurar';

   await updateStatusBar(statusBar, context);
   statusBar.show();

   const refreshStatusBar = vscode.commands.registerCommand('documentacaoSql.refreshStatusBar', () => {
      updateStatusBar(statusBar, context);
   });

   context.subscriptions.push(
      configurar,
      refreshStatusBar,
      statusBar
   );
}

async function updateStatusBar(
   statusBar: vscode.StatusBarItem,
   context: vscode.ExtensionContext
) {

   const config = vscode.workspace.getConfiguration('documentacaoSql');

   const server = config.get<string>('db.server');
   const database = config.get<string>('db.database');

   if (!server || !database) {

      statusBar.text = '$(warning) Configurar SQL Doc';
      statusBar.tooltip = 'Clique para configurar conexão';
      return;
   }

   try {

      await getConnection(context);

      statusBar.text = `DOC-SQL - $(database) ${database}`;
      statusBar.tooltip = `Conectado em ${server}`;

   } catch (e) {
      console.log(e)
      statusBar.text = 'DOC-SQL - $(error) Erro conexão';
      statusBar.tooltip = 'Erro ao conectar no banco';
   }
}

export function deactivate() { }