// Judge0 API for code execution (free tier)
export const executeCode = async (code, testCases) => {
  try {
    // Create a submission
    const submission = {
      source_code: code,
      language_id: 71, // Python 3
      stdin: '',
      expected_output: '',
      cpu_time_limit: 2,
      memory_limit: 128000
    };

    // For demo purposes, let's simulate execution since the free API might be rate-limited
    // In production, you'd want to use a real API
    
    console.log('Simulating code execution for testing...');
    
    // Simulate test results
    const results = testCases.map((test, index) => {
      // Basic simulation - you can enhance this
      const passed = Math.random() > 0.3; // 70% chance of passing for demo
      return {
        test: index + 1,
        passed: passed,
        expected: test.expected,
        got: passed ? test.expected : 'different output',
        error: passed ? null : 'Output mismatch'
      };
    });
    
    return {
      success: true,
      results: results,
      output: JSON.stringify(results),
      error: null,
      executionTime: Math.random() * 500
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

// Alternative: Use a simple local evaluation for basic challenges
export const evaluateLocally = (code, testCases) => {
  try {
    // This is a very basic evaluation - only works for simple functions
    // In production, use a proper API
    const results = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const test = testCases[i];
      try {
        // Very unsafe - only for demo!
        const func = new Function('return ' + code)();
        const result = func(eval(test.input));
        const passed = String(result) === String(test.expected);
        
        results.push({
          test: i + 1,
          passed,
          expected: test.expected,
          got: result,
          error: null
        });
      } catch (e) {
        results.push({
          test: i + 1,
          passed: false,
          error: e.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Local evaluation error:', error);
    return [];
  }
};
