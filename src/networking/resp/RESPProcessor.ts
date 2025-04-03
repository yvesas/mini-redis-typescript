import { DataStore } from "../../core/DataStore";
import net from "net";

export class RESPProcessor {
  constructor(private store: DataStore) {}

  process(input: string, socket: net.Socket) {
    const parts = this.parseRESP(input);
    if (!parts) return socket.write("-ERR invalid command\r\n");

    const [command, ...args] = parts;
    this.executeCommand(command, args, socket);
  }

  private parseRESP(input: string): string[] | null {
    try {
      if (!input.startsWith("*")) {
        return input.split(" ").filter((x) => x.length > 0);
      }

      const lines = input.split("\r\n");
      const count = parseInt(lines[0].substring(1));
      if (isNaN(count)) return null;

      const args: string[] = [];
      let i = 1;

      while (args.length < count && i < lines.length) {
        if (lines[i].startsWith("$")) {
          const length = parseInt(lines[i].substring(1));
          if (!isNaN(length) && length >= 0) {
            args.push(lines[i + 1]);
            i += 2;
          } else {
            i += 1;
          }
        } else {
          i += 1;
        }
      }

      return args;
    } catch (err) {
      console.error("Parse error:", err);
      return null;
    }
  }

  private async executeCommand(
    command: string,
    args: string[],
    socket: net.Socket
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
          socket.write(
            value
              ? `$${Buffer.byteLength(value, "utf8")}\r\n${value}\r\n`
              : "$-1\r\n"
          );
          break;

        case "lpush":
          const lpushLength = await this.store.lpush(args[0], args[1]);
          socket.write(`:${lpushLength}\r\n`);
          break;

        case "rpush":
          const rpushLength = await this.store.rpush(args[0], args[1]);
          socket.write(`:${rpushLength}\r\n`);
          break;

        case "lpop":
          const lpopValue = await this.store.lpop(args[0]);
          socket.write(
            lpopValue ? `$${lpopValue.length}\r\n${lpopValue}\r\n` : "$-1\r\n"
          );
          break;

        case "rpop":
          const rpopValue = await this.store.rpop(args[0]);
          socket.write(
            rpopValue ? `$${rpopValue.length}\r\n${rpopValue}\r\n` : "$-1\r\n"
          );
          break;

        case "lrange":
          const lrangeValues = await this.store.lrange(
            args[0],
            parseInt(args[1]),
            parseInt(args[2])
          );

          if (!lrangeValues) {
            socket.write("*-1\r\n");
          } else {
            let resp = `*${lrangeValues.length}\r\n`;
            for (const val of lrangeValues) {
              const strVal = String(val);
              resp += `$${Buffer.byteLength(strVal, "utf8")}\r\n${strVal}\r\n`;
            }
            socket.write(resp);
          }
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
