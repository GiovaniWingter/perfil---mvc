const mysql = require('mysql2')

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.BD_PORT,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});

pool.getConnection((err, conn) => {
    if (err) {
        switch (err.code) {
            case 'ER_ACCESS_DENIED_ERROR':
                console.error('Usuário ou senha inválidos');
                break;

            case 'ECONNREFUSED':
                console.error('Servidor MySQL não está acessível');
                break;

            default:
                console.error(err);
        }
    }
    console.log("Conectado ao SGBD!")
    conn.release();

});

module.exports = pool.promise()