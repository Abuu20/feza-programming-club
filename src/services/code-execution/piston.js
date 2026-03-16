// Piston API for code execution (free)
export const executeCode = async (code, testCases) => {
  try {
    // Wrap the code with test harness
    const wrappedCode = `
import json
import sys
import traceback

def run_tests():
    results = []
    test_cases = ${JSON.stringify(testCases)}
    
    for i, test in enumerate(test_cases):
        try:
            # Prepare environment
            input_data = test.get('input', '')
            expected = test.get('expected', '')
            
            # Execute user code
            namespace = {}
            exec(${JSON.stringify(code)}, namespace)
            
            # Call the main function (assuming they define solve())
            if 'solve' in namespace:
                result = namespace['solve'](input_data)
            else:
                result = None
            
            passed = str(result) == str(expected)
            results.append({
                'test': i + 1,
                'passed': passed,
                'expected': expected,
                'got': result,
                'error': None
            })
        except Exception as e:
            results.append({
                'test': i + 1,
                'passed': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            })
    
    print(json.dumps(results))

if __name__ == '__main__':
    run_tests()
`;

    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'python',
        version: '3.10.0',
        files: [{ content: wrappedCode }]
      })
    });

    const result = await response.json();
    
    if (result.run?.stdout) {
      try {
        const testResults = JSON.parse(result.run.stdout);
        return {
          success: true,
          results: testResults,
          output: result.run.output,
          error: result.run.stderr
        };
      } catch (e) {
        return {
          success: true,
          results: [],
          output: result.run.stdout,
          error: result.run.stderr
        };
      }
    }
    
    return {
      success: false,
      error: result.run?.stderr || 'Execution failed',
      results: []
    };
  } catch (error) {
    console.error('Code execution error:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
};
