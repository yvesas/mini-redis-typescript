import { BaseCommandService } from "./CommandService";
import { Socket } from "net";

export class InfoCommand extends BaseCommandService {
  async execute(args: string[], socket: Socket): Promise<void> {
    try {
      const stats = this.gatherStats();
      const response = this.formatRESPResponse(stats);
      this.responseHandler.sendResponse(socket, response);
    } catch (err) {
      this.responseHandler.sendResponse(
        socket,
        new Error(`ERR ${err instanceof Error ? err.message : String(err)}`)
      );
    }
  }

  private gatherStats() {
    return {
      server: `version:1.0.0\r\nuptime:${process.uptime()}\r\nprocess_id:${
        process.pid
      }`,
      memory: `used_memory:${process.memoryUsage().rss}\r\npeak_memory:${
        process.memoryUsage().heapTotal
      }`,
      stats: `total_connections:0\r\ntotal_commands:0`,
      keyspace: `strings:${this.store["data"].size}\r\nlists:${
        this.store["lists"].size
      }\r\ntotal:${this.store["data"].size + this.store["lists"].size}`,
    };
  }

  private formatRESPResponse(stats: Record<string, string>): string {
    const combined = Object.entries(stats)
      .map(([section, data]) => `# ${section}\r\n${data}`)
      .join("\r\n");

    return combined;
  }
}
