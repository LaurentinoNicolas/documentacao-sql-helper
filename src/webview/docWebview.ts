import * as vscode from 'vscode';
import { salvarDocBanco, buscarDocBanco } from '../database/repository';
import { clearCache } from '../utils/cache';

export async function openDocWebview(context: vscode.ExtensionContext, docId: string, fileName: string) {

   const panel = vscode.window.createWebviewPanel(
      'sqlDocEditor',
      `Doc: ${docId}`,
      vscode.ViewColumn.Active,
      { enableScripts: true }
   );

   let doc = null;

   try {
      doc = await buscarDocBanco(fileName, docId, context);
   } catch (e) {
      console.error(e);
   }

   panel.webview.html = getHtml(docId, doc?.descricao || '');

   panel.webview.onDidReceiveMessage(async message => {

      if (message.command === 'save') {

         // 🔹 1. mostra salvando
         panel.webview.postMessage({
            command: 'status',
            message: '💾 Salvando...',
            color: '#ccc'
         });

         try {

            // 🔹 2. salva de verdade
            await salvarDocBanco(docId, message.descricao, fileName, context);

            // 🔹 3. sucesso
            panel.webview.postMessage({
               command: 'status',
               message: '✅ Salvo com sucesso!',
               color: '#4CAF50'
            });

            vscode.window.showInformationMessage(`Doc ${docId} salva!`);

            clearCache();
            vscode.commands.executeCommand('editor.action.codeLens.refresh');

            // 🔹 4. fecha por último
            panel.dispose();

         } catch (err) {

            panel.webview.postMessage({
               command: 'status',
               message: '❌ Erro ao salvar',
               color: 'red'
            });
         }
      }
   });
}

function getHtml(docId: string, descricao: string): string {
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
            width: 500px;
            background: #252526;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
        ">

            <h2 style="margin-top:0;">📘 ${docId}</h2>

            <label style="font-size:12px; color:#aaa;">Descrição</label>

            <textarea id="desc" style="
                width:100%;
                height:180px;
                margin-top:5px;
                padding:10px;
                border-radius:5px;
                border:1px solid #3c3c3c;
                background:#1e1e1e;
                color:#fff;
                resize:none;
                outline:none;
            ">${descricao || ''}</textarea>

            <div style="margin-top:20px;">
                <button onclick="salvar()" style="
                    width:100%;
                    padding:10px;
                    border:none;
                    border-radius:5px;
                    background:#0e639c;
                    color:white;
                    cursor:pointer;
                ">
                    💾 Salvar
                </button>
            </div>

            <div id="status" style="margin-top:10px; font-size:12px;"></div>

        </div>

        <script>
            const vscode = acquireVsCodeApi();

            function setStatus(msg, color){
                const el = document.getElementById('status');
                el.innerText = msg;
                el.style.color = color;
            }

            function salvar(){
                setStatus('💾 Salvando...', '#ccc');

                vscode.postMessage({
                    command:'save',
                    descricao: document.getElementById('desc').value
                });
            }
            window.addEventListener('message', event => {
               const msg = event.data;
               if (msg.command === 'status') {
                  setStatus(msg.message, msg.color);
               }
            });
        </script>

    </body>
    </html>`;
}