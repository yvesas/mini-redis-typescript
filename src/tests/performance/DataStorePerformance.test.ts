import { DataStore } from "../../core/DataStore";

describe("DataStore Performance", () => {
  const store = new DataStore();
  const testSize = 1000;

  it(`should process ${testSize} SET operations under 500ms`, async () => {
    const start = process.hrtime();

    for (let i = 0; i < testSize; i++) {
      await store.set(`perfkey${i}`, `value${i}`);
    }

    const [seconds, nanoseconds] = process.hrtime(start);
    const totalMs = seconds * 1000 + nanoseconds / 1000000;
    console.log(`Performance: ${totalMs}ms for ${testSize} operations`);

    expect(totalMs).toBeLessThan(500);
  }, 10000);

  it(`should process ${testSize} GET operations under 300ms`, async () => {
    // > Pre-populate the data store
    for (let i = 0; i < testSize; i++) {
      await store.set(`perfkey${i}`, `value${i}`);
    }

    const start = process.hrtime();

    for (let i = 0; i < testSize; i++) {
      await store.get(`perfkey${i}`);
    }

    const [seconds, nanoseconds] = process.hrtime(start);
    const totalMs = seconds * 1000 + nanoseconds / 1000000;
    console.log(`Performance: ${totalMs}ms for ${testSize} operations`);

    expect(totalMs).toBeLessThan(300);
  }, 10000);
});
