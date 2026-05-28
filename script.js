const tbody = document.querySelector('.tabela-container tbody');

// Função para buscar e desenhar os produtos na tela
async function carregarProdutos() {
    try {
        const resposta = await fetch('api.php');
        
        if (!resposta.ok) throw new Error('Erro ao buscar dados do servidor');

        const produtos = await resposta.json();
        tbody.innerHTML = ''; 

        // --- Variáveis da Nova Matemática ---
        let contagemModelos = produtos.length; 
        let somaItensFisicos = 0;
        let somaCapitalTotal = 0;

        produtos.forEach(prod => {
            // Converte os dados do banco para números que podemos somar
            const qtd = parseInt(prod.quantidade);
            const preco = parseFloat(prod.preco);

            // Multiplica o preço de cada faca pela quantidade em estoque
            somaItensFisicos += qtd;
            somaCapitalTotal += (preco * qtd);

            // Formata o preço para o padrão brasileiro na tabela
            const precoFormatado = preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const linhaHTML = `
                <tr>
                    <td style="color: var(--texto-mutado);">#${prod.id}</td>
                    <td style="font-weight: bold;">${prod.nome}</td>
                    <td><span style="background: #333; padding: 3px 8px; border-radius: 12px; font-size: 12px;">${prod.categoria_nome}</span></td>
                    <td style="font-size: 13px; color: var(--texto-mutado);">${prod.descricao}</td>
                    <td style="color: var(--entrada-texto); font-weight: bold;">${precoFormatado}</td>
                    <td>${prod.quantidade} un.</td>
                    <td><button class="btn-excluir" onclick="deletarProduto(${prod.id})">Excluir</button></td>
                </tr>
            `;

            tbody.innerHTML += linhaHTML;
        });

       
        document.getElementById('totalModelos').innerText = contagemModelos;
        document.getElementById('totalItens').innerText = somaItensFisicos;
        document.getElementById('valorEstoque').innerText = somaCapitalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    } catch (erro) {
        console.error("Erro:", erro);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Erro ao conectar com o banco de dados.</td></tr>`;
    }
}


document.addEventListener('DOMContentLoaded', carregarProdutos);



const modal = document.getElementById('modalProduto');

const btnNovoProduto = document.getElementById('btnNovoProduto'); 
const botoesFechar = document.querySelectorAll('.fechar-modal');
const formulario = document.getElementById('formProduto');


btnNovoProduto.addEventListener('click', () => {
    modal.style.display = 'flex';
});

// Fechar o modal
botoesFechar.forEach(botao => {
    botao.addEventListener('click', () => {
        modal.style.display = 'none';
        formulario.reset();
    });
});

// Enviar os dados para o banco
formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault(); 

    // Empacota os dados do novo formulário
    const dadosFormulario = {
        nome: document.getElementById('inputNome').value,
        categoria_id: document.getElementById('inputCategoria').value,
        preco: document.getElementById('inputPreco').value,
        quantidade: document.getElementById('inputQuantidade').value,
        descricao: document.getElementById('inputDescricao').value
    };

    try {
        const resposta = await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosFormulario)
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            modal.style.display = 'none';
            formulario.reset();
            carregarProdutos(); 
        } else {
            alert("Erro: " + resultado.erro);
        }

    } catch (erro) {
        console.error("Falha ao salvar:", erro);
        alert("Erro ao conectar com o servidor.");
    }
});

// --- LÓGICA DE EXCLUSÃO ---
async function deletarProduto(id) {
    const confirmar = confirm("Tem certeza que deseja excluir este produto do catálogo?");
    if (!confirmar) return;

    try {
        const resposta = await fetch('api.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id }) 
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            carregarProdutos(); // Recarrega a tabela e atualiza os valores!
        } else {
            alert("Erro: " + resultado.erro);
        }

    } catch (erro) {
        console.error("Falha ao excluir:", erro);
        alert("Erro ao conectar com o servidor.");
    }
}

// --- LÓGICA DE PESQUISA ---
const inputPesquisa = document.getElementById('inputPesquisa');

inputPesquisa.addEventListener('keyup', function() {
    const termoBuscado = inputPesquisa.value.toLowerCase();
    const linhas = tbody.getElementsByTagName('tr');

    for (let i = 0; i < linhas.length; i++) {
        
        const produto = linhas[i].getElementsByTagName('td')[1].innerText.toLowerCase();
        const categoria = linhas[i].getElementsByTagName('td')[2].innerText.toLowerCase();
        const descricao = linhas[i].getElementsByTagName('td')[3].innerText.toLowerCase();

       
        if (produto.includes(termoBuscado) || categoria.includes(termoBuscado) || descricao.includes(termoBuscado)) {
            linhas[i].style.display = ''; 
        } else {
            linhas[i].style.display = 'none'; 
        }
    }
});

// --- LÓGICA DE NAVEGAÇÃO DO MENU LATERAL ---
const itensMenu = document.querySelectorAll('.item-menu');
const telas = document.querySelectorAll('.tela-sistema');

itensMenu.forEach(item => {
    item.addEventListener('click', (evento) => {
        evento.preventDefault(); 

        
        itensMenu.forEach(i => i.classList.remove('ativo'));
        
        
        item.classList.add('ativo');

        
        telas.forEach(tela => tela.style.display = 'none');

        
        const alvo = item.getAttribute('data-alvo');
        document.getElementById(alvo).style.display = 'block';

        
        if (window.innerWidth <= 768) {
            document.querySelector('.sidebar').classList.remove('ativa');
        }
    });
});

// ==========================================
// --- LÓGICA DO FRENTE DE CAIXA (PDV) ---
// ==========================================

let carrinhoDeVendas = []; 
let listaDeProdutosPDV = []; 
// 1. Função para carregar os produtos no campo de Seleção
async function carregarProdutosPDV() {
    try {
        const resposta = await fetch('api.php');
        listaDeProdutosPDV = await resposta.json();
        
        const selectProduto = document.getElementById('pdvProduto');
        selectProduto.innerHTML = '<option value="">-- Escolha um produto --</option>'; 
        
        listaDeProdutosPDV.forEach(prod => {
            
            if(prod.quantidade > 0) {
                selectProduto.innerHTML += `<option value="${prod.id}">[Estoque: ${prod.quantidade}] ${prod.nome} - R$ ${prod.preco}</option>`;
            }
        });
    } catch (erro) {
        console.error("Erro ao carregar PDV:", erro);
    }
}

// Manda carregar a lista do PDV assim que a página abre
document.addEventListener('DOMContentLoaded', carregarProdutosPDV);

// 2. Botão de Adicionar ao Carrinho
document.getElementById('btnAdicionarCarrinho').addEventListener('click', () => {
    const select = document.getElementById('pdvProduto');
    const idProduto = select.value;
    const qtd = parseInt(document.getElementById('pdvQuantidade').value);

    if (!idProduto) {
        alert("Selecione um produto primeiro!");
        return;
    }

    // Acha todas as informações do produto que foi selecionado
    const produtoSelecionado = listaDeProdutosPDV.find(p => p.id == idProduto);

    // Trava de segurança: Não deixa vender mais do que tem no estoque
    if (qtd > produtoSelecionado.quantidade) {
        alert(`Estoque insuficiente! Temos apenas ${produtoSelecionado.quantidade} unidades de ${produtoSelecionado.nome}.`);
        return;
    }

    // Verifica se a faca já está no carrinho. Se tiver, só aumenta a quantidade.
    const itemExistente = carrinhoDeVendas.find(item => item.id == idProduto);
    if (itemExistente) {
        itemExistente.quantidade += qtd;
        itemExistente.subtotal = itemExistente.quantidade * itemExistente.preco;
    } else {
        // Se não estiver, adiciona uma linha nova no carrinho
        carrinhoDeVendas.push({
            id: produtoSelecionado.id,
            nome: produtoSelecionado.nome,
            preco: parseFloat(produtoSelecionado.preco),
            quantidade: qtd,
            subtotal: parseFloat(produtoSelecionado.preco) * qtd
        });
    }

    atualizarTelaCarrinho();
});

// 3. Desenha a tabela do carrinho e calcula o Total
function atualizarTelaCarrinho() {
    const tbody = document.getElementById('corpoTabelaCarrinho');
    const spanTotal = document.getElementById('pdvTotal');
    
    tbody.innerHTML = ''; // Limpa a tabela
    let valorTotalVenda = 0;

    if (carrinhoDeVendas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--texto-mutado); padding: 30px;">O carrinho está vazio. Adicione produtos acima.</td></tr>`;
        spanTotal.innerText = 'R$ 0,00';
        return;
    }

    // Desenha cada item que está no carrinho
    carrinhoDeVendas.forEach((item, index) => {
        valorTotalVenda += item.subtotal;
        
        const precoFormat = item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const subFormat = item.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        tbody.innerHTML += `
            <tr>
                <td style="font-weight: bold;">${item.nome}</td>
                <td>${item.quantidade}</td>
                <td style="color: var(--texto-mutado);">${precoFormat}</td>
                <td style="color: var(--entrada-texto); font-weight: bold;">${subFormat}</td>
                <td><button class="btn-excluir" onclick="removerDoCarrinho(${index})">X</button></td>
            </tr>
        `;
    });

    
    spanTotal.innerText = valorTotalVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 4. Botão vermelho (X) para tirar algo do carrinho se o cliente desistir
function removerDoCarrinho(index) {
    carrinhoDeVendas.splice(index, 1); // Tira o item da lista
    atualizarTelaCarrinho(); // Redesenha a tela
}

// 5. Botão Verde de Finalizar Venda
document.getElementById('btnFinalizarVenda').addEventListener('click', async () => {
    // Se o carrinho estiver vazio, bloqueia a venda
    if (carrinhoDeVendas.length === 0) {
        alert("O carrinho está vazio! Adicione produtos para vender.");
        return;
    }

    const nomeCliente = document.getElementById('pdvCliente').value || "Cliente Padrão";
    
    
    const totalVenda = carrinhoDeVendas.reduce((soma, item) => soma + item.subtotal, 0);

    
    const dadosVenda = {
        acao: "nova_venda", 
        cliente: nomeCliente,
        total: totalVenda,
        itens: carrinhoDeVendas
    };

    try {
        const resposta = await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosVenda)
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            alert("💸 Venda finalizada com sucesso! Estoque atualizado.");
            
            
            carrinhoDeVendas = [];
            document.getElementById('pdvCliente').value = '';
            atualizarTelaCarrinho();
            
            
            carregarProdutosPDV(); 
            carregarProdutos(); 
            carregarDashboard();
        } else {
            alert("Erro ao finalizar venda: " + resultado.erro);
        }

    } catch (erro) {
        console.error("Falha ao salvar:", erro);
        alert("Erro ao conectar com o servidor.");
    }
});

