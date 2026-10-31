import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { spawnSync } from 'child_process';

type PgTool = "pg_dump" | "pg_restore" | "psql" | "createdb" | "dropdb";

export function shouldRequirePgTools(): boolean {
  return process.env.REQUIRE_PG_TOOLS === "1";
}

function checkExecutable(filePath: string): boolean {
  try {
    if (process.platform !== 'win32') {
      fs.accessSync(filePath, fs.constants.X_OK);
      return true;
    } else {
      return fs.existsSync(filePath);
    }
  } catch (e) {
    return false;
  }
}

export function resolvePgBinary(name: PgTool): string | null {
  if (process.env.PG_TOOLS_DISABLE_KNOWN_LOCATIONS === '1') {
    // Hidden toggle for testing skip behavior
  }

  const envVarMap: Record<PgTool, string> = {
    "pg_dump": "PG_DUMP_BIN",
    "pg_restore": "PG_RESTORE_BIN",
    "psql": "PSQL_BIN",
    "createdb": "CREATEDB_BIN",
    "dropdb": "DROPDB_BIN"
  };
  const envVarName = envVarMap[name];
  const explicitPath = process.env[envVarName];

  // 1. Explicit env var
  if (explicitPath) {
    if (checkExecutable(explicitPath)) {
      return explicitPath;
    }
    throw new Error(`Environment variable ${envVarName} is set to '${explicitPath}', but it does not exist or is not executable.`);
  }

  // Windows extensions
  const exts = process.platform === 'win32' ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';') : [''];

  // 2. PG_BIN_DIR
  if (process.env.PG_BIN_DIR) {
    for (const ext of exts) {
      const p = path.join(process.env.PG_BIN_DIR, name + ext.toLowerCase());
      if (checkExecutable(p)) return p;
    }
  }

  // 3. PATH lookup
  if (process.env.PATH) {
    const paths = process.env.PATH.split(path.delimiter);
    for (const p of paths) {
      for (const ext of exts) {
        const fullPath = path.join(p, name + ext.toLowerCase());
        if (checkExecutable(fullPath)) return fullPath;
      }
    }
  }

  if (process.env.PG_TOOLS_DISABLE_KNOWN_LOCATIONS === '1') {
    return null;
  }

  // 4. Well-known locations
  let possibleDirs: string[] = [];
  if (process.platform === 'win32') {
    const progFiles = [process.env.ProgramFiles, process.env['ProgramFiles(x86)']].filter(Boolean) as string[];
    for (const pf of progFiles) {
      const pgDir = path.join(pf, 'PostgreSQL');
      if (fs.existsSync(pgDir)) {
        try {
          const versions = fs.readdirSync(pgDir)
            .filter(v => !isNaN(Number(v)))
            .sort((a, b) => Number(b) - Number(a));
          for (const v of versions) {
            possibleDirs.push(path.join(pgDir, v, 'bin'));
          }
        } catch (e) {}
      }
    }
  } else if (process.platform === 'darwin') {
    const homebrewBaseDirs = ['/opt/homebrew/opt', '/usr/local/opt'];
    for (const base of homebrewBaseDirs) {
      if (fs.existsSync(base)) {
        try {
          const versions = fs.readdirSync(base)
            .filter(d => d.startsWith('postgresql@'))
            .sort((a, b) => a.localeCompare(b)).reverse();
          for (const v of versions) {
            possibleDirs.push(path.join(base, v, 'bin'));
          }
        } catch (e) {}
      }
    }
    const pgAppDir = '/Applications/Postgres.app/Contents/Versions';
    if (fs.existsSync(pgAppDir)) {
      try {
        const versions = fs.readdirSync(pgAppDir).sort().reverse();
        for (const v of versions) {
          possibleDirs.push(path.join(pgAppDir, v, 'bin'));
        }
      } catch(e) {}
    }
  } else {
    // Linux
    const pgLibs = '/usr/lib/postgresql';
    if (fs.existsSync(pgLibs)) {
      try {
        const versions = fs.readdirSync(pgLibs).sort().reverse();
        for (const v of versions) {
          possibleDirs.push(path.join(pgLibs, v, 'bin'));
        }
      } catch(e) {}
    }
    const usrPgsql = '/usr';
    if (fs.existsSync(usrPgsql)) {
      try {
        const dirs = fs.readdirSync(usrPgsql).filter(d => d.startsWith('pgsql-')).sort().reverse();
        for (const d of dirs) {
          possibleDirs.push(path.join(usrPgsql, d, 'bin'));
        }
      } catch(e) {}
    }
  }

  for (const dir of possibleDirs) {
    for (const ext of exts) {
      const fullPath = path.join(dir, name + ext.toLowerCase());
      if (checkExecutable(fullPath)) return fullPath;
    }
  }

  return null;
}

export function describePgBinary(name: PgTool): { path: string, source: "env"|"PG_BIN_DIR"|"PATH"|"known-location" } | null {
  const envVarMap: Record<PgTool, string> = {
    "pg_dump": "PG_DUMP_BIN",
    "pg_restore": "PG_RESTORE_BIN",
    "psql": "PSQL_BIN",
    "createdb": "CREATEDB_BIN",
    "dropdb": "DROPDB_BIN"
  };
  
  const explicitPath = process.env[envVarMap[name]];
  if (explicitPath && checkExecutable(explicitPath)) return { path: explicitPath, source: "env" };

  const exts = process.platform === 'win32' ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';') : [''];

  if (process.env.PG_BIN_DIR) {
    for (const ext of exts) {
      const p = path.join(process.env.PG_BIN_DIR, name + ext.toLowerCase());
      if (checkExecutable(p)) return { path: p, source: "PG_BIN_DIR" };
    }
  }

  if (process.env.PATH) {
    const paths = process.env.PATH.split(path.delimiter);
    for (const p of paths) {
      for (const ext of exts) {
        const fullPath = path.join(p, name + ext.toLowerCase());
        if (checkExecutable(fullPath)) return { path: fullPath, source: "PATH" };
      }
    }
  }

  const p = resolvePgBinary(name);
  if (p) return { path: p, source: "known-location" };
  
  return null;
}

export function runPgTool(name: string, args: string[], options?: { env?: Record<string,string>; cwd?: string; mustSucceed?: boolean }) {
  const res = spawnSync(name, args, {
    shell: false,
    env: { ...process.env, ...options?.env },
    cwd: options?.cwd
  });

  const status = res.status;
  const stdout = res.stdout ? res.stdout.toString() : '';
  const stderr = res.stderr ? res.stderr.toString() : '';

  if (options?.mustSucceed && status !== 0) {
    let safeStderr = stderr;
    const pwd = options?.env?.PGPASSWORD;
    if (pwd) {
      safeStderr = safeStderr.split(pwd).join('***REDACTED***');
    }
    throw new Error(`Tool ${name} failed with exit code ${status}: ${safeStderr}`);
  }

  return { status, stdout, stderr };
}

export function getTempFile(prefix: string, ext: string) {
  const rand = crypto.randomBytes(4).toString('hex');
  return path.join(os.tmpdir(), `${prefix}_${rand}${ext}`);
}
