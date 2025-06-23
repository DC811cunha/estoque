const express = require('express')
const router = express.Router()

// middleware de autenticação simples
function autenticar(req, res, next) {
  if (!global.usuarioCodigo) {
    return res.redirect('/')
  }
  next()
}

// GET home
router.get('/', (req, res) => {
  res.render('index', { titulo: 'Sistema de Estoque' })
})

// GET principal
router.get('/principal', autenticar, async (req, res, next) => {
  try {
    const pedidos = await global.db.buscarPedidos()
    res.render('principal', {
      titulo:       'Sistema de Estoque / Principal',
      totalPedidos: pedidos.length
      // flash já está em res.locals graças ao app.js
    })
  } catch (err) {
    next(err)
  }
})

// GET sair
router.get('/sair', autenticar, (req, res) => {
  global.usuarioCodigo = null
  res.redirect('/')
})

// POST login
router.post('/login', async (req, res) => {
  const { edtUsuario, edtSenha } = req.body
  const usuario = await global.db.buscarUsuario({ login: edtUsuario, senha: edtSenha })
  if (!usuario.id_usuario) {
    req.flash('error_msg', 'Usuário ou senha inválidos')
    return res.render('index', { titulo: 'Sistema de Estoque', edtUsuario })
  }
  global.usuarioCodigo = usuario.id_usuario
  res.redirect('/principal')
})

// === Clientes ===

// Listar
router.get('/clientes', autenticar, async (req, res, next) => {
  try {
    const registros = await global.db.buscarClientes()
    res.render('clientes', {
      titulo:    'Clientes',
      registros
    })
  } catch (err) {
    next(err)
  }
})

// Formulário novo
router.get('/novoCliente', autenticar, (req, res) => {
  res.render('clientesForm', {
    titulo:   'Cadastro Cliente',
    registro: {},
    acao:     '/gravarNovoCliente',
    errors:   []
  })
})

// Formulário alterar
router.get('/alterarCliente/:cod', autenticar, async (req, res, next) => {
  try {
    const registro = await global.db.selecionarCliente(+req.params.cod)
    res.render('clientesForm', {
      titulo:   'Alteração Cliente',
      registro,
      acao:     '/gravarAlteracaoCliente',
      errors:   []
    })
  } catch (err) {
    next(err)
  }
})

// Excluir cliente (tratamento FK)
router.get('/excluirCliente/:cod', autenticar, async (req, res) => {
  const id = +req.params.cod
  try {
    await global.db.apagarCliente(id)
    req.flash('success_msg', 'Cliente excluído com sucesso!')
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      req.flash('error_msg', 'Não é possível excluir cliente: existem pedidos vinculados.')
    } else {
      req.flash('error_msg', 'Erro ao excluir cliente. Tente novamente.')
      console.error(err)
    }
  }
  res.redirect('/clientes')
})

// Gravar novo cliente
router.post('/gravarNovoCliente', autenticar, async (req, res) => {
  const { edtNome: nome, edtEmail: email, edtTelefone: telefone } = req.body
  try {
    const id = await global.db.inserirCliente({ nome, email, telefone })
    req.flash('success_msg', `Cliente cadastrado (ID ${id})`)
    res.redirect('/clientes')
  } catch (err) {
    req.flash('error_msg', err.message)
    res.render('clientesForm', {
      titulo:   'Cadastro Cliente',
      registro: { nome, email, telefone },
      acao:     '/gravarNovoCliente',
      errors:   []
    })
  }
})

// Gravar alteração cliente
router.post('/gravarAlteracaoCliente', autenticar, async (req, res) => {
  const cliente = {
    codigo:   +req.body.edtCodigo,
    nome:     req.body.edtNome,
    email:    req.body.edtEmail,
    telefone: req.body.edtTelefone
  }
  try {
    await global.db.alterarCliente(cliente)
    req.flash('success_msg', `Cliente (ID ${cliente.codigo}) atualizado`)
    res.redirect('/clientes')
  } catch (err) {
    req.flash('error_msg', err.message)
    res.render('clientesForm', {
      titulo:   'Alteração Cliente',
      registro: {
        id_cliente:     cliente.codigo,
        nome_cliente:   cliente.nome,
        email_cliente:  cliente.email,
        telefone_cliente: cliente.telefone
      },
      acao:   '/gravarAlteracaoCliente',
      errors: []
    })
  }
})

