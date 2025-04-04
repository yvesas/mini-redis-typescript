import { ListCommandService } from "../../../src/commands/ListCommands";
import { DataStore } from "../../../src/core/DataStore";
import { Socket } from "net";

describe("ListCommandService", () => {
  let service: ListCommandService;
  let mockStore: jest.Mocked<DataStore>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(() => {
    mockStore = {
      lpush: jest.fn(),
      rpush: jest.fn(),
      lpop: jest.fn(),
      rpop: jest.fn(),
      lrange: jest.fn(),
    } as any;

    mockSocket = {
      write: jest.fn(),
    } as any;

    service = new ListCommandService(mockStore);
  });

  describe("LPUSH command", () => {
    it("should push to list", async () => {
      mockStore.lpush.mockResolvedValue(1);
      await service.execute(["lpush", "mylist", "value"], mockSocket);
      expect(mockSocket.write).toHaveBeenCalledWith(":1\r\n");
    });
  });

  describe("LRANGE command", () => {
    it("should return list range", async () => {
      mockStore.lrange.mockResolvedValue(["a", "b"]);
      await service.execute(["lrange", "mylist", "0", "-1"], mockSocket);
      expect(mockSocket.write).toHaveBeenCalledWith(
        "*2\r\n$1\r\na\r\n$1\r\nb\r\n"
      );
    });
  });
});
