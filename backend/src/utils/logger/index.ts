type LogLevel = 'INFO' | 'WARN' | 'ERROR';

class Logger {
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}]: ${message}`;
  }

  public info(message: string): void {
    console.log(this.formatMessage('INFO', message));
  }

  public warn(message: string): void {
    console.warn(this.formatMessage('WARN', message));
  }

  public error(message: string, error?: any): void {
    console.error(this.formatMessage('ERROR', message));
    if (error) {
      console.error(error);
    }
  }
}

export const logger = new Logger();
