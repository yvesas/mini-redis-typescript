import { DataStore } from "../../core/DataStore";
import { ResponseHandler } from "./ResponseHandler";
import { Socket } from "net";

export class RESPProcessor {
  private responseHandler: ResponseHandler;

  constructor(private store: DataStore) {
    this.responseHandler = ResponseHandler.getInstance();
  }

  /**
   * Processa a entrada do cliente e executa o comando recebido
   * @param input Comando recebido do cliente
   * @param socket Conexão do cliente
   */
  process(input: string, socket: Socket): void {
    try {
      const parts = this.parseRESP(input);
      if (!parts) {
        this.responseHandler.sendResponse(
          socket,
          new Error("Invalid command format")
        );
        return;
      }

      const [command, ...args] = parts;
      if (!command) {
        this.responseHandler.sendResponse(socket, new Error("Empty command"));
        return;
      }

      this.executeCommand(command, args, socket);
    } catch (err) {
      this.responseHandler.sendResponse(
        socket,
        new Error(
          `Processing error: ${
            err instanceof Error ? err.message : String(err)
          }`
        )
      );
    }
  }

  /**
   * Interpreta o protocolo RESP (Redis Serialization Protocol)
   * @param input Dados recebidos do cliente
   * @returns Array de argumentos ou null se inválido
   */
  private parseRESP(input: string): string[] | null {
    try {
      if (!input.startsWith("*")) {
        return input.trim().split(/\s+/);
      }

      const lines = input.split("\r\n");
      if (lines.length < 1) return null;

      const count = parseInt(lines[0].substring(1));
      if (isNaN(count) || count < 0) return null;

      const args: string[] = [];
      let i = 1;

      while (args.length < count && i < lines.length) {
        if (lines[i].startsWith("$")) {
          const length = parseInt(lines[i].substring(1));
          if (!isNaN(length) && length >= 0 && i + 1 < lines.length) {
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
    } catch {
      return null;
    }
  }

  /**
   * Executa o comando Redis e envia a resposta
   * @param command Comando em lowercase
   * @param args Argumentos do comando
   * @param socket Conexão do cliente
   */
  private async executeCommand(
    command: string,
    args: string[],
    socket: Socket
  ): Promise<void> {
    const cmd = command.toLowerCase();

    try {
      switch (cmd) {
        case "ping":
          this.responseHandler.sendResponse(socket, "PONG");
          break;

        case "echo":
          this.responseHandler.sendResponse(socket, args[0] || "");
          break;

        case "set":
          await this.handleSetCommand(args, socket);
          break;

        case "get":
          const value = await this.store.get(args[0]);
          this.responseHandler.sendResponse(socket, value);
          break;

        case "del":
          if (args.length === 0) {
            this.responseHandler.sendResponse(
              socket,
              new Error("ERR wrong number of arguments for 'del' command")
            );
          } else {
            try {
              const count =
                args.length === 1
                  ? (await this.store.delete(args[0]))
                    ? 1
                    : 0
                  : await this.store.deleteMultiple(args);

              this.responseHandler.sendResponse(socket, count);
            } catch (err) {
              this.responseHandler.sendResponse(
                socket,
                new Error(
                  `DEL command error: ${
                    err instanceof Error ? err.message : String(err)
                  }`
                )
              );
            }
          }
          break;

        case "lpush":
          const lpushLength = await this.store.lpush(args[0], args[1]);
          this.responseHandler.sendResponse(socket, lpushLength);
          break;

        case "rpush":
          const rpushLength = await this.store.rpush(args[0], args[1]);
          this.responseHandler.sendResponse(socket, rpushLength);
          break;

        case "lpop":
          const lpopValue = await this.store.lpop(args[0]);
          this.responseHandler.sendResponse(socket, lpopValue);
          break;

        case "rpop":
          const rpopValue = await this.store.rpop(args[0]);
          this.responseHandler.sendResponse(socket, rpopValue);
          break;

        case "lrange":
          const start = parseInt(args[1]) || 0;
          const end = parseInt(args[2]) || -1;
          const rangeValues = await this.store.lrange(args[0], start, end);
          this.responseHandler.sendResponse(socket, rangeValues);
          break;

        case "expire":
          const ttl = parseInt(args[1]);
          if (isNaN(ttl)) {
            this.responseHandler.sendResponse(socket, new Error("Invalid TTL"));
          } else {
            // Implementar expire no DataStore
            this.responseHandler.sendResponse(socket, 1); // Simulando sucesso
          }
          break;

        default:
          this.responseHandler.sendResponse(
            socket,
            new Error(`Unknown command '${command}'`)
          );
      }
    } catch (err) {
      this.responseHandler.sendResponse(
        socket,
        new Error(
          `Command execution error: ${
            err instanceof Error ? err.message : String(err)
          }`
        )
      );
    }
  }

  /**
   * Trata o comando SET com todas as suas variantes
   */
  private async handleSetCommand(
    args: string[],
    socket: Socket
  ): Promise<void> {
    if (args.length < 2) {
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
      if (optLower === "ex") {
        // segundos para ms
        ttlMs = parseInt(ttl) * 1000;
      } else if (optLower === "px") {
        // já está em ms
        ttlMs = parseInt(ttl);
      }
    }

    await this.store.set(key, value, ttlMs);
    this.responseHandler.sendResponse(socket, "OK");
  }
}
