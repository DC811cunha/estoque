const mysql = require('mysql2/promise')

//---------------------------Função para estabelecer conexão com o banco
async function conectarBD() {
  if (global.conexao && global.conexao.state !== 'disconnected') {
    return global.conexao
  }
  const conexao = await mysql.createConnection({
    host:     'localhost',
    port:     '3306',
    user:     'root',
    password: 'DC811roo&',
    database: 'estoque'
  })
  console.log('Conectado ao BD estoque')
  global.conexao = conexao
  return conexao
}

//---------------------------Usuário
async function buscarUsuario({ login, senha }) {
  const con = await conectarBD()
  const sql = `SELECT * FROM usuarios WHERE nome_usuario = ? AND senha_usuario = ?;`
  const [rows] = await con.execute(sql, [login, senha])
  return rows[0] || {}
}

//---------------------------Clientes
async function buscarClientes() {
  const con = await conectarBD()
  const [rows] = await con.execute(
    `SELECT * FROM clientes ORDER BY id_cliente;`
  )
  return rows
}

async function inserirCliente({ nome, email, telefone }) {
  const con = await conectarBD()
  const sql = `
    INSERT INTO clientes (nome_cliente, email_cliente, telefone_cliente)
    VALUES (?, ?, ?);
  `
  try {
    const [result] = await con.execute(sql, [nome, email, telefone])
    return result.insertId
  } catch (err) {
    console.error('ERRO inserirCliente:', err)
    throw new Error('Não foi possível cadastrar o cliente. Confira os dados e tente novamente.')
  }
}

async function selecionarCliente(id) {
  const con = await conectarBD()
  const [rows] = await con.execute(
    `SELECT * FROM clientes WHERE id_cliente = ?;`,
    [id]
  )
  return rows[0] || {}
}

async function alterarCliente({ codigo, nome, email, telefone }) {
  const con = await conectarBD()
  const sql = `
    UPDATE clientes
       SET nome_cliente     = ?,
           email_cliente    = ?,
           telefone_cliente = ?
     WHERE id_cliente      = ?;
  `
  try {
    const [result] = await con.execute(sql, [nome, email, telefone, codigo])
    if (result.affectedRows === 0) {
      throw new Error(`Nenhum cliente encontrado com ID ${codigo}`)
    }
    return result.affectedRows
  } catch (err) {
    console.error('ERRO alterarCliente:', err)
    throw new Error('Não foi possível atualizar o cliente. Confira os dados e tente novamente.')
  }
}

async function apagarCliente(id) {
  const con = await conectarBD()
  await con.execute(`DELETE FROM clientes WHERE id_cliente = ?;`, [id])
}

//---------------------------Produtos
async function buscarProdutos() {
  const con = await conectarBD()
  const [rows] = await con.execute(
    `SELECT * FROM produtos ORDER BY id_produto;`
  )
  return rows
}

async function inserirProduto({ nome, descricao, preco, estoque }) {
  const con = await conectarBD()
  const sql = `
    INSERT INTO produtos
      (nome_produto, descricao_produto, preco_produto, estoque_produto)
    VALUES (?, ?, ?, ?);
  `
  try {
    const [result] = await con.execute(sql, [nome, descricao, preco, estoque])
    return result.insertId
  } catch (err) {
    console.error('ERRO inserirProduto:', err)
    throw new Error('Não foi possível cadastrar o produto. Confira os dados e tente novamente.')
  }
}

async function selecionarProduto(id) {
  const con = await conectarBD()
  const [rows] = await con.execute(
    `SELECT * FROM produtos WHERE id_produto = ?;`,
    [id]
  )
  return rows[0] || {}
}

async function alterarProduto({ codigo, nome, descricao, preco, estoque }) {
  const con = await conectarBD()
  const sql = `
    UPDATE produtos
       SET nome_produto      = ?,
           descricao_produto = ?,
           preco_produto     = ?,
           estoque_produto   = ?
     WHERE id_produto       = ?;
  `
  try {
    const [result] = await con.execute(sql, [nome, descricao, preco, estoque, codigo])
    if (result.affectedRows === 0) {
      throw new Error(`Nenhum produto encontrado com ID ${codigo}`)
    }
    return result.affectedRows
  } catch (err) {
    console.error('ERRO alterarProduto:', err)
    throw new Error('Não foi possível atualizar o produto. Confira os dados e tente novamente.')
  }
}

async function apagarProduto(id) {
  const con = await conectarBD()
  await con.execute(`DELETE FROM produtos WHERE id_produto = ?;`, [id])
}

//---------------------------Pedidos
async function buscarPedidos() {
  const con = await conectarBD()
  const sql = `
    SELECT
      p.id_pedido,
      p.quantidade_pedido,
      p.data_pedido,
      p.valor_total_pedido,
      p.cliente_id,
      c.nome_cliente,
      p.produto_id,
      pr.nome_produto
    FROM pedidos p
    LEFT JOIN clientes c ON c.id_cliente = p.cliente_id
    LEFT JOIN produtos pr ON pr.id_produto = p.produto_id
    ORDER BY p.id_pedido;
  `
  const [rows] = await con.execute(sql)
  return rows
}

