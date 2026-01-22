import { RedisClientType } from 'redis';

declare const connectDB: () => Promise<void>;
declare const redisClient: RedisClientType | null;

export { redisClient };
export default connectDB;