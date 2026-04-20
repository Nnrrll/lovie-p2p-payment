import { Client } from 'pg';

async function verifyDbConnection() {
    const client = new Client({
        user: 'lovie_user',
        host: 'localhost',
        database: 'lovie_payments',
        password: 'lovie_password',
        port: 5432,
    });

    try {
        console.log('Connecting to PostgreSQL...');
        await client.connect();
        console.log('✅ Connected successfully!');

        // Test a simple query
        const res = await client.query('SELECT NOW()');
        console.log('✅ Database time:', res.rows[0].now);

        // Test table creation and insertion
        console.log('Testing table creation...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS connection_test (
                id SERIAL PRIMARY KEY,
                message TEXT
            );
        `);

        await client.query('INSERT INTO connection_test (message) VALUES ($1)', ['Hello from Claude!']);
        const insertRes = await client.query('SELECT message FROM connection_test LIMIT 1');
        console.log('✅ Read/Write successful:', insertRes.rows[0].message);

    } catch (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

verifyDbConnection();
