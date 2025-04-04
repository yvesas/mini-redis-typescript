import { DataStore } from "../core/DataStore";
import { Socket } from "net";
import { ResponseHandler } from "../networking/resp/ResponseHandler";

export interface ICommandService {
  execute(args: string[], socket: Socket): Promise<void>;
}

export abstract class BaseCommandService implements ICommandService {
  constructor(
    protected store: DataStore,
    protected responseHandler = ResponseHandler.getInstance()
  ) {}

  abstract execute(args: string[], socket: Socket): Promise<void>;

  protected validateArgs(
    args: string[],
    socket: Socket,
    minArgs: number,
    maxArgs?: number
  ): boolean {
    if (
      args.length < minArgs ||
      (maxArgs !== undefined && args.length > maxArgs)
    ) {
      this.responseHandler.sendResponse(
        socket,
        new Error(`ERR wrong number of arguments`)
      );
      return false;
    }
    return true;
  }
}
