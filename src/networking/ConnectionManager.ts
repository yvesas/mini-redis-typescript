import { Server, Socket, createServer } from "net";
import { RESPProcessor } from "./resp/RESPProcessor";
import { DataStore } from "../core/DataStore";

export class ConnectionManager {
  private server: Server;
  private clients: Set<Socket> = new Set();
  private processor: RESPProcessor;

  constructor(private store: DataStore, private port: number = 6379) {
    this.processor = new RESPProcessor(store);
    this.server = createServer(this.handleConnection.bind(this));
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`Mini-Redis listening on port ${this.port}`);
        resolve();
      });
    });
  }

  private handleConnection(socket: Socket): void {
    this.clients.add(socket);
    console.log(`New client connected (${this.clients.size} total)`);

    socket.on("data", (data) => {
      const input = data.toString().trim();
      this.processor.process(input, socket);
    });

    socket.on("close", () => {
      this.clients.delete(socket);
      console.log(`Client disconnected (${this.clients.size} remaining)`);
    });

    socket.on("error", (err) => {
      console.error("Client error:", err.message);
      this.clients.delete(socket);
    });
  }

  async shutdown(): Promise<void> {
    this.clients.forEach((client) => client.destroy());
    this.clients.clear();

    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          console.error("Server shutdown error:", err);
          return reject(err);
        }
        console.log("Server stopped");
        resolve();
      });
    });
  }

  get activeConnections(): number {
    return this.clients.size;
  }
}
