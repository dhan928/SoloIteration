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

function startFrontendServer() {
  const cwd = path.resolve(__dirname, '..');
  const child = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['http-server', '-p', '5500', '-c-1'],
    { cwd, stdio: 'inherit' }
  );
  return child;
}

async function main() {
  const headed = process.argv.includes('--headed');
  let server = null;
  let startedServer = false;

  try {
    try {
      await waitForHttpOk('http://localhost:5500/index.html', 1500);
    } catch (_) {
      server = startFrontendServer();
      startedServer = true;
      await waitForHttpOk('http://localhost:5500/index.html');
    }
    await runAll({ headed });
  } finally {
    if (startedServer && server && !server.killed) {
      server.kill();
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

