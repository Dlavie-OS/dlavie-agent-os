export function timestamp() {
  return new Date().toISOString();
}

export function createLogger(scope = 'app') {
  const write = (level, args) => {
    const prefix = `[${timestamp()}] [${scope}]`;
    const line = [prefix, ...args];
    if (level === 'error') return console.error(...line);
    if (level === 'warn') return console.warn(...line);
    return console.log(...line);
  };

  return {
    info: (...args) => write('info', args),
    warn: (...args) => write('warn', args),
    error: (...args) => write('error', args),
    debug: (...args) => {
      if (process.env.DEBUG || process.env.LOG_LEVEL === 'debug') write('info', args);
    }
  };
}
