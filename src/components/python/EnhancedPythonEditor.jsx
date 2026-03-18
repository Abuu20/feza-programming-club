import React, { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { 
  FaPlay, 
  FaSave, 
  FaCopy, 
  FaDownload, 
  FaUpload,
  FaTerminal,
  FaCog,
  FaCode,
  FaFile,
  FaFolderOpen,
  FaPlus,
  FaTrash,
  FaExpand,
  FaCompress,
  FaMoon,
  FaSun,
  FaExclamationTriangle,
  FaWifi,
  FaRocket,
  FaServer,
  FaClock,
  FaKeyboard
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { codesService } from '../../services/codes';
import toast from 'react-hot-toast';

const EnhancedPythonEditor = () => {
  const { user } = useAuth();
  const [code, setCode] = useState(`# Welcome to Feza Python Lab! 🐍
# Try this interactive program:

name = input("What's your name? ")
age = input("How old are you? ")
print(f"\\nHello {name}! You are {age} years old.")
print("Nice to meet you!")`);

  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState(14);
  const [showConsole, setShowConsole] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [files, setFiles] = useState([
    { id: 1, name: 'main.py', content: code }
  ]);
  const [currentFile, setCurrentFile] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Execution mode states
  const [executionMode, setExecutionMode] = useState('browser'); // 'browser' or 'api'
  const [pyodide, setPyodide] = useState(null);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [pyodideLoaded, setPyodideLoaded] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [executionTime, setExecutionTime] = useState(null);
  const [memoryUsed, setMemoryUsed] = useState(null);
  
  // Input modal states
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [inputResolver, setInputResolver] = useState(null);
  const [inputHistory, setInputHistory] = useState([]);
  const [pendingInputs, setPendingInputs] = useState([]);

  // Load Pyodide on mount if browser mode is selected
  useEffect(() => {
    if (executionMode === 'browser' && !pyodideLoaded && !pyodideLoading) {
      loadPyodide();
    }
  }, [executionMode]);

  // Check API status on mount
  useEffect(() => {
    checkApiStatus();
  }, []);

  // Auto-save feature
  useEffect(() => {
    let timeoutId;
    if (autoSave && user) {
      timeoutId = setTimeout(() => {
        handleSave();
      }, 3000);
    }
    return () => clearTimeout(timeoutId);
  }, [code, autoSave, user]);

  const loadPyodide = async () => {
    setPyodideLoading(true);
    setOutput('Loading Python environment... (this may take a few seconds)');
    
    try {
      // Create script element to load Pyodide
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
      
      script.onload = async () => {
        try {
          // @ts-ignore
          const pyodideInstance = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
          });
          
          setPyodide(pyodideInstance);
          setPyodideLoaded(true);
          setOutput('✅ Python environment loaded! Ready to run code.\n');
          toast.success('Python loaded in browser!');
        } catch (error) {
          console.error('Pyodide init error:', error);
          setOutput('❌ Failed to initialize Python environment. Switching to API mode.');
          setExecutionMode('api');
          toast.error('Browser Python failed, using API mode');
        }
        setPyodideLoading(false);
      };
      
      script.onerror = () => {
        setOutput('❌ Failed to load Python environment. Switching to API mode.');
        setExecutionMode('api');
        setPyodideLoading(false);
        toast.error('Could not load browser Python');
      };
      
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error loading Pyodide:', error);
      setOutput('❌ Failed to load Python environment');
      setPyodideLoading(false);
      setExecutionMode('api');
    }
  };

  const checkApiStatus = async () => {
    setApiStatus('checking');
    try {
      const response = await fetch('https://emkc.org/api/v2/piston/versions', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (error) {
      console.error('API check failed:', error);
      setApiStatus('offline');
    }
  };

  // Check if code uses input()
  const detectInputUsage = (code) => {
    return code.includes('input(');
  };

  // Handle Python input requests
  const handlePythonInput = (promptText) => {
    return new Promise((resolve) => {
      setInputPrompt(promptText || 'Enter value:');
      setShowInputModal(true);
      setInputResolver(() => resolve);
    });
  };

  // Handle input submission
  const handleInputSubmit = (value) => {
    setShowInputModal(false);
    setInputHistory([...inputHistory, value]);
    if (inputResolver) {
      inputResolver(value + '\n');
      setInputResolver(null);
    }
  };

  // Run with Pyodide (browser mode)
  const runWithPyodide = async () => {
    if (!pyodide) {
      setOutput('Python environment not loaded. Please wait...');
      return;
    }

    const startTime = performance.now();
    
    try {
      setOutput('');
      setInputHistory([]);
      
      // Set up custom input handler
      pyodide.runPython(`
import sys
from io import StringIO

# Store the input handler function
input_handler = None

class CustomInput:
    def __init__(self, input_callback):
        self.input_callback = input_callback
        self.buffer = ""
    
    def readline(self, *args):
        import asyncio
        # Use the callback to get input
        result = asyncio.get_event_loop().run_until_complete(
            self.input_callback("Python input:")
        )
        return result

# Redirect stdout/stderr
sys.stdout = StringIO()
sys.stderr = StringIO()
      `);
      
      // Register the JavaScript input handler
      const inputCallback = pyodide.toPy(async (prompt) => {
        return await handlePythonInput(prompt);
      });
      
      pyodide.runPython(`
# Set up the input handler
input_handler = ${inputCallback}
sys.stdin = CustomInput(input_handler)
      `);
      
      // Run the code
      await pyodide.runPythonAsync(code);
      
      // Get output
      const stdout = pyodide.runPython('sys.stdout.getvalue()');
      const stderr = pyodide.runPython('sys.stderr.getvalue()');
      
      const endTime = performance.now();
      setExecutionTime((endTime - startTime).toFixed(2));
      
      // Estimate memory
      const memoryEstimate = Math.round(code.length * 0.1);
      setMemoryUsed(memoryEstimate);
      
      if (stderr) {
        setOutput(`Errors:\n${stderr}\n\nOutput:\n${stdout}`);
      } else {
        setOutput(stdout || 'Code executed successfully (no output)');
      }
      
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  // Run with Piston API
  const runWithApi = async () => {
    const startTime = performance.now();
    
    try {
      setOutput('Running on server...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'python',
          version: '3.10.0',
          files: [{ 
            name: files[currentFile].name,
            content: code 
          }],
          stdin: pendingInputs.join('\n') // Send any pending inputs
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();
      
      const endTime = performance.now();
      setExecutionTime((endTime - startTime).toFixed(2));
      
      if (result.run) {
        const output_text = result.run.output || result.run.stderr || 'No output';
        setOutput(output_text);
        
        // Check if program is waiting for input
        if (output_text.includes('input(') || output_text.endsWith(':')) {
          // Show input modal for API mode
          handlePythonInput('Program needs input:');
        }
        
        setMemoryUsed(Math.round(code.length * 0.15));
        
        if (result.run.stderr) {
          toast.error('Code executed with errors');
        }
      }
    } catch (error) {
      console.error('API error:', error);
      setOutput(`API Error: ${error.message}\n\nTry switching to Browser mode for offline execution.`);
      
      if (executionMode === 'api') {
        toast.error('API unavailable - consider using Browser mode');
      }
    }
  };

  // Main run handler
  const handleRun = async () => {
    setIsRunning(true);
    setExecutionTime(null);
    setMemoryUsed(null);
    setPendingInputs([]);
    
    const needsInput = detectInputUsage(code);
    
    // If program needs input and we're in browser mode without input handler ready
    if (needsInput && executionMode === 'browser' && !pyodide) {
      toast('This program uses input(). Loading Python environment...');
      await loadPyodide();
    }
    
    if (executionMode === 'browser') {
      await runWithPyodide();
    } else {
      await runWithApi();
    }
    
    setIsRunning(false);
  };

  const toggleExecutionMode = () => {
    const newMode = executionMode === 'browser' ? 'api' : 'browser';
    setExecutionMode(newMode);
    
    if (newMode === 'browser' && !pyodideLoaded && !pyodideLoading) {
      loadPyodide();
    }
    
    toast.success(`Switched to ${newMode === 'browser' ? 'Browser' : 'Server'} execution mode`);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please login to save code');
      return;
    }

    try {
      await codesService.create({
        title: files[currentFile].name,
        code: code,
        author: user.email,
        user_id: user.id
      });
      setLastSaved(new Date());
      toast.success('Code saved successfully');
    } catch (error) {
      toast.error('Failed to save code');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = files[currentFile].name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File downloaded');
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile = {
          id: files.length + 1,
          name: file.name,
          content: e.target.result
        };
        setFiles([...files, newFile]);
        setCurrentFile(files.length);
        setCode(e.target.result);
        toast.success('File uploaded');
      };
      reader.readAsText(file);
    }
  };

  const createNewFile = () => {
    const newFileName = `script${files.length + 1}.py`;
    const newFile = {
      id: files.length + 1,
      name: newFileName,
      content: '# New Python file\n\n'
    };
    setFiles([...files, newFile]);
    setCurrentFile(files.length);
    setCode(newFile.content);
    toast.success(`Created ${newFileName}`);
  };

  const deleteFile = (index) => {
    if (files.length === 1) {
      toast.error('Cannot delete the only file');
      return;
    }
    
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    setCurrentFile(0);
    setCode(newFiles[0].content);
    toast.success('File deleted');
  };

  const switchFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles[currentFile].content = code;
    setFiles(updatedFiles);
    setCurrentFile(index);
    setCode(files[index].content);
  };

  const clearConsole = () => {
    setOutput('');
    setExecutionTime(null);
    setMemoryUsed(null);
    setInputHistory([]);
    toast.success('Console cleared');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const samplePrograms = {
    hello: 'print("Hello, Feza Programming Club!")',
    input: `# Interactive Program
name = input("What's your name? ")
age = input("How old are you? ")
print(f"\\nHello {name}! You are {age} years old.")`,
    math: `
# Math operations
a = 15
b = 7
print(f"Addition: {a} + {b} = {a + b}")
print(f"Subtraction: {a} - {b} = {a - b}")
print(f"Multiplication: {a} × {b} = {a * b}")
print(f"Division: {a} ÷ {b} = {a / b}")
print(f"Power: {a}² = {a ** 2}")
    `,
    loop: `
# Loop and list example
numbers = [1, 2, 3, 4, 5]
print("Numbers:", numbers)

print("\\nSquares:")
for num in numbers:
    square = num ** 2
    print(f"{num}² = {square}")
    `,
    function: `
# Function example
def calculate_average(grades):
    total = sum(grades)
    count = len(grades)
    return total / count

# Test the function
scores = [85, 90, 78, 92, 88]
avg = calculate_average(scores)
print(f"Class scores: {scores}")
print(f"Average: {avg:.2f}")
    `,
    game: `
# Simple number guessing game
import random

print("🎮 Number Guessing Game")
print("I'm thinking of a number between 1 and 20")

secret = random.randint(1, 20)
attempts = 0

while True:
    try:
        guess = int(input("Your guess: "))
        attempts += 1
        
        if guess < secret:
            print("Too low! Try again.")
        elif guess > secret:
            print("Too high! Try again.")
        else:
            print(f"✨ Correct! You got it in {attempts} attempts!")
            break
    except ValueError:
        print("Please enter a number")
    `
  };

  const loadSample = (key) => {
    setCode(samplePrograms[key]);
  };

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Menu Bar */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-lg px-4 py-2 flex items-center gap-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mr-4">
          <FaCode className="text-primary-500" />
          <span className="font-bold">Feza Python Lab</span>
        </div>

        {/* Execution Mode Toggle */}
        <div className="flex items-center gap-2 mr-4 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setExecutionMode('browser')}
            className={`px-3 py-1 rounded flex items-center gap-2 transition ${
              executionMode === 'browser' 
                ? 'bg-primary-600 text-white' 
                : 'text-gray-300 hover:bg-gray-600'
            }`}
            title="Run in browser (fast, offline, supports input())"
          >
            <FaRocket />
            <span className="text-sm hidden md:inline">Browser</span>
          </button>
          <button
            onClick={() => setExecutionMode('api')}
            className={`px-3 py-1 rounded flex items-center gap-2 transition ${
              executionMode === 'api' 
                ? 'bg-primary-600 text-white' 
                : 'text-gray-300 hover:bg-gray-600'
            }`}
            title="Run on server (more packages)"
          >
            <FaServer />
            <span className="text-sm hidden md:inline">Server</span>
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 mr-2">
          {executionMode === 'browser' && (
            <>
              {pyodideLoading && (
                <span className="text-yellow-500 text-xs flex items-center gap-1">
                  <span className="animate-spin">⏳</span> Loading Python...
                </span>
              )}
              {pyodideLoaded && (
                <span className="text-green-500 text-xs flex items-center gap-1">
                  <span>✅</span> Python Ready
                </span>
              )}
            </>
          )}
          {executionMode === 'api' && (
            <>
              {apiStatus === 'online' && (
                <span className="text-green-500 text-xs flex items-center gap-1">
                  <FaWifi /> Server Online
                </span>
              )}
              {apiStatus === 'offline' && (
                <span className="text-red-500 text-xs flex items-center gap-1">
                  <FaWifi /> Server Offline
                </span>
              )}
            </>
          )}
        </div>

        {/* Run Button */}
        <button
          onClick={handleRun}
          disabled={isRunning || (executionMode === 'browser' && !pyodideLoaded && !pyodideLoading)}
          className={`p-2 rounded flex items-center gap-2 ${
            theme === 'dark' 
              ? 'hover:bg-gray-700 text-green-400' 
              : 'hover:bg-gray-100 text-green-600'
          } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Run (F5)"
        >
          <FaPlay />
          <span className="text-sm hidden md:inline">{isRunning ? 'Running...' : 'Run'}</span>
        </button>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`p-2 rounded flex items-center gap-2 ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
          title="Save (Ctrl+S)"
        >
          <FaSave className="text-blue-500" />
          <span className="text-sm hidden md:inline">Save</span>
        </button>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`p-2 rounded ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
          title="Copy"
        >
          <FaCopy />
        </button>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className={`p-2 rounded ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
          title="Download"
        >
          <FaDownload />
        </button>

        {/* Upload Button */}
        <label className={`p-2 rounded cursor-pointer ${
          theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
        }`} title="Upload">
          <FaUpload />
          <input type="file" accept=".py" onChange={handleUpload} className="hidden" />
        </label>

        <div className="w-px h-6 bg-gray-600 mx-2"></div>

        {/* Sample Programs Dropdown */}
        <select
          onChange={(e) => loadSample(e.target.value)}
          className={`px-3 py-1 rounded text-sm ${
            theme === 'dark' 
              ? 'bg-gray-700 text-white' 
              : 'bg-gray-200 text-gray-800'
          }`}
          defaultValue=""
        >
          <option value="" disabled>Load Example</option>
          <option value="hello">Hello World</option>
          <option value="input">Interactive Input</option>
          <option value="math">Math Operations</option>
          <option value="loop">Loop Example</option>
          <option value="function">Function Example</option>
          <option value="game">Guessing Game</option>
        </select>

        <div className="w-px h-6 bg-gray-600 mx-2"></div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`p-2 rounded ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-gray-700" />}
        </button>

        {/* Console Toggle */}
        <button
          onClick={() => setShowConsole(!showConsole)}
          className={`p-2 rounded ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
          title="Toggle Console"
        >
          <FaTerminal />
        </button>

        {/* Settings Toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
          title="Settings"
        >
          <FaCog />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className={`p-2 rounded ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
          title="Fullscreen"
        >
          {isFullscreen ? <FaCompress /> : <FaExpand />}
        </button>

        {lastSaved && (
          <span className={`text-xs ml-auto ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="font-bold mb-3">Editor Settings</h3>
          <div className="flex gap-6 flex-wrap">
            <div>
              <label className="block text-sm mb-1">Font Size</label>
              <input
                type="range"
                min="10"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-32"
              />
              <span className="text-sm ml-2">{fontSize}px</span>
            </div>
            <div>
              <label className="block text-sm mb-1">Auto Save</label>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={`px-3 py-1 rounded text-sm ${
                  autoSave 
                    ? 'bg-green-600 text-white' 
                    : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              >
                {autoSave ? 'ON' : 'OFF'}
              </button>
            </div>
            <div>
              <label className="block text-sm mb-1">Execution Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExecutionMode('browser')}
                  className={`px-3 py-1 rounded text-sm ${
                    executionMode === 'browser'
                      ? 'bg-primary-600 text-white'
                      : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                >
                  Browser (Fast, Input Support)
                </button>
                <button
                  onClick={() => setExecutionMode('api')}
                  className={`px-3 py-1 rounded text-sm ${
                    executionMode === 'api'
                      ? 'bg-primary-600 text-white'
                      : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                >
                  Server (More Features)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className={`w-48 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-800'} p-2 overflow-y-auto border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold">FILES</h3>
            <button
              onClick={createNewFile}
              className={`p-1 rounded ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
              title="New File"
            >
              <FaPlus size={12} />
            </button>
          </div>
          {files.map((file, index) => (
            <div
              key={file.id}
              className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer ${
                currentFile === index
                  ? theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
              onClick={() => switchFile(index)}
            >
              <div className="flex items-center gap-2">
                <FaFile size={12} className="text-gray-400" />
                <span className="text-sm truncate max-w-[100px]">{file.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFile(index);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400"
              >
                <FaTrash size={10} />
              </button>
            </div>
          ))}
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="python"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              fontSize,
              minimap: { enabled: true },
              lineNumbers: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              suggestOnTriggerCharacters: true,
              formatOnPaste: true,
              formatOnType: true,
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true },
              folding: true,
              foldingHighlight: true,
              matchBrackets: 'always',
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              quickSuggestions: true,
              tabCompletion: 'on',
              wordBasedSuggestions: true,
            }}
          />
        </div>
      </div>

      {/* Console/Output Panel */}
      {showConsole && (
        <div className={`h-64 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'} border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}>
          <div className={`px-4 py-2 flex justify-between items-center border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FaTerminal className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                <span className="font-bold text-sm">Console</span>
              </div>
              
              {/* Execution Stats */}
              {executionTime && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-gray-500">
                    <FaClock /> {executionTime}ms
                  </span>
                  {memoryUsed && (
                    <span className="text-gray-500">
                      | ~{memoryUsed} KB
                    </span>
                  )}
                </div>
              )}

              {/* Input History Indicator */}
              {inputHistory.length > 0 && (
                <span className="text-xs text-purple-500 flex items-center gap-1">
                  <FaKeyboard /> {inputHistory.length} inputs
                </span>
              )}

              {/* Mode Indicator */}
              <span className={`text-xs px-2 py-0.5 rounded ${
                executionMode === 'browser' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {executionMode === 'browser' ? '🚀 Browser Mode' : '🌐 Server Mode'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={clearConsole}
                className={`text-xs px-2 py-1 rounded ${
                  theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4 font-mono text-sm">
            <pre className="whitespace-pre-wrap">{output || 'Ready to run Python code...'}</pre>
          </div>
        </div>
      )}

      {/* Input Modal */}
      {showInputModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FaKeyboard className="text-primary-600" />
              Python Input Required
            </h3>
            <p className="mb-3 text-gray-600">{inputPrompt}</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = e.target.input.value;
              handleInputSubmit(input);
            }}>
              <input
                name="input"
                className="w-full px-3 py-2 border rounded-lg mb-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
                placeholder="Type your input here..."
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleInputSubmit('')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Submit
                </button>
              </div>
            </form>
            <p className="text-xs text-gray-500 mt-3">
              Your input will be sent to the Python program
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPythonEditor;
