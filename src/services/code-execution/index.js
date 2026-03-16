import { executeCode } from './judge0';

export const calculatePoints = (difficulty, passedTests, totalTests, executionTime) => {
  const basePoints = {
    easy: 100,
    medium: 200,
    hard: 300,
    expert: 500
  }[difficulty] || 100;

  const score = (passedTests / totalTests) * basePoints;
  const timeBonus = executionTime < 1000 ? 50 : 0;
  
  return Math.round(score + timeBonus);
};

export const validateSolution = async (code, challenge) => {
  try {
    console.log('Validating solution for challenge:', challenge?.title);
    console.log('Test cases:', challenge?.test_cases);
    
    if (!challenge?.test_cases || challenge.test_cases.length === 0) {
      return {
        status: 'error',
        error: 'No test cases defined for this challenge',
        passed: false,
        results: []
      };
    }
    
    const result = await executeCode(code, challenge.test_cases);
    
    console.log('Execution result:', result);
    
    if (!result.success) {
      return {
        status: 'error',
        error: result.error || 'Execution failed',
        passed: false,
        results: []
      };
    }
    
    const testResults = result.results || [];
    const passedCount = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    const allPassed = passedCount === totalTests && totalTests > 0;
    
    return {
      status: allPassed ? 'correct' : 'wrong',
      passed: allPassed,
      passedCount,
      totalTests,
      results: testResults,
      output: result.output,
      executionTime: result.executionTime || 300,
      points: calculatePoints(challenge.difficulty, passedCount, totalTests, 300)
    };
  } catch (error) {
    console.error('Validation error:', error);
    return {
      status: 'error',
      error: error.message,
      passed: false,
      results: []
    };
  }
};
