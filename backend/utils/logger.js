const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const logFile = path.join(LOG_DIR, 'app.log');

const timestamp = () => new Date().toISOString();

const write = (level, message) => {
  const line = `[${timestamp()}] [${level}] ${message}\n`;
  process.stdout.write(line);
  fs.appendFileSync(logFile, line);
};

const logger = {
  info:  (msg) => write('INFO',  msg),
  warn:  (msg) => write('WARN',  msg),
  error: (msg) => write('ERROR', msg),
};

module.exports = logger;
