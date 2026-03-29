<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$servidor = "localhost";
$usuario = "root";
$senha = ""; 
$banco = "sistema_cutelaria"; 

$conexao = new mysqli($servidor, $usuario, $senha, $banco);

if ($conexao->connect_error) {
    die(json_encode(["erro" => "Falha ao conectar no banco"]));
}

// --- RECEBENDO DADOS (PODE SER NOVO PRODUTO, VENDA, CLIENTE OU LOGIN) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $dados = json_decode(file_get_contents('php://input'), true);
    
    // ==========================================
    // 0. VERIFICA SE O COMANDO É PARA FAZER LOGIN
    // ==========================================
    if (isset($dados['acao']) && $dados['acao'] === 'login') {
        $usuario_login = $conexao->real_escape_string($dados['usuario']);
        $senha_login = $conexao->real_escape_string($dados['senha']); 

        // Confere se existe alguém com esse usuario e senha exatos na tabela 'usuario'
        $sql_login = "SELECT id, nome FROM usuario WHERE usuario = '$usuario_login' AND senha = '$senha_login'";
        $res_login = $conexao->query($sql_login);

        if ($res_login && $res_login->num_rows > 0) {
            $user = $res_login->fetch_assoc();
            // Senha certa! Libera a entrada mandando o nome do dono.
            echo json_encode(["sucesso" => true, "nome" => $user['nome']]);
        } else {
            // Senha errada! Bloqueia e avisa o erro.
            echo json_encode(["erro" => "Usuário ou senha incorretos!"]);
        }
        exit;
    }

    // 1. VERIFICA SE O COMANDO É PARA FINALIZAR UMA VENDA
    if (isset($dados['acao']) && $dados['acao'] === 'nova_venda') {
        // ... (o resto do seu código de vendas continua normal aqui para baixo) ...
        
        $total_venda = (float)$dados['total'];
        $usuario_id = 1; // O seu usuário admin

        // Inicia a Transação (Modo de Segurança)
        $conexao->begin_transaction();

        try {
            // A. Cria o registro na tabela 'venda' (assumindo que o cliente pagou o valor exato, sem desconto)
            $sql_venda = "INSERT INTO venda (total_venda, valor_pago, troco, desconto, usuario_id) 
                          VALUES ($total_venda, $total_venda, 0, 0, $usuario_id)";
            
            if (!$conexao->query($sql_venda)) {
                throw new Exception("Erro ao criar venda: " . $conexao->error);
            }

            // Pega o ID da venda que acabou de ser gerada
            $venda_id = $conexao->insert_id;

            // B. Registra cada item do carrinho e dá baixa no estoque
            foreach ($dados['itens'] as $item) {
                $produto_id = (int)$item['id'];
                $quantidade = (int)$item['quantidade'];
                $total_item = (float)$item['subtotal'];

                // Grava na tabela 'venda_item'
                $sql_item = "INSERT INTO venda_item (venda_id, produto_id, quantidade, total, desconto) 
                             VALUES ($venda_id, $produto_id, $quantidade, $total_item, 0)";
                if (!$conexao->query($sql_item)) throw new Exception("Erro no item: " . $conexao->error);

                // C. DÁ BAIXA NO ESTOQUE DA TABELA 'produto'
                $sql_estoque = "UPDATE produto SET quantidade = quantidade - $quantidade WHERE id = $produto_id";
                if (!$conexao->query($sql_estoque)) throw new Exception("Erro no estoque: " . $conexao->error);
            }

            // Se chegou até aqui sem erros, SALVA TUDO de uma vez!
            $conexao->commit();
            echo json_encode(["sucesso" => true]);

        } catch (Exception $e) {
            // Se deu qualquer problema, DESFAZ TUDO!
            $conexao->rollback();
            echo json_encode(["erro" => $e->getMessage()]);
        }
        exit;
    }
