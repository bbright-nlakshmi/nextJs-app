// utils/logger.ts
import { appConfig } from '@/app/config';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogMessage {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}

 export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = this.isProduction ? 'warn' : 'debug';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 4,
      warn: 3,
      info: 2,
      debug: 1
    };
    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(message: LogMessage): string {
    const { level, message: msg, context, timestamp } = message;
    const contextStr = context ? `\nContext: ${JSON.stringify(context, null, 2)}` : '';
    return `[${timestamp.toISOString()}] [${level.toUpperCase()}] ${msg}${contextStr}`;
  }

  private logToConsole(message: LogMessage): void {
    const formatted = this.formatMessage(message);
    switch (message.level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      default:
        console.debug(formatted);
    }
  }

  private async logToServer(message: LogMessage): Promise<void> {
    if (!this.isProduction) return;

    try {
      const payload = {
        ...message,
        tenant_id: appConfig.tenantId,
        app_version: appConfig.version,
        environment: process.env.NODE_ENV
      };

      await fetch(`${appConfig.apiBaseUrl}/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send log to server:', error);
    }
  }

  public error(message: string, context?: Record<string, unknown>): void {
    const logMessage: LogMessage = {
      level: 'error',
      message,
      context,
      timestamp: new Date()
    };

    if (this.shouldLog('error')) {
      this.logToConsole(logMessage);
      this.logToServer(logMessage).catch(console.error);
    }
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    const logMessage: LogMessage = {
      level: 'warn',
      message,
      context,
      timestamp: new Date()
    };

    if (this.shouldLog('warn')) {
      this.logToConsole(logMessage);
      this.logToServer(logMessage).catch(console.error);
    }
  }

  public info(message: string, context?: Record<string, unknown>): void {
    const logMessage: LogMessage = {
      level: 'info',
      message,
      context,
      timestamp: new Date()
    };

    if (this.shouldLog('info')) {
      this.logToConsole(logMessage);
      this.logToServer(logMessage).catch(console.error);
    }
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    const logMessage: LogMessage = {
      level: 'debug',
      message,
      context,
      timestamp: new Date()
    };

    if (this.shouldLog('debug')) {
      this.logToConsole(logMessage);
      if (!this.isProduction) {
        this.logToServer(logMessage).catch(console.error);
      }
    }
  }
}

export const logger = Logger.getInstance();