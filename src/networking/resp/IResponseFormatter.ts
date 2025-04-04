export interface IResponseFormatter {
  formatSimpleString(message: string): string;
  formatError(type: string, message: string): string;
  formatInteger(value: number): string;
  formatBulkString(value: string | null): string;
  formatArray(values: Array<string | null> | null): string;
}

export class RESPResponseFormatter implements IResponseFormatter {
  formatSimpleString(message: string): string {
    return `+${message}\r\n`;
  }

  formatError(type: string, message: string): string {
    return `-${type} ${message}\r\n`;
  }

  formatInteger(value: number): string {
    return `:${value}\r\n`;
  }

  formatBulkString(value: string | null): string {
    if (value === null) return "$-1\r\n";
    if (value === "") return "$0\r\n\r\n";
    return `$${Buffer.byteLength(value, "utf8")}\r\n${value}\r\n`;
  }

  formatArray(values: Array<string | null> | null): string {
    if (values === null) return "*-1\r\n";

    let response = `*${values.length}\r\n`;
    for (const val of values) {
      if (val === null) {
        response += "$-1\r\n";
      } else {
        response += this.formatBulkString(val);
      }
    }
    return response;
  }
}
