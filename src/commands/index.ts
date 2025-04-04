import { KeyCommandService } from "./Keycommands";
import { ListCommandService } from "./ListCommands";
import { StringCommandService } from "./StringCommands";
import { DataStore } from "../core/DataStore";
import { ICommandService } from "./CommandService";

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
  };
}
