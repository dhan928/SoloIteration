const { spawn } = require('child_process');
const path = require('path');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHttpOk(url, timeoutMs = 15000) {
  const start = Date.now();

  while (true) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch (_) {
      // ignore until ready
    }
    if (Date.now() - start > timeoutMs) {
      return false;
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

  child.stdout?.on('data', (data) => {
    console.log(`[${label}] ${data}`);
  });
  child.stderr?.on('data', (data) => {
    console.error(`[${label}] ${data}`);
  });

  return child;
}

async function main() {
  const headed = process.argv.includes('--headed');
  let frontendServer = null;
  let backendServer = null;

  try {
    // Always start servers fresh for real tests
    console.log('🚀 Starting servers for REAL integration tests...\n');

    const backendCwd = path.resolve(__dirname, '..', '..', 'backend');
    backendServer = startServer('npm', ['run', 'dev'], backendCwd, 'BACKEND');

    const frontendCwd = path.resolve(__dirname, '..');
    frontendServer = startServer(
      'npx',
      ['http-server', '-p', '5500', '-c-1'],
      frontendCwd,
      'FRONTEND'
    );

    console.log('\nWaiting for servers to be ready...');
    if (!await waitForHttpOk('http://localhost:3000/health')) {
      throw new Error('Backend health check failed - backend not responding');
    }
    console.log('✅ Backend ready');

    if (!await waitForHttpOk('http://localhost:5500/index.html')) {
      throw new Error('Frontend health check failed - frontend not responding');
    }
    console.log('✅ Frontend ready');

    console.log('\n✅ All servers ready. Running REAL integration tests...\n');

    // Run the real tests (no mocking)
    const testProcess = require('./realTests');
    await testProcess.runAll({ headed });

    console.log('\n✅ All integration tests completed!\n');
  } catch (err) {
    console.error('\n❌ Error:', err.message, '\n');
    process.exitCode = 1;
  } finally {
    console.log('Cleaning up servers...');
    if (backendServer && !backendServer.killed) {
      backendServer.kill();
      console.log('Backend stopped');
    }
    if (frontendServer && !frontendServer.killed) {
      frontendServer.kill();
      console.log('Frontend stopped');
    }
    // Give servers time to shut down
    await sleep(1000);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
