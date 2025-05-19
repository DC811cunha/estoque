const mysql = require('mysql2/promise');



//---------------------------Funcao para estabelecer a conexao com o banco de dados
async function conectarBD()
{
    //verifica se já existe uma conexão no objeto global
    if(global.conexao && global.conexao.state !== 'disconnected')
    {
        return global.conexao;
    }
    //caso a conexão não exista em global, cria uma nova
    const conexao = await mysql.createConnection({
        host: 'localhost',
        port: '3306',
        user: 'root',
        password: 'DC811roo&',
        database: 'estoque'
    });
    console.log('Conectado ao BD estoque');
    global.conexao = conexao;
    return global.conexao;
}



//---------------------------Funcao para buscar usuario
async function buscarUsuario(usuario) 
{
    const con = await conectarBD();
    const sql = "select * from usuarios where nome_usuario=? and senha_usuario=?;";
    const [usuarioEncontrado] = await con.query(sql, [usuario.login, usuario.senha]);
    console.log(usuarioEncontrado);
    if(usuarioEncontrado && usuarioEncontrado.length>0)
    {
        return usuarioEncontrado[0];
    }
    else
    {
        return {};
    }
}



//---------------------------Funcao para buscar registros dos clientes
async function buscarClientes()
{
    const con = await conectarBD();
    const [registros] = await con.query('select *from clientes order by id_cliente;');
    return registros;
}



//---------------------------Funcao para inserir cliente BD
async function inserirCliente(novoCliente) 
{
    const con = await conectarBD();
    const sql = "insert into clientes (nome_cliente, email_cliente, telefone_cliente) values (?,?,?);";
    await con.query(sql, [novoCliente.nome, novoCliente.email, novoCliente.telefone]);
}



//---------------------------Funcao para selecionar registro do cliente
async function selecionarCliente(codigo) 
{
    const con = await conectarBD();
    const sql = "select *from clientes where id_cliente=?;";
    const [registro] = await con.query(sql, [codigo]);
    return registro && registro.length>0 ? registro[0] : {};
}



//---------------------------Funcao para alterar registro do cliente
async function alterarCliente(cliente) 
{
    const con = await conectarBD();
    const sql = "update clientes set nome_cliente=?, email_cliente=?, telefone_cliente=? where id_cliente=?;";
    await con.query(sql, [cliente.nome, cliente.email, cliente.telefone, cliente.codigo]);
    return;
}



//---------------------------Funcao para apagar registro do cliente
async function apagarCliente(codigo) 
{
    const con = await conectarBD();
    const sql = "delete from clientes where id_cliente=?;";
    await con.query(sql, [codigo]);
    return;
}



//---------------------------Funcao para buscar registros dos produtos
async function buscarProdutos()
{
    const con = await conectarBD();
    const [registros] = await con.query('select *from produtos order by id_produto;');
    return registros;
}



//---------------------------Funcao para inserir produto BD
async function inserirProduto(novoProduto) 
{
    const con = await conectarBD();
    const sql = "insert into produtos (nome_produto, descricao_produto, preco_produto, estoque_produto) values (?,?,?,?);";
    await con.query(sql, [novoProduto.nome, novoProduto.descricao, novoProduto.preco, novoProduto.estoque]);
}



//---------------------------Funcao para selecionar registro do produto
async function selecionarProduto(codigo) 
{
    const con = await conectarBD();
    const sql = "select *from produtos where id_produto=?;";
    const [registro] = await con.query(sql, [codigo]);
    return registro && registro.length>0 ? registro[0] : {};
}



//---------------------------Funcao para alterar registro do produto
async function alterarProduto(produto) 
{
    const con = await conectarBD();
    const sql = "update produtos set nome_produto=?, descricao_produto=?, preco_produto=?, estoque_produto=? where id_produto=?;";
    await con.query(sql, [produto.nome, produto.descricao, produto.preco, produto.estoque, produto.codigo]);
    return;
}



//---------------------------Funcao para apagar registro do produto
async function apagarProduto(codigo) 
{
    const con = await conectarBD();
    const sql = "delete from produtos where id_produto=?;";
    await con.query(sql, [codigo]);
    return;
}



conectarBD();



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
    apagarProduto
}