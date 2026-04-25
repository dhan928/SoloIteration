
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
};

function log(color, prefix, msg) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] [${prefix}] ${msg}${COLORS.reset}`);
}

function info(msg) {
  log(COLORS.blue, 'INFO', msg);
}

function success(msg) {
  log(COLORS.green, 'SUCCESS', msg);
}

function warning(msg) {
  log(COLORS.yellow, 'WARN', msg);
}

function error(msg) {
  log(COLORS.red, 'ERROR', msg);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function checkHttpReady(url, timeoutMs = 15000) {
  const start = Date.now();
  while (true) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch (_) {
      // Not ready yet
    }
    if (Date.now() - start > timeoutMs) {
      return false;
    }
    await sleep(250);
  }
}

function startProcess(name, command, args, cwd) {
  return new Promise((resolve, reject) => {
    info(`Starting ${name}...`);
    
    const child = spawn(
      process.platform === 'win32' ? `${command}.cmd` : command,
      args,
      { cwd, stdio: 'pipe' }
    );

    child.stdout?.on('data', (data) => {
      console.log(`  [${name}] ${data}`);
    });

    child.stderr?.on('data', (data) => {
      console.error(`  [${name}] ${data}`);
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to start ${name}: ${err.message}`));
    });

    child.on('exit', (code) => {
      if (code !== null && code !== 0) {
        reject(new Error(`${name} exited with code ${code}`));
      }
    });

    resolve(child);
  });
}

async function validateSetup() {
  info('Validating setup...');

  // Check directories exist
  const dirs = [
    { path: 'backend', name: 'Backend' },
    { path: 'frontend', name: 'Frontend' },
  ];

  for (const { path: dir, name } of dirs) {
    if (!fs.existsSync(path.join(process.cwd(), dir))) {
      error(`${name} directory not found: ${dir}`);
      process.exit(1);
    }
  }

  // Check package.json files
  const pkgFiles = [
    path.join(process.cwd(), 'backend', 'package.json'),
    path.join(process.cwd(), 'frontend', 'package.json'),
  ];

  for (const pkgFile of pkgFiles) {
    if (!fs.existsSync(pkgFile)) {
      error(`Package file not found: ${pkgFile}`);
      process.exit(1);
    }
  }

  // Check .env file exists for backend
  const envFile = path.join(process.cwd(), 'backend', '.env');
  if (!fs.existsSync(envFile)) {
    warning('Backend .env file not found');
    warning('Creating .env from .env.example...');
    const exampleFile = path.join(process.cwd(), 'backend', '.env.example');
    if (fs.existsSync(exampleFile)) {
      fs.copyFileSync(exampleFile, envFile);
      success('.env created from .env.example');
    } else {
      warning('Please configure backend/.env manually');
    }
  }

  success('Setup validated');
}

async function main() {
  const args = process.argv.slice(2);
  const runTests = args.includes('--test');
  const runRealTests = args.includes('--real');
  const backendOnly = args.includes('--backend');
  const frontendOnly = args.includes('--frontend');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    console.log(`
LLM Inference App - Master Startup Script

Usage:
  node startup.js              Start both backend and frontend
  node startup.js --test       Start servers and run E2E tests
  node startup.js --backend    Start only backend server
  node startup.js --frontend   Start only frontend server
  node startup.js --help       Show this help message

Examples:
  # Full startup with tests
  node startup.js --test

  # Development mode
  node startup.js

  # Test specific server
  node startup.js --backend
    `);
    process.exit(0);
  }

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     LLM INFERENCE APP - STARTUP                               ║
╚════════════════════════════════════════════════════════════════╝
  `);

  try {
    await validateSetup();

    const servers = [];
    const backendCwd = path.join(process.cwd(), 'backend');
    const frontendCwd = path.join(process.cwd(), 'frontend');

    // Start backend
    if (!frontendOnly) {
      const portAvailable = await checkPort(3000);
      if (!portAvailable) {
        warning('Port 3000 already in use (backend may be running)');
      } else {
        try {
          const backend = await startProcess(
            'BACKEND',
            'npm',
            ['run', 'dev'],
            backendCwd
          );
          servers.push({ name: 'backend', process: backend });

          info('Waiting for backend to be ready...');
          const ready = await checkHttpReady('http://localhost:3000/health');
          if (ready) {
            success('Backend ready on http://localhost:3000');
          } else {
            warning('Backend did not respond to health check');
          }
        } catch (err) {
          error(err.message);
          process.exit(1);
        }
      }
    }

    // Start frontend
    if (!backendOnly) {
      const portAvailable = await checkPort(5500);
      if (!portAvailable) {
        warning('Port 5500 already in use (frontend may be running)');
      } else {
        try {
          const frontend = await startProcess(
            'FRONTEND',
            'npx',
            ['http-server', '-p', '5500', '-c-1'],
            frontendCwd
          );
          servers.push({ name: 'frontend', process: frontend });

          info('Waiting for frontend to be ready...');
          const ready = await checkHttpReady('http://localhost:5500/index.html');
          if (ready) {
            success('Frontend ready on http://localhost:5500');
          } else {
            warning('Frontend did not respond');
          }
        } catch (err) {
          error(err.message);
          process.exit(1);
        }
      }
    }

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║     ✅ ALL SERVERS READY                                       ║
╚════════════════════════════════════════════════════════════════╝

Access the application:
  🌐 http://localhost:5500

API endpoints:
  🔌 http://localhost:3000/api/v1

Logs:
  Each server logs above with [BACKEND] or [FRONTEND] prefix

Press Ctrl+C to stop all servers

    `);

    // Run tests if requested
    if (runTests) {
      info('Running E2E tests...');
      try {
        const testResult = await new Promise((resolve, reject) => {
          const testProcess = spawn(
            process.platform === 'win32' ? 'npm.cmd' : 'npm',
            ['run', 'test:e2e'],
            { cwd: frontendCwd, stdio: 'inherit' }
          );
          testProcess.on('exit', (code) => {
            if (code === 0) resolve(true);
            else reject(new Error(`Tests failed with code ${code}`));
          });
          testProcess.on('error', reject);
        });
        if (testResult) {
          success('All tests passed!');
        }
      } catch (err) {
        error(`Tests failed: ${err.message}`);
      }
    }

    // Keep running until Ctrl+C
    await new Promise(() => {
      // Never resolve, just keep running
    });
  } catch (err) {
    error(err.message);
    process.exit(1);
  } finally {
    // This won't normally execute unless an error occurs before the infinite wait
    info('Shutting down...');
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n');
  info('Shutting down servers...');
  process.exit(0);
});

main().catch((err) => {
  error(err.message);
  process.exit(1);
});
