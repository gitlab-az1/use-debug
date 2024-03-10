import { EventLoop, EventEmitter, Event as BaseEvent } from 'not-synchronous';

import type { Writable } from './types';
import { isBrowser, removeAsciCharacters } from './util';
import { jsonSafeStringify } from './_internals/safe-json';
import { ASCI_BLUE, ASCI_BRIGHT_BLUE, ASCI_BRIGHT_YELLOW, ASCI_CYAN, ASCI_GREEN, ASCI_MAGENTA, ASCI_RED, ASCI_RESET } from './_internals/asci';



export type LevelDescriptor = 
  | 'fatal'
  | 'error'
  | 'warning'
  | 'info'
  | 'debug'
  | 'trace'
  | 'audit'
  | 'metric';

export const enum LogLevel {
  Off = 0x1,
  Fatal = 0xa,
  Error = 0x14,
  Warning = 0x1e,
  Info = 0x28,
  Debug = 0x32,
  Trace = 0x3c,
  Audit = 0x62,
  Metric = 0x63,
}


export interface Log {
  level: LogLevel;
  message: any;
  timestamp: number;
  type?: string;
  id?: string;
  namespace?: string;
}


/* events */
export class LogEvent extends BaseEvent<Log> {
  constructor(target: Log) {
    super('log', target, { cancelable: false });
  }
}

export interface LogHandlerDefaultEventsMap {
  log: LogEvent;
}
/* events */


export function buildMessageFromEvent(e: LogEvent): string {
  const content = ['string', 'number'].includes(typeof e.target.message) ?
    e.target.message :
    jsonSafeStringify(e.target.message, null, 2) || '[Failed to stringify log message]';

  let level: string = '';

  const pid = isBrowser() ?
    e.target.namespace ? 
      ` ${ASCI_MAGENTA}(at ${e.target.namespace})${ASCI_RESET} ` :
      '' :
    ` ${ASCI_MAGENTA}(${e.target.namespace ? 'at ' + e.target.namespace + ' - ' : ''}${process.pid})${ASCI_RESET} `;

  const type = e.target.type ? ` ${ASCI_BLUE}${e.target.type}${e.target.id ? ' from "' + e.target.id + '"' : ''} >>${ASCI_RESET} ` : '';

  switch(e.target.level) {
    case LogLevel.Audit:
      level = ` ${ASCI_CYAN}[${levelToString(e.target.level)}]${ASCI_RESET} `;
      break;
    case LogLevel.Metric:
      level = ` ${ASCI_CYAN}[${levelToString(e.target.level)}]${ASCI_RESET} `;
      break;
    case LogLevel.Error:
    case LogLevel.Fatal:
      level = ` ${ASCI_RED}[${levelToString(e.target.level)}]${ASCI_RESET} `;
      break;
    case LogLevel.Warning:
      level = ` ${ASCI_BRIGHT_YELLOW}[${levelToString(e.target.level)}]${ASCI_RESET} `;
      break;
    case LogLevel.Trace:
      level = ` ${ASCI_MAGENTA}[${levelToString(e.target.level)}]${ASCI_RESET} `;
      break;
    case LogLevel.Debug:
      level = ` ${ASCI_GREEN}[${levelToString(e.target.level)}]${ASCI_RESET} `;
      break;
    default:
      level = ` ${ASCI_BRIGHT_BLUE}[${levelToString(e.target.level)}]${ASCI_RESET} `;
      break;
  }
    
  return `${ASCI_GREEN}${new Date().toISOString()}${ASCI_RESET} ${level.trim()}${pid}${type}${content}`;
}

export function levelToString(level: number): LevelDescriptor {
  switch(level) {
    case LogLevel.Fatal:
      return 'fatal';
    case LogLevel.Error:
      return 'error';
    case LogLevel.Warning:
      return 'warning';
    case LogLevel.Info:
      return 'info';
    case LogLevel.Debug:
      return 'debug';
    case LogLevel.Trace:
      return 'trace';
    case LogLevel.Audit:
      return 'audit';
    case LogLevel.Metric:
      return 'metric';
    default:
      throw new Error(`Unrecognized log level: ${level}`);
  }
}

export function levelToEnum(level: LevelDescriptor): LogLevel {
  switch(level) {
    case 'audit':
      return LogLevel.Audit;
    case 'debug':
      return LogLevel.Debug;
    case 'error':
      return LogLevel.Error;
    case 'fatal':
      return LogLevel.Fatal;
    case 'info':
      return LogLevel.Info;
    case 'metric':
      return LogLevel.Metric;
    case 'trace':
      return LogLevel.Trace;
    case 'warning':
      return LogLevel.Warning;
    default:
      throw new Error(`Unrecognized log level: ${level}`);
  }
}


export function writeStandardOutput(value: string): void {
  if(!isBrowser()) return void process.stdout.write(value.endsWith('\n') ? value : `${value}\n`);
  console.log(removeAsciCharacters(value));
}

export function writeStandardError(value: string): void {
  if(!isBrowser()) return void process.stderr.write(value.endsWith('\n') ? value : `${value}\n`);
  console.error(removeAsciCharacters(value));
}

export function consoleHandler(e: LogEvent): void {
  const message = buildMessageFromEvent(e);

  if(e.target.level === LogLevel.Audit ||
    e.target.level === LogLevel.Metric) {
    console.log(message);
  } else if(
    e.target.level === LogLevel.Fatal ||
    e.target.level === LogLevel.Error
  ) {
    console.error(message);
  } else if(e.target.level === LogLevel.Warning) {
    console.warn(message);
  } else if(e.target.level === LogLevel.Trace) {
    console.trace(message);
  } else if(e.target.level === LogLevel.Debug) {
    console.debug(message);
  } else {
    console.log(message);
  }
}

export function defaultHandler(e: LogEvent): void {
  const message = buildMessageFromEvent(e);

  if(e.target.level === LogLevel.Audit ||
    e.target.level === LogLevel.Metric) {
    writeStandardOutput(message);
  } else if(
    e.target.level === LogLevel.Fatal ||
    e.target.level === LogLevel.Error
  ) {
    writeStandardError(message);
  } else {
    writeStandardOutput(message);
  }
}


export type LogHandlerProps = {
  level?: LevelDescriptor | LogLevel;
  allowMetrics?: boolean;
  allowAudits?: boolean;
  handler?: (event: LogEvent) => void;
}

/** @internal */
export class LogHandler extends EventEmitter {
  readonly #handler: (event: LogEvent) => void;
  #onMessageCallback?: (message: string, event: LogEvent) => void;

  private _audits: boolean;
  private _metrics: boolean;

  public readonly level: LogLevel;

  constructor(props?: LogHandlerProps) {
    super({ onListenerError: e => writeStandardError(`Error in log handler: ${e.message}`) });

    this._audits = typeof props?.allowAudits === 'boolean' ?
      props.allowAudits :
      true;

    this._metrics = typeof props?.allowMetrics === 'boolean' ?
      props.allowMetrics :
      true;

    this.#handler = props?.handler && typeof props.handler === 'function' ?
      props.handler :
      defaultHandler;

    this.level = props?.level ?
      typeof props.level === 'string' ?
        levelToEnum(props.level) :
        levelToEnum(levelToString(props.level)) :
      LogLevel.Info;

    this.subscribe('message-transporter:log', (event: LogEvent) => {
      if(!this.shouldReport(event.target.level)) return;

      EventLoop.immediate(() => {
        this.#handler(event);
        this.#onMessageCallback?.(removeAsciCharacters(buildMessageFromEvent(event)), event);
      });
    });
  }

  public set onmessage(handler: (message: string, event: LogEvent) => void) {
    if(typeof handler !== 'function') return;
    this.#onMessageCallback = handler;
  }

  public isDisposed(): boolean {
    return this.level === LogLevel.Off;
  }

  public get levelDescriptor(): LevelDescriptor {
    return levelToString(this.level);
  }

  public shouldReport(level: LogLevel): boolean {
    return (
      (level === LogLevel.Audit && this._audits === true) ||
      (level === LogLevel.Metric && this._metrics === true) ||
      level <= this.level
    );
  }

  public override dispose(): void {
    super.dispose();

    this._audits = false;
    this._metrics = false;
    (<Writable<typeof this>>this).level = LogLevel.Off;
  }

  public override [Symbol.dispose](): void {
    this.dispose();
  }
}

export default LogHandler;
