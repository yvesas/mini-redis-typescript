export interface IResponseFormatter {
  formatSimpleString(message: string): string;
  formatError(message: string): string;
  formatInteger(value: number): string;
  formatBulkString(value: string | null): string;
  formatArray(values: any[] | null): string;
}

export class RESPResponseFormatter implements IResponseFormatter {
  formatSimpleString(message: string): string {
    return `+${message}\r\n`;
  }

  formatError(message: string): string {
    return `-${message}\r\n`;
  }

  formatInteger(value: number): string {
    return `:${value}\r\n`;
  }

  formatBulkString(value: string | null): string {
    return value === null
      ? "$-1\r\n"
      : `$${Buffer.byteLength(value, "utf8")}\r\n${value}\r\n`;
  }

  formatArray(values: any[] | null): string {
    if (values === null) return "*-1\r\n";

    let response = `*${values.length}\r\n`;
    for (const val of values) {
      response += this.formatBulkString(String(val));
    }
    return response;
  }
}
