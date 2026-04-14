// ─────────────────────────────────────────────────────────────
// BEFORE USING THIS FILE, run in your project terminal:
//   npm install @xterm/xterm @xterm/addon-fit
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  FaPlay, FaSave, FaCopy, FaDownload, FaUpload,
  FaTerminal, FaCog, FaCode, FaFile, FaPlus, FaTrash,
  FaExpand, FaCompress, FaMoon, FaSun,
  FaExclamationTriangle, FaWifi, FaRocket, FaServer, FaStop,
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { codesService } from '../../services/codes';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────
// XtermTerminal component
// ─────────────────────────────────────────────────────────────
const XtermTerminal = ({ terminalRef, onReady }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"Fira Code", "Cascadia Code", "Courier New", monospace',
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        selectionBackground: '#264f78',
        black: '#0d1117',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#e6edf3',
        brightBlack: '#8b949e',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#ffffff',
      },
      scrollback: 2000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);

    // Small delay so DOM is fully laid out before fit
    setTimeout(() => {
      try { fitAddon.fit(); } catch (_) {}
    }, 50);

    if (terminalRef) {
      terminalRef.current = { term, fitAddon };
    }

    if (onReady) onReady(term);

    const ro = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch (_) {}
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      term.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#0d1117', padding: '4px', boxSizing: 'border-box' }}
    />
  );
};

