import net from "net";
import { RESPProcessor } from "./resp/RESPProcessor";
import { DataStore } from "../core/DataStore";

export class RedisServer {
  private server: net.Server;
  private store: DataStore;
  private respProcessor: RESPProcessor;

  constructor(port: number = 6379) {
    this.store = new DataStore();
    this.respProcessor = new RESPProcessor(this.store);

    this.server = net.createServer((socket) => {
      this.handleConnection(socket);
    });

    this.server.listen(port, () => {
      console.log(`Mini-Redis listening on port ${port}`);
    });
  }

  private handleConnection(socket: net.Socket) {
    socket.on("data", (data) => {
      const input = data.toString().trim();
      this.respProcessor.process(input, socket);
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });
  }

  close() {
    this.server.close();
  }
}
