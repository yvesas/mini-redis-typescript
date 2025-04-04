import { Mutex } from "async-mutex";

interface StoredValue {
  value: any;
  expiresAt?: number;
}

export class DataStore {
  private data: Map<string, StoredValue> = new Map();
  private lists: Map<string, any[]> = new Map();
  private mutex = new Mutex();

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.mutex.runExclusive(() => {
      const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
      this.data.set(key, { value, expiresAt });
    });
  }

  async get(key: string): Promise<any> {
    return this.mutex.runExclusive(() => {
      const item = this.data.get(key);
      if (!item) return null;

      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.data.delete(key);
        return null;
      }

      return String(item.value);
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
      const existed = this.data.has(key);
      this.data.delete(key);
      return existed;
    });
  }

  async deleteMultiple(keys: string[]): Promise<number> {
    return this.mutex.runExclusive(() => {
      let count = 0;
      for (const key of keys) {
        if (this.data.has(key)) {
          this.data.delete(key);
          count++;
        }
      }
      return count;
    });
  }

  async lpush(key: string, value: any): Promise<number> {
    return this.mutex.runExclusive(() => {
      if (this.data.has(key)) {
        throw new Error(
          "WRONGTYPE Operation against a key holding the wrong kind of value"
        );
      }

      if (!this.lists.has(key)) {
        this.lists.set(key, []);
      }
      this.lists.get(key)!.unshift(value);
      return this.lists.get(key)!.length;
    });
  }

  async rpush(key: string, value: any): Promise<number> {
    return this.mutex.runExclusive(() => {
      if (!this.lists.has(key)) {
        this.lists.set(key, []);
      }
      this.lists.get(key)!.push(value);
      return this.lists.get(key)!.length;
    });
  }

  async lpop(key: string): Promise<any> {
    return this.mutex.runExclusive(() => {
      const list = this.lists.get(key);
      return list ? list.shift() : null;
    });
  }

  async rpop(key: string): Promise<any> {
    return this.mutex.runExclusive(() => {
      const list = this.lists.get(key);
      return list ? list.pop() : null;
    });
  }

  async lrange(key: string, start: number, end: number): Promise<any[] | null> {
    return this.mutex.runExclusive(() => {
      const list = this.lists.get(key);
      if (!list) return null;
      const len = list.length;
      const s = start < 0 ? Math.max(0, len + start) : Math.min(len, start);
      const e = end < 0 ? Math.max(0, len + end) : Math.min(len, end);

      return list.slice(s, e + 1);
    });
  }
}
