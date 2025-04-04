import {
  IResponseFormatter,
  RESPResponseFormatter,
} from "./IResponseFormatter";

export class ResponseHandler {
  private static instance: ResponseHandler;
  private formatter: IResponseFormatter;

  private constructor(formatter?: IResponseFormatter) {
    this.formatter = formatter || new RESPResponseFormatter();
  }

  public static getInstance(): ResponseHandler {
    if (!ResponseHandler.instance) {
      ResponseHandler.instance = new ResponseHandler();
    }
    return ResponseHandler.instance;
  }

  public sendResponse(
    socket: import("net").Socket,
    data: string | number | any[] | Error | null
  ): void {
    try {
      let response: string;

      if (typeof data === "string") {
        response = data.startsWith("-")
          ? this.formatter.formatError(data.substring(1))
          : this.formatter.formatSimpleString(data);
      } else if (typeof data === "number") {
        response = this.formatter.formatInteger(data);
      } else if (Array.isArray(data)) {
        response = this.formatter.formatArray(data);
      } else if (data === null) {
        response = this.formatter.formatBulkString(null);
      } else if (data instanceof Error) {
        response = this.formatter.formatError(data.message);
      } else {
        response = this.formatter.formatError("Unsupported data type");
      }

      socket.write(response);
    } catch (err) {
      socket.write(this.formatter.formatError("Error generating response"));
    }
  }
}
