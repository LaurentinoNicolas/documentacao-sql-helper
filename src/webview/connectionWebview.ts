import * as vscode from 'vscode';
import { testarConexao } from '../database/connection';
import * as sql from 'mssql';
import { clearCache } from '../utils/cache';

let pool: sql.ConnectionPool | null = null;

export async function openConnectionWebview(context: vscode.ExtensionContext) {

   const panel = vscode.window.createWebviewPanel(
      'sqlConnectionConfig',
      'Configurar Conexão SQL',
      vscode.ViewColumn.Active,
      { enableScripts: true }
   );

   const config = vscode.workspace.getConfiguration('documentacaoSql');

   const server = config.get<string>('db.server') || '';
   const database = config.get<string>('db.database') || '';
   const user = config.get<string>('db.user') || '';
   const usuarioApp = config.get<string>('usuario') || '';

   const password = await context.secrets.get('documentacaoSql.db.password') || '';

   panel.webview.html = getConnectionHtml({
      server,
      database,
      user,
      password,
      usuarioApp
   });

   panel.webview.onDidReceiveMessage(async message => {

      if (!message.server || !message.database || !message.user || !message.password) {
         vscode.window.showErrorMessage('Preencha todos os campos');
         return;
      }

      if (message.command === 'test') {
         panel.webview.postMessage({
            command: 'status',
            message: '🔄 Testando conexão...',
            color: '#ccc'
         });

         const ok = await testarConexao(message);

         if (ok) {
            panel.webview.postMessage({
               command: 'status',
               message: '✅ Conectado com sucesso!',
               color: '#4CAF50'
            });
         } else {
            panel.webview.postMessage({
               command: 'status',
               message: '❌ Falha na conexão',
               color: '#f44336'
            });
         }
      }

      if (message.command === 'save') {

         const ok = await testarConexao(message);
         if (!ok) return;

         const config = vscode.workspace.getConfiguration('documentacaoSql');

         await config.update('db.server', message.server, vscode.ConfigurationTarget.Global);
         await config.update('db.database', message.database, vscode.ConfigurationTarget.Global);
         await config.update('db.user', message.user, vscode.ConfigurationTarget.Global);
         await config.update('usuario', message.usuarioApp, vscode.ConfigurationTarget.Global);

         await context.secrets.store('documentacaoSql.db.password', message.password);

         if (pool) {
            await pool.close();
            pool = null;
         }

         clearCache();

         vscode.window.showInformationMessage('Configuração salva!');
         vscode.commands.executeCommand('documentacaoSql.refreshStatusBar');
         panel.dispose();
      }
   });
}

function getConnectionHtml(data?: any): string {
   return `
    <html>
    <body style="
        font-family: Segoe UI, sans-serif;
        background-color: #1e1e1e;
        color: #ddd;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
    ">

        <div style="
            width: 400px;
            background: #252526;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
        ">

            <h2 style="margin-top: 0;">🔌 Conexão SQL</h2>

            ${input('server', 'Servidor', data?.server)}
            ${input('database', 'Database', data?.database)}
            ${input('user', 'Usuário', data?.user)}
            ${input('password', 'Senha', data?.password, 'password')}
            ${input('usuarioApp', 'Seu nome', data?.usuarioApp)}

            <div style="display:flex; gap:10px; margin-top:20px;">
                <button onclick="testar()" style="${btn('#007acc')}">Testar</button>
                <button onclick="salvar()" style="${btn('#0e639c')}">Salvar</button>
            </div>

            <div id="status" style="margin-top:15px; font-size:12px; color:#aaa;"></div>

        </div>

        <script>
            const vscode = acquireVsCodeApi();

            function getValue(id){
                return document.getElementById(id).value;
            }

            function getData(){
                return {
                    server: getValue('server'),
                    database: getValue('database'),
                    user: getValue('user'),
                    password: getValue('password'),
                    usuarioApp: getValue('usuarioApp')
                }
            }

            function setStatus(msg, color){
                const el = document.getElementById('status');
                el.innerText = msg;
                el.style.color = color;
            }

            function testar(){
                setStatus('Testando conexão...', '#ccc');
                vscode.postMessage({ command:'test', ...getData() });
            }

            function salvar(){
                vscode.postMessage({ command:'save', ...getData() });
            }

            window.addEventListener('message', event => {
            const msg = event.data;

            if (msg.command === 'status') {
               setStatus(msg.message, msg.color);
            }
      });
        </script>

    </body>
    </html>

    ${helpers()}
    `;
}

function input(id: string, label: string, value?: string, type = 'text') {
   return `
    <div style="margin-top:15px;">
        <label style="font-size:12px; color:#aaa;">${label}</label>
        <input id="${id}" type="${type}" value="${value || ''}" style="
            width:100%;
            padding:8px;
            margin-top:5px;
            border-radius:5px;
            border:1px solid #3c3c3c;
            background:#1e1e1e;
            color:#fff;
            outline:none;
        "/>
    </div>
   `;
}

function btn(color: string) {
   return `
        flex:1;
        padding:10px;
        border:none;
        border-radius:5px;
        background:${color};
        color:white;
        cursor:pointer;
    `;
}

function helpers() {
   return '';
}