// ==========================================
// --- LÓGICA DO DASHBOARD (VISÃO GERAL) ---
// ==========================================

async function carregarDashboard() {
    try {
        
        const resposta = await fetch('api.php?acao=dashboard');
        const dados = await resposta.json();

        
        document.getElementById('dashFaturamento').innerText = dados.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('dashQtdVendas').innerText = dados.qtd_vendas;

        // Atualiza a tabela das últimas vendas
        const tbody = document.getElementById('corpoTabelaDashboard');
        tbody.innerHTML = '';

        if (dados.ultimas_vendas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--texto-mutado);">Nenhuma venda registrada ainda.</td></tr>`;
            return;
        }

        dados.ultimas_vendas.forEach(venda => {
            const valorFormatado = parseFloat(venda.total_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            
            
            const dataFormatada = new Date(venda.data_hora_criacao).toLocaleString('pt-BR');

            tbody.innerHTML += `
                <tr>
                    <td style="color: var(--texto-mutado);">#${venda.id}</td>
                    <td>${dataFormatada}</td>
                    <td style="color: var(--entrada-texto); font-weight: bold;">${valorFormatado}</td>
                </tr>
            `;
        });

    } catch (erro) {
        console.error("Erro ao carregar Dashboard:", erro);
    }
}

// Manda carregar o Dashboard assim que o sistema abre
document.addEventListener('DOMContentLoaded', carregarDashboard);

