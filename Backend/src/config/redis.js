import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis(process.env.REDIS_URL, {
  tls: {},
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 5) return null;
    return Math.min(times * 500, 2000);
  },
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));

export default redis;

(async () => {
  try {
    await redis.connect(); // important (kyuki lazyConnect true hai)

    await redis.set("test", "hello");
    const value = await redis.get("test");

    console.log("Redis test value:", value);
  } catch (err) {
    console.error("Test failed:", err.message);
  }
})();