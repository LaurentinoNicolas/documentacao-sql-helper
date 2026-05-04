import * as vscode from 'vscode';
import { salvarDocBanco, buscarDocBanco } from '../database/repository';
import { clearCache } from '../utils/cache';

export async function openDocWebview(context: vscode.ExtensionContext, docId: string, fileName: string) {

   const panel = vscode.window.createWebviewPanel(
      'sqlDocEditor',
      `Doc: ${docId}`,
      vscode.ViewColumn.Active,
      {
         enableScripts: true,
         retainContextWhenHidden: true
      }
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
            width: 720px;
            background: #252526;
            padding: 22px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
        ">

            <h2 style="margin-top:0; margin-bottom: 15px;">📘 ${docId}</h2>

            <div style="
                display:flex;
                flex-wrap:wrap;
                gap:8px;
                margin-bottom:12px;
            ">
                <button onclick="formatar('bold')" class="toolbar-btn"><b>B</b></button>
                <button onclick="formatar('italic')" class="toolbar-btn"><i>I</i></button>
                <button onclick="formatar('inlineCode')" class="toolbar-btn">&lt;/&gt;</button>
                <button onclick="formatar('codeBlock')" class="toolbar-btn">SQL</button>
                <button onclick="formatar('title')" class="toolbar-btn">Título</button>
                <button onclick="formatar('list')" class="toolbar-btn">Lista</button>
            </div>

            <label style="font-size:12px; color:#aaa;">Descrição</label>

            <textarea id="desc" style="
               width:100%;
               max-width:100%;
               height:190px;
               margin-top:5px;
               padding:10px;
               border-radius:5px;
               border:1px solid #3c3c3c;
               background:#1e1e1e;
               color:#fff;
               resize:none;
               outline:none;
               font-family: Consolas, monospace;
               font-size:13px;
               line-height:1.5;
               box-sizing:border-box;
               display:block;
            ">${escapeHtml(descricao || '')}</textarea>

            <h4 style="margin-top:18px; margin-bottom:8px;">👁️ Preview</h4>

            <div id="preview" style="
                background:#1e1e1e;
                padding:12px;
                border-radius:5px;
                border:1px solid #3c3c3c;
                min-height:130px;
                max-height:230px;
                overflow:auto;
                line-height:1.5;
            "></div>

            <div style="margin-top:18px;">
                <button onclick="salvar()" style="
                    width:100%;
                    padding:10px;
                    border:none;
                    border-radius:5px;
                    background:#0e639c;
                    color:white;
                    cursor:pointer;
                    font-weight:600;
                ">
                    💾 Salvar
                </button>
            </div>

            <div id="status" style="margin-top:10px; font-size:12px;"></div>

        </div>

        <style>

            * {
               box-sizing: border-box;
            }

            body {
               overflow: hidden;
            }

            .toolbar-btn {
               background:#333;
               color:#ddd;
               border:1px solid #444;
               border-radius:5px;
               padding:6px 10px;
               cursor:pointer;
               font-size:12px;
            }

            .toolbar-btn:hover {
               background:#0e639c;
               color:white;
               border-color:#0e639c;
            }

            #desc {
               box-sizing: border-box;
               display: block;
               max-width: 100%;
            }

            #preview {
               box-sizing: border-box;
               max-width: 100%;
            }

            .toolbar-btn {
                background:#333;
                color:#ddd;
                border:1px solid #444;
                border-radius:5px;
                padding:6px 10px;
                cursor:pointer;
                font-size:12px;
            }

            .toolbar-btn:hover {
                background:#0e639c;
                color:white;
                border-color:#0e639c;
            }

            #preview h1, #preview h2, #preview h3 {
                margin-top: 8px;
                margin-bottom: 8px;
            }

            #preview p {
                margin: 4px 0;
            }

            #preview code {
                background:#2d2d2d;
                padding:2px 5px;
                border-radius:4px;
                font-family: Consolas, monospace;
            }

            #preview pre {
                background:#111;
                padding:10px;
                border-radius:5px;
                overflow:auto;
                border:1px solid #333;
            }

            #preview ul {
                margin-top: 4px;
            }
        </style>

        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

        <script>
            const vscode = acquireVsCodeApi();
            const textarea = document.getElementById('desc');
            const preview = document.getElementById('preview');

            const estadoSalvo = vscode.getState();

            if (estadoSalvo && estadoSalvo.descricao !== undefined) {
               textarea.value = estadoSalvo.descricao;
            }

            marked.setOptions({
                breaks: true,
                gfm: true
            });

            function render() {
               preview.innerHTML = marked.parse(textarea.value || '');
            }

            function setStatus(msg, color){
                const el = document.getElementById('status');
                el.innerText = msg;
                el.style.color = color;
            }

            function inserirTextoAntesDepois(antes, depois, placeholder) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selected = textarea.value.substring(start, end);
                const texto = selected || placeholder;

                textarea.value =
                    textarea.value.substring(0, start) +
                    antes + texto + depois +
                    textarea.value.substring(end);

                const cursorStart = start + antes.length;
                const cursorEnd = cursorStart + texto.length;

                textarea.focus();
                textarea.setSelectionRange(cursorStart, cursorEnd);
                render();
            }

            function inserirLinha(texto) {
                const start = textarea.selectionStart;

                textarea.value =
                    textarea.value.substring(0, start) +
                    texto +
                    textarea.value.substring(start);

                textarea.focus();
                textarea.setSelectionRange(start + texto.length, start + texto.length);
                render();
            }

            function formatar(tipo) {
                if (tipo === 'bold') {
                    inserirTextoAntesDepois('**', '**', 'texto em negrito');
                }

                if (tipo === 'italic') {
                    inserirTextoAntesDepois('*', '*', 'texto em itálico');
                }

                if (tipo === 'inlineCode') {
                    inserirTextoAntesDepois('\`', '\`', 'codigo');
                }

                if (tipo === 'codeBlock') {
                    inserirTextoAntesDepois(
                        '\\n\`\`\`sql\\n',
                        '\\n\`\`\`\\n',
                        'SELECT * FROM TABELA'
                    );
                }

                if (tipo === 'title') {
                    inserirLinha('\\n### Título\\n');
                }

                if (tipo === 'list') {
                    inserirLinha('\\n- Item 1\\n- Item 2\\n');
                }
            }

            function salvar(){
                setStatus('💾 Salvando...', '#ccc');

                vscode.postMessage({
                    command:'save',
                    descricao: textarea.value
                });
            }

            textarea.addEventListener('input', () => {
               vscode.setState({
                  descricao: textarea.value
               });

               render();
            });

            window.addEventListener('message', event => {
                const msg = event.data;

                if (msg.command === 'status') {
                    setStatus(msg.message, msg.color);
                }
            });

            render();
        </script>

    </body>
    </html>`;
}

function escapeHtml(value: string): string {
   return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
}