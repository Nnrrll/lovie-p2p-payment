import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..');
const frontendDir = path.join(rootDir, 'frontend');
const artifactsDir = path.join(rootDir, 'tests', 'e2e', 'artifacts');
const screenshotsDir = path.join(artifactsDir, 'screenshots');
const chromeUserDataDir = path.join(artifactsDir, 'chrome-profile');
const runLogPath = path.join(rootDir, 'tests', 'e2e', 'last-run.log');
const backendUrl = 'http://127.0.0.1:3100';
const frontendUrl = 'http://127.0.0.1:4173';
const chromeDebugPort = 9222;
// Allow overriding chrome binary via env (useful for CI) and use platform sensible defaults
const chromePath = process.env.CHROME_PATH || (process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : '/usr/bin/google-chrome-stable');
const scenarioNotes = {
  pay: 'E2E pay flow',
  decline: 'E2E decline flow',
  expired: 'Groceries',
};

function logStep(message) {
  const line = `[e2e] ${new Date().toISOString()} ${message}`;
  console.log(line);
  void fs.appendFile(runLogPath, `${line}\n`);
}

function logError(error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  const line = `[e2e:error] ${new Date().toISOString()} ${message}`;
  console.error(line);
  void fs.appendFile(runLogPath, `${line}\n`);
}

async function ensureDirectory(directory) {
  await fs.mkdir(directory, { recursive: true });
}

async function clearDirectory(directory) {
  await fs.rm(directory, { force: true, recursive: true });
  await fs.mkdir(directory, { recursive: true });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: process.env,
      shell: options.shell ?? process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      ...options,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(
            `Command failed: ${command} ${args.join(' ')}\n${stdout}\n${stderr}`.trim(),
          ),
        );
      }
    });
  });
}

function startProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env: process.env,
    shell: options.shell ?? process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    ...options,
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${path.basename(command)}] ${chunk}`);
    void fs.appendFile(runLogPath, `[${path.basename(command)}:stdout] ${chunk}`);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${path.basename(command)}] ${chunk}`);
    void fs.appendFile(runLogPath, `[${path.basename(command)}:stderr] ${chunk}`);
  });

  child.on('exit', (code, signal) => {
    logStep(`${path.basename(command)} exited with code=${code ?? 'null'} signal=${signal ?? 'null'}`);
  });

  return child;
}

async function waitForUrl(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      await wait(300);
    }
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function getJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${url}`);
  }

  return response.json();
}

async function putJson(url) {
  const response = await fetch(url, { method: 'PUT' });

  if (!response.ok) {
    throw new Error(`Request failed: ${url}`);
  }

  return response.json();
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.pending = new Map();
    this.frames = [];
    this.eventHandlers = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.addEventListener('open', () => resolve());
      this.ws.addEventListener('error', reject);
      this.ws.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);

        if (message.id) {
          const pending = this.pending.get(message.id);

          if (!pending) {
            return;
          }

          this.pending.delete(message.id);

          if (message.error) {
            pending.reject(new Error(message.error.message));
          } else {
            pending.resolve(message.result);
          }

          return;
        }

        if (message.method === 'Page.screencastFrame') {
          this.frames.push(message.params.data);
          void this.send('Page.screencastFrameAck', {
            sessionId: message.params.sessionId,
          });
        }

        const handlers = this.eventHandlers.get(message.method) ?? [];
        handlers.forEach((handler) => handler(message.params));
      });
    });
  }

  send(method, params = {}) {
    this.id += 1;
    const id = this.id;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, handler) {
    const handlers = this.eventHandlers.get(method) ?? [];
    handlers.push(handler);
    this.eventHandlers.set(method, handlers);
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });

    return result.result?.value;
  }

  async waitFor(expression, timeoutMs = 20_000) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const value = await this.evaluate(expression);

      if (value) {
        return value;
      }

      await wait(200);
    }

    throw new Error(`Timed out waiting for condition: ${expression}`);
  }

  async captureScreenshot(filename) {
    const { data } = await this.send('Page.captureScreenshot', {
      format: 'png',
    });

    await fs.writeFile(path.join(screenshotsDir, filename), Buffer.from(data, 'base64'));
  }

  async close() {
    if (!this.ws) {
      return;
    }

    await new Promise((resolve) => {
      this.ws.addEventListener('close', () => resolve(), { once: true });
      this.ws.close();
    });
  }
}

function stringify(value) {
  return JSON.stringify(value);
}

async function setField(client, selector, value) {
  const result = await client.evaluate(`
    (() => {
      const element = document.querySelector(${stringify(selector)});
      if (!element) return false;
      element.focus();
      const prototype = element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      const setter = descriptor && descriptor.set;
      if (!setter) return false;
      setter.call(element, ${stringify(value)});
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `);

  if (!result) {
    throw new Error(`Could not set field ${selector}`);
  }
}

async function clickByText(client, text) {
  const result = await client.evaluate(`
    (() => {
      const target = [...document.querySelectorAll('button, a')]
        .find((element) => element.textContent && element.textContent.includes(${stringify(text)}));
      if (!target) return false;
      target.click();
      return true;
    })()
  `);

  if (!result) {
    throw new Error(`Could not click element with text ${text}`);
  }
}

async function clickInCard(client, cardText, controlText) {
  logStep(`Clicking "${controlText}" for card "${cardText}"`);
  const result = await client.evaluate(`
    (() => {
      const card = [...document.querySelectorAll('.request-card')]
        .find((element) => element.innerText.includes(${stringify(cardText)}));
      if (!card) return 'missing-card';
      const target = [...card.querySelectorAll('button, a')]
        .find((element) => element.textContent && element.textContent.includes(${stringify(controlText)}));
      if (!target) return 'missing-control';
      target.click();
      return true;
    })()
  `);

  if (result !== true) {
    throw new Error(`Could not click ${controlText} inside card ${cardText}: ${result}`);
  }
}

async function loginAs(client, email) {
  logStep(`Logging in as ${email}`);
  await client.waitFor(`document.body.innerText.includes('Mock magic-link entry')`);
  await setField(client, 'input[placeholder="alice@lovie.com"]', email);
  await clickByText(client, 'Send mock magic link');
  await client.waitFor(`
    document.querySelector('main.page-shell') !== null &&
    document.querySelector('input[placeholder="friend@example.com or +1 555 555 0102"]') !== null
  `);
}

async function createRequest(client, recipient, amount, memo) {
  logStep(`Creating request for ${recipient} amount ${amount}`);
  await client.waitFor(`document.querySelector('[data-testid="request-form"]') !== null`);
  await setField(
    client,
    'input[placeholder="friend@example.com or +1 555 555 0102"]',
    recipient,
  );
  await setField(client, 'input[placeholder="50.00"]', amount);
  await setField(client, 'textarea', memo);
  await wait(300);
  await clickByText(client, 'Create payment request');
  await client.waitFor(`
    document.querySelector('.success-banner strong') !== null ||
    document.body.innerText.includes('created and ready to share') ||
    document.querySelector('.form-error') !== null
  `);

  const formError = await client.evaluate(`
    (() => document.querySelector('.form-error')?.textContent ?? null)()
  `);

  if (formError) {
    throw new Error(`Request creation failed in UI: ${formError}`);
  }
}

async function recordScenario(client) {
  logStep('Capturing initial Alice dashboard');
  await loginAs(client, 'alice@lovie.com');
  await wait(1_200);
  await client.captureScreenshot('01-alice-dashboard.png');

  await createRequest(client, 'bob@lovie.com', '24.50', scenarioNotes.pay);
  await wait(1_500);
  await client.captureScreenshot('02-created-pay-request.png');

  logStep('Switching to Bob for pay flow');
  await clickByText(client, 'Sign out');
  await loginAs(client, 'bob@lovie.com');
  await clickInCard(client, scenarioNotes.pay, 'Pay');
  await client.waitFor(`document.body.innerText.includes('Payment settled successfully')`);
  await wait(1_500);
  await client.captureScreenshot('03-bob-paid-request.png');

  logStep('Running decline flow');
  await clickByText(client, 'Sign out');
  await loginAs(client, 'alice@lovie.com');
  await createRequest(client, 'bob@lovie.com', '17.20', scenarioNotes.decline);
  await wait(1_000);
  await clickByText(client, 'Sign out');
  await loginAs(client, 'bob@lovie.com');
  await clickInCard(client, scenarioNotes.decline, 'Decline');
  await client.waitFor(`document.body.innerText.includes('Request declined.')`);
  await wait(1_500);
  await client.captureScreenshot('04-bob-declined-request.png');

  logStep('Checking expired request detail');
  await clickByText(client, 'Sign out');
  await loginAs(client, 'alice@lovie.com');
  await clickInCard(client, scenarioNotes.expired, 'View details');
  await client.waitFor(`
    document.querySelector('.detail-panel') !== null &&
    window.location.pathname.startsWith('/requests/')
  `);
  const payButtonVisible = await client.evaluate(`
    document.body.innerText.includes('Pay request')
  `);

  if (payButtonVisible) {
    throw new Error('Expired request unexpectedly exposed the Pay action');
  }

  await wait(1_500);
  await client.captureScreenshot('05-expired-request-detail.png');
}

async function startEncoderServer(frames) {
  const server = http.createServer(async (request, response) => {
    if (request.url === '/frames') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify(frames));
      return;
    }

    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(`
      <!doctype html>
      <html>
        <body style="margin:0;background:#111;color:#fff;font-family:sans-serif">
          <canvas id="screen" width="1440" height="1100"></canvas>
          <script>
            async function encode() {
              const response = await fetch('/frames');
              const frames = await response.json();
              const canvas = document.getElementById('screen');
              const ctx = canvas.getContext('2d');
              const stream = canvas.captureStream(4);
              const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
              const chunks = [];
              recorder.ondataavailable = (event) => {
                if (event.data.size > 0) chunks.push(event.data);
              };
              const stopped = new Promise((resolve) => {
                recorder.onstop = resolve;
              });

              recorder.start();

              for (const frame of frames) {
                const image = new Image();
                image.src = 'data:image/jpeg;base64,' + frame;
                await image.decode();
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                await new Promise((resolve) => setTimeout(resolve, 420));
              }

              recorder.stop();
              await stopped;
              const blob = new Blob(chunks, { type: 'video/webm' });
              const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(String(reader.result).split(',')[1]);
                reader.readAsDataURL(blob);
              });

              window.__videoBase64 = base64;
              window.__videoReady = true;
            }

            encode();
          </script>
        </body>
      </html>
    `);
  });

  await new Promise((resolve) => server.listen(4901, '127.0.0.1', resolve));
  return server;
}

async function encodeVideo(client) {
  const server = await startEncoderServer(client.frames);

  try {
    await client.send('Page.navigate', { url: 'http://127.0.0.1:4901/' });
    await client.waitFor(`window.__videoReady === true`, 120_000);
    const videoBase64 = await client.evaluate('window.__videoBase64');

    if (!videoBase64) {
      throw new Error('Video encoding did not produce output');
    }

    const videoPath = path.join(artifactsDir, 'lovie-e2e-recording.webm');
    await fs.writeFile(videoPath, Buffer.from(videoBase64, 'base64'));
    return videoPath;
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function prepareEnvironment() {
  logStep('Preparing artifacts and build output');
  await clearDirectory(artifactsDir);
  await ensureDirectory(screenshotsDir);
  await ensureDirectory(chromeUserDataDir);

  logStep('Starting database container');
  await runCommand('docker', ['compose', 'up', '-d', 'db'], { cwd: rootDir });
  logStep('Building backend');
  // Use platform-specific npm command (npm.cmd on Windows, npm elsewhere)
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  await runCommand(npmCmd, ['run', 'build'], { cwd: rootDir });
  logStep('Applying database schema');
  await runCommand('node', ['dist/scripts/setup-db.js'], { cwd: rootDir });
  logStep('Seeding database');
  await runCommand('node', ['dist/scripts/seed-db.js'], { cwd: rootDir });
  logStep('Building frontend');
  await runCommand(npmCmd, ['run', 'build'], {
    cwd: frontendDir,
    env: {
      ...process.env,
      VITE_API_URL: `${backendUrl}/api/v1`,
    },
  });
}

async function launchBrowser() {
  logStep('Launching Chrome in headless mode');
  const chromeArgs = [
    `--remote-debugging-port=${chromeDebugPort}`,
    `--user-data-dir=${chromeUserDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-crash-reporter',
    '--disable-breakpad',
    '--window-size=1440,1100',
    'about:blank',
  ];

  const processHandle = startProcess(chromePath, chromeArgs, {
    cwd: rootDir,
    shell: false,
  });
  logStep('Waiting for Chrome DevTools endpoint');
  await waitForUrl(`http://127.0.0.1:${chromeDebugPort}/json/version`, 20_000);
  logStep('Opening browser target');
  const target = await putJson(
    `http://127.0.0.1:${chromeDebugPort}/json/new?${encodeURIComponent(frontendUrl)}`,
  );
  logStep('Connecting to DevTools target');
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });
  return { client, processHandle };
}

function killProcess(child) {
  if (!child || child.killed) {
    return;
  }

  child.kill('SIGTERM');
}

async function main() {
  const startedAt = new Date().toISOString();
  let backendProcess;
  let frontendProcess;
  let chromeProcess;
  let client;

  try {
    await fs.writeFile(runLogPath, '');
    logStep('E2E run started');
    await prepareEnvironment();

    logStep('Starting backend server');
    backendProcess = startProcess('node', ['dist/src/app/index.js'], {
      cwd: rootDir,
      env: {
        ...process.env,
        PORT: '3100',
        CORS_ORIGIN: frontendUrl,
        APP_BASE_URL: frontendUrl,
      },
    });

    logStep('Starting frontend preview server');
    frontendProcess = startProcess(
      'node',
      ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173'],
      {
        cwd: frontendDir,
        env: {
          ...process.env,
          VITE_API_URL: `${backendUrl}/api/v1`,
        },
      },
    );

    logStep('Waiting for backend health check');
    await waitForUrl(`${backendUrl}/health`);
    logStep('Waiting for frontend preview');
    await waitForUrl(frontendUrl);

    const browser = await launchBrowser();
    client = browser.client;
    chromeProcess = browser.processHandle;

    logStep('Starting screencast capture');
    await client.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 70,
      everyNthFrame: 1,
    });

    logStep('Running UI scenario');
    await recordScenario(client);
    logStep('Stopping screencast capture');
    await client.send('Page.stopScreencast');

    logStep('Encoding captured frames into WebM');
    const videoPath = await encodeVideo(client);
    const summaryPath = path.join(artifactsDir, 'summary.json');

    await fs.writeFile(
      summaryPath,
      JSON.stringify(
        {
          artifacts: {
            screenshotsDir,
            videoPath,
          },
          finishedAt: new Date().toISOString(),
          startedAt,
          steps: [
            'Alice created a new request for Bob',
            'Bob paid the first request',
            'Bob declined the second request',
            'Alice opened an expired request detail and confirmed actions were blocked',
          ],
        },
        null,
        2,
      ),
    );

    logStep(`E2E artifacts generated at ${artifactsDir}`);
  } finally {
    if (client) {
      await client.close().catch(() => {});
    }

    killProcess(chromeProcess);
    killProcess(frontendProcess);
    killProcess(backendProcess);
  }
}

main().catch((error) => {
  logError(error);
  process.exitCode = 1;
});
