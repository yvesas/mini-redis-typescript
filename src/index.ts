import { DataStore } from "./core/DataStore";
import { ExpirationManager } from "./core/Expiration";

console.log("Hello, Redis");

const store = new DataStore();
const expiration = new ExpirationManager(store);

async function testExpiration() {
  console.log("SET registro 'temp' que expira em 2 segundos");
  await store.set("temp", "data", 2);
  expiration.setExpiration("temp", 2);

  setTimeout(async () => {
    console.log("Deve ser null após 2 segundos: ", await store.get("temp"));
  }, 2500);
}

testExpiration();
