import { DataStore } from "./DataStore";

export class ExpirationManager {
  private store: DataStore;
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(store: DataStore) {
    this.store = store;
  }

  setExpiration(key: string, ttl: number): void {
    this.clearExpiration(key);

    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, ttl * 1000);

    this.timers.set(key, timer);
  }

  clearExpiration(key: string): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
  }
}
