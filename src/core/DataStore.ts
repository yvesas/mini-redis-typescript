import { Mutex } from "async-mutex";
import { WrongTypeError } from "../errors/RedisError";
import { RDB } from "../persistence/RDB";

interface StoredValue {
  value: string;
  expiresAt?: number;
}

export class DataStore {
  private data: Map<string, StoredValue> = new Map();
  private lists: Map<string, string[]> = new Map();
  private mutex = new Mutex();
  private rdb = new RDB();

  constructor() {
    this.initialize();
    setInterval(() => this.cleanupExpiredKeys(), 300000);
  }

  private async initialize() {
    try {
      const loaded = await this.rdb.load(this);
      console.log(loaded ? "Data loaded from RDB" : "No RDB data found");
    } catch (err) {
      console.error("Failed to initialize data store:", err);
    }

    setInterval(() => {
      this.rdb
        .save(this)
        .catch((err) => console.error("Auto-save failed:", err));
    }, 120_000);
  }

  private cleanupExpiredKeys(): void {
    const now = Date.now();
    this.data.forEach((value, key) => {
      if (value.expiresAt && value.expiresAt <= now) {
        this.data.delete(key);
      }
    });
  }

  private checkExpiration(key: string): boolean {
    const item = this.data.get(key);

    if (item?.expiresAt && Date.now() > item.expiresAt) {
      this.data.delete(key);
      return true;
    }
    return false;
  }

  async shutdown() {
    await this.rdb.save(this);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!key || typeof value === "undefined") {
      throw new Error("ERR invalid key or value");
    }

    return this.mutex.runExclusive(() => {
      if (this.lists.has(key)) {
        throw new WrongTypeError();
      }

      const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
      this.data.set(key, { value: String(value), expiresAt });
    });
  }

  async get(key: string): Promise<string | null> {
    return this.mutex.runExclusive(() => {
      if (this.checkExpiration(key)) return null;
      return this.data.get(key)?.value ?? null;
    });
  }

  async exists(key: string): Promise<boolean> {
    return this.mutex.runExclusive(() => {
      const item = this.data.get(key);
      if (item?.expiresAt && Date.now() > item.expiresAt) {
        this.data.delete(key);
        return false;
      }
      return this.data.has(key);
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.mutex.runExclusive(() => {
      const existed = this.data.has(key) || this.lists.has(key);
      this.data.delete(key);
      this.lists.delete(key);
      return existed;
    });
  }

  async deleteMultiple(keys: string[]): Promise<number> {
    return this.mutex.runExclusive(() => {
      let count = 0;
      for (const key of keys) {
        if (this.data.has(key) || this.lists.has(key)) {
          this.data.delete(key);
          this.lists.delete(key);
          count++;
        }
      }
      return count;
    });
  }

  async lpush(key: string, value: any): Promise<number> {
    return this.mutex.runExclusive(() => {
      if (this.data.has(key)) {
        throw new WrongTypeError();
      }

      if (!this.lists.has(key)) {
        this.lists.set(key, []);
      }
      this.lists.get(key)!.unshift(String(value));
      return this.lists.get(key)!.length;
    });
  }

  async rpush(key: string, value: any): Promise<number> {
    return this.mutex.runExclusive(() => {
      if (this.data.has(key)) {
        throw new WrongTypeError();
      }

      if (!this.lists.has(key)) {
        this.lists.set(key, []);
      }
      this.lists.get(key)!.push(String(value));
      return this.lists.get(key)!.length;
    });
  }

  async lpop(key: string): Promise<string | null> {
    return this.mutex.runExclusive(() => {
      const list = this.lists.get(key);
      return list?.shift() ?? null;
    });
  }

  async rpop(key: string): Promise<string | null> {
    return this.mutex.runExclusive(() => {
      const list = this.lists.get(key);
      return list?.pop() ?? null;
    });
  }

  async lrange(
    key: string,
    start: number,
    end: number
  ): Promise<string[] | null> {
    return this.mutex.runExclusive(() => {
      const list = this.lists.get(key);
      if (!list) return null;

      const len = list.length;
      const s = start < 0 ? Math.max(0, len + start) : Math.min(len, start);
      const e = end < 0 ? Math.max(0, len + end) : Math.min(len, end);

      return list.slice(s, e + 1);
    });
  }

  public async saveToDisk(): Promise<string> {
    try {
      await this.rdb.save(this);
      return "OK";
    } catch (err) {
      console.error("Save failed:", err);
      throw new Error("ERR Failed to save database");
    }
  }

  public async bgSaveToDisk(): Promise<string> {
    setImmediate(async () => {
      try {
        await this.rdb.save(this);
        console.log("Background save completed");
      } catch (err) {
        console.error("Background save failed:", err);
      }
    });
    return "Background saving started";
  }
}
