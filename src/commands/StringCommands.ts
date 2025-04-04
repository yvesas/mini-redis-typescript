import { WrongTypeError } from "../errors/RedisError";
import { BaseCommandService } from "./CommandService";
import { Socket } from "net";

export class StringCommandService extends BaseCommandService {
  async execute(args: string[], socket: Socket): Promise<void> {
    try {
      switch (args[0].toLowerCase()) {
        case "set":
          await this.handleSet(args.slice(1), socket);
          break;
        case "get":
          await this.handleGet(args.slice(1), socket);
          break;
        default:
          this.responseHandler.sendResponse(
            socket,
            new Error(`ERR unknown string command '${args[0]}'`)
          );
      }
    } catch (err) {
      this.responseHandler.sendResponse(
        socket,
        new Error(
          `String command error: ${
            err instanceof Error ? err.message : String(err)
          }`
        )
      );
    }
  }

  private async handleSet(args: string[], socket: Socket): Promise<void> {
    if (!this.validateArgs(args, socket, 2, 4)) {
      this.responseHandler.sendResponse(
        socket,
        new Error("ERR wrong number of arguments for 'set' command")
      );
      return;
    }

    const [key, value, opt, ttl] = args;
    let ttlMs: number | undefined;

    if (opt && ttl) {
      const optLower = opt.toLowerCase();
      if (!["ex", "px"].includes(optLower)) {
        this.responseHandler.sendResponse(
          socket,
          new Error("ERR syntax error in SET option")
        );
        return;
      }

      const ttlNum = parseInt(ttl);
      if (isNaN(ttlNum) || ttlNum <= 0) {
        this.responseHandler.sendResponse(
          socket,
          new Error("ERR invalid expire time in SET")
        );
        return;
      }

      ttlMs = optLower === "ex" ? ttlNum * 1000 : ttlNum;
    }

    try {
      await this.store.set(key, value, ttlMs);
      this.responseHandler.sendResponse(socket, "OK");
    } catch (err) {
      if (err instanceof Error && err.message.includes("wrong kind")) {
        this.responseHandler.sendResponse(socket, new WrongTypeError());
      } else {
        this.responseHandler.sendResponse(
          socket,
          new Error(`ERR ${err instanceof Error ? err.message : String(err)}`)
        );
      }
    }
  }

  private async handleGet(args: string[], socket: Socket): Promise<void> {
    if (!this.validateArgs(args, socket, 1, 1)) return;

    const value = await this.store.get(args[0]);
    this.responseHandler.sendResponse(socket, value);
  }
}
