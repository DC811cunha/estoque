````markdown
# Sistema de Controle de Estoque

## 1. Visão Geral

O **Sistema de Controle de Estoque** é uma aplicação web desenvolvida em **Node.js** utilizando o framework **Express** e o motor de templates **EJS**. Seu objetivo é oferecer funcionalidades de:

- **Autenticação de usuário** (login/logout).
- **Gestão de clientes**: cadastro, listagem, edição e exclusão.
- **Gestão de produtos**: cadastro, listagem, edição e exclusão.
- **Gestão de pedidos**: criação, listagem, edição e exclusão, com atualização automática de níveis de estoque.
- **Mensagens de feedback** (sucesso/erro) via _flash messages_.
- **Transações ACID** em operações críticas de estoque, garantindo consistência em operações de débito e restituição.

## 2. Arquitetura

- **Node.js v14+**  
- **Express 4.x**  
- **EJS** (renderização de views)  
- **MySQL / MariaDB** como sistema gerenciador de banco de dados  
- **mysql2** para comunicação com o banco  
- **express-session** + **connect-flash** para gerenciamento de sessão e mensagens  
- **express-validator** para validação de entradas de formulário  
- **morgan** para logging HTTP  
- **nodemon** para desenvolvimento com recarga automática  

## 3. Pré-requisitos

- **Node.js** ≥ 14.0.0  
- **npm** (gerenciador de pacotes do Node)  
- **MySQL** ≥ 5.7 ou **MariaDB** ≥ 10.2  
- Acesso de escrita/leitura ao servidor de banco de dados

## 4. Instalação

1. **Clone o repositório**  
   ```bash
   git clone https://github.com/DC811cunha/estoque.git
   cd estoque
````

2. **Instale dependências**

   ```bash
   npm install
   ```

3. **Configure variáveis de ambiente**
   Crie um arquivo `.env` na raiz do projeto:

   ```ini
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASS=SuaSenha
   DB_NAME=estoque
   SESSION_SECRET=umSegredoComplexo
   PORT=3000
   ```

## 5. Banco de Dados

1. **Criação do banco**

   ```sql
   CREATE DATABASE estoque
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;
   USE estoque;
   ```

2. **Estrutura de tabelas**
   Execute o seguinte *script* SQL:

   ```sql
   -- Tabela usuarios
   CREATE TABLE usuarios (
     id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
     nome_usuario    VARCHAR(50) NOT NULL UNIQUE,
     senha_usuario   VARCHAR(100) NOT NULL,
     createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
     updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );

   -- Tabela clientes
   CREATE TABLE clientes (
     id_cliente      INT AUTO_INCREMENT PRIMARY KEY,
     nome_cliente    VARCHAR(100) NOT NULL,
     email_cliente   VARCHAR(100),
     telefone_cliente VARCHAR(20),
     createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
     updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );

   -- Tabela produtos
   CREATE TABLE produtos (
     id_produto      INT AUTO_INCREMENT PRIMARY KEY,
     nome_produto    VARCHAR(100) NOT NULL,
     descricao_produto TEXT,
     preco_produto   DECIMAL(10,2) NOT NULL,
     estoque_produto INT NOT NULL DEFAULT 0,
     createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
     updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );

   -- Tabela pedidos
   CREATE TABLE pedidos (
     id_pedido           INT AUTO_INCREMENT PRIMARY KEY,
     quantidade_pedido   INT NOT NULL,
     data_pedido         DATETIME NOT NULL,
     valor_total_pedido  DECIMAL(10,2) NOT NULL,
     cliente_id          INT,
     produto_id          INT,
     createdAt           DATETIME DEFAULT CURRENT_TIMESTAMP,
     updatedAt           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     FOREIGN KEY (cliente_id) REFERENCES clientes(id_cliente) ON DELETE RESTRICT ON UPDATE CASCADE,
     FOREIGN KEY (produto_id) REFERENCES produtos(id_produto) ON DELETE RESTRICT ON UPDATE CASCADE
   );
   ```

## 6. Configuração da Aplicação

* Arquivo de conexão: `db.js`

  * Usa `mysql2/promise`
  * Realiza *pool* global para evitar múltiplas conexões
* Variáveis lidas via `process.env` (ex.: host, usuário, senha, nome do DB, porta HTTP, segredo da sessão)

## 7. Estrutura de Pastas

```
/
├── bin/                → Script de inicialização (www)
├── node_modules/       → Dependências instaladas
├── public/             → Arquivos estáticos (CSS, JS, imagens)
├── routes/
│   └── index.js        → Definição de todas as rotas HTTP
├── views/
│   ├── layouts/        → Layouts genéricos (header, footer, etc.)
│   ├── index.ejs       → Formulário de login
│   ├── principal.ejs   → Dashboard principal
│   ├── clientes*.ejs   → Listagem e formulários de clientes
│   ├── produtos*.ejs   → Listagem e formulários de produtos
│   └── pedidos*.ejs    → Listagem e formulários de pedidos
├── app.js              → Configuração do Express, middlewares
├── db.js               → Conexão e consultas ao MySQL
├── package.json        → Metadados e dependências
└── README.md           → Documentação (este arquivo)
```

## 8. Endpoints e Fluxos Principais

| Método       | Rota                      | Descrição                                 |
| ------------ | ------------------------- | ----------------------------------------- |
| GET          | `/`                       | Formulário de login                       |
| POST         | `/login`                  | Autenticar usuário                        |
| GET          | `/principal`              | Dashboard (total de pedidos)              |
| **Clientes** |                           |                                           |
| GET          | `/clientes`               | Listar clientes                           |
| GET          | `/novoCliente`            | Formulário de cadastro de cliente         |
| POST         | `/gravarNovoCliente`      | Inserir novo cliente                      |
| GET          | `/alterarCliente/:cod`    | Formulário de alteração                   |
| POST         | `/gravarAlteracaoCliente` | Atualizar dados do cliente                |
| GET          | `/excluirCliente/:cod`    | Excluir cliente (com tratamento de FK)    |
| **Produtos** |                           |                                           |
| GET          | `/produtos`               | Listar produtos                           |
| GET          | `/novoProduto`            | Formulário de cadastro de produto         |
| POST         | `/gravarNovoProduto`      | Inserir novo produto                      |
| GET          | `/alterarProduto/:cod`    | Formulário de alteração                   |
| POST         | `/gravarAlteracaoProduto` | Atualizar dados do produto                |
| GET          | `/excluirProduto/:cod`    | Excluir produto (com tratamento de FK)    |
| **Pedidos**  |                           |                                           |
| GET          | `/pedidos`                | Listar pedidos                            |
| GET          | `/novoPedido`             | Formulário de novo pedido                 |
| POST         | `/gravarNovoPedido`       | Inserir novo pedido (transação + estoque) |
| GET          | `/alterarPedido/:id`      | Formulário de edição                      |
| POST         | `/gravarAlteracaoPedido`  | Atualizar pedido (transação + estoque)    |
| GET          | `/excluirPedido/:id`      | Excluir pedido (restituir estoque)        |

## 9. Execução

* **Desenvolvimento**

  ```bash
  npm run dev
  ```
* **Produção**

  ```bash
  npm start
  ```

A aplicação estará disponível em `http://localhost:3000`.

## 10. Contribuição

1. Fork este repositório.
2. Abra uma branch de recurso:

   ```bash
   git checkout -b feature/nome-do-recurso
   ```
3. Comite suas alterações:

   ```bash
   git commit -m "Descrição da melhoria"
   ```
4. Faça push para sua branch e abra um Pull Request.

---