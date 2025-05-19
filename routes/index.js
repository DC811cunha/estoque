var express = require('express');
var router = express.Router();



//---------------------------GETS'S



// GET home.
router.get('/', function(req, res, next) {
  res.render('index', { titulo: 'Sistema de Estoque' });
});



// GET principal.
router.get('/principal', function(req, res, next){
  if(!global.usuarioCodigo || global.usuarioCodigo <=0)
  {
    res.redirect('/');
  }
  res.render('principal', {titulo: 'Sistema de Estoque / Principal'});
});



// GET desconectar.
router.get('/sair', function(req, res, next){
  if(!global.usuarioCodigo || global.usuarioCodigo <=0)
  {
    res.redirect('/');
  }  
  global.usuarioCodigo = null;
  res.redirect('/');
});



// GET clientes.
router.get('/clientes', async function(req, res, next) {
  if(!global.usuarioCodigo || global.usuarioCodigo <=0)
  {
    res.redirect('/');
  }  
  const registros = await global.db.buscarClientes();
  res.render('clientes', {titulo: "Clientes", registros});
});



// GET clientes para formulário cadastro.
router.get('/novoCliente', function(req,res,next){
  if(!global.usuarioCodigo || global.usuarioCodigo <=0)
  {
    res.redirect('/');
  }  
  res.render('clientesForm', {titulo: "Cadastro Cliente", registro: {}, acao: "/gravarNovoCliente"});
});



// GET clientes para formulário de alteração.
router.get('/alterarCliente/:cod', async function(req,res,next){
  if(!global.usuarioCodigo || global.usuarioCodigo <=0)
  {
    res.redirect('/');
  }
  const codigo = parseInt(req.params.cod);
  const registro = await global.db.selecionarCliente(codigo);
  res.render('clientesForm', {titulo: "Alteração Cliente", registro, acao: "/gravarAlteracaoCliente"});
});



// GET clientes para excluir.
router.get('/excluirCliente/:cod', async function (req,res,next) {
  if(!global.usuarioCodigo || global.usuarioCodigo <=0)
  {
    res.redirect('/');
  }
  const codigo = parseInt(req.params.cod);
  await global.db.apagarCliente(codigo);
  res.redirect('/clientes');
});



// GET produtos.
router.get('/produtos', async function(req, res, next) {
  if(!global.usuarioCodigo || global.usuarioCodigo <=0)
  {
    res.redirect('/');
  }  
  const registros = await global.db.buscarProdutos();
  res.render('produtos', {titulo: "Produtos", registros});
});



// GET produtos para formulário cadastro.
router.get('/novoProduto', function(req,res,next){
  if(!global.usuarioCodigo || global.usuarioCodigo <=0)
  {
    res.redirect('/');
  }  
  res.render('produtosForm', {titulo: "Cadastro Produto", registro: {}, acao: "/gravarNovoProduto"});
});



// GET produtos para formulário de alteração.
router.get('/alterarProduto/:cod', async function(req,res,next){
  if(!global.usuarioCodigo || global.usuarioCodigo <=0)
  {
    res.redirect('/');
  }
  const codigo = parseInt(req.params.cod);
  const registro = await global.db.selecionarProduto(codigo);
  res.render('produtosForm', {titulo: "Alteração Produto", registro, acao: "/gravarAlteracaoProduto"});
});



// GET produtos para excluir.
router.get('/excluirProduto/:cod', async function (req,res,next) {
  if(!global.usuarioCodigo || global.usuarioCodigo <=0)
  {
    res.redirect('/');
  }
  const codigo = parseInt(req.params.cod);
  await global.db.apagarProduto(codigo);
  res.redirect('/produtos');
});



//---------------------------POST'S



// POSt login.
router.post('/login', async function(req, res, next){
  const login = req.body.edtUsuario;
  const senha = req.body.edtSenha;
  const usuario = await global.db.buscarUsuario({login, senha});
  //verificar se o usuário senha existe no BD
  if(usuario.id_usuario)
  {
    global.usuarioCodigo = usuario.id_usuario;
    global.usuarioLogin = usuario.nome_usuario;
    res.redirect('/principal');
  }
  else
  {
    res.redirect('/');
  }
});



// POST gravar novo cliente.
router.post('/gravarNovoCliente', async function(req,res,next){
  if(!global.usuarioCodigo || global.usuarioCodigo <=0)
  {
    res.redirect('/');
  }
  const nome = req.body.edtNome;
  const email = req.body.edtEmail;
  const telefone = req.body.edtTelefone;
  await global.db.inserirCliente({nome, email, telefone});
  res.redirect('/clientes');
  });



  // POST gravar alteração cliente.
router.post('/gravarAlteracaoCliente', async function(req,res,next){
  if(!global.usuarioCodigo || global.usuarioCodigo <=0)
  {
    res.redirect('/');
  }
  const codigo = parseInt(req.body.edtCodigo);
  const nome = req.body.edtNome;
  const email = req.body.edtEmail;
  const telefone = req.body.edtTelefone;
  await global.db.alterarCliente({codigo, nome, email, telefone});
  res.redirect('/clientes');
});



// POST gravar novo produto.
router.post('/gravarNovoProduto', async function(req,res,next){
  if(!global.usuarioCodigo || global.usuarioCodigo <=0)
  {
    res.redirect('/');
  }
  const nome = req.body.edtNome;
  const descricao = req.body.edtDescricao;
  const preco = req.body.edtPreco;
  const estoque = req.body.edtEstoque
  await global.db.inserirProduto({nome, descricao, preco, estoque});
  res.redirect('/produtos');
  });



// POST gravar alteração produto.
router.post('/gravarAlteracaoProduto', async function(req,res,next){
  if(!global.usuarioCodigo || global.usuarioCodigo <=0)
  {
    res.redirect('/');
  }
  const codigo = parseInt(req.body.edtCodigo);
  const nome = req.body.edtNome;
  const descricao = req.body.edtDescricao;
  const preco = req.body.edtPreco;
  const estoque = req.body.edtEstoque
  await global.db.alterarProduto({codigo, nome, descricao, preco, estoque});
  res.redirect('/produtos');
});



module.exports = router;