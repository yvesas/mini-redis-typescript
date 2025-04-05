import { RedisServer } from "./networking/server";

const PORT = parseInt(process.env.PORT || "6379");
const server = new RedisServer(PORT);

async function main() {
  try {
    await server.start();
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await server.close();
  process.exit();
});

process.on("SIGTERM", async () => {
  await server.close();
  process.exit();
});

main();
