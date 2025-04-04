import { BaseCommandService } from "./CommandService";
import { Socket } from "net";

export class ListCommandService extends BaseCommandService {
    async execute(args: string[], socket: Socket): Promise<void> {
        try {
            switch (args[0].toLowerCase()) {
                case "lpush":
                    await this.handleLPush(args.slice(1), socket);
                    break;
                case "rpush":
                    await this.handleRPush(args.slice(1), socket);
                    break;
                case "lpop":
                    await this.handleLPop(args.slice(1), socket);
                    break;
                case "rpop":
                    await this.handleRPop(args.slice(1), socket);
                    break;
                case "lrange":
                    await this.handleLRange(args.slice(1), socket);
                    break;
                default:
                    this.responseHandler.sendResponse(
                        socket,
                        new Error(`ERR unknown list command '${args[0]}'`)
                    );
            }
        } catch (err) {
            this.responseHandler.sendResponse(
                socket,
                new Error(`List command error: ${err instanceof Error ? err.message : String(err)}`)
            );
        }
    }

    private async handleLPush(args: string[], socket: Socket): Promise<void> {
        if (!this.validateArgs(args, socket, 2, 2)) return;
        const count = await this.store.lpush(args[0], args[1]);
        this.responseHandler.sendResponse(socket, count);
    }

    private async handleRPush(args: string[], socket: Socket): Promise<void> {
        if (!this.validateArgs(args, socket, 2, 2)) return;
        const count = await this.store.rpush(args[0], args[1]);
        this.responseHandler.sendResponse(socket, count);
    }

    private async handleLPop(args: string[], socket: Socket): Promise<void> {
        if (!this.validateArgs(args, socket, 1, 1)) return;
        const value = await this.store.lpop(args[0]);
        this.responseHandler.sendResponse(socket, value);
    }

    private async handleRPop(args: string[], socket: Socket): Promise<void> {
        if (!this.validateArgs(args, socket, 1, 1)) return;
        const value = await this.store.rpop(args[0]);
        this.responseHandler.sendResponse(socket, value);
    }

    private async handleLRange(args: string[], socket: Socket): Promise<void> {
        if (!this.validateArgs(args, socket, 3, 3)) return;
        const start = parseInt(args[1]);
        const end = parseInt(args[2]);
        
        if (isNaN(start) || isNaN(end)) {
            this.responseHandler.sendResponse(
                socket,
                new Error("ERR value is not an integer or out of range")
            );
            return;
        }

        const values = await this.store.lrange(args[0], start, end);
        this.responseHandler.sendResponse(socket, values);
    }
}