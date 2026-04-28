import * as vscode from 'vscode';
import * as path from 'path';
import * as sql from 'mssql';
import { getConnection } from './connection';

export async function buscarDocBanco(fileName: string, docId: string, context: vscode.ExtensionContext) {

    const conn = await getConnection(context);
    const nomeArquivo = path.basename(fileName);

    const result = await conn.request()
        .input('NOME_ARQUIVO', sql.VarChar, nomeArquivo)
        .input('NOME_DOC', sql.VarChar, docId)
        .query(`
            SELECT DESCRICAO_DOC, 
            ISNULL(USUARIO_ALTERACAO, USUARIO_INCLUSAO) AS AUTOR,
            ISNULL(DATA_ALTERACAO, DATA_INCLUSAO) AS DATA
            FROM DBO.DOCUMENTACAO_SQL
            WHERE NOME_ARQUIVO = @NOME_ARQUIVO
            AND NOME_DOC = @NOME_DOC
            AND ATIVO = 1
        `);

    if (result.recordset.length === 0) return null;

    const row = result.recordset[0];

    return {
        descricao: row.DESCRICAO_DOC,
        autor: row.AUTOR,
        dataAtualizacao: row.DATA
    };
}

export async function salvarDocBanco(docId: string, descricao: string, fileName: string, context: vscode.ExtensionContext) {

    const conn = await getConnection(context);
    const nomeArquivo = path.basename(fileName);
    const usuario = vscode.workspace.getConfiguration('documentacaoSql').get<string>('usuario');

    await conn.request()
        .input('NOME_ARQUIVO', sql.VarChar, nomeArquivo)
        .input('NOME_DOC', sql.VarChar, docId)
        .input('DESCRICAO_DOC', sql.VarChar, descricao)
        .input('USUARIO', sql.VarChar, usuario)
        .query(`
            IF EXISTS (
                SELECT 1 FROM DBO.DOCUMENTACAO_SQL 
                WHERE NOME_ARQUIVO = @NOME_ARQUIVO 
                AND NOME_DOC = @NOME_DOC
            )
            BEGIN
                UPDATE DBO.DOCUMENTACAO_SQL
                SET DESCRICAO_DOC = @DESCRICAO_DOC,
                    USUARIO_ALTERACAO = @USUARIO,
                    DATA_ALTERACAO = GETDATE(),
                    ATIVO = 1
                WHERE NOME_ARQUIVO = @NOME_ARQUIVO 
                AND NOME_DOC = @NOME_DOC
            END
            ELSE
            BEGIN
                INSERT INTO DBO.DOCUMENTACAO_SQL (
                    NOME_ARQUIVO,
                    NOME_DOC,
                    DESCRICAO_DOC,
                    USUARIO_INCLUSAO,
                    DATA_INCLUSAO
                )
                VALUES (
                    @NOME_ARQUIVO,
                    @NOME_DOC,
                    @DESCRICAO_DOC,
                    @USUARIO,
                    GETDATE()
                )
            END
        `);
}