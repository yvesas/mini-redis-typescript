import { DataStore } from "../core/DataStore";
import fs from "fs/promises";
import path from "path";

export class RDB {
  private readonly filePath: string;

  constructor(filename = "dump.rdb") {
    this.filePath = path.join(process.cwd(), filename);
  }

  async save(store: DataStore): Promise<void> {
    try {
      const snapshot = {
        data: Array.from(store["data"].entries()),
        lists: Array.from(store["lists"].entries()),
        timestamp: Date.now(),
      };

      await fs.writeFile(this.filePath, JSON.stringify(snapshot), "utf8");
    } catch (err) {
      console.error("RDB save error:", err);
      throw new Error("ERR Failed to save database");
    }
  }

  async load(store: DataStore): Promise<boolean> {
    try {
      const stats = await fs.stat(this.filePath).catch(() => null);
      if (!stats || stats.size === 0) {
        return false;
      }

      const data = await fs.readFile(this.filePath, "utf8");
      if (!data.trim()) {
        return false;
      }

      const parsed = JSON.parse(data);

      if (!parsed.data || !parsed.lists) {
        console.warn("Invalid RDB file structure");
        return false;
      }

      store["data"] = new Map(parsed.data);
      store["lists"] = new Map(parsed.lists);
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }

      console.error("RDB load error:", err);
      return false;
    }
  }
}
