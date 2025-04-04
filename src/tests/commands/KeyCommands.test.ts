import { Socket } from "net";
import { DataStore } from "../../../src/core/DataStore";
import { KeyCommandService } from "../../commands";

describe("KeyCommandService", () => {
  let service: KeyCommandService;
  let mockStore: jest.Mocked<DataStore>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(() => {
    mockStore = {
      exists: jest.fn(),
      delete: jest.fn(),
      deleteMultiple: jest.fn(),
    } as any;

    mockSocket = {
      write: jest.fn(),
    } as any;

    service = new KeyCommandService(mockStore);
  });

  describe("DEL command", () => {
    it("should delete single key", async () => {
      mockStore.delete.mockResolvedValue(true);
      await service.execute(["del", "foo"], mockSocket);
      expect(mockSocket.write).toHaveBeenCalledWith(":1\r\n");
    });

    it("should handle multiple keys", async () => {
      mockStore.deleteMultiple.mockResolvedValue(2);
      await service.execute(["del", "key1", "key2"], mockSocket);
      expect(mockSocket.write).toHaveBeenCalledWith(":2\r\n");
    });
  });

  describe("EXISTS command", () => {
    it("should return 1 for existing key", async () => {
      mockStore.exists.mockResolvedValue(true);
      await service.execute(["exists", "foo"], mockSocket);
      expect(mockSocket.write).toHaveBeenCalledWith(":1\r\n");
    });
  });
});
