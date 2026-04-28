import * as sql from 'mssql';

export async function inicializarBanco(conn: sql.ConnectionPool) {

    await conn.request().query(`

    IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'DOCUMENTACAO_SQL')
    BEGIN

        CREATE TABLE DBO.DOCUMENTACAO_SQL (
            NOME_ARQUIVO VARCHAR(255) NOT NULL,
            NOME_DOC VARCHAR(255) NOT NULL,
            DESCRICAO_DOC VARCHAR(MAX) NOT NULL,

            USUARIO_INCLUSAO VARCHAR(100) NOT NULL,
            DATA_INCLUSAO DATETIME2 NOT NULL DEFAULT GETDATE(),

            USUARIO_ALTERACAO VARCHAR(100) NULL,
            DATA_ALTERACAO DATETIME2 NULL,

            ATIVO BIT NOT NULL DEFAULT 1,

            CONSTRAINT PK_DOCUMENTACAO_SQL 
            PRIMARY KEY (NOME_ARQUIVO, NOME_DOC)
        );

        CREATE NONCLUSTERED INDEX IX_DOCUMENTACAO_SQL_NOME_ARQUIVO
        ON DBO.DOCUMENTACAO_SQL (NOME_ARQUIVO);

        CREATE NONCLUSTERED INDEX IX_DOCUMENTACAO_SQL_ATIVO
        ON DBO.DOCUMENTACAO_SQL (ATIVO);

    END;

    IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'DOCUMENTACAO_SQL_HISTORICO')
    BEGIN

        CREATE TABLE DBO.DOCUMENTACAO_SQL_HISTORICO (
            ID INT IDENTITY(1,1) PRIMARY KEY,

            NOME_ARQUIVO VARCHAR(255) NOT NULL,
            NOME_DOC VARCHAR(255) NOT NULL,
            DESCRICAO_DOC VARCHAR(MAX) NOT NULL,

            USUARIO_ACAO VARCHAR(100) NOT NULL,
            DATA_ACAO DATETIME2 NOT NULL DEFAULT GETDATE(),

            TIPO_ACAO VARCHAR(10) NOT NULL
        );

        CREATE NONCLUSTERED INDEX IX_DOCUMENTACAO_SQL_HIST_ARQ_DOC
        ON DBO.DOCUMENTACAO_SQL_HISTORICO (NOME_ARQUIVO, NOME_DOC);

    END;

    IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_DOCUMENTACAO_SQL_AUDITORIA')
    BEGIN

        EXEC('
        CREATE TRIGGER TR_DOCUMENTACAO_SQL_AUDITORIA
        ON DBO.DOCUMENTACAO_SQL
        AFTER INSERT, UPDATE, DELETE
        AS
        BEGIN
            SET NOCOUNT ON;

            INSERT INTO DBO.DOCUMENTACAO_SQL_HISTORICO (
                NOME_ARQUIVO,
                NOME_DOC,
                DESCRICAO_DOC,
                USUARIO_ACAO,
                DATA_ACAO,
                TIPO_ACAO
            )
            SELECT
                I.NOME_ARQUIVO,
                I.NOME_DOC,
                I.DESCRICAO_DOC,
                ISNULL(I.USUARIO_ALTERACAO, I.USUARIO_INCLUSAO),
                GETDATE(),
                CASE 
                    WHEN D.NOME_ARQUIVO IS NULL THEN ''INSERT''
                    ELSE ''UPDATE''
                END
            FROM INSERTED I
            LEFT JOIN DELETED D 
                ON I.NOME_ARQUIVO = D.NOME_ARQUIVO
               AND I.NOME_DOC = D.NOME_DOC;

            INSERT INTO DBO.DOCUMENTACAO_SQL_HISTORICO (
                NOME_ARQUIVO,
                NOME_DOC,
                DESCRICAO_DOC,
                USUARIO_ACAO,
                DATA_ACAO,
                TIPO_ACAO
            )
            SELECT
                D.NOME_ARQUIVO,
                D.NOME_DOC,
                D.DESCRICAO_DOC,
                D.USUARIO_ALTERACAO,
                GETDATE(),
                ''DELETE''
            FROM DELETED D
            LEFT JOIN INSERTED I 
                ON I.NOME_ARQUIVO = D.NOME_ARQUIVO
               AND I.NOME_DOC = D.NOME_DOC
            WHERE I.NOME_ARQUIVO IS NULL;
        END
        ');

    END;

    `);
}