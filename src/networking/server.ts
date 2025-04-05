import { DataStore } from "../core/DataStore";
import { ConnectionManager } from "./ConnectionManager";

export class RedisServer {
  private connectionManager: ConnectionManager;
  private store: DataStore;

  constructor(private port: number = 6379) {
    this.store = new DataStore();
    this.connectionManager = new ConnectionManager(this.store, this.port);
  }

  async start(): Promise<void> {
    await this.connectionManager.start();
    console.log(`Server running on port ${this.port}`);
  }

  async close(): Promise<void> {
    await this.store.shutdown();
    await this.connectionManager.shutdown();
  }
}
