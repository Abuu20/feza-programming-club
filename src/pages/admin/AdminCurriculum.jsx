import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaBookOpen, 
  FaClock, 
  FaGraduationCap,
  FaSave,
  FaTimes,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const AdminCurriculum = () => {
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  // Form states
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    icon: '📚',
    color: '#3B82F6',
    order_number: 0,
    is_published: true
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    order_number: 0,
    estimated_time: 30,
    prerequisites: '',
    learning_objectives: '',
    resources: '',
    is_published: true,
    module_id: null
  });

  // Color options for modules
  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Teal', value: '#14B8A6' }
  ];

  // Icon options
  const iconOptions = [
    { name: 'Python', icon: '🐍' },
    { name: 'Book', icon: '📚' },
    { name: 'Gear', icon: '⚙️' },
    { name: 'Folder', icon: '📁' },
    { name: 'Building', icon: '🏗️' },
    { name: 'Globe', icon: '🌐' },
    { name: 'Star', icon: '⭐' },
    { name: 'Rocket', icon: '🚀' },
    { name: 'Lightbulb', icon: '💡' },
    { name: 'Code', icon: '💻' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch modules
    const { data: modulesData } = await supabase
      .from('curriculum_modules')
      .select('*')
      .order('order_number', { ascending: true });
    
    setModules(modulesData || []);
    
    // Fetch lessons for each module
    const lessonsMap = {};
    for (const module of (modulesData || [])) {
      const { data: lessonsData } = await supabase
        .from('curriculum')
        .select('*')
        .eq('module_id', module.id)
        .order('order_number', { ascending: true });
      
      lessonsMap[module.id] = lessonsData || [];
    }
    setLessons(lessonsMap);
    
    setLoading(false);
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Module CRUD
  const handleSaveModule = async () => {
    try {
      let result;
      if (editingModule) {
        result = await supabase
          .from('curriculum_modules')
          .update(moduleForm)
          .eq('id', editingModule.id);
        toast.success('Module updated successfully');
      } else {
        result = await supabase
          .from('curriculum_modules')
          .insert([moduleForm]);
        toast.success('Module created successfully');
      }
      
      if (!result.error) {
        setShowModuleModal(false);
        setEditingModule(null);
        resetModuleForm();
        fetchData();
      } else {
        throw result.error;
      }
    } catch (error) {
      toast.error('Failed to save module');
    }
  };

  const handleDeleteModule = async (module) => {
    if (window.confirm(`Are you sure you want to delete "${module.title}"? All lessons in this module will also be deleted.`)) {
      const { error } = await supabase
        .from('curriculum_modules')
        .delete()
        .eq('id', module.id);
      
      if (!error) {
        toast.success('Module deleted');
        fetchData();
      } else {
        toast.error('Failed to delete module');
      }
    }
  };

  const editModule = (module) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title,
      description: module.description || '',
      icon: module.icon || '📚',
      color: module.color || '#3B82F6',
      order_number: module.order_number,
      is_published: module.is_published
    });
    setShowModuleModal(true);
  };

  // Lesson CRUD
  const handleSaveLesson = async () => {
    try {
      const lessonData = {
        ...lessonForm,
        prerequisites: lessonForm.prerequisites ? lessonForm.prerequisites.split(',').map(p => p.trim()) : [],
        learning_objectives: lessonForm.learning_objectives ? lessonForm.learning_objectives.split(',').map(o => o.trim()) : [],
        resources: lessonForm.resources ? JSON.parse(lessonForm.resources) : null
      };
      lessonData.module_id = selectedModuleId || lessonForm.module_id;
      
      let result;
      if (editingLesson) {
        result = await supabase
          .from('curriculum')
          .update(lessonData)
          .eq('id', editingLesson.id);
        toast.success('Lesson updated successfully');
      } else {
        result = await supabase
          .from('curriculum')
          .insert([lessonData]);
        toast.success('Lesson created successfully');
      }
      
      if (!result.error) {
        setShowLessonModal(false);
        setEditingLesson(null);
        resetLessonForm();
        fetchData();
      } else {
        throw result.error;
      }
    } catch (error) {
      toast.error('Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (lesson) => {
    if (window.confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
      const { error } = await supabase
        .from('curriculum')
        .delete()
        .eq('id', lesson.id);
      
      if (!error) {
        toast.success('Lesson deleted');
        fetchData();
      } else {
        toast.error('Failed to delete lesson');
      }
    }
  };

  const editLesson = (lesson, moduleId) => {
    setEditingLesson(lesson);
    setSelectedModuleId(moduleId);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      difficulty: lesson.difficulty || 'beginner',
      order_number: lesson.order_number,
      estimated_time: lesson.estimated_time || 30,
      prerequisites: lesson.prerequisites ? lesson.prerequisites.join(', ') : '',
      learning_objectives: lesson.learning_objectives ? lesson.learning_objectives.join(', ') : '',
      resources: lesson.resources ? JSON.stringify(lesson.resources, null, 2) : '',
      is_published: lesson.is_published,
      module_id: moduleId
    });
    setShowLessonModal(true);
  };

  const resetModuleForm = () => {
    setModuleForm({
      title: '',
      description: '',
      icon: '📚',
      color: '#3B82F6',
      order_number: modules.length,
      is_published: true
    });
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: '',
      description: '',
      difficulty: 'beginner',
      order_number: 0,
      estimated_time: 30,
      prerequisites: '',
      learning_objectives: '',
      resources: '',
      is_published: true,
      module_id: null
    });
  };

  const openNewLesson = (moduleId) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(null);
    resetLessonForm();
    setLessonForm(prev => ({ ...prev, module_id: moduleId, order_number: lessons[moduleId]?.length || 0 }));
    setShowLessonModal(true);
  };

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Curriculum Management</h1>
          <p className="text-gray-600">Create and manage your Python learning path</p>
        </div>
        <button
          onClick={() => {
            setEditingModule(null);
            resetModuleForm();
            setShowModuleModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <FaPlus />
          New Module
        </button>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {modules.map((module) => (
          <div key={module.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            {/* Module Header */}
            <div className="p-4 flex items-center justify-between" style={{ borderLeft: `4px solid ${module.color}` }}>
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{module.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{module.title}</h2>
                    {!module.is_published && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Draft</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{module.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>Order: {module.order_number}</span>
                    <span>{lessons[module.id]?.length || 0} lessons</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => editModule(module)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit Module"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDeleteModule(module)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete Module"
                >
                  <FaTrash />
                </button>
                <button
                  onClick={() => toggleModule(module.id)}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded"
                >
                  {expandedModules[module.id] ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
            </div>

            {/* Lessons List */}
            {expandedModules[module.id] && (
              <div className="border-t border-gray-100 p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700">Lessons</h3>
                  <button
                    onClick={() => openNewLesson(module.id)}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <FaPlus size={12} />
                    Add Lesson
                  </button>
                </div>
                
                <div className="space-y-2">
                  {lessons[module.id]?.length > 0 ? (
                    lessons[module.id].map((lesson) => (
                      <div key={lesson.id} className="bg-white rounded-lg p-3 flex items-center justify-between border border-gray-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lesson.order_number + 1}.</span>
                            <span className="font-medium">{lesson.title}</span>
                            {!lesson.is_published && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Draft</span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              lesson.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                              lesson.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {lesson.difficulty}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-1">{lesson.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><FaClock /> {lesson.estimated_time} min</span>
                            <span>{lesson.learning_objectives?.length || 0} objectives</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => editLesson(lesson, module.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No lessons yet. Click "Add Lesson" to start.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {modules.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FaBookOpen className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No modules yet. Click "New Module" to create your first module.</p>
          </div>
        )}
      </div>

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingModule ? 'Edit Module' : 'Create New Module'}
              </h2>
              <button onClick={() => setShowModuleModal(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Module Title *</label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Python Fundamentals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Describe what students will learn in this module"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    value={moduleForm.icon}
                    onChange={(e) => setModuleForm({ ...moduleForm, icon: e.target.value })}
                    className="input-field"
                  >
                    {iconOptions.map(icon => (
                      <option key={icon.icon} value={icon.icon}>
                        {icon.icon} - {icon.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setModuleForm({ ...moduleForm, color: color.value })}
                        className={`w-8 h-8 rounded-full border-2 ${moduleForm.color === color.value ? 'border-gray-800' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
                  <input
                    type="number"
                    value={moduleForm.order_number}
                    onChange={(e) => setModuleForm({ ...moduleForm, order_number: parseInt(e.target.value) })}
                    className="input-field"
                    min="0"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={moduleForm.is_published}
                      onChange={(e) => setModuleForm({ ...moduleForm, is_published: e.target.checked })}
                      className="rounded text-primary-600"
                    />
                    <span className="text-sm text-gray-700">Publish (visible to students)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowModuleModal(false)} className="px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button onClick={handleSaveModule} className="btn-primary">
                  {editingModule ? 'Update' : 'Create'} Module
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
              </h2>
              <button onClick={() => setShowLessonModal(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title *</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Variables and Data Types"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Detailed description of what students will learn"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={lessonForm.difficulty}
                    onChange={(e) => setLessonForm({ ...lessonForm, difficulty: e.target.value })}
                    className="input-field"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time (minutes)</label>
                  <input
                    type="number"
                    value={lessonForm.estimated_time}
                    onChange={(e) => setLessonForm({ ...lessonForm, estimated_time: parseInt(e.target.value) })}
                    className="input-field"
                    min="5"
                    max="180"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
                <input
                  type="number"
                  value={lessonForm.order_number}
                  onChange={(e) => setLessonForm({ ...lessonForm, order_number: parseInt(e.target.value) })}
                  className="input-field w-32"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisites (comma-separated)</label>
                <input
                  type="text"
                  value={lessonForm.prerequisites}
                  onChange={(e) => setLessonForm({ ...lessonForm, prerequisites: e.target.value })}
                  className="input-field"
                  placeholder="Variables, Loops"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learning Objectives (comma-separated)</label>
                <textarea
                  value={lessonForm.learning_objectives}
                  onChange={(e) => setLessonForm({ ...lessonForm, learning_objectives: e.target.value })}
                  className="input-field"
                  rows="2"
                  placeholder="Understand variables, Use data types, Perform type conversion"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resources (JSON format)</label>
                <textarea
                  value={lessonForm.resources}
                  onChange={(e) => setLessonForm({ ...lessonForm, resources: e.target.value })}
                  className="input-field font-mono text-sm"
                  rows="4"
                  placeholder='{"video": "https://...", "reading": "https://...", "exercise": "https://..."}'
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={lessonForm.is_published}
                    onChange={(e) => setLessonForm({ ...lessonForm, is_published: e.target.checked })}
                    className="rounded text-primary-600"
                  />
                  <span className="text-sm text-gray-700">Publish (visible to students)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowLessonModal(false)} className="px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button onClick={handleSaveLesson} className="btn-primary">
                  {editingLesson ? 'Update' : 'Create'} Lesson
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCurriculum;
