/**
 * Типы для библиотеки winston
 */
declare module 'winston' {
  export interface Logger {
    error(message: any, ...meta: any[]): Logger;
    warn(message: any, ...meta: any[]): Logger;
    info(message: any, ...meta: any[]): Logger;
    debug(message: any, ...meta: any[]): Logger;
    verbose(message: any, ...meta: any[]): Logger;
  }

  export interface LoggerOptions {
    level?: string;
    format?: Logform.Format;
    defaultMeta?: any;
    transports?: transport[];
  }

  export namespace Logform {
    export interface Format {}
  }

  export class transport {}

  export namespace transports {
    export class Console extends transport {
      constructor(options?: any);
    }
    export class File extends transport {
      constructor(options?: any);
    }
  }

  export namespace format {
    export function timestamp(options?: any): Logform.Format;
    export function errors(options?: any): Logform.Format;
    export function json(): Logform.Format;
    export function combine(...formats: Logform.Format[]): Logform.Format;
    export function colorize(): Logform.Format;
    export function printf(fn: (info: any) => string): Logform.Format;
  }

  export function createLogger(options: LoggerOptions): Logger;
}
