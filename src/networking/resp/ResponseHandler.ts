import {
  IResponseFormatter,
  RESPResponseFormatter,
} from "./IResponseFormatter";
import { Socket } from "net";

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

  public sendResponse(socket: Socket, data: any): void {
    try {
      let response: string;

      if (typeof data === "string") {
        response =
          data.startsWith("+") || ["OK", "PONG"].includes(data)
            ? this.formatter.formatSimpleString(data.replace(/^\+/, ""))
            : this.formatter.formatBulkString(data);
      } else if (typeof data === "number") {
        response = this.formatter.formatInteger(data);
      } else if (Array.isArray(data)) {
        response = this.formatter.formatArray(data);
      } else if (data === null) {
        response = this.formatter.formatBulkString(null);
      } else if (data instanceof Error) {
        const errorType = this.determineErrorType(data.message);
        response = this.formatter.formatError(
          errorType.type,
          errorType.message
        );
      } else {
        response = this.formatter.formatError("ERR", "Unsupported data type");
      }

      socket.write(response);
    } catch (err) {
      socket.write(this.formatter.formatError("ERR", "Internal server error"));
    }
  }

  private determineErrorType(message: string): {
    type: string;
    message: string;
  } {
    const [type, ...parts] = message.split(" ");
    const redisTypes = ["ERR", "WRONGTYPE", "SYNTAX", "IOERR", "BUSY"];

    return redisTypes.includes(type)
      ? { type, message: parts.join(" ") }
      : { type: "ERR", message };
  }
}
