import { DataStore } from "../../../src/core/DataStore";
import { WrongTypeError } from "../../../src/errors/RedisError";

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

    it("should convert values to string", async () => {
      await store.set("num", 123);
      expect(await store.get("num")).toBe("123");
    });

    it("should return null for non-existent key", async () => {
      expect(await store.get("nonexistent")).toBeNull();
    });

    it("should handle expiration", async () => {
      await store.set("temp", "data", 0.1); // 100ms
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(await store.get("temp")).toBeNull();
    });

    it("should reject empty key", async () => {
      await expect(store.set("", "value")).rejects.toThrow(
        "ERR invalid key or value"
      );
    });
  });

  describe("List Operations", () => {
    it("should lpush and lrange", async () => {
      await store.lpush("mylist", "a");
      await store.lpush("mylist", "b");
      expect(await store.lrange("mylist", 0, -1)).toEqual(["b", "a"]);
    });

    it("should rpush elements", async () => {
      await store.rpush("mylist", "a");
      await store.rpush("mylist", "b");
      expect(await store.lrange("mylist", 0, -1)).toEqual(["a", "b"]);
    });

    it("should handle empty list", async () => {
      expect(await store.lrange("emptylist", 0, -1)).toBeNull();
    });

    it("should reject string operations on lists", async () => {
      await store.lpush("mylist", "a");
      await expect(store.set("mylist", "value")).rejects.toThrow(
        WrongTypeError
      );
    });

    it("should reject list operations on strings", async () => {
      await store.set("mystring", "value");
      await expect(store.lpush("mystring", "a")).rejects.toThrow(
        WrongTypeError
      );
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
      await store.lpush("mylist", "a");

      expect(await store.delete("foo")).toBe(true);
      expect(await store.delete("mylist")).toBe(true);
      expect(await store.get("foo")).toBeNull();
      expect(await store.lrange("mylist", 0, -1)).toBeNull();
    });

    it("should delete multiple keys", async () => {
      await store.set("key1", "val1");
      await store.set("key2", "val2");
      await store.lpush("list1", "a");

      expect(
        await store.deleteMultiple(["key1", "key2", "list1", "nonexistent"])
      ).toBe(3);
    });
  });

  describe("Concurrency Tests", () => {
    it("should handle 100 concurrent SET operations", async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        store.set(`key${i}`, `value${i}`)
      );

      await Promise.all(promises);

      for (let i = 0; i < 100; i++) {
        expect(await store.get(`key${i}`)).toBe(`value${i}`);
      }
    }, 10000);

    it("should prevent race conditions in increment", async () => {
      await store.set("counter", "0");

      const increment = async () => {
        const value = await store.get("counter");
        const newValue = parseInt(value || "0") + 1;
        await store.set("counter", newValue.toString());
      };

      await Promise.all(
        Array(50)
          .fill(0)
          .map(() => increment())
      );
      expect(await store.get("counter")).toBe("50");
    });

    it("should handle mixed operations concurrently", async () => {
      await Promise.all([
        store.set("key1", "val1"),
        store.lpush("list1", "a"),
        store.set("key2", "val2"),
        store.rpush("list1", "b"),
      ]);

      expect(await store.get("key1")).toBe("val1");
      expect(await store.lrange("list1", 0, -1)).toEqual(["a", "b"]);
    });
  });
});
