const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
// Importar o cliente PostgreSQL
const { Pool } = require('pg'); 

const app = express();
const port = 3001; 

// ------------------------------------------------------------------
// CONFIGURAÇÃO DO BANCO DE DADOS
// ------------------------------------------------------------------
const pool = new Pool({
    user: 'postgres',             // Seu USUÁRIO do PostgreSQL
    host: 'localhost',           // O endereço do servidor
    database: 'english',         // O NOME DO BANCO DE DADOS (o que você criou no pgAdmin)
    password: 'triafysql', // Sua SENHA do usuário 'geovane'
    port: 5432,                  // Porta padrão do PostgreSQL (verifique se você não está usando 5433)
});

// Teste a conexão assim que o servidor iniciar
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Erro ao adquirir cliente do pool', err.stack);
    }
    console.log('🎉 Conexão bem-sucedida com o PostgreSQL!');
    release(); // Libera o cliente
});
// ------------------------------------------------------------------


// Middlewares (configurações intermediárias)
app.use(cors()); 
app.use(bodyParser.json()); 


// Rota de Teste para buscar dados do BD
app.get('/', async (req, res) => {
    try {
        // Exemplo: Consultar a versão do PostgreSQL para provar a conexão
        const result = await pool.query('SELECT current_database()');

        res.status(200).json({ 
            message: 'Bem-vindo ao Backend da English Platform!',
            database_status: 'Conectado!',
            current_db: result.rows[0].current_database
        });
    } catch (err) {
        console.error("Erro na rota /api/hello:", err);
        res.status(500).json({ error: 'Erro ao conectar ou consultar o banco de dados.' });
    }
});


// 4. Iniciar o Servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});