import LogHandler, { LogEvent, LogLevel, defaultHandler } from './handler';


export type MessageOptions = {
  type?: string;
  id?: string;
}

export class Logger {
  readonly #handlers: LogHandler[] = [];
  readonly #namespace?: string;

  constructor();
  constructor(namespace: string);
  constructor(handler: LogHandler);
  constructor(handler: LogHandler, namespace?: string);
  constructor(handlerOrNamespace?: LogHandler | string, ns?: string) {
    if(handlerOrNamespace instanceof LogHandler) {
      this.#handlers = [handlerOrNamespace];
      this.#namespace = ns;
    } else {
      this.#namespace = typeof handlerOrNamespace === 'string' ? handlerOrNamespace : undefined;

      this.#handlers = [
        new LogHandler({
          allowAudits: true,
          allowMetrics: true,
          level: LogLevel.Metric,
          handler: defaultHandler,
        }),
      ];
    }
  }

  public info(message: any, options?: MessageOptions): void {
    const eachHandlers = (n: number, pos: number = 0) => {
      if(pos <= n) {
        this.#handlers[pos].emit('message-transporter:log', new LogEvent({
          message,
          namespace: this.#namespace,
          level: LogLevel.Info,
          timestamp: Date.now(),
          id: options?.id,
          type: options?.type,
        }));

        eachHandlers(n, pos + 1);
      }
    };

    eachHandlers(this.#handlers.length - 1);
  }

  public error(message: any, options?: MessageOptions): void {
    const eachHandlers = (n: number, pos: number = 0) => {
      if(pos <= n) {
        this.#handlers[pos].emit('message-transporter:log', new LogEvent({
          message,
          namespace: this.#namespace,
          level: LogLevel.Error,
          timestamp: Date.now(),
          id: options?.id,
          type: options?.type,
        }));
    
        eachHandlers(n, pos + 1);
      }
    };
    
    eachHandlers(this.#handlers.length - 1);
  }

  public audit(message: any, options?: MessageOptions): void {
    const eachHandlers = (n: number, pos: number = 0) => {
      if(pos <= n) {
        this.#handlers[pos].emit('message-transporter:log', new LogEvent({
          message,
          namespace: this.#namespace,
          level: LogLevel.Audit,
          timestamp: Date.now(),
          id: options?.id,
          type: options?.type,
        }));
        
        eachHandlers(n, pos + 1);
      }
    };
        
    eachHandlers(this.#handlers.length - 1);
  }

  public metric(message: any, options?: MessageOptions): void {
    const eachHandlers = (n: number, pos: number = 0) => {
      if(pos <= n) {
        this.#handlers[pos].emit('message-transporter:log', new LogEvent({
          message,
          namespace: this.#namespace,
          level: LogLevel.Metric,
          timestamp: Date.now(),
          id: options?.id,
          type: options?.type,
        }));
            
        eachHandlers(n, pos + 1);
      }
    };
                
    eachHandlers(this.#handlers.length - 1);
  }

  public debug(message: any, options?: MessageOptions): void {
    const eachHandlers = (n: number, pos: number = 0) => {
      if(pos <= n) {
        this.#handlers[pos].emit('message-transporter:log', new LogEvent({
          message,
          namespace: this.#namespace,
          level: LogLevel.Debug,
          timestamp: Date.now(),
          id: options?.id,
          type: options?.type,
        }));
                
        eachHandlers(n, pos + 1);
      }
    };
                        
    eachHandlers(this.#handlers.length - 1);
  }

  public trace(message: any, options?: MessageOptions): void {
    const eachHandlers = (n: number, pos: number = 0) => {
      if(pos <= n) {
        this.#handlers[pos].emit('message-transporter:log', new LogEvent({
          message,
          namespace: this.#namespace,
          level: LogLevel.Trace,
          timestamp: Date.now(),
          id: options?.id,
          type: options?.type,
        }));
                        
        eachHandlers(n, pos + 1);
      }
    };
                                
    eachHandlers(this.#handlers.length - 1);
  }

  public warning(message: any, options?: MessageOptions): void {
    const eachHandlers = (n: number, pos: number = 0) => {
      if(pos <= n) {
        this.#handlers[pos].emit('message-transporter:log', new LogEvent({
          message,
          namespace: this.#namespace,
          level: LogLevel.Warning,
          timestamp: Date.now(),
          id: options?.id,
          type: options?.type,
        }));
                                    
        eachHandlers(n, pos + 1);
      }
    };
                                        
    eachHandlers(this.#handlers.length - 1);
  }

  public fatal(message: any, options?: MessageOptions): void {
    const eachHandlers = (n: number, pos: number = 0) => {
      if(pos <= n) {
        this.#handlers[pos].emit('message-transporter:log', new LogEvent({
          message,
          namespace: this.#namespace,
          level: LogLevel.Fatal,
          timestamp: Date.now(),
          id: options?.id,
          type: options?.type,
        }));
                                        
        eachHandlers(n, pos + 1);
      }
    };
                                            
    eachHandlers(this.#handlers.length - 1);
  }

  public addHandler(handler: LogHandler): void {
    if(!(handler instanceof LogHandler)) return;
    this.#handlers.push(handler);
  }

  public removeHandler(handler: LogHandler): void {
    if(!(handler instanceof LogHandler)) return;
    const index = this.#handlers.indexOf(handler);
        
    if(index !== -1) {
      this.#handlers.splice(index, 1);
    }
  }

  public get handlers(): LogHandler[] {
    return this.#handlers;
  }

  public get namespace(): string | undefined {
    return this.#namespace;
  }

  public get level(): LogLevel {
    let highestLevel = -1;

    const eachHandlers = (n: number, pos: number = 0) => {
      if(pos <= n) {
        if(this.#handlers[pos].level > highestLevel) {
          highestLevel = this.#handlers[pos].level;
        }

        eachHandlers(n, pos + 1);
      }
    };

    eachHandlers(this.#handlers.length - 1);
    return highestLevel;
  }
}
