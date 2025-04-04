import { RESPResponseFormatter } from "../../networking/resp/IResponseFormatter";

describe("RESPResponseFormatter", () => {
  const formatter = new RESPResponseFormatter();

  test("formatSimpleString", () => {
    expect(formatter.formatSimpleString("OK")).toBe("+OK\r\n");
  });

  test("formatError", () => {
    expect(formatter.formatError("Bad command")).toBe("-Bad command\r\n");
  });

  test("formatBulkString", () => {
    expect(formatter.formatBulkString("hello")).toBe("$5\r\nhello\r\n");
    expect(formatter.formatBulkString(null)).toBe("$-1\r\n");
  });

  test("formatArray", () => {
    expect(formatter.formatArray(["a", "b"])).toBe(
      "*2\r\n$1\r\na\r\n$1\r\nb\r\n"
    );
  });
});
