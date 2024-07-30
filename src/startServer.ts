#!/usr/bin/env node

import * as chokidar from 'chokidar';
import * as WebSocket from 'ws';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const FLUTTER_PROJECT_FILE = 'pubspec.yaml';
let wss: WebSocket.Server | null = null;
let isBuilding = false; 

function checkIfInFlutterProject() {
  const currentDir = process.cwd();
  if (!fs.existsSync(path.join(currentDir, FLUTTER_PROJECT_FILE))) {
    console.error('\x1b[31m%s\x1b[0m', `🐛 Error: This command must be run from the root of a Flutter project directory.`);
    process.exit(1);
  }
}

function startFlutterEngine(restart = false) {
  if (isBuilding) {
    console.log('Build already in progress. Skipping new build...');
    return;
  }
  
  isBuilding = true;
  console.log(`\x1b[33m%s\x1b[0m`, restart ? '⚡️ Restarting Flutter engine...' : '🛠 Initializing Flutter engine...');

  // Run flutter build command in a headless way
  const buildProcess = exec('flutter build bundle');

  buildProcess.stdout?.on('data', (data) => {
    console.log(`Flutter: ${data}`);
  });

  buildProcess.stderr?.on('data', (data) => {
    console.error(`Flutter error: ${data}`);
  });

  buildProcess.on('close', (code) => {
    isBuilding = false; // Reset the build flag when done
    if (code === 0) {
      console.log(restart ? '\x1b[32m%s\x1b[0m' : '\x1b[32m%s\x1b[0m', restart ? '✅ Flutter engine restarted successfully.' : '✅ Flutter engine initialized successfully.');
      
      if (!wss) {
        startWebSocketServer();
      }

    } else {
      console.error(`\x1b[31m%s\x1b[0m`, `🐛 Flutter build failed with code ${code}`);
    }
  });
}

function watchFiles() {
  console.log('[👀] Watching project files for changes...');

  const watcher = chokidar.watch('lib/**/*.dart');
  watcher.on('change', (path) => {
    console.log(`File ${path} has changed. Rebuilding...`);
    // Debounce the rebuilds to avoid running multiple builds simultaneously
    if (!isBuilding) {
      startFlutterEngine(true);
    }
  });
}

function startWebSocketServer() {
  wss = new WebSocket.Server({ port: 8080 });

  wss.on('connection', (ws) => {
    console.log('Client connected.');

    ws.on('message', (message) => {
      console.log(`Received message: ${message}`);
      // Handle incoming messages from companion app
    });

    // Send serialized data to the client
    ws.send(JSON.stringify({ type: 'initialData', data: 'Serialized Flutter data here' }));
  });

  console.log('WebSocket server started on ws://localhost:8080');
}

function startServer() {
  checkIfInFlutterProject();
  startFlutterEngine();
  watchFiles();
}

startServer();