async function inserirPedido({ quantidade, data, cliente, produto }) {
  const con = await conectarBD()
  try {
    await con.beginTransaction()

    // bloqueia linha do produto
    const [prodRows] = await con.execute(
      `SELECT preco_produto, estoque_produto
         FROM produtos
        WHERE id_produto = ?
        FOR UPDATE;`,
      [produto]
    )
    if (prodRows.length === 0) {
      throw new Error('Produto não encontrado')
    }
    const { preco_produto, estoque_produto } = prodRows[0]

    const qty = parseInt(quantidade, 10)
    if (estoque_produto < qty) {
      throw new Error(`Estoque insuficiente. Disponível: ${estoque_produto}`)
    }

    const valorTotal = parseFloat(preco_produto) * qty

    const [insertResult] = await con.execute(
      `INSERT INTO pedidos
         (quantidade_pedido, data_pedido, valor_total_pedido, cliente_id, produto_id)
       VALUES (?, ?, ?, ?, ?);`,
      [qty, data, valorTotal, cliente, produto]
    )

    await con.execute(
      `UPDATE produtos
         SET estoque_produto = estoque_produto - ?
       WHERE id_produto     = ?;`,
      [qty, produto]
    )

    await con.commit()
    return insertResult.insertId
  } catch (err) {
    await con.rollback()
    console.error('ERRO inserirPedido:', err)
    throw new Error('Não foi possível cadastrar o pedido. ' + err.message)
  }
}

async function selecionarPedido(id) {
  const con = await conectarBD();
  const sql = `
    SELECT
      p.id_pedido,
      p.quantidade_pedido,
      p.data_pedido,
      p.valor_total_pedido,
      p.cliente_id,
      c.nome_cliente,
      p.produto_id,
      pr.nome_produto
    FROM pedidos AS p
    LEFT JOIN clientes AS c
      ON c.id_cliente = p.cliente_id
    LEFT JOIN produtos AS pr
      ON pr.id_produto = p.produto_id
    WHERE p.id_pedido = ?;
  `;
  const [rows] = await con.query(sql, [id]);
  return rows.length > 0 ? rows[0] : {};
}

async function alterarPedido({ id, quantidade, data, cliente, produto }) {
  const con = await conectarBD()
  try {
    await con.beginTransaction()

    // bloqueia pedido atual
    const [pedRows] = await con.execute(
      `SELECT produto_id AS prod_old, quantidade_pedido AS qty_old
         FROM pedidos
        WHERE id_pedido = ?
        FOR UPDATE;`,
      [id]
    )
    if (pedRows.length === 0) {
      throw new Error(`Pedido #${id} não encontrado`)
    }
    const { prod_old, qty_old } = pedRows[0]

    // devolve estoque antigo
    await con.execute(
      `UPDATE produtos
         SET estoque_produto = estoque_produto + ?
       WHERE id_produto     = ?;`,
      [qty_old, prod_old]
    )

    // bloqueia novo produto
    const [newProdRows] = await con.execute(
      `SELECT preco_produto, estoque_produto
         FROM produtos
        WHERE id_produto = ?
        FOR UPDATE;`,
      [produto]
    )
    if (newProdRows.length === 0) {
      throw new Error(`Produto #${produto} não encontrado`)
    }
    const { preco_produto, estoque_produto } = newProdRows[0]

    const newQty = parseInt(quantidade, 10)
    if (estoque_produto < newQty) {
      throw new Error(`Estoque insuficiente. Disponível: ${estoque_produto}`)
    }

    const valorTotal = parseFloat(preco_produto) * newQty

    const [updResult] = await con.execute(
      `UPDATE pedidos
         SET quantidade_pedido  = ?,
             data_pedido        = ?,
             valor_total_pedido = ?,
             cliente_id         = ?,
             produto_id         = ?
       WHERE id_pedido          = ?;`,
      [newQty, data, valorTotal, cliente, produto, id]
    )
    if (updResult.affectedRows === 0) {
      throw new Error(`Falha ao atualizar o pedido #${id}`)
    }

    // debita novo estoque
    await con.execute(
      `UPDATE produtos
         SET estoque_produto = estoque_produto - ?
       WHERE id_produto     = ?;`,
      [newQty, produto]
    )

    await con.commit()
    return updResult.affectedRows
  } catch (err) {
    await con.rollback()
    console.error('ERRO alterarPedido:', err)
    throw new Error('Não foi possível atualizar o pedido. ' + err.message)
  }
}

// Métodos de validação para exclusões.
// conta quantos pedidos existem para um dado cliente
async function contarPedidosPorCliente(idCliente) {
  const con = await conectarBD();
  const [rows] = await con.query(
    'SELECT COUNT(*) AS total FROM pedidos WHERE cliente_id = ?;',
    [idCliente]
  );
  return rows[0].total;
}

// conta quantos pedidos existem para um dado produto
async function contarPedidosPorProduto(idProduto) {
  const con = await conectarBD();
  const [rows] = await con.query(
    'SELECT COUNT(*) AS total FROM pedidos WHERE produto_id = ?;',
    [idProduto]
  );
  return rows[0].total;
}

conectarBD()

module.exports = {
  buscarUsuario,
  buscarClientes,
  inserirCliente,
  selecionarCliente,
  alterarCliente,
  apagarCliente,
  buscarProdutos,
  inserirProduto,
  selecionarProduto,
  alterarProduto,
  apagarProduto,
  buscarPedidos,
  inserirPedido,
  selecionarPedido,
  alterarPedido,
  contarPedidosPorCliente,
  contarPedidosPorProduto
}
