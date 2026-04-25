const { spawn } = require('child_process');
const path = require('path');
const { runAll } = require('./tests');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHttpOk(url, timeoutMs = 15000) {
  const start = Date.now();

  while (true) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return;
    } catch (_) {
      // ignore until ready
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for ${url}`);
    }
    await sleep(250);
  }
}

function startServer(command, args, cwd, label) {
  console.log(`\n[${label}] Starting server...`);
  const child = spawn(
    process.platform === 'win32' ? `${command}.cmd` : command,
    args,
    { cwd, stdio: 'pipe' }
  );

  // Log output for debugging
  child.stdout?.on('data', (data) => {
    console.log(`[${label}] ${data}`);
  });
  child.stderr?.on('data', (data) => {
    console.error(`[${label}] ${data}`);
  });

  child.on('error', (err) => {
    console.error(`[${label}] Error: ${err.message}`);
  });

  return child;
}

function startFrontendServer() {
  const cwd = path.resolve(__dirname, '..');
  return startServer(
    'npx',
    ['http-server', '-p', '5500', '-c-1'],
    cwd,
    'FRONTEND'
  );
}

function startBackendServer() {
  const cwd = path.resolve(__dirname, '..', '..', 'backend');
  return startServer(
    'npm',
    ['run', 'dev'],
    cwd,
    'BACKEND'
  );
}

async function main() {
  const headed = process.argv.includes('--headed');
  const skipBackend = process.argv.includes('--skip-backend');
  let frontendServer = null;
  let backendServer = null;
  let startedFrontend = false;
  let startedBackend = false;

  try {
    // Check and start frontend
    try {
      await waitForHttpOk('http://localhost:5500/index.html', 1500);
      console.log('[FRONTEND] Server already running');
    } catch (_) {
      frontendServer = startFrontendServer();
      startedFrontend = true;
      await waitForHttpOk('http://localhost:5500/index.html');
      console.log('[FRONTEND] Server ready');
    }

    // Check and start backend
    if (!skipBackend) {
      try {
        await waitForHttpOk('http://localhost:3000/health', 1500);
        console.log('[BACKEND] Server already running');
      } catch (_) {
        backendServer = startBackendServer();
        startedBackend = true;
        await waitForHttpOk('http://localhost:3000/health');
        console.log('[BACKEND] Server ready');
      }
    }

    console.log('\n✅ All servers ready. Running tests...\n');
    await runAll({ headed });
    console.log('\n✅ All tests completed!\n');
  } catch (err) {
    console.error('\n❌ Test execution failed:', err.message, '\n');
    process.exitCode = 1;
  } finally {
    console.log('\nCleaning up servers...');
    if (startedFrontend && frontendServer && !frontendServer.killed) {
      frontendServer.kill();
      console.log('[FRONTEND] Server stopped');
    }
    if (startedBackend && backendServer && !backendServer.killed) {
      backendServer.kill();
      console.log('[BACKEND] Server stopped');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

