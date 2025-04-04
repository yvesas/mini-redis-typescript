import { StringCommandService } from "../../../src/commands/StringCommands";
import { DataStore } from "../../../src/core/DataStore";
import { Socket } from "net";

describe("StringCommandService", () => {
  let service: StringCommandService;
  let mockStore: jest.Mocked<DataStore>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(() => {
    mockStore = {
      set: jest.fn(),
      get: jest.fn(),
      exists: jest.fn(),
    } as any;

    mockSocket = {
      write: jest.fn(),
    } as any;

    service = new StringCommandService(mockStore);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("SET command", () => {
    it("should set value without TTL", async () => {
      await service.execute(["set", "foo", "bar"], mockSocket);
      expect(mockStore.set).toHaveBeenCalledWith("foo", "bar", undefined);
      expect(mockSocket.write).toHaveBeenCalledWith("+OK\r\n");
    });

    it("should set value with TTL", async () => {
      await service.execute(["set", "foo", "bar", "EX", "10"], mockSocket);
      expect(mockStore.set).toHaveBeenCalledWith("foo", "bar", 10000);
    });
  });

  describe("GET command", () => {
    it("should return value for existing key", async () => {
      mockStore.get.mockResolvedValue("bar");
      await service.execute(["get", "foo"], mockSocket);
      expect(mockSocket.write).toHaveBeenCalledWith("$3\r\nbar\r\n");
    });

    it("should return null for non-existent key", async () => {
      mockStore.get.mockResolvedValue(null);
      await service.execute(["get", "nonexistent"], mockSocket);
      expect(mockSocket.write).toHaveBeenCalledWith("$-1\r\n");
    });
  });

  describe("Expiration Tests", () => {
    it("should return null after PX expiration", async () => {
      const testValue = { value: "tempvalue", expiresAt: Date.now() + 100 };
      mockStore.get.mockImplementation(async (key) => {
        if (testValue.expiresAt && Date.now() > testValue.expiresAt) {
          return null;
        }
        return testValue.value;
      });

      await service.execute(["get", "tempkey"], mockSocket);
      expect(mockSocket.write).toHaveBeenCalledWith("$8\r\ntempvalue\r\n");

      jest.advanceTimersByTime(101);

      await service.execute(["get", "tempkey"], mockSocket);
      expect(mockSocket.write).toHaveBeenCalledWith("$-1\r\n");
    });

    it("should set value with PX (milliseconds) TTL", async () => {
      await service.execute(["set", "foo", "bar", "PX", "5000"], mockSocket);
      expect(mockStore.set).toHaveBeenCalledWith("foo", "bar", 5000);
      expect(mockSocket.write).toHaveBeenCalledWith("+OK\r\n");
    });

    it("should reject invalid TTL values", async () => {
      await service.execute(["set", "foo", "bar", "EX", "invalid"], mockSocket);
      expect(mockSocket.write).toHaveBeenCalledWith(
        expect.stringContaining("-ERR invalid expire time in SET")
      );
    });
  });
});
