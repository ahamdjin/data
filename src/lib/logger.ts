import pino from 'pino';

const logger = pino({
  level: process.env.DEBUG === 'true' ? 'debug' : 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

export function sanitizeMessages(messages: any[]): any[] {
  return messages.map((m: any) => {
    const sanitized: any = { role: m.role };
    if (m.tool) sanitized.tool = m.tool;
    return sanitized;
  });
}

export function sanitizeQuery(table: string) {
  return { table };
}

export { logger };
