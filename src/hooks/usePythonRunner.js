// src/hooks/usePythonRunner.js - Final working version
import { useState, useCallback, useEffect, useRef } from 'react';

export const usePythonRunner = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const iframeRef = useRef(null);
  const initPromiseRef = useRef(null);

  const initializeIframe = useCallback(() => {
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    initPromiseRef.current = new Promise((resolve, reject) => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        setIsInitialized(true);
        resolve();
        return;
      }

      const iframe = document.createElement('iframe');
      iframe.src = '/python-runner.html';
      iframe.style.display = 'none';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.position = 'absolute';
      iframe.style.visibility = 'hidden';
      
      const timeout = setTimeout(() => {
        reject(new Error('Iframe load timeout'));
      }, 10000);
      
      iframe.onload = () => {
        clearTimeout(timeout);
        console.log('Python runner iframe loaded');
        iframeRef.current = iframe;
        setIsInitialized(true);
        resolve();
      };
      
      iframe.onerror = (err) => {
        clearTimeout(timeout);
        console.error('Failed to load python runner:', err);
        reject(err);
      };
      
      document.body.appendChild(iframe);
    });

    return initPromiseRef.current;
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return;
      
      if (event.data?.type === 'complete' && window.pendingResolve) {
        window.pendingResolve({ output: event.data.output });
        window.pendingResolve = null;
        setIsLoading(false);
      }
      
      if (event.data?.type === 'error' && window.pendingResolve) {
        window.pendingResolve({ error: event.data.error });
        window.pendingResolve = null;
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const runPython = useCallback(async (code) => {
    if (!code || !code.trim()) {
      return { error: 'Please write some code first!' };
    }

    try {
      await initializeIframe();
    } catch (err) {
      return { error: 'Failed to initialize Python environment. Please refresh the page.' };
    }

    if (!iframeRef.current || !iframeRef.current.contentWindow) {
      return { error: 'Python environment not ready. Please wait a moment and try again.' };
    }

    setIsLoading(true);
    
    return new Promise((resolve) => {
      window.pendingResolve = resolve;
      
      const timeout = setTimeout(() => {
        if (window.pendingResolve) {
          window.pendingResolve({ error: 'Code execution timed out (30 seconds)' });
          window.pendingResolve = null;
          setIsLoading(false);
        }
      }, 30000);

      const wrappedResolve = (result) => {
        clearTimeout(timeout);
        resolve(result);
        setIsLoading(false);
      };
      
      window.pendingResolve = wrappedResolve;
      
      try {
        iframeRef.current.contentWindow.postMessage({
          type: 'execute',
          code: code
        }, '*');
      } catch (err) {
        clearTimeout(timeout);
        window.pendingResolve = null;
        resolve({ error: 'Failed to communicate with Python runner' });
        setIsLoading(false);
      }
    });
  }, [initializeIframe]);

  return { runPython, isLoading, isInitialized };
};