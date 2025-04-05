import { ConnectionManager } from "../../../src/networking/ConnectionManager";
import { DataStore } from "../../../src/core/DataStore";
import { Socket } from "net";

describe("ConnectionManager", () => {
  let manager: ConnectionManager;
  let mockStore: DataStore;

  beforeEach(async () => {
    mockStore = new DataStore();
    manager = new ConnectionManager(mockStore, 6380);
    await manager.start();
  });

  afterEach(async () => {
    await manager.shutdown();
  });

  it("should accept connections", async () => {
    const client = new Socket();

    await new Promise<void>((resolve) => {
      client.connect(6380, () => {
        expect(manager.activeConnections).toBe(1);
        client.end();
        resolve();
      });
    });
  });

  it("should process commands", async () => {
    const client = new Socket();

    const response = await new Promise<string>((resolve) => {
      client.connect(6380, () => {
        client.write("SET foo bar\r\n");

        client.on("data", (data) => {
          resolve(data.toString());
          client.end();
        });
      });
    });

    expect(response).toContain("OK");
  });

  it("should track active connections", async () => {
    const client1 = new Socket();
    const client2 = new Socket();

    await Promise.all([
      new Promise<void>((resolve) => client1.connect(6380, resolve)),
      new Promise<void>((resolve) => client2.connect(6380, resolve)),
    ]);

    expect(manager.activeConnections).toBe(2);

    client1.end();
    client2.end();
  });
});
