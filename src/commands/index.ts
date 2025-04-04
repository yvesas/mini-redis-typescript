import { KeyCommandService } from "./KeyCommands";
import { ListCommandService } from "./ListCommands";
import { StringCommandService } from "./StringCommands";
import { DataStore } from "../core/DataStore";
import { ICommandService } from "./CommandService";
import { InfoCommand } from "./InfoCommand";

export {
  ICommandService,
  KeyCommandService,
  StringCommandService,
  ListCommandService,
};

export function createCommandServices(
  store: DataStore
): Record<string, ICommandService> {
  return {
    key: new KeyCommandService(store),
    string: new StringCommandService(store),
    list: new ListCommandService(store),
    connection: {
      execute: async (args, socket) => {
        if (args[0]?.toLowerCase() === "info") {
          await new InfoCommand(store).execute(args.slice(1), socket);
        } else if (args[0]?.toLowerCase() === "ping") {
          socket.write("+PONG\r\n");
        }
      },
    },
  };
}
