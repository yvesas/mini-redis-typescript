import { InfoCommand } from "../../commands/InfoCommand";
import { DataStore } from "../../core/DataStore";
import { Socket } from "net";
import { ResponseHandler } from "../../networking/resp/ResponseHandler";

describe("InfoCommand", () => {
  let command: InfoCommand;
  let mockStore: DataStore;
  let mockSocket: jest.Mocked<Socket>;
  let mockResponseHandler: ResponseHandler;

  beforeEach(() => {
    mockStore = new DataStore();
    mockSocket = {
      write: jest.fn(),
    } as any;
    mockResponseHandler = ResponseHandler.getInstance();

    command = new InfoCommand(mockStore);
    command["responseHandler"] = mockResponseHandler;
  });

  it("should return server info in RESP format", async () => {
    await command.execute([], mockSocket);

    expect(mockSocket.write).toHaveBeenCalled();
    const response = mockSocket.write.mock.calls[0][0];

    expect(response).toContain("# server");
    expect(response).toContain("version:1.0.0");
    expect(response).toContain("# memory");
    expect(response).toContain("used_memory:");

    expect(response).toMatch(/^\$[0-9]+\r\n|^\*/);
  });

  it("should include keyspace statistics", async () => {
    await mockStore.set("key1", "value1");
    await mockStore.lpush("list1", "item1");

    await command.execute([], mockSocket);

    const response = mockSocket.write.mock.calls[0][0];
    expect(response).toContain("strings:1");
    expect(response).toContain("lists:1");
    expect(response).toContain("total:2");
  });

  //   it("should handle errors properly", async () => {
  //     jest.spyOn(mockStore, "data", "get").mockImplementation(() => {
  //       throw new Error("Mock error");
  //     });

  //     await command.execute([], mockSocket);

  //     expect(mockSocket.write).toHaveBeenCalledWith(
  //       expect.stringContaining("-ERR Mock error")
  //     );
  //   });
});