// ─────────────────────────────────────────────────────────────
// Main EnhancedPythonEditor
// ─────────────────────────────────────────────────────────────
const EnhancedPythonEditor = () => {
  const { user } = useAuth();

  const defaultCode = `# Welcome to Feza Python Lab! 🐍
# input() is fully supported — try running this!

print("Hello from Python!")
name = input("What is your name? ")
print(f"Welcome, {name}!")

age = input("How old are you? ")
print(f"Wow, {age} years old!")
`;

  const [code, setCode] = useState(defaultCode);
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState(14);
  const [showConsole, setShowConsole] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [files, setFiles] = useState([{ id: 1, name: 'main.py', content: defaultCode }]);
  const [currentFile, setCurrentFile] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [executionMode, setExecutionMode] = useState('browser');
  const [pyodide, setPyodide] = useState(null);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [pyodideLoaded, setPyodideLoaded] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [executionTime, setExecutionTime] = useState(null);

  // Terminal & input refs
  const terminalRef = useRef(null); // { term, fitAddon }
  const inputResolverRef = useRef(null);
  const inputBufferRef = useRef('');
  const abortRef = useRef(false);

  // ── Effects ───────────────────────────────
  useEffect(() => {
    if (executionMode === 'browser' && !pyodideLoaded && !pyodideLoading) {
      loadPyodide();
    }
  }, [executionMode]); // eslint-disable-line

  useEffect(() => { checkApiStatus(); }, []);

  useEffect(() => {
    let id;
    if (autoSave && user) id = setTimeout(handleSave, 3000);
    return () => clearTimeout(id);
  }, [code, autoSave, user]); // eslint-disable-line

  // ── Terminal helpers ──────────────────────
  const writeToTerminal = useCallback((text) => {
    terminalRef.current?.term?.write(text);
  }, []);

  const clearTerminal = useCallback(() => {
    terminalRef.current?.term?.clear();
  }, []);

  // Called once xterm is mounted and ready
  const onTerminalReady = useCallback((term) => {
    term.onData((data) => {
      // Only process keypresses while waiting for input()
      if (!inputResolverRef.current) return;

      if (data === '\r' || data === '\n') {
        const line = inputBufferRef.current;
        inputBufferRef.current = '';
        const resolver = inputResolverRef.current;
        inputResolverRef.current = null;
        term.write('\r\n');
        resolver(line);
      } else if (data === '\u007f' || data === '\b') {
        // Backspace
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data >= ' ') {
        inputBufferRef.current += data;
        term.write(data);
      }
    });

    term.write('\x1b[32mFeza Python Lab\x1b[0m — Terminal ready\r\n');
    term.write('Select \x1b[33mBrowser\x1b[0m or \x1b[36mServer\x1b[0m mode, then press \x1b[32mRun\x1b[0m.\r\n\r\n');
  }, []);

  // Returns a promise that resolves when user presses Enter in terminal
  const terminalInput = useCallback((prompt) => {
    writeToTerminal('\x1b[36m' + prompt + '\x1b[0m');
    return new Promise((resolve) => {
      inputBufferRef.current = '';
      inputResolverRef.current = (value) => resolve(abortRef.current ? '' : value);
    });
  }, [writeToTerminal]);

  // ── Load Pyodide ──────────────────────────
  const loadPyodide = async () => {
    setPyodideLoading(true);
    writeToTerminal('\x1b[33m⏳ Loading Python (Pyodide)… please wait.\x1b[0m\r\n');

    try {
      // Pyodide is loaded via script tag (it's a large WASM bundle)
      if (!window.loadPyodide) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      const py = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
      });

      setPyodide(py);
      setPyodideLoaded(true);
      writeToTerminal('\x1b[32m✅ Python ready! Press Run to execute your code.\x1b[0m\r\n\r\n');
      toast.success('Python loaded!');
    } catch (err) {
      writeToTerminal('\x1b[31m❌ Could not load Pyodide. Switching to Server mode.\x1b[0m\r\n');
      setExecutionMode('api');
      toast.error('Browser Python failed, using Server mode');
    }
    setPyodideLoading(false);
  };

  const checkApiStatus = async () => {
    setApiStatus('checking');
    try {
      const r = await fetch('https://emkc.org/api/v2/piston/versions', {
        signal: AbortSignal.timeout(5000),
      });
      setApiStatus(r.ok ? 'online' : 'offline');
    } catch {
      setApiStatus('offline');
    }
  };

  // ── Run: Browser (Pyodide) ────────────────
  const runWithPyodide = async () => {
    if (!pyodide) {
      writeToTerminal('\x1b[31mPython not ready. Please wait for it to load.\x1b[0m\r\n');
      return;
    }

    abortRef.current = false;
    const startTime = performance.now();

    try {
      // Expose JS functions that Python calls back into
      window.__feza_input__ = (prompt) => terminalInput(prompt || '');
      window.__feza_write__ = (text) => writeToTerminal(text.replace(/\n/g, '\r\n'));
      window.__feza_err__ = (text) => writeToTerminal('\x1b[31m' + text.replace(/\n/g, '\r\n') + '\x1b[0m');

      // Patch stdout, stderr and input inside Pyodide
      pyodide.runPython(`
import sys, builtins, js

class _Out:
    def write(self, t): js.window.__feza_write__(t)
    def flush(self): pass

class _Err:
    def write(self, t): js.window.__feza_err__(t)
    def flush(self): pass

sys.stdout = _Out()
sys.stderr = _Err()
`);

      // Wrap user code in an async function so await works for input()
      const wrappedCode = `
import js, builtins, asyncio

async def __main__():
    async def _input(prompt=''):
        return await js.window.__feza_input__(str(prompt))
    builtins.input = lambda p='': asyncio.get_event_loop().run_until_complete(_input(p))

${code.split('\n').map(line => '    ' + line).join('\n')}

asyncio.get_event_loop().run_until_complete(__main__())
`;

      await pyodide.runPythonAsync(wrappedCode);

      const ms = (performance.now() - startTime).toFixed(0);
      setExecutionTime(ms);
      writeToTerminal(`\r\n\x1b[90m─── Done in ${ms}ms ───\x1b[0m\r\n`);
    } catch (err) {
      const msg = (err.message || String(err)).replace(/\n/g, '\r\n');
      writeToTerminal(`\r\n\x1b[31m${msg}\x1b[0m\r\n`);
    }
  };

  // ── Run: Server (Piston API) ──────────────
  const runWithApi = async () => {
    abortRef.current = false;
    const startTime = performance.now();

    try {
      const inputCount = (code.match(/\binput\s*\(/g) || []).length;
      const stdinLines = [];

      if (inputCount > 0) {
        writeToTerminal(`\x1b[33mFound ${inputCount} input() call(s). Enter values below:\x1b[0m\r\n`);
        for (let i = 0; i < inputCount; i++) {
          if (abortRef.current) return;
          const val = await terminalInput(`Input #${i + 1}: `);
          stdinLines.push(val);
        }
        writeToTerminal('\r\n\x1b[36m▶ Sending to server…\x1b[0m\r\n\r\n');
      } else {
        writeToTerminal('\x1b[36m▶ Running on server…\x1b[0m\r\n\r\n');
      }

      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'python',
          version: '3.10.0',
          files: [{ name: files[currentFile]?.name || 'main.py', content: code }],
          stdin: stdinLines.join('\n') + (stdinLines.length ? '\n' : ''),
        }),
        signal: controller.signal,
      });

      clearTimeout(tid);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const result = await response.json();
      const ms = (performance.now() - startTime).toFixed(0);
      setExecutionTime(ms);

      if (result.run) {
        if (result.run.stdout) writeToTerminal(result.run.stdout.replace(/\n/g, '\r\n'));
        if (result.run.stderr) writeToTerminal('\x1b[31m' + result.run.stderr.replace(/\n/g, '\r\n') + '\x1b[0m');
        if (!result.run.stdout && !result.run.stderr) writeToTerminal('\x1b[90m(no output)\x1b[0m\r\n');
        writeToTerminal(`\r\n\x1b[90m─── Done in ${ms}ms ───\x1b[0m\r\n`);
        if (result.run.stderr) toast.error('Code ran with errors');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        writeToTerminal('\x1b[31mRequest timed out.\x1b[0m\r\n');
      } else {
        writeToTerminal('\x1b[31mServer error: ' + err.message + '\x1b[0m\r\n');
      }
    }
  };

  // ── Handle Run ────────────────────────────
  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setExecutionTime(null);
    clearTerminal();
    writeToTerminal(`\x1b[32m❯ Running ${files[currentFile]?.name || 'main.py'}…\x1b[0m\r\n\r\n`);

    try {
      if (executionMode === 'browser') await runWithPyodide();
      else await runWithApi();
    } finally {
      setIsRunning(false);
    }
  };

  // ── Handle Stop ───────────────────────────
  const handleStop = () => {
    abortRef.current = true;
    if (inputResolverRef.current) {
      const r = inputResolverRef.current;
      inputResolverRef.current = null;
      r('');
    }
    writeToTerminal('\r\n\x1b[31m⛔ Stopped.\x1b[0m\r\n');
    setIsRunning(false);
  };

  // ── File operations ───────────────────────
  const handleSave = async () => {
    if (!user) { toast.error('Please login to save code'); return; }
    try {
      await codesService.create({ title: files[currentFile]?.name, code, author: user.email, user_id: user.id });
      setLastSaved(new Date());
      toast.success('Saved!');
    } catch { toast.error('Failed to save'); }
  };

  const handleCopy = () => { navigator.clipboard.writeText(code); toast.success('Copied!'); };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: files[currentFile]?.name || 'main.py' });
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const f = { id: Date.now(), name: file.name, content: ev.target.result };
      setFiles(prev => [...prev, f]);
      setCurrentFile(files.length);
      setCode(ev.target.result);
      toast.success('Uploaded!');
    };
    reader.readAsText(file);
  };

  const createNewFile = () => {
    const name = `script${files.length + 1}.py`;
    const f = { id: Date.now(), name, content: '# New file\n\n' };
    setFiles(prev => [...prev, f]);
    setCurrentFile(files.length);
    setCode(f.content);
  };

  const deleteFile = (index) => {
    if (files.length === 1) { toast.error('Cannot delete the only file'); return; }
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    setCurrentFile(0);
    setCode(updated[0].content);
  };

  const switchFile = (index) => {
    const updated = [...files];
    updated[currentFile].content = code;
    setFiles(updated);
    setCurrentFile(index);
    setCode(files[index].content);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  // ── Sample programs ───────────────────────
  const samples = {
    hello: `print("Hello, Feza Programming Club!")`,
    input_demo: `name = input("Enter your name: ")
age = input("Enter your age: ")
print(f"Hello {name}, you are {age} years old!")`,
    math: `a = int(input("First number: "))
b = int(input("Second number: "))
print(f"{a} + {b} = {a + b}")
print(f"{a} - {b} = {a - b}")
print(f"{a} * {b} = {a * b}")
print(f"{a} / {b} = {a / b:.2f}")`,
    game: `import random
print("🎮 Number Guessing Game (1–20)")
secret = random.randint(1, 20)
attempts = 0
while True:
    guess = int(input("Your guess: "))
    attempts += 1
    if guess < secret: print("Too low!")
    elif guess > secret: print("Too high!")
    else:
        print(f"✨ Correct in {attempts} attempts!")
        break`,
    loop: `for n in range(1, 6):
    print(f"{n} squared = {n**2}")`,
  };

  const dk = theme === 'dark';

  return (
    <div className={`h-screen flex flex-col ${dk ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>

      {/* ── Menu Bar ── */}
      <div className={`${dk ? 'bg-gray-800' : 'bg-white'} shadow px-3 py-2 flex items-center gap-2 flex-wrap border-b ${dk ? 'border-gray-700' : 'border-gray-200'}`}>

        <div className="flex items-center gap-2 mr-2">
          <FaCode className="text-blue-400" />
          <span className="font-bold text-sm">Feza Python Lab</span>
        </div>

        {/* Mode switcher */}
        <div className={`flex items-center gap-1 rounded-lg p-1 ${dk ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <button
            onClick={() => { setExecutionMode('browser'); if (!pyodideLoaded && !pyodideLoading) loadPyodide(); }}
            className={`px-3 py-1 rounded flex items-center gap-1 text-sm transition ${executionMode === 'browser' ? 'bg-blue-600 text-white' : dk ? 'text-gray-300' : 'text-gray-600'}`}
          >
            <FaRocket size={10} /> Browser
          </button>
          <button
            onClick={() => setExecutionMode('api')}
            className={`px-3 py-1 rounded flex items-center gap-1 text-sm transition ${executionMode === 'api' ? 'bg-blue-600 text-white' : dk ? 'text-gray-300' : 'text-gray-600'}`}
          >
            <FaServer size={10} /> Server
          </button>
        </div>

        {/* Status */}
        <div className="text-xs min-w-[80px]">
          {executionMode === 'browser' && pyodideLoading && <span className="text-yellow-400">⏳ Loading…</span>}
          {executionMode === 'browser' && pyodideLoaded && <span className="text-green-400">✅ Ready</span>}
          {executionMode === 'browser' && !pyodideLoaded && !pyodideLoading && <span className="text-gray-400">Not loaded</span>}
          {executionMode === 'api' && apiStatus === 'online' && <span className="text-green-400 flex items-center gap-1"><FaWifi size={10} /> Online</span>}
          {executionMode === 'api' && apiStatus === 'offline' && <span className="text-red-400 flex items-center gap-1"><FaExclamationTriangle size={10} /> Offline</span>}
        </div>

        {/* Run / Stop */}
        {!isRunning ? (
          <button
            onClick={handleRun}
            disabled={executionMode === 'browser' && !pyodideLoaded}
            className="px-3 py-1.5 rounded flex items-center gap-2 text-sm font-semibold bg-green-600 hover:bg-green-500 text-white transition disabled:opacity-40"
          >
            <FaPlay size={10} /> Run
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="px-3 py-1.5 rounded flex items-center gap-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition"
          >
            <FaStop size={10} /> Stop
          </button>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-1">
          <button onClick={handleSave} title="Save" className={`p-2 rounded ${dk ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}><FaSave className="text-blue-400" /></button>
          <button onClick={handleCopy} title="Copy" className={`p-2 rounded ${dk ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}><FaCopy /></button>
          <button onClick={handleDownload} title="Download" className={`p-2 rounded ${dk ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}><FaDownload /></button>
          <label title="Upload" className={`p-2 rounded cursor-pointer ${dk ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <FaUpload />
            <input type="file" accept=".py" onChange={handleUpload} className="hidden" />
          </label>
        </div>

        <div className="w-px h-5 bg-gray-600 mx-1" />

        <select
          onChange={(e) => { if (e.target.value) setCode(samples[e.target.value]); }}
          value=""
          className={`px-2 py-1 rounded text-sm ${dk ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          <option value="" disabled>Load Example</option>
          <option value="hello">Hello World</option>
          <option value="input_demo">Input Demo ✨</option>
          <option value="math">Math + Input</option>
          <option value="game">Guessing Game</option>
          <option value="loop">Loop Example</option>
        </select>

        <div className="w-px h-5 bg-gray-600 mx-1" />

        <button onClick={() => setTheme(dk ? 'light' : 'dark')} className={`p-2 rounded ${dk ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
          {dk ? <FaSun className="text-yellow-400" /> : <FaMoon />}
        </button>
        <button onClick={() => setShowConsole(v => !v)} title="Toggle Terminal" className={`p-2 rounded ${dk ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
          <FaTerminal className={showConsole ? 'text-green-400' : ''} />
        </button>
        <button onClick={() => setShowSettings(v => !v)} className={`p-2 rounded ${dk ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
          <FaCog />
        </button>
        <button onClick={toggleFullscreen} className={`p-2 rounded ${dk ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
          {isFullscreen ? <FaCompress /> : <FaExpand />}
        </button>

        {lastSaved && <span className="text-xs text-gray-400 ml-auto">Saved {lastSaved.toLocaleTimeString()}</span>}
      </div>

      {/* ── Settings ── */}
      {showSettings && (
        <div className={`${dk ? 'bg-gray-800' : 'bg-white'} px-4 py-3 border-b ${dk ? 'border-gray-700' : 'border-gray-200'} flex gap-6 flex-wrap text-sm`}>
          <div className="flex items-center gap-3">
            <label>Font Size</label>
            <input type="range" min="10" max="24" value={fontSize} onChange={(e) => setFontSize(+e.target.value)} className="w-28" />
            <span>{fontSize}px</span>
          </div>
          <div className="flex items-center gap-3">
            <label>Auto Save</label>
            <button onClick={() => setAutoSave(v => !v)} className={`px-3 py-1 rounded ${autoSave ? 'bg-green-600 text-white' : dk ? 'bg-gray-700' : 'bg-gray-200'}`}>
              {autoSave ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      )}

      {/* ── Editor + File Explorer ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Files */}
        <div className={`w-44 ${dk ? 'bg-gray-800' : 'bg-gray-50'} p-2 border-r ${dk ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Files</span>
            <button onClick={createNewFile} className={`p-1 rounded ${dk ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}><FaPlus size={11} /></button>
          </div>
          {files.map((file, index) => (
            <div
              key={file.id}
              onClick={() => switchFile(index)}
              className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer text-sm mb-0.5 ${
                currentFile === index
                  ? dk ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                  : dk ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                <FaFile size={10} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteFile(index); }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400"
              >
                <FaTrash size={9} />
              </button>
            </div>
          ))}
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="python"
            theme={dk ? 'vs-dark' : 'light'}
            value={code}
            onChange={(v) => setCode(v || '')}
            options={{
              fontSize,
              minimap: { enabled: true },
              lineNumbers: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
              bracketPairColorization: { enabled: true },
              folding: true,
              matchBrackets: 'always',
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              quickSuggestions: true,
              tabCompletion: 'on',
            }}
          />
        </div>
      </div>

      {/* ── Terminal Panel ── */}
      {showConsole && (
        <div style={{ height: '280px' }} className={`flex flex-col border-t ${dk ? 'border-gray-700' : 'border-gray-300'}`}>

          {/* Header */}
          <div className={`flex items-center justify-between px-3 py-1.5 border-b flex-shrink-0 ${dk ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs font-mono text-gray-400">
                {executionMode === 'browser' ? '🚀 Browser Terminal' : '🌐 Server Terminal'}
                {executionTime && <span className="ml-2 text-gray-500">({executionTime}ms)</span>}
              </span>
              {isRunning && (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <span className="animate-pulse">●</span> Running…
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden md:block">
                {executionMode === 'browser' ? 'Type responses directly in terminal' : 'Values collected before run'}
              </span>
              <button
                onClick={clearTerminal}
                className={`text-xs px-2 py-0.5 rounded ${dk ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Clear
              </button>
            </div>
          </div>

          {/* xterm.js renders here */}
          <div className="flex-1 overflow-hidden">
            <XtermTerminal terminalRef={terminalRef} onReady={onTerminalReady} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPythonEditor;