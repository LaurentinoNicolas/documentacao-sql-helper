# 📘 SQL Documentation

Documente suas queries SQL **diretamente no código** e visualize tudo de forma rápida, contextual e organizada dentro do VS Code.

---

## 🚀 Visão Geral

O **SQL Documentation** permite adicionar descrições estruturadas às suas queries utilizando comentários simples como:

```sql
-- @doc:VALIDAR_CLIENTE
SELECT * FROM CLIENTE
```

Com isso, você ganha:

* 📖 Documentação integrada ao código
* ⚡ Acesso rápido via hover
* ✏️ Edição sem sair do editor
* 🗄️ Persistência centralizada no banco

---

## ✨ Funcionalidades

### 🔍 Hover inteligente

Visualize a documentação apenas passando o mouse sobre o `@doc`.

---

### ✏️ Edição inline (CodeLens)

Edite ou crie documentações diretamente no arquivo SQL com um clique.

---

### 💾 Persistência em SQL Server

As documentações são armazenadas de forma estruturada no banco de dados.

---

### ⚡ Cache otimizado

Melhor performance com cache inteligente por arquivo.

---

### 🧠 Contexto por arquivo

Permite reutilizar o mesmo identificador (`@doc`) em arquivos diferentes sem conflito.

---

### 🧾 Histórico automático

Controle de alterações com auditoria automática:

* INSERT
* UPDATE
* DELETE

---

## 🧩 Como usar

1. Adicione um identificador no seu SQL:

```sql
-- @doc:VALIDAR_LOJA
SELECT * FROM LOJA
```

2. Passe o mouse para visualizar
3. Clique em **Editar / Criar Doc**
4. Escreva a descrição e salve

---

## 👀 Exemplo de visualização

```
📘 VALIDAR_LOJA

Valida se a loja está ativa e apta para operação.

👤 Nicolas Laurentino
🕒 25/04/2026 14:32
```

---

## 🔌 Configuração

Ao iniciar a extensão, será solicitado:

* Servidor SQL
* Database
* Usuário
* Senha
* Nome do usuário (autor)

---

## 🗄️ Estrutura criada automaticamente

A extensão cria automaticamente no banco:

* `DOCUMENTACAO_SQL`
* `DOCUMENTACAO_SQL_HISTORICO`
* Índices otimizados
* Trigger de auditoria

---

## 🔐 Segurança

* Senha armazenada com segurança via `VS Code Secrets`
* Nenhuma credencial exposta em arquivos

---

## ⚙️ Configurações

```properties
documentacaoSql.db.server
documentacaoSql.db.database
documentacaoSql.db.user
documentacaoSql.usuario
```

---

## 📌 Requisitos

* SQL Server acessível
* Permissão de criação de tabelas (primeira execução)

---

## 🐛 Troubleshooting

### Não conecta

* Verifique servidor e porta (1433)
* Firewall ou VPN
* Nome da instância

---

### Sem permissão

* Usuário sem permissão de CREATE TABLE

---

## 🧭 Roadmap

* [ ] Autocomplete para `@doc`
* [ ] Visualização de histórico
* [ ] Suporte a múltiplos bancos
* [ ] Exportação de documentação
* [ ] Integração com APIs

---

## 📷 Preview

> Recomenda-se adicionar um GIF demonstrando:
>
> * Hover
> * Edição
> * Salvamento

---

## 👨‍💻 Autor

**Nicolas Laurentino**

---

## 🤝 Contribuição

Pull requests e sugestões são bem-vindos.

---

## ⭐ Se curtir o projeto

Considere deixar uma estrela e compartilhar com outros devs 🚀

---

## 📄 Licença

MIT
