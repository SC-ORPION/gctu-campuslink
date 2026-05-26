import * as fs from 'fs';
import * as path from 'path';

try {
  // Travel up to find the root folder containing .env if process.cwd() is nested, or use process.cwd()
  const cwd = process.cwd();
  const envPath = path.resolve(cwd, '.env');
  
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const index = trimmed.indexOf('=');
        if (index > 0) {
          const key = trimmed.substring(0, index).trim();
          let val = trimmed.substring(index + 1).trim();
          // Remove surrounding quotes if any
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (key) {
            process.env[key] = val;
          }
        }
      }
    });
    console.log(`[LOAD-ENV] Programmatically loaded .env from ${envPath}`);
    console.log(`[LOAD-ENV] DATABASE_URL is: "${process.env.DATABASE_URL}"`);
  } else {
    console.warn(`[LOAD-ENV] .env file not found at ${envPath}`);
  }
} catch (e) {
  console.error('[LOAD-ENV] Error programmatically loading .env file:', e);
}
