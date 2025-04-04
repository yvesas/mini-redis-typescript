import { DataStore } from "../core/DataStore";
import fs from "fs/promises";
import path from "path";

export class RDB {
  private readonly filePath: string;

  constructor(filename = "dump.rdb") {
    this.filePath = path.join(process.cwd(), filename);
  }

  async save(store: DataStore): Promise<void> {
    const snapshot = {
      data: Array.from(store["data"].entries()),
      lists: Array.from(store["lists"].entries()),
      timestamp: Date.now(),
    };

    await fs.writeFile(this.filePath, JSON.stringify(snapshot), "utf8");
  }

  async load(store: DataStore): Promise<boolean> {
    try {
      const data = await fs.readFile(this.filePath, "utf8");
      const { data: storedData, lists } = JSON.parse(data);

      store["data"] = new Map(storedData);
      store["lists"] = new Map(lists);
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("RDB load error:", err);
      }
      return false;
    }
  }
}