// === Produtos ===

// Listar
router.get('/produtos', autenticar, async (req, res, next) => {
  try {
    const raw = await global.db.buscarProdutos()
    const registros = raw.map(p => ({ ...p, preco_produto: parseFloat(p.preco_produto) }))
    res.render('produtos', {
      titulo:    'Produtos',
      registros
    })
  } catch (err) {
    next(err)
  }
})

// Formulário novo
router.get('/novoProduto', autenticar, (req, res) => {
  res.render('produtosForm', {
    titulo:   'Cadastro Produto',
    registro: {},
    acao:     '/gravarNovoProduto',
    errors:   []
  })
})

// Formulário alterar
router.get('/alterarProduto/:cod', autenticar, async (req, res, next) => {
  try {
    const registro = await global.db.selecionarProduto(+req.params.cod)
    registro.preco_produto   = parseFloat(registro.preco_produto)
    registro.estoque_produto = +registro.estoque_produto
    res.render('produtosForm', {
      titulo:   'Alteração Produto',
      registro,
      acao:     '/gravarAlteracaoProduto',
      errors:   []
    })
  } catch (err) {
    next(err)
  }
})

// Excluir produto (tratamento FK)
router.get('/excluirProduto/:cod', autenticar, async (req, res) => {
  const id = +req.params.cod
  try {
    await global.db.apagarProduto(id)
    req.flash('success_msg', 'Produto excluído com sucesso!')
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      req.flash('error_msg', 'Não é possível excluir produto: existem pedidos vinculados.')
    } else {
      req.flash('error_msg', 'Erro ao excluir produto. Tente novamente.')
      console.error(err)
    }
  }
  res.redirect('/produtos')
})

// Gravar novo produto
router.post('/gravarNovoProduto', autenticar, async (req, res) => {
  const produto = {
    nome:      req.body.edtNome,
    descricao: req.body.edtDescricao,
    preco:     parseFloat(req.body.edtPreco.replace(',', '.')),
    estoque:   +req.body.edtEstoque
  }
  try {
    const id = await global.db.inserirProduto(produto)
    req.flash('success_msg', `Produto cadastrado (ID ${id})`)
    res.redirect('/produtos')
  } catch (err) {
    req.flash('error_msg', err.message)
    res.render('produtosForm', {
      titulo:   'Cadastro Produto',
      registro: {
        nome_produto:      produto.nome,
        descricao_produto: produto.descricao,
        preco_produto:     req.body.edtPreco,
        estoque_produto:   req.body.edtEstoque
      },
      acao:   '/gravarNovoProduto',
      errors: []
    })
  }
})

// Gravar alteração produto
router.post('/gravarAlteracaoProduto', autenticar, async (req, res) => {
  const produto = {
    codigo:    +req.body.edtCodigo,
    nome:      req.body.edtNome,
    descricao: req.body.edtDescricao,
    preco:     parseFloat(req.body.edtPreco.replace(',', '.')),
    estoque:   +req.body.edtEstoque
  }
  try {
    await global.db.alterarProduto(produto)
    req.flash('success_msg', `Produto (ID ${produto.codigo}) atualizado`)
    res.redirect('/produtos')
  } catch (err) {
    req.flash('error_msg', err.message)
    res.render('produtosForm', {
      titulo:   'Alteração Produto',
      registro: {
        id_produto:       produto.codigo,
        nome_produto:     produto.nome,
        descricao_produto:produto.descricao,
        preco_produto:    req.body.edtPreco,
        estoque_produto:  req.body.edtEstoque
      },
      acao:   '/gravarAlteracaoProduto',
      errors: []
    })
  }
})

// === Pedidos ===

// Listar
router.get('/pedidos', autenticar, async (req, res, next) => {
  try {
    let registros = await global.db.buscarPedidos()
    registros = registros.map(p => ({ ...p, valor_total_pedido: parseFloat(p.valor_total_pedido) }))
    res.render('pedidos', {
      titulo:    'Pedidos',
      registros
    })
  } catch (err) {
    next(err)
  }
})

// Formulário novo
router.get('/novoPedido', autenticar, async (req, res, next) => {
  try {
    const clientes = await global.db.buscarClientes()
    const produtos = await global.db.buscarProdutos()
    res.render('pedidosForm', {
      titulo:   'Cadastro Pedido',
      acao:     '/gravarNovoPedido',
      registro: {},
      clientes,
      produtos,
      errors:   []
    })
  } catch (err) {
    next(err)
  }
})

// Gravar novo pedido
router.post('/gravarNovoPedido', autenticar, async (req, res) => {
  try {
    const [cli] = req.body.edtCliente.split(' - ')
    const [prd] = req.body.edtProduto.split(' - ')
    await global.db.inserirPedido({
      quantidade: +req.body.edtQuantidade,
      data:       req.body.edtData,
      cliente:    +cli,
      produto:    +prd
    })
    req.flash('success_msg', 'Pedido cadastrado com sucesso!')
    res.redirect('/pedidos')
  } catch (err) {
    req.flash('error_msg', err.message)
    const clientes = await global.db.buscarClientes()
    const produtos = await global.db.buscarProdutos()
    res.render('pedidosForm', {
      titulo:   'Cadastro Pedido',
      acao:     '/gravarNovoPedido',
      registro: {
        quantidade_pedido: req.body.edtQuantidade,
        data_pedido:       req.body.edtData,
        cliente_id:        req.body.edtCliente,
        produto_id:        req.body.edtProduto
      },
      clientes,
      produtos,
      errors:   []
    })
  }
})

// Formulário alterar
router.get('/alterarPedido/:id', autenticar, async (req, res, next) => {
  try {
    const id     = +req.params.id
    const pedido = await global.db.selecionarPedido(id)
    if (!pedido.id_pedido) {
      req.flash('error_msg', `Pedido #${id} não encontrado`)
      return res.redirect('/pedidos')
    }
    const clientes = await global.db.buscarClientes()
    const produtos = await global.db.buscarProdutos()
    res.render('pedidosForm', {
      titulo:   'Alteração de Pedido',
      acao:     '/gravarAlteracaoPedido',
      registro: {
        id_pedido:         pedido.id_pedido,
        quantidade_pedido: pedido.quantidade_pedido,
        data_pedido:       pedido.data_pedido,
        cliente_id:        `${pedido.cliente_id} - ${pedido.nome_cliente}`,
        produto_id:        `${pedido.produto_id} - ${pedido.nome_produto}`
      },
      clientes,
      produtos,
      errors:   []
    })
  } catch (err) {
    next(err)
  }
})

// Gravar alteração pedido
router.post('/gravarAlteracaoPedido', autenticar, async (req, res) => {
  const [cli] = req.body.edtCliente.split(' - ')
  const [prd] = req.body.edtProduto.split(' - ')
  const pedido = {
    id:         +req.body.edtCodigo,
    quantidade: +req.body.edtQuantidade,
    data:       req.body.edtData,
    cliente:    +cli,
    produto:    +prd
  }
  try {
    await global.db.alterarPedido(pedido)
    req.flash('success_msg', `Pedido #${pedido.id} atualizado com sucesso!`)
    res.redirect('/pedidos')
  } catch (err) {
    req.flash('error_msg', err.message)
    const clientes = await global.db.buscarClientes()
    const produtos = await global.db.buscarProdutos()
    res.render('pedidosForm', {
      titulo:   'Alteração de Pedido',
      acao:     '/gravarAlteracaoPedido',
      registro: {
        id_pedido:         pedido.id,
        quantidade_pedido: pedido.quantidade,
        data_pedido:       pedido.data,
        cliente_id:        req.body.edtCliente,
        produto_id:        req.body.edtProduto
      },
      clientes,
      produtos,
      errors:   []
    })
  }
})

module.exports = router
