# 🔪 Sistema de Gestão - Facas do Marco (ERP/PDV)

![Status](https://img.shields.io/badge/Status-Concluído-success)
![Versão](https://img.shields.io/badge/Versão-1.0-blue)

Um sistema web completo no formato Single Page Application (SPA) desenvolvido do zero para gerenciar o estoque, as vendas e os clientes de uma cutelaria artesanal. O sistema foi projetado para ser rápido, seguro e responsivo (mobile-friendly).

## 🚀 Funcionalidades Principais

O sistema é dividido em 4 módulos integrados:

* **🔒 Autenticação de Segurança:** Tela de login blindada que impede o acesso de usuários não autorizados ao painel.
* **📊 Visão Geral (Dashboard):** Painel gerencial com cálculo automático de faturamento total, quantidade de vendas realizadas e contagem de itens físicos no estoque.
* **📦 Catálogo de Produtos:** CRUD completo (Criar, Ler, Atualizar, Excluir) para gestão do estoque de facas, com controle de categorias, preços e quantidades.
* **🛒 Frente de Caixa (PDV):** Interface de vendas rápida. Ao finalizar uma compra, o sistema dá baixa automática no estoque do produto e atrela a venda a um cliente específico.
* **👥 Gestão de Clientes:** Banco de dados inteligente para cadastrar compradores (Nome, WhatsApp, E-mail) e integrá-los diretamente no momento da venda no PDV.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído sem o uso de frameworks complexos, focando no domínio das linguagens base da web:

* **Frontend:** HTML5, CSS3 (com variáveis CSS para o tema escuro/dark mode) e JavaScript puro (Vanilla JS).
* **Comunicação:** API RESTful construída no backend utilizando a função `fetch` e requisições assíncronas (`async/await`) no frontend.
* **Backend:** PHP.
* **Banco de Dados:** MySQL (versão 5.7) / MariaDB.

## 🗄️ Estrutura do Banco de Dados (DER)

O sistema opera com um banco de dados relacional estruturado nas seguintes tabelas principais:

1.  `usuario`: Controla o acesso ao sistema (`id`, `nome`, `usuario`, `senha`, `perfil`).
2.  `produto`: Armazena o estoque (`id`, `nome`, `descricao`, `preco`, `quantidade`, `categoria_id`).
3.  `cliente`: Cadastros do CRM (`id`, `nome`, `telefone`, `email`).
4.  `venda`: Registro financeiro (`id`, `total_venda`, `data_hora_criacao`).
5.  `categoria`: Classificação das facas (Artesanal, Chef, etc).

## 💻 Como rodar este projeto localmente

Para executar este projeto na sua máquina para testes ou apresentações:

1.  Instale o pacote **XAMPP** (ou WAMP/MAMP).
2.  Inicie os módulos **Apache** e **MySQL** no painel de controle do XAMPP.
3.  Coloque a pasta deste projeto dentro do diretório `htdocs` (ex: `C:\xampp\htdocs\facas_marco`).
4.  Acesse o **phpMyAdmin** (`http://localhost/phpmyadmin`), crie um banco de dados e importe o arquivo `.sql` fornecido.
5.  Abra o arquivo `api.php` e configure as credenciais de conexão na linha `$conexao = new mysqli(...)`.
6.  Acesse `http://localhost/facas_marco` no seu navegador.
