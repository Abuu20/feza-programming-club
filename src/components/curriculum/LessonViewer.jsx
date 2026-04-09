// src/components/curriculum/LessonViewer.jsx
import React, { useState } from 'react';
import { FaCheck, FaClock, FaProjectDiagram, FaImage, FaCode, FaLightbulb, FaGraduationCap, FaDownload, FaFilePdf, FaFileImage, FaFileAlt, FaHeart, FaStar, FaRegSmile, FaSpinner, FaKeyboard } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { usePythonRunner } from '../../hooks/usePythonRunner';

const LessonViewer = ({ 
  lesson, 
  module, 
  attachments = [], 
  miniProject = null, 
  isCompleted = false, 
  onComplete, 
  onBack 
}) => {
  const [userCode, setUserCode] = useState(miniProject?.starter_code || '# Write your code here\n\n');
  const [codeOutput, setCodeOutput] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [inputValues, setInputValues] = useState([]);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [pendingCode, setPendingCode] = useState(null);
  
  const { runPython, isLoading: isRunning } = usePythonRunner();

  // Helper function to safely get array values (handles both array and string formats)
  const getArrayFromField = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      // Check if it's a JSON string representation of an array
      if (field.startsWith('[') && field.endsWith(']')) {
        try {
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : [field];
        } catch (e) {
          return field.split('\n').filter(line => line.trim());
        }
      }
      // Treat as newline-separated string
      return field.split('\n').filter(line => line.trim());
    }
    return [];
  };

  // Helper function to safely get string field
  const getStringFromField = (field) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (Array.isArray(field)) return field.join('\n');
    return String(field);
  };

  const runCode = async () => {
    if (!userCode.trim()) {
      setCodeOutput('⚠️ Please write some code first!');
      return;
    }

    // Check if code has input() calls
    const hasInput = userCode.includes('input(');
    
    if (hasInput) {
      setPendingCode(userCode);
      setShowInputDialog(true);
    } else {
      setCodeOutput('🔄 Running code...');
      const result = await runPython(userCode, []);
      
      if (result.error) {
        setCodeOutput(`❌ Error:\n${result.error}`);
      } else {
        setCodeOutput(`✅ Output:\n${result.output || 'No output'}`);
      }
    }
  };

  const handleRunWithInputs = async () => {
    setShowInputDialog(false);
    setCodeOutput('🔄 Running code with provided inputs...');
    
    const result = await runPython(pendingCode, inputValues);
    
    if (result.error) {
      setCodeOutput(`❌ Error:\n${result.error}`);
    } else {
      setCodeOutput(`✅ Output:\n${result.output || 'No output'}`);
    }
    
    setInputValues([]);
    setPendingCode(null);
  };

  const getFileType = (url) => {
    if (!url) return 'other';
    const extension = url.split('.').pop()?.toLowerCase() || '';
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    const pdfTypes = ['pdf'];
    
    if (imageTypes.includes(extension)) return 'image';
    if (pdfTypes.includes(extension)) return 'pdf';
    return 'other';
  };

  const getFileIcon = (fileType) => {
    switch(fileType) {
      case 'pdf': return <FaFilePdf className="text-red-500 text-2xl" />;
      case 'image': return <FaFileImage className="text-purple-500 text-2xl" />;
      default: return <FaFileAlt className="text-gray-500 text-2xl" />;
    }
  };

  // Attachment titles are raw filenames saved during upload (e.g.
  // "lessonId-timestamp-random.png"). We never want to show those to
  // students — only show a caption when the admin has written a real
  // human-readable description for the file.
  const renderAttachment = (attachment) => {
    if (!attachment || !attachment.url) return null;
    
    const fileType = getFileType(attachment.url);
    
    if (fileType === 'image') {
      return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border hover:shadow-lg transition-all duration-300">
          <div className="relative group">
            <img 
              src={attachment.url} 
              alt="Learning material"
              className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition"
              onClick={() => setSelectedImage(attachment.url)}
              loading="lazy"
            />
            <button
              onClick={() => window.open(attachment.url, '_blank')}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
              aria-label="View full size"
            >
              🔍
            </button>
          </div>
          {attachment.description && (
            <div className="p-3 bg-gray-50 text-sm border-t">
              <p className="text-gray-600">{attachment.description}</p>
            </div>
          )}
        </div>
      );
    }
    
    if (fileType === 'pdf') {
      return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border hover:shadow-lg transition-all duration-300">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl animate-pulse">📚</div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    {getFileIcon(fileType)}
                    {attachment.description || 'Learning Material'}
                  </h4>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 transition flex items-center gap-2 shadow-md">
                  📖 Read Online
                </a>
                <a href={attachment.url} download className="bg-gray-700 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 shadow-md">
                  <FaDownload /> Download
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderMotivationalContent = () => {
    const motivationalMaterials = attachments?.filter(att => att.is_motivational) || [];
    if (motivationalMaterials.length === 0) return null;

    const randomMotivation = motivationalMaterials[Math.floor(Math.random() * motivationalMaterials.length)];
    
    return (
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="text-4xl animate-bounce">
            {randomMotivation.icon || <FaHeart className="text-pink-500" />}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-pink-800 flex items-center gap-2">
              <FaStar className="text-yellow-500" />
              Daily Motivation
              <FaRegSmile className="text-yellow-500" />
            </h3>
            <p className="text-gray-700 mt-2 italic">{randomMotivation.description || "Keep going! Every line of code brings you closer to mastery! 💪"}</p>
          </div>
        </div>
      </div>
    );
  };

  const ImageLightbox = () => {
    if (!selectedImage) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
        <div className="relative max-w-5xl max-h-screen">
          <img src={selectedImage} alt="Full size view" className="max-w-full max-h-screen object-contain rounded-lg" />
          <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition">✕</button>
        </div>
      </div>
    );
  };

  const learningMaterials = attachments?.filter(att => !att.is_motivational) || [];
  const codeExamples = lesson?.code_examples || [];
  
  // Get array values for text fields
  const learningOutcomes = getArrayFromField(lesson?.learning_outcomes);
  const keyTakeaways = getArrayFromField(lesson?.key_takeaways);
  const commonMistakes = getArrayFromField(lesson?.common_mistakes);
  const prerequisites = getArrayFromField(lesson?.prerequisites);

  return (
    <>
      <ImageLightbox />
      
      {/* Input Dialog */}
      {showInputDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaKeyboard className="text-primary-600" />
                Input Required
              </h3>
              <p className="text-gray-600 mb-4">This code uses <code className="bg-gray-100 px-2 py-1 rounded">input()</code>. Please provide the required inputs:</p>
              
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-medium text-gray-700">Input values (one per line):</label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Example:&#10;10&#10;Hello World&#10;42"
                  value={inputValues.join('\n')}
                  onChange={(e) => setInputValues(e.target.value.split('\n').filter(v => v.trim()))}
                />
                <p className="text-xs text-gray-500">Each line will be used as an input in order</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowInputDialog(false);
                    setInputValues([]);
                    setPendingCode(null);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRunWithInputs}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  Run Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-2">
            <button onClick={onBack} className="text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
              ← Back to Curriculum
            </button>
            <div className="text-sm text-gray-500">{module?.title} • {lesson?.title}</div>
            {isCompleted && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs flex items-center gap-1"><FaCheck /> Completed</span>}
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{lesson?.title}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1"><FaClock /> {lesson?.estimated_time || 10} minutes</span>
              <span className="capitalize">📊 {lesson?.difficulty || 'Beginner'}</span>
              {miniProject && <span className="flex items-center gap-1 text-green-600"><FaProjectDiagram /> Includes Mini-Project</span>}
              {learningMaterials.length > 0 && <span className="flex items-center gap-1 text-purple-600"><FaImage /> {learningMaterials.length} learning materials</span>}
            </div>
            <p className="text-gray-700 text-lg">{lesson?.description}</p>
          </div>

          {/* Prerequisites */}
          {prerequisites.length > 0 && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg mb-6">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                📋 Prerequisites
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {prerequisites.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Learning Outcomes */}
          {learningOutcomes.length > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <FaGraduationCap className="text-blue-600" />
                What You'll Learn
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {learningOutcomes.map((outcome, i) => (
                  <li key={i}>{outcome}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Motivational Content */}
          {renderMotivationalContent()}

          {/* Learning Materials */}
          {learningMaterials.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold flex items-center gap-2 mb-4 text-xl">
                <FaImage className="text-purple-600" />
                Learning Materials ({learningMaterials.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {learningMaterials.map(att => <div key={att.id}>{renderAttachment(att)}</div>)}
              </div>
            </div>
          )}

          {/* Code Examples */}
          {codeExamples.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold flex items-center gap-2 mb-3 text-xl">
                <FaCode className="text-green-600" />
                Code Examples
              </h3>
              {codeExamples.map((example, idx) => (
                <div key={idx} className="bg-gray-900 rounded-lg overflow-hidden mb-4">
                  <div className="bg-gray-800 px-4 py-2 text-white text-sm">
                    {example.description || `Example ${idx + 1}`}
                  </div>
                  <SyntaxHighlighter language="python" style={tomorrow} className="m-0">
                    {example.code || ''}
                  </SyntaxHighlighter>
                  {example.output && (
                    <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
                      <div className="text-gray-400 text-xs mb-1">Output:</div>
                      <pre className="text-green-400 text-sm font-mono">{example.output}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Mini Project */}
          {miniProject && (
            <div className="border-2 border-green-200 rounded-xl p-6 mb-8 bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="text-2xl font-bold flex items-center gap-2 mb-4 text-green-800">
                <FaProjectDiagram className="text-green-600" />
                🎯 Mini-Project: {miniProject.title}
              </h3>
              
              <p className="text-gray-700 mb-4 text-lg">{miniProject.description}</p>
              
              {miniProject.learning_goals && miniProject.learning_goals.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <FaLightbulb className="text-yellow-600" />
                    Project Goals
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {miniProject.learning_goals.map((goal, i) => (
                      <li key={i} className="text-gray-700">{goal}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-4">
                <label className="block font-semibold mb-2 text-gray-700">Your Code:</label>
                <textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  rows="12"
                  className="w-full font-mono text-sm p-4 border rounded-lg bg-gray-900 text-gray-100 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <button 
                  onClick={runCode} 
                  disabled={isRunning}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isRunning ? <><FaSpinner className="animate-spin" /> Running...</> : '▶ Run Code'}
                </button>
                {miniProject.solution_code && (
                  <button 
                    onClick={() => setShowSolution(!showSolution)} 
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
                  >
                    {showSolution ? 'Hide Solution' : '💡 View Solution'}
                  </button>
                )}
              </div>

              {codeOutput && (
                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <div className="text-gray-400 text-xs mb-1">Output:</div>
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">{codeOutput}</pre>
                </div>
              )}

              {showSolution && miniProject.solution_code && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 text-gray-700">Solution:</h4>
                  <SyntaxHighlighter language="python" style={tomorrow}>
                    {miniProject.solution_code}
                  </SyntaxHighlighter>
                </div>
              )}

              {miniProject.expected_output && (
                <div className="bg-blue-50 p-4 rounded-lg mt-4 border border-blue-200">
                  <h4 className="font-semibold mb-2 text-blue-800">Expected Output:</h4>
                  <pre className="text-sm font-mono bg-blue-100 p-2 rounded text-blue-900">
                    {miniProject.expected_output}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Key Takeaways */}
          {keyTakeaways.length > 0 && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <FaCheck className="text-green-600" />
                Key Takeaways
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {keyTakeaways.map((takeaway, i) => (
                  <li key={i}>{takeaway}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Common Mistakes */}
          {commonMistakes.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                ⚠️ Common Mistakes to Avoid
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {commonMistakes.map((mistake, i) => (
                  <li key={i}>{mistake}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Complete Button */}
          {!isCompleted ? (
            <button
              onClick={onComplete}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition text-lg"
            >
              ✓ Mark as Complete & Continue
            </button>
          ) : (
            <div className="text-center p-4 bg-green-100 rounded-lg text-green-700">
              ✅ You've completed this lesson! 🎉
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LessonViewer;