import mysql from 'mysql2/promise';

async function check() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'atc'
    });

    const [rows]: any = await connection.query('SELECT name FROM migrations');
    console.log('Migrations in DB:', rows.map((r: any) => r.name));
    await connection.end();
}

check();
