import { RedisServer } from "./networking/server";

const PORT = parseInt(process.env.PORT || "6379");
const server = new RedisServer(PORT);

process.on("SIGINT", () => {
  server.close();
  process.exit();
});
