import { Socket } from "net";
import { DataStore } from "../../core/DataStore";
import { createCommandServices } from "../../commands";
import { ResponseHandler } from "./ResponseHandler";

export class RESPProcessor {
  private responseHandler: ResponseHandler;
  private commandServices: Record<string, any>;

  constructor(private store: DataStore) {
    this.responseHandler = ResponseHandler.getInstance();
    this.commandServices = createCommandServices(store);
  }

  /**
   * Processa a entrada recebida do cliente
   * @param input Comando recebido
   * @param socket Conexão do cliente
   */
  public process(input: string, socket: Socket): void {
    try {
      const parts = this.parseRESP(input);
      if (!parts) {
        this.responseHandler.sendResponse(
          socket,
          new Error("ERR Invalid RESP format")
        );
        return;
      }

      const [command, ...args] = parts;
      if (!command) {
        this.responseHandler.sendResponse(
          socket,
          new Error("ERR Empty command")
        );
        return;
      }

      this.executeCommand(command, args, socket);
    } catch (err) {
      this.responseHandler.sendResponse(
        socket,
        new Error(`FATAL: ${err instanceof Error ? err.message : String(err)}`)
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
      // Comando inline (não-RESP)
      if (!input.startsWith("*")) {
        return input
          .trim()
          .split(/\s+/)
          .filter((arg) => arg.length > 0);
      }

      // NOTE: Parse de array RESP (*<n>\r\n$<len>\r\n<arg>\r\n...)
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
    } catch (err) {
      console.error("RESP Parse Error:", err);
      return null;
    }
  }

  /**
   * Executa o comando e envia a resposta
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
    const cmdType = this.getCommandType(cmd);

    try {
      if (!cmdType || !this.commandServices[cmdType]) {
        this.responseHandler.sendResponse(
          socket,
          new Error(`ERR unknown command '${command}'`)
        );
        return;
      }

      await this.commandServices[cmdType].execute([cmd, ...args], socket);
    } catch (err) {
      this.responseHandler.sendResponse(
        socket,
        new Error(
          `CMD ${command} failed: ${
            err instanceof Error ? err.message : String(err)
          }`
        )
      );
    }
  }

  /**
   * Determina o tipo de comando para roteamento
   * @param command Comando em lowercase
   * @returns Tipo de serviço correspondente
   */
  private getCommandType(command: string): string {
    switch (command) {
      // String commands
      case "set":
      case "get":
      case "append":
        return "string";

      // List commands
      case "lpush":
      case "rpush":
      case "lpop":
      case "rpop":
      case "lrange":
        return "list";

      // Key commands
      case "save":
      case "bgsave":
      case "del":
      case "exists":
      case "expire":
        return "key";

      // Special commands
      case "ping":
      case "echo":
      case "info":
        return "connection";

      default:
        return "";
    }
  }
}
