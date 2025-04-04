import { BaseCommandService } from "./CommandService";
import { Socket } from "net";

export class KeyCommandService extends BaseCommandService {
  async execute(args: string[], socket: Socket): Promise<void> {
    try {
      switch (args[0].toLowerCase()) {
        case "del":
          await this.handleDel(args.slice(1), socket);
          break;
        case "exists":
          await this.handleExists(args.slice(1), socket);
          break;
        default:
          this.responseHandler.sendResponse(
            socket,
            new Error(`ERR unknown key command '${args[0]}'`)
          );
      }
    } catch (err) {
      this.responseHandler.sendResponse(
        socket,
        new Error(
          `Key command error: ${
            err instanceof Error ? err.message : String(err)
          }`
        )
      );
    }
  }

  private async handleDel(keys: string[], socket: Socket): Promise<void> {
    if (!this.validateArgs(keys, socket, 1)) return;

    const count =
      keys.length === 1
        ? (await this.store.delete(keys[0]))
          ? 1
          : 0
        : await this.store.deleteMultiple(keys);

    this.responseHandler.sendResponse(socket, count);
  }

  private async handleExists(keys: string[], socket: Socket): Promise<void> {
    if (!this.validateArgs(keys, socket, 1)) return;

    try {
      const exists = await this.store.exists(keys[0]);
      this.responseHandler.sendResponse(socket, exists ? 1 : 0);
    } catch (err) {
      this.responseHandler.sendResponse(
        socket,
        new Error(
          `ERR exists command failed: ${
            err instanceof Error ? err.message : String(err)
          }`
        )
      );
    }
  }
}
