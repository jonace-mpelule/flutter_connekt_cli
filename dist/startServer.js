#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chokidar = __importStar(require("chokidar"));
const WebSocket = __importStar(require("ws"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const FLUTTER_PROJECT_FILE = 'pubspec.yaml';
let wss = null;
let isBuilding = false;
function checkIfInFlutterProject() {
    const currentDir = process.cwd();
    if (!fs.existsSync(path.join(currentDir, FLUTTER_PROJECT_FILE))) {
        console.error('\x1b[31m%s\x1b[0m', `🐛 Error: This command must be run from the root of a Flutter project directory.`);
        process.exit(1);
    }
}
function startFlutterEngine(restart = false) {
    var _a, _b;
    if (isBuilding) {
        console.log('Build already in progress. Skipping new build...');
        return;
    }
    isBuilding = true;
    console.log(`\x1b[33m%s\x1b[0m`, restart ? '⚡️ Restarting Flutter engine...' : '🛠 Initializing Flutter engine...');
    // Run flutter build command in a headless way
    const buildProcess = (0, child_process_1.exec)('flutter build bundle');
    (_a = buildProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
        console.log(`Flutter: ${data}`);
    });
    (_b = buildProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (data) => {
        console.error(`Flutter error: ${data}`);
    });
    buildProcess.on('close', (code) => {
        isBuilding = false; // Reset the build flag when done
        if (code === 0) {
            console.log(restart ? '\x1b[32m%s\x1b[0m' : '\x1b[32m%s\x1b[0m', restart ? '✅ Flutter engine restarted successfully.' : '✅ Flutter engine initialized successfully.');
            if (!wss) {
                startWebSocketServer();
            }
        }
        else {
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
