import * as vscode from 'vscode';
import * as sql from 'mssql';
import { inicializarBanco } from './init';
import { parseSqlServer } from '../utils/sqlServerParser';

let pool: sql.ConnectionPool | null = null;

export async function getConnection(context: vscode.ExtensionContext) {

   if (pool && pool.connected) {
      return pool;
   }

   if (pool) {
      try {
         await pool.close();
      } catch (e) {
         console.error('Erro ao fechar pool inválido:', e);
      } finally {
         pool = null;
      }
   }

   const config = vscode.workspace.getConfiguration('documentacaoSql');

   const server = config.get<string>('db.server');
   const database = config.get<string>('db.database');
   const user = config.get<string>('db.user');
   const password = await context.secrets.get('documentacaoSql.db.password');

   if (!server || !database || !user || !password) {
      throw new Error('Banco não configurado');
   }

   const parsedServer = parseSqlServer(server);

   pool = new sql.ConnectionPool({
      user,
      password,
      server: parsedServer.server,
      database,
      options: {
         encrypt: false,
         trustServerCertificate: true,
         ...(parsedServer.port ? { port: parsedServer.port } : {}),
         ...(parsedServer.instanceName ? { instanceName: parsedServer.instanceName } : {})
      }
   });

   await pool.connect();

   const key = `dbInit:${server}:${database}`;
   const jaRodou = context.globalState.get(key);

   if (!jaRodou) {
      try {
         await inicializarBanco(pool);
         await context.globalState.update(key, true);
      } catch (e: any) {
        vscode.window.showErrorMessage(`❌ Sem permissão para criar tabela: ${e.message}`);
      }    
   }

   return pool;

}

export async function testarConexao(data: any): Promise<boolean> {

   let temp: sql.ConnectionPool | null = null;

   try {
      const parsedServer = parseSqlServer(data.server);

      temp = new sql.ConnectionPool({
         user: data.user,
         password: data.password,
         server: parsedServer.server,
         database: data.database,
         options: {
            encrypt: false,
            trustServerCertificate: true,
            ...(parsedServer.port ? { port: parsedServer.port } : {}),
            ...(parsedServer.instanceName ? { instanceName: parsedServer.instanceName } : {})
         }
      });

      await temp.connect();

      vscode.window.showInformationMessage('✅ Conectado!');
      return true;

   } catch (err: any) {

      vscode.window.showErrorMessage(`❌ ${err.message}`);
      return false;

   } finally {
      if (temp) await temp.close();
   }
}

export async function resetConnection() {
   if (pool) {
      try {
         await pool.close();
      } catch (e) {
         console.error('Erro ao fechar conexão:', e);
      } finally {
         pool = null;
      }
   }
}