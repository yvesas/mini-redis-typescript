import { ConnectionManager } from "../../networking/ConnectionManager";
import { DataStore } from "../../core/DataStore";
import { createConnection } from "net";

describe("ConnectionManager Integration", () => {
  let manager: ConnectionManager;
  let store: DataStore;
  const TEST_PORT = 6380;

  beforeAll(async () => {
    store = new DataStore();
    manager = new ConnectionManager(store, TEST_PORT);
    await manager.start();
  });

  afterAll(async () => {
    await manager.shutdown();
  });

  it("should track active connections", async () => {
    const client = createConnection({ port: TEST_PORT });

    await new Promise<void>((resolve) => client.on("connect", resolve));
    expect(manager.activeConnections).toBe(1);

    client.end();
    await new Promise<void>((resolve) => client.on("close", resolve));
  });

  it("should process SET/GET commands", async () => {
    const client = createConnection({ port: TEST_PORT });

    await new Promise<void>((resolve) => {
      client.write("SET testkey testvalue\r\n");
      client.once("data", (data) => {
        expect(data.toString()).toMatch(/^\+OK/);
        resolve();
      });
    });

    const getResponse = await new Promise<string>((resolve) => {
      client.write("GET testkey\r\n");
      client.once("data", resolve);
    });

    expect(getResponse.toString()).toContain("testvalue");
    client.end();
  });

  it("should handle concurrent connections", async () => {
    const clients = Array(3)
      .fill(null)
      .map(() => createConnection({ port: TEST_PORT }));

    await Promise.all(
      clients.map(
        (client) =>
          new Promise<void>((resolve) => client.on("connect", resolve))
      )
    );

    expect(manager.activeConnections).toBe(3);

    clients.forEach((client) => client.end());
    await Promise.all(
      clients.map(
        (client) => new Promise<void>((resolve) => client.on("close", resolve))
      )
    );
  });

  it("should remove disconnected clients", async () => {
    const client = createConnection({ port: TEST_PORT });
    await new Promise<void>((resolve) => client.on("connect", resolve));

    expect(manager.activeConnections).toBe(1);
    client.end();

    await new Promise<void>((resolve) => client.on("close", resolve));
    expect(manager.activeConnections).toBe(0);
  });
});
