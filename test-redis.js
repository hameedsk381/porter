const redis = require('redis');
const dotenv = require('dotenv');

dotenv.config();

const url = process.env.REDIS_URL;
console.log('Attempting to connect to Redis:', url.replace(/\/\/.*@/, '//****:****@'));

const client = redis.createClient({ url });

client.on('error', (err) => console.error('❌ Redis Error:', err.message));

async function test() {
    try {
        await client.connect();
        console.log('✅ Redis Connection successful!');
        await client.set('test_key', 'it works');
        const value = await client.get('test_key');
        console.log('✅ Redis Read/Write successful! Value:', value);
        await client.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Redis Connection failed:', err.message);
        process.exit(1);
    }
}

test();