// ... [código da nova_venda termina aqui com exit;] ...

    // 1.5 VERIFICA SE O COMANDO É PARA SALVAR UM CLIENTE
    if (isset($dados['acao']) && $dados['acao'] === 'novo_cliente') {
        $nome_cli = $conexao->real_escape_string($dados['nome']);
        $telefone_cli = $conexao->real_escape_string($dados['telefone']);
        // Vamos salvar o e-mail na coluna endereco do banco de dados
        $email_cli = $conexao->real_escape_string($dados['email']); 

        $sql_cli = "INSERT INTO cliente (nome, telefone, endereco) VALUES ('$nome_cli', '$telefone_cli', '$email_cli')";

        if ($conexao->query($sql_cli) === TRUE) {
            echo json_encode(["sucesso" => true, "id" => $conexao->insert_id]);
        } else {
            echo json_encode(["erro" => "Erro ao salvar cliente: " . $conexao->error]);
        }
        exit;
    }
    // 2. SE NÃO FOR VENDA, ENTÃO É CADASTRO DE UM NOVO PRODUTO
    $nome = $conexao->real_escape_string($dados['nome']);
    $categoria_id = (int)$dados['categoria_id'];
    $preco = (float)$dados['preco'];
    $quantidade = (int)$dados['quantidade'];
    $descricao = $conexao->real_escape_string($dados['descricao']);
    $usuario_id = 1; 

    $sql = "INSERT INTO produto (nome, descricao, preco, quantidade, categoria_id, usuario_id) 
            VALUES ('$nome', '$descricao', $preco, $quantidade, $categoria_id, $usuario_id)";

    if ($conexao->query($sql) === TRUE) {
        echo json_encode(["sucesso" => true]);
    } else {
        echo json_encode(["erro" => "Erro ao salvar: " . $conexao->error]);
    }
    exit;
}

// --- DELETAR PRODUTO (DELETE) ---
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $dados = json_decode(file_get_contents('php://input'), true);
    $id = (int)$dados['id'];

    $sql = "DELETE FROM produto WHERE id = $id";

    if ($conexao->query($sql) === TRUE) {
        echo json_encode(["sucesso" => true]);
    } else {
        echo json_encode(["erro" => "Erro ao excluir: " . $conexao->error]);
    }
    exit;
}

// --- LER DADOS (GET) ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    // 1. SE O JAVASCRIPT PEDIR O "DASHBOARD"
    if (isset($_GET['acao']) && $_GET['acao'] === 'dashboard') {
        $dados_dash = ["faturamento" => 0, "qtd_vendas" => 0, "ultimas_vendas" => []];

        // Manda o banco somar todo o dinheiro e contar os recibos
        $sql_totais = "SELECT SUM(total_venda) as faturamento, COUNT(id) as qtd_vendas FROM venda";
        $res_totais = $conexao->query($sql_totais);
        if ($res_totais && $linha = $res_totais->fetch_assoc()) {
            $dados_dash['faturamento'] = $linha['faturamento'] ? (float)$linha['faturamento'] : 0;
            $dados_dash['qtd_vendas'] = $linha['qtd_vendas'] ? (int)$linha['qtd_vendas'] : 0;
        }

        // Pega apenas as 5 últimas vendas para a tabela
        $sql_ultimas = "SELECT id, total_venda, data_hora_criacao FROM venda ORDER BY id DESC LIMIT 5";
        $res_ultimas = $conexao->query($sql_ultimas);
        if ($res_ultimas && $res_ultimas->num_rows > 0) {
            while($linha = $res_ultimas->fetch_assoc()) {
                $dados_dash['ultimas_vendas'][] = $linha;
            }
        }

        echo json_encode($dados_dash);
        exit;
    }
// ... [código do dashboard termina aqui com exit;] ...

    // 1.5 SE O JAVASCRIPT PEDIR A LISTA DE CLIENTES
    if (isset($_GET['acao']) && $_GET['acao'] === 'listar_clientes') {
        $sql_clientes = "SELECT id, nome, telefone, endereco as email FROM cliente ORDER BY nome ASC";
        $res_clientes = $conexao->query($sql_clientes);
        $clientes = array();
        
        if ($res_clientes && $res_clientes->num_rows > 0) {
            while($linha = $res_clientes->fetch_assoc()) {
                $clientes[] = $linha;
            }
        }
        echo json_encode($clientes);
        exit;
    }
    // 2. SE NÃO PEDIU O DASHBOARD, MANDA A LISTA DE PRODUTOS NORMAL (CATÁLOGO)
    $sql = "SELECT p.id, p.nome, p.descricao, p.preco, p.quantidade, c.nome AS categoria_nome 
            FROM produto p 
            INNER JOIN categoria c ON p.categoria_id = c.id 
            ORDER BY p.id DESC";
            
    $resultado = $conexao->query($sql);
    $produtos = array();

    if ($resultado && $resultado->num_rows > 0) {
        while($linha = $resultado->fetch_assoc()) {
            $produtos[] = $linha;
        }
    }
    echo json_encode($produtos);
}

$conexao->close();
?>