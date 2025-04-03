import { DataStore } from "../../core/DataStore";
import { Socket } from "net";

export class RESPProcessor {
  constructor(private store: DataStore) {}

  process(input: string, socket: Socket) {
    const parts = this.parseRESP(input);
    if (!parts) return socket.write("-ERR invalid command\r\n");

    const [command, ...args] = parts;
    this.executeCommand(command, args, socket);
  }

  private parseRESP(input: string): string[] | null {
    try {
      if (input.startsWith("*")) {
        return input
          .split("\r\n")
          .slice(1)
          .filter((_, i) => i % 2 !== 0);
      }
      return input.split(" ");
    } catch {
      return null;
    }
  }

  private async executeCommand(
    command: string,
    args: string[],
    socket: Socket
  ) {
    const cmd = command.toLowerCase();

    try {
      switch (cmd) {
        case "ping":
          socket.write("+PONG\r\n");
          break;
        case "set":
          const [key, setValue, ttlOpt, ttl] = args;
          if (ttlOpt?.toLowerCase() === "ex") {
            await this.store.set(key, setValue, parseInt(ttl));
          } else {
            await this.store.set(key, setValue);
          }
          socket.write("+OK\r\n");
          break;
        case "get":
          const value = await this.store.get(args[0]);
          socket.write(value ? `$${value.length}\r\n${value}\r\n` : "$-1\r\n");
          break;
        default:
          socket.write(`-ERR unknown command '${command}'\r\n`);
      }
    } catch (err) {
      socket.write(
        `-ERR ${err instanceof Error ? err.message : String(err)}\r\n`
      );
    }
  }
}
