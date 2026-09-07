import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  FaPlay, 
  FaSave, 
  FaCopy, 
  FaDownload, 
  FaUpload,
  FaUndo,
  FaRedo,
  FaSearch,
  FaCog,
  FaTerminal,
  FaBug,
  FaCode,
  FaFile,
  FaFolderOpen,
  FaTrash,
  FaPlus,
  FaShare,
  FaPrint,
  FaFont,
  FaPalette,
  FaKeyboard,
  FaExpand,
  FaCompress
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { codesService } from '../../services/codes';
import toast from 'react-hot-toast';

const AdvancedCodeEditor = () => {
  const { user } = useAuth();
  const [code, setCode] = useState('# Write your Python code here\nprint("Hello, World!")');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState('vs-dark');
  const [wordWrap, setWordWrap] = useState('on');
  const [minimap, setMinimap] = useState(true);
  const [lineNumbers, setLineNumbers] = useState('on');
  const [autoSave, setAutoSave] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showConsole, setShowConsole] = useState(true);
  const [files, setFiles] = useState([
    { name: 'main.py', content: '# Main program', language: 'python' }
  ]);
  const [currentFile, setCurrentFile] = useState(0);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [debugMode, setDebugMode] = useState(false);
  const [breakpoints, setBreakpoints] = useState([]);
  const [variables, setVariables] = useState({});

  // Auto-save feature
  useEffect(() => {
    let timeoutId;
    if (autoSave && user) {
      timeoutId = setTimeout(() => {
        saveCode();
      }, 3000);
    }
    return () => clearTimeout(timeoutId);
  }, [code, autoSave, user]);

  // Run code function
  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...\n');
    
    try {
      // Use Piston API for actual Python execution
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'python',
          version: '3.10.0',
          files: [{ content: code }]
        })
      });

      const result = await response.json();
      
      if (result.run) {
        setOutput(result.run.output || result.run.stderr || 'No output');
        addToTerminalHistory('$ python ' + files[currentFile].name, 'command');
        addToTerminalHistory(result.run.output || result.run.stderr || 'No output', 'output');
      } else {
        setOutput('Error: Could not execute code');
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Save code to database
  const saveCode = async () => {
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

  // Copy code to clipboard
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  // Download code as file
  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = files[currentFile].name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File downloaded');
  };

  // Upload code file
  const uploadCode = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCode(e.target.result);
        setFiles([...files, { 
          name: file.name, 
          content: e.target.result,
          language: 'python'
        }]);
        toast.success('File uploaded');
      };
      reader.readAsText(file);
    }
  };

  // Create new file
  const createNewFile = () => {
    const newFileName = `script${files.length + 1}.py`;
    setFiles([...files, { 
      name: newFileName, 
      content: '# New Python file\n',
      language: 'python'
    }]);
    setCurrentFile(files.length);
    toast.success(`Created ${newFileName}`);
  };

  // Delete file
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

  // Add to terminal history
  const addToTerminalHistory = (text, type = 'output') => {
    setTerminalHistory(prev => [...prev, { text, type, timestamp: new Date() }]);
  };

  // Clear console
  const clearConsole = () => {
    setOutput('');
    setTerminalHistory([]);
    toast.success('Console cleared');
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Format code (basic Python formatting)
  const formatCode = () => {
    // Simple formatting - in production, use a proper Python formatter
    const lines = code.split('\n');
    const formatted = lines.map(line => line.trim()).join('\n');
    setCode(formatted);
    toast.success('Code formatted');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Menu Bar */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center gap-2 border-b border-gray-700">
        <div className="flex items-center gap-2 mr-4">
          <FaCode className="text-primary-400" />
          <span className="font-bold">Advanced Python Editor</span>
        </div>
        
        <div className="flex-1 flex items-center gap-1">
          <button onClick={runCode} className="p-2 hover:bg-gray-700 rounded" title="Run (F5)">
            <FaPlay className="text-green-400" />
          </button>
          <button onClick={saveCode} className="p-2 hover:bg-gray-700 rounded" title="Save (Ctrl+S)">
            <FaSave className="text-blue-400" />
          </button>
          <button onClick={copyCode} className="p-2 hover:bg-gray-700 rounded" title="Copy">
            <FaCopy />
          </button>
          <button onClick={downloadCode} className="p-2 hover:bg-gray-700 rounded" title="Download">
            <FaDownload />
          </button>
          <label className="p-2 hover:bg-gray-700 rounded cursor-pointer" title="Upload">
            <FaUpload />
            <input type="file" accept=".py" onChange={uploadCode} className="hidden" />
          </label>
          <span className="w-px h-6 bg-gray-700 mx-2"></span>
          <button onClick={() => setShowFileExplorer(!showFileExplorer)} className="p-2 hover:bg-gray-700 rounded" title="File Explorer">
            <FaFolderOpen />
          </button>
          <button onClick={createNewFile} className="p-2 hover:bg-gray-700 rounded" title="New File">
            <FaPlus />
          </button>
          <span className="w-px h-6 bg-gray-700 mx-2"></span>
          <button onClick={formatCode} className="p-2 hover:bg-gray-700 rounded" title="Format Code">
            <FaCode />
          </button>
          <button onClick={() => setDebugMode(!debugMode)} className={`p-2 rounded ${debugMode ? 'bg-yellow-600' : 'hover:bg-gray-700'}`} title="Debug Mode">
            <FaBug />
          </button>
          <button onClick={() => setShowConsole(!showConsole)} className="p-2 hover:bg-gray-700 rounded" title="Toggle Console">
            <FaTerminal />
          </button>
          <span className="w-px h-6 bg-gray-700 mx-2"></span>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-gray-700 rounded" title="Settings">
            <FaCog />
          </button>
          <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-700 rounded" title="Fullscreen">
            <FaExpand />
          </button>
        </div>

        {lastSaved && (
          <span className="text-xs text-gray-400">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 text-white p-4 border-b border-gray-700">
          <h3 className="font-bold mb-3">Editor Settings</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Font Size</label>
              <input
                type="range"
                min="10"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-xs">{fontSize}px</span>
            </div>
            <div>
              <label className="block text-sm mb-1">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-gray-700 text-white px-2 py-1 rounded"
              >
                <option value="vs-dark">Dark</option>
                <option value="vs-light">Light</option>
                <option value="hc-black">High Contrast</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Word Wrap</label>
              <select
                value={wordWrap}
                onChange={(e) => setWordWrap(e.target.value)}
                className="bg-gray-700 text-white px-2 py-1 rounded"
              >
                <option value="on">On</option>
                <option value="off">Off</option>
                <option value="wordWrapColumn">At Column</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Minimap</label>
              <button
                onClick={() => setMinimap(!minimap)}
                className={`px-3 py-1 rounded ${minimap ? 'bg-green-600' : 'bg-gray-600'}`}
              >
                {minimap ? 'On' : 'Off'}
              </button>
            </div>
            <div>
              <label className="block text-sm mb-1">Auto Save</label>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={`px-3 py-1 rounded ${autoSave ? 'bg-green-600' : 'bg-gray-600'}`}
              >
                {autoSave ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        {showFileExplorer && (
          <div className="w-64 bg-gray-800 text-white p-2 overflow-y-auto">
            <h3 className="text-sm font-bold mb-2 px-2">EXPLORER</h3>
            <div className="space-y-1">
              {files.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer hover:bg-gray-700 ${
                    currentFile === index ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => {
                    setCurrentFile(index);
                    setCode(file.content);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <FaFile className="text-gray-400" size={12} />
                    <span className="text-sm">{file.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(index);
                    }}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <FaTrash size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            defaultLanguage="python"
            theme={theme}
            value={code}
            onChange={(value) => setCode(value)}
            options={{
              fontSize,
              minimap: { enabled: minimap },
              lineNumbers: lineNumbers,
              wordWrap: wordWrap,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              suggestOnTriggerCharacters: true,
              formatOnPaste: true,
              formatOnType: true,
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true },
              folding: true,
              foldingHighlight: true,
              foldingStrategy: 'auto',
              showFoldingControls: 'always',
              matchBrackets: 'always',
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              autoSurround: 'languageDefined',
              contextmenu: true,
              mouseWheelZoom: true,
              quickSuggestions: true,
              snippetSuggestions: 'inline',
              tabCompletion: 'on',
              wordBasedSuggestions: true,
            }}
          />
        </div>
      </div>

      {/* Console/Output Panel */}
      {showConsole && (
        <div className="h-64 bg-gray-900 text-white border-t border-gray-700 flex flex-col">
          <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FaTerminal className="text-gray-400" />
              <span className="font-bold">Console</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearConsole}
                className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-sm">
            <pre className="whitespace-pre-wrap">{output}</pre>
            {terminalHistory.map((entry, i) => (
              <div key={i} className={`mb-1 ${
                entry.type === 'command' ? 'text-green-400' : 'text-gray-300'
              }`}>
                <span className="text-gray-500 mr-2">
                  [{entry.timestamp.toLocaleTimeString()}]
                </span>
                {entry.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedCodeEditor;
