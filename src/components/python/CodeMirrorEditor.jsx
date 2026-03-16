import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
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
  FaRedo,
  FaUndo
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { codesService } from '../../services/codes';
import toast from 'react-hot-toast';

const CodeMirrorEditor = () => {
  const { user } = useAuth();
  const [code, setCode] = useState('# Write your Python code here\nprint("Hello, Feza Programming Club!")');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState(14);
  const [showConsole, setShowConsole] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [files, setFiles] = useState([
    { id: 1, name: 'main.py', content: '# Write your Python code here\nprint("Hello, Feza Programming Club!")' }
  ]);
  const [currentFile, setCurrentFile] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const editorRef = useRef(null);

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

  // Run Python code using Piston API
  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...\n');
    
    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'python',
          version: '3.10.0',
          files: [{ 
            name: files[currentFile].name,
            content: code 
          }]
        })
      });

      const result = await response.json();
      
      if (result.run) {
        const output_text = result.run.output || result.run.stderr || 'No output';
        setOutput(output_text);
        
        // Add to console with timestamp
        console.log(`[${new Date().toLocaleTimeString()}] Program executed`);
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

  // Create new file
  const createNewFile = () => {
    const newFileName = `script${files.length + 1}.py`;
    const newFile = {
      id: files.length + 1,
      name: newFileName,
      content: '# New Python file\n'
    };
    setFiles([...files, newFile]);
    setCurrentFile(files.length);
    setCode(newFile.content);
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
    
    // Switch to first file
    setCurrentFile(0);
    setCode(newFiles[0].content);
    toast.success('File deleted');
  };

  // Switch file
  const switchFile = (index) => {
    // Save current file content before switching
    const updatedFiles = [...files];
    updatedFiles[currentFile].content = code;
    setFiles(updatedFiles);
    
    setCurrentFile(index);
    setCode(files[index].content);
  };

  // Clear console
  const clearConsole = () => {
    setOutput('');
    toast.success('Console cleared');
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Undo/Redo
  const undo = () => {
    // CodeMirror handles undo internally
    document.execCommand('undo');
  };

  const redo = () => {
    document.execCommand('redo');
  };

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Menu Bar */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-lg px-4 py-2 flex items-center gap-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mr-4">
          <FaCode className="text-primary-500" />
          <span className="font-bold">Python Lab</span>
        </div>

        {/* Run Button */}
        <button
          onClick={runCode}
          disabled={isRunning}
          className={`p-2 rounded flex items-center gap-2 ${
            theme === 'dark' 
              ? 'hover:bg-gray-700 text-green-400' 
              : 'hover:bg-gray-100 text-green-600'
          }`}
          title="Run (F5)"
        >
          <FaPlay />
          <span className="text-sm hidden md:inline">Run</span>
        </button>

        {/* Save Button */}
        <button
          onClick={saveCode}
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
          onClick={copyCode}
          className={`p-2 rounded ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
          title="Copy"
        >
          <FaCopy />
        </button>

        {/* Download Button */}
        <button
          onClick={downloadCode}
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
          <input type="file" accept=".py" onChange={uploadCode} className="hidden" />
        </label>

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
          <div className="flex gap-6">
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

        {/* CodeMirror Editor */}
        <div className="flex-1 overflow-auto">
          <CodeMirror
            value={code}
            height="100%"
            theme={theme === 'dark' ? oneDark : undefined}
            extensions={[python()]}
            onChange={(value) => setCode(value)}
            style={{ fontSize: `${fontSize}px` }}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              history: true,
              foldGutter: true,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              syntaxHighlighting: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              crosshairCursor: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              defaultKeymap: true,
              searchKeymap: true,
              historyKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
          />
        </div>
      </div>

      {/* Console/Output Panel */}
      {showConsole && (
        <div className={`h-48 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'} border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}>
          <div className={`px-4 py-2 flex justify-between items-center border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <FaTerminal className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
              <span className="font-bold text-sm">Console</span>
            </div>
            <button
              onClick={clearConsole}
              className={`text-xs px-2 py-1 rounded ${
                theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-sm">
            <pre className="whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeMirrorEditor;
