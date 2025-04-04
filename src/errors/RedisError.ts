export class RedisError extends Error {
  constructor(public readonly type: string, message: string) {
    super(`${type} ${message}`.trim());
    Object.setPrototypeOf(this, RedisError.prototype);
  }

  static isRedisError(err: unknown): err is RedisError {
    return (
      err instanceof Error &&
      "type" in err &&
      typeof (err as any).type === "string"
    );
  }
}

export class WrongTypeError extends RedisError {
  constructor(
    message = "Operation against a key holding the wrong kind of value"
  ) {
    super("WRONGTYPE", message);
  }
}

export class SyntaxError extends RedisError {
  constructor(message = "Syntax error") {
    super("SYNTAX", message);
  }
}
