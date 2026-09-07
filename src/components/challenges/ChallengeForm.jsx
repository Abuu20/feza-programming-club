import React, { useState } from 'react';
import { FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { challengesService } from '../../services/challenges';
import toast from 'react-hot-toast';

const ChallengeForm = ({ challenge, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: challenge?.title || '',
    description: challenge?.description || '',
    difficulty: challenge?.difficulty || 'easy',
    points: challenge?.points || 100,
    category: challenge?.category || '',
    starter_code: challenge?.starter_code || '# Write your solution here\n\ndef solve(input_data):\n    # Your code here\n    pass\n',
    test_cases: challenge?.test_cases || [
      { input: '', expected: '', hidden: false }
    ],
    hints: challenge?.hints || [],
    solution_explanation: challenge?.solution_explanation || '',
    is_active: challenge?.is_active ?? true
  });

  const [newHint, setNewHint] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTestCaseChange = (index, field, value) => {
    const updatedTests = [...formData.test_cases];
    updatedTests[index] = { ...updatedTests[index], [field]: value };
    setFormData({ ...formData, test_cases: updatedTests });
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      test_cases: [...formData.test_cases, { input: '', expected: '', hidden: false }]
    });
  };

  const removeTestCase = (index) => {
    const updatedTests = formData.test_cases.filter((_, i) => i !== index);
    setFormData({ ...formData, test_cases: updatedTests });
  };

  const addHint = () => {
    if (newHint.trim()) {
      setFormData({
        ...formData,
        hints: [...(formData.hints || []), newHint.trim()]
      });
      setNewHint('');
    }
  };

  const removeHint = (index) => {
    const updatedHints = formData.hints.filter((_, i) => i !== index);
    setFormData({ ...formData, hints: updatedHints });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const challengeData = {
        ...formData,
        points: parseInt(formData.points)
      };

      if (challenge) {
        const { error } = await challengesService.update(challenge.id, challengeData);
        if (error) throw error;
        toast.success('Challenge updated successfully');
      } else {
        const { error } = await challengesService.create(challengeData);
        if (error) throw error;
        toast.success('Challenge created successfully');
      }

      onClose();
    } catch (error) {
      toast.error('Failed to save challenge');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {challenge ? 'Edit Challenge' : 'Create New Challenge'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="e.g., Two Sum"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Arrays, Strings, DP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty *
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points *
              </label>
              <input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleChange}
                required
                min="10"
                max="1000"
                className="input-field"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              className="input-field"
              placeholder="Describe the challenge, input format, output format, and examples..."
            />
          </div>

          {/* Test Cases */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Cases
            </label>
            <div className="space-y-3">
              {formData.test_cases.map((test, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg relative">
                  <button
                    type="button"
                    onClick={() => removeTestCase(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <FaTrash size={12} />
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Input
                      </label>
                      <input
                        type="text"
                        value={test.input}
                        onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                        className="input-field text-sm"
                        placeholder="e.g., [1,2,3]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Expected Output
                      </label>
                      <input
                        type="text"
                        value={test.expected}
                        onChange={(e) => handleTestCaseChange(index, 'expected', e.target.value)}
                        className="input-field text-sm"
                        placeholder="e.g., 6"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={test.hidden}
                      onChange={(e) => handleTestCaseChange(index, 'hidden', e.target.checked)}
                      id={`hidden-${index}`}
                      className="rounded text-primary-600"
                    />
                    <label htmlFor={`hidden-${index}`} className="text-sm text-gray-600">
                      Hidden test case (not shown to users)
                    </label>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addTestCase}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-500 hover:text-primary-600 transition flex items-center justify-center gap-2"
              >
                <FaPlus />
                Add Test Case
              </button>
            </div>
          </div>

          {/* Starter Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starter Code
            </label>
            <textarea
              name="starter_code"
              value={formData.starter_code}
              onChange={handleChange}
              rows="8"
              className="input-field font-mono text-sm"
              placeholder="def solve(input_data):&#10;    # Your code here&#10;    pass"
            />
          </div>

          {/* Hints */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hints
            </label>
            <div className="space-y-2">
              {formData.hints?.map((hint, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                  <span className="flex-1 text-sm">{hint}</span>
                  <button
                    type="button"
                    onClick={() => removeHint(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHint}
                  onChange={(e) => setNewHint(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Add a hint..."
                />
                <button
                  type="button"
                  onClick={addHint}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Solution Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Solution Explanation (Admin only)
            </label>
            <textarea
              name="solution_explanation"
              value={formData.solution_explanation}
              onChange={handleChange}
              rows="4"
              className="input-field"
              placeholder="Explain the solution approach, complexity analysis, etc."
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              id="is_active"
              className="rounded text-primary-600"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Publish immediately (make visible to users)
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? 'Saving...' : (challenge ? 'Update Challenge' : 'Create Challenge')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChallengeForm;