// ==========================================
// --- CONTROLE DO MENU MOBILE ---
// ==========================================
const botoesMenu = document.querySelectorAll('.btn-menu');
const sidebar = document.querySelector('.sidebar');

// 1. Faz o botão ☰ abrir/fechar o menu corretamente
botoesMenu.forEach(botao => {
    botao.addEventListener('click', () => {
        sidebar.classList.toggle('ativa');
    });
});


document.addEventListener('click', (evento) => {
    
    if (!sidebar.contains(evento.target) && !evento.target.classList.contains('btn-menu')) {
        
        sidebar.classList.remove('ativa');
    }
});
// ==========================================
// --- LÓGICA DA GESTÃO DE CLIENTES ---
// ==========================================

// 1. Função para carregar e desenhar a tabela de clientes
async function carregarClientes() {
    try {
        const resposta = await fetch('api.php?acao=listar_clientes');
        const clientes = await resposta.json();
        
        const tbody = document.getElementById('corpoTabelaClientes');
        tbody.innerHTML = ''; // Limpa a tabela

        if (clientes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--texto-mutado);">Nenhum cliente cadastrado ainda.</td></tr>`;
            return;
        }

        clientes.forEach(cli => {
            tbody.innerHTML += `
                <tr>
                    <td style="color: var(--texto-mutado);">#${cli.id}</td>
                    <td style="font-weight: bold;">${cli.nome}</td>
                    <td>${cli.telefone || '-'}</td>
                    <td>${cli.email || '-'}</td>
                    <td>
                        <button class="btn-excluir" onclick="excluirCliente(${cli.id})">Excluir</button>
                    </td>
                </tr>
            `;
        });
    } catch (erro) {
        console.error("Erro ao carregar clientes:", erro);
    }
}

