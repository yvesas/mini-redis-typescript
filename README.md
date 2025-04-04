# Mini-Redis using Typescript


## Prerequisites

Before you begin, make sure you have installed:

[Redis-CLI](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/)

---


## **🚀 Running the Application**

### 1. Install the dependencies and then start

```
pnpm i && pnpm start
```

### 2. In another terminal after installing Redis-CLI connect to Mini-Redis

Use the '--raw' parameter so that redis-cli does not report the bytes in raw form instead of decoding them to UTF-8.

Client situation (redis-cli), as the server (Mini-Redis) works and persists on disk with UTF-8.

```
redis-cli -p 6379 --raw
```

---
