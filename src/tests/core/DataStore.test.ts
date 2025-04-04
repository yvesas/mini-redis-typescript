import { DataStore } from "../../../src/core/DataStore";
import { Mutex } from "async-mutex";

describe("DataStore", () => {
  let store: DataStore;

  beforeEach(() => {
    store = new DataStore();
  });

  describe("String Operations", () => {
    it("should set and get string value", async () => {
      await store.set("foo", "bar");
      expect(await store.get("foo")).toBe("bar");
    });

    it("should return null for non-existent key", async () => {
      expect(await store.get("nonexistent")).toBeNull();
    });

    it("should handle expiration", async () => {
      await store.set("temp", "data", 0.1); // 100ms
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(await store.get("temp")).toBeNull();
    });
  });

  describe("List Operations", () => {
    it("should lpush and lrange", async () => {
      await store.lpush("mylist", "a");
      await store.lpush("mylist", "b");
      expect(await store.lrange("mylist", 0, -1)).toEqual(["b", "a"]);
    });

    it("should handle empty list", async () => {
      expect(await store.lrange("emptylist", 0, -1)).toBeNull();
    });
  });

  describe("Key Operations", () => {
    it("should check key existence", async () => {
      await store.set("foo", "bar");
      expect(await store.exists("foo")).toBe(true);
      expect(await store.exists("nonexistent")).toBe(false);
    });

    it("should delete keys", async () => {
      await store.set("foo", "bar");
      expect(await store.delete("foo")).toBe(true);
      expect(await store.get("foo")).toBeNull();
    });
  });

  describe("Concurrency Tests", () => {
    it("should handle 100 concurrent SET operations", async () => {
      const store = new DataStore();
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(store.set(`key${i}`, `value${i}`));
      }

      await Promise.all(promises);

      // > Check if all values ​​are set correctly
      for (let i = 0; i < 100; i++) {
        expect(await store.get(`key${i}`)).toBe(`value${i}`);
      }
    }, 10000); // > Timeout increased to 10 seconds

    it("should prevent race conditions", async () => {
      const store = new DataStore();
      await store.set("counter", "0");

      const increment = async () => {
        const value = await store.get("counter");
        const newValue = parseInt(value || "0") + 1;
        await store.set("counter", newValue.toString());
      };

      // > 50 concurrent increments
      await Promise.all(
        Array(50)
          .fill(0)
          .map(() => increment())
      );

      // > The final value must be exactly 50
      expect(await store.get("counter")).toBe("50");
    });
  });
});
