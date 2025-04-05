import { RESPProcessor } from "../../../src/networking/resp/RESPProcessor";
import { DataStore } from "../../../src/core/DataStore";
import { Socket } from "net";

describe("RESPProcessor", () => {
  let processor: RESPProcessor;
  let mockStore: jest.Mocked<DataStore>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(() => {
    mockStore = {
      get: jest.fn(),
      set: jest.fn(),
      exists: jest.fn(),
    } as any;

    mockSocket = {
      write: jest.fn(),
    } as any;

    processor = new RESPProcessor(mockStore);
  });

  it("should process inline SET command", () => {
    processor.process("SET foo bar", mockSocket);
    expect(mockStore.set).toHaveBeenCalledWith("foo", "bar", undefined);
  });

  it("should process RESP array command", () => {
    processor.process(
      "*3\r\n$3\r\nSET\r\n$3\r\nfoo\r\n$3\r\nbar\r\n",
      mockSocket
    );
    expect(mockStore.set).toHaveBeenCalledWith("foo", "bar", undefined);
  });

  it("should handle invalid commands", () => {
    processor.process("INVALID COMMAND", mockSocket);
    expect(mockSocket.write).toHaveBeenCalledWith(
      expect.stringContaining("ERR unknown command")
    );
  });
});
