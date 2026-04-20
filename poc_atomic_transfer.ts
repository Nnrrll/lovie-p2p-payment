import { Client } from 'pg';

async function verifyAtomicTransfer() {
    const client = new Client({
        user: 'lovie_user',
        host: 'localhost',
        database: 'lovie_payments',
        password: 'lovie_password',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('Connecting to PostgreSQL for Atomic Transfer PoC...');

        // 1. Setup: Create two users and their accounts
        await client.query('TRUNCATE accounts, users CASCADE');

        const u1 = await client.query('INSERT INTO users (email, phone) VALUES ($1, $2) RETURNING user_id', ['alice@lovie.com', '111']);
        const u2 = await client.query('INSERT INTO users (email, phone) VALUES ($1, $2) RETURNING user_id', ['bob@lovie.com', '222']);

        const aliceId = u1.rows[0].user_id;
        const bobId = u2.rows[0].user_id;

        await client.query('INSERT INTO accounts (user_id, balance, currency) VALUES ($1, 100.00, \'USD\')', [aliceId]);
        await client.query('INSERT INTO accounts (user_id, balance, currency) VALUES ($1, 50.00, \'USD\')', [bobId]);

        console.log('✅ Setup complete. Alice: 100, Bob: 50');

        // 2. Atomic Transfer: Bob sends 20 to Alice
        console.log('Executing atomic transfer: Bob -> Alice (20 USD)...');
        try {
            await client.query('BEGIN');

            // Bob's balance check and subtract
            const bobAcc = await client.query('SELECT balance FROM accounts WHERE user_id = $1 FOR UPDATE', [bobId]);
            const bobBalance = parseFloat(bobAcc.rows[0].balance);
            if (bobBalance < 20) throw new Error('Insufficient funds');

            await client.query('UPDATE accounts SET balance = balance - 20 WHERE user_id = $1', [bobId]);

            // Alice's balance add
            await client.query('UPDATE accounts SET balance = balance + 20 WHERE user_id = $1', [aliceId]);

            await client.query('COMMIT');
            console.log('✅ Transaction committed successfully');
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('❌ Transaction failed, rolled back:', e);
        }

        // 3. Verify Result
        const finalAlice = await client.query('SELECT balance FROM accounts WHERE user_id = $1', [aliceId]);
        const finalBob = await client.query('SELECT balance FROM accounts WHERE user_id = $1', [bobId]);

        console.log(`Final Balances -> Alice: ${finalAlice.rows[0].balance}, Bob: ${finalBob.rows[0].balance}`);

        if (finalAlice.rows[0].balance === '120.0000' && finalBob.rows[0].balance === '30.0000') {
            console.log('🚀 Atomic Transfer PoC PASSED');
        } else {
            console.error('❌ Atomic Transfer PoC FAILED');
        }

    } catch (err) {
        console.error('❌ Critical Error:', err);
    } finally {
        await client.end();
    }
}

verifyAtomicTransfer();
