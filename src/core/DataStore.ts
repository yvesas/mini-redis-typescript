import { Mutex } from "async-mutex";

interface StoredValue {
  value: any;
  expiresAt?: number;
}

export class DataStore {
  private data: Map<string, StoredValue> = new Map();
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

      return item.value;
    });
  }

  async delete(key: string): Promise<void> {
    await this.mutex.runExclusive(() => {
      this.data.delete(key);
    });
  }
}
