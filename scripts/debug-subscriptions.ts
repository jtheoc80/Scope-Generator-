
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function checkWebhooks() {
    try {
        console.log('Checking recent webhook events for Jan 21-22...');
        const result = await db.execute(
            sql`SELECT event_id, event_type, processing_result, error_message, created_at, user_id, raw_payload FROM webhook_events WHERE created_at >= '2026-01-21' ORDER BY created_at DESC`
        );

        for (const row of result.rows) {
            console.log(`\n--- Event: ${row.event_id} (${row.event_type}) ---`);
            console.log(`Processing Result: ${row.processing_result}`);
            console.log(`Error: ${row.error_message}`);

            if (row.raw_payload) {
                try {
                    const payload = JSON.parse(row.raw_payload as string);
                    console.log('Metadata:', JSON.stringify(payload.metadata, null, 2));
                    console.log('Subscription ID:', payload.subscription);
                    console.log('Mode:', payload.mode);
                    console.log('Amount Total:', payload.amount_total);
                } catch (e) {
                    console.log('Could not parse raw_payload');
                }
            }
        }

        console.log('\nChecking user status...');
        const userRes = await db.execute(
            sql`SELECT is_pro, subscription_plan, proposal_credits FROM users WHERE id = 'user_38YPeR5ZmSRAyoKhlNnwhS8eSb7'`
        );
        console.table(userRes.rows);

    } catch (error) {
        console.error('Error checking webhooks:', error);
    } finally {
        process.exit();
    }
}

checkWebhooks();