// 2. Botão de Salvar Cliente
document.getElementById('btnSalvarCliente').addEventListener('click', async () => {
    const nome = document.getElementById('inputNomeCliente').value;
    const telefone = document.getElementById('inputTelefoneCliente').value;
    const email = document.getElementById('inputEmailCliente').value;

    if (!nome) {
        alert("O nome do cliente é obrigatório!");
        return;
    }

    const dadosCliente = {
        acao: 'novo_cliente',
        nome: nome,
        telefone: telefone,
        email: email
    };

    try {
        const resposta = await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosCliente)
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            alert("✅ Cliente salvo com sucesso!");
            
            // Limpa os campos
            document.getElementById('inputNomeCliente').value = '';
            document.getElementById('inputTelefoneCliente').value = '';
            document.getElementById('inputEmailCliente').value = '';
            
            // Recarrega a tabela na hora
            carregarClientes();
            carregarClientesNoPDV();
        } else {
            alert(resultado.erro);
        }
    } catch (erro) {
        console.error("Erro ao salvar:", erro);
    }
});

// Manda carregar a lista de clientes quando a página abrir
document.addEventListener('DOMContentLoaded', carregarClientes);


async function carregarClientesNoPDV() {
    try {
        const resposta = await fetch('api.php?acao=listar_clientes');
        const clientes = await resposta.json();
        
        const selectCliente = document.getElementById('pdvCliente');
        
        
        selectCliente.innerHTML = '<option value="null">Cliente Padrão (Sem cadastro)</option>';

        
        clientes.forEach(cli => {
            selectCliente.innerHTML += `<option value="${cli.id}">${cli.nome}</option>`;
        });
    } catch (erro) {
        console.error("Erro ao carregar clientes no PDV:", erro);
    }
}

// Manda carregar a lista no PDV assim que a página abrir
document.addEventListener('DOMContentLoaded', carregarClientesNoPDV);

// ==========================================
// --- LÓGICA DO LOGIN ---
// ==========================================
document.getElementById('btnEntrarLogin').addEventListener('click', async () => {
    const usuario_digitado = document.getElementById('inputUsuario').value;
    const senha_digitada = document.getElementById('inputSenha').value;
    const msgErro = document.getElementById('msgErroLogin');
    const btnEntrar = document.getElementById('btnEntrarLogin');

    // Se deixar em branco, dá bronca
    if (!usuario_digitado || !senha_digitada) {
        msgErro.innerText = "Preencha seu usuário e senha!";
        msgErro.style.display = "block";
        return;
    }

    btnEntrar.innerText = "Verificando..."; 

    try {
        const resposta = await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                acao: 'login',
                usuario: usuario_digitado,
                senha: senha_digitada
            })
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            
            document.getElementById('telaLogin').style.display = 'none';
            msgErro.style.display = "none";
        } else {
            
            msgErro.innerText = resultado.erro;
            msgErro.style.display = "block";
            btnEntrar.innerText = "Entrar no Sistema";
        }
    } catch (erro) {
        console.error("Erro no login:", erro);
        msgErro.innerText = "Erro ao conectar com o servidor.";
        msgErro.style.display = "block";
        btnEntrar.innerText = "Entrar no Sistema";
    }
});

// ==========================================
// --- FUNÇÃO PARA EXCLUIR CLIENTE ---
// ==========================================
async function excluirCliente(id_cliente) {
    // Uma travinha de segurança para não apagar sem querer
    if (!confirm("Tem certeza que deseja excluir este cliente? Essa ação não pode ser desfeita.")) {
        return; 
    }

    try {
        const resposta = await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                acao: 'excluir_cliente',
                id: id_cliente
            })
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            carregarClientes();
            carregarClientesNoPDV();
        } else {
            alert(resultado.erro || "Erro ao excluir cliente.");
        }
    } catch (erro) {
        console.error("Erro ao excluir cliente:", erro);
        alert("Erro de conexão com o servidor.");
    }
}