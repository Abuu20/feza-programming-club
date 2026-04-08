// src/pages/admin/AdminCurriculum.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { 
  FaPlus, FaEdit, FaTrash, FaBookOpen, FaClock, FaCode, 
  FaImage, FaProjectDiagram, FaLightbulb, FaChevronDown, 
  FaChevronUp, FaTimes, FaUpload, FaSpinner, FaSave, FaEye,
  FaCopy, FaCheck, FaArrowLeft, FaArrowRight, FaVideo, FaFileAlt
} from 'react-icons/fa';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const AdminCurriculum = () => {
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState({});
  const [attachments, setAttachments] = useState({});
  const [miniProjects, setMiniProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Form states for Module
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    icon: '📚',
    color: '#3B82F6',
    order_number: 0,
    is_published: true
  });

  // Form states for Lesson
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    order_number: 0,
    estimated_time: 30,
    prerequisites: [], // Changed to array
    learning_outcomes: [], // Changed to array
    key_takeaways: [], // Changed to array
    common_mistakes: [], // Changed to array
    code_examples: [],
    is_published: true,
    module_id: null
  });

  // Form state for Mini Project
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    estimated_time: 30,
    starter_code: '# Write your code here\n\ndef main():\n    # Your code here\n    pass\n\nif __name__ == "__main__":\n    main()',
    solution_code: '',
    expected_output: '',
    output_image_url: '',
    hints: [],
    learning_goals: []
  });

  // Color options
  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Cyan', value: '#06B6D4' }
  ];

  // Icon options
  const iconOptions = [
    { name: 'Python', icon: '🐍' },
    { name: 'Book', icon: '📚' },
    { name: 'Code', icon: '💻' },
    { name: 'Rocket', icon: '🚀' },
    { name: 'Star', icon: '⭐' },
    { name: 'Lightbulb', icon: '💡' },
    {name: 'Gear', icon: '⚙️' },
    { name: 'Folder', icon: '📁' },
    { name: 'Target', icon: '🎯' },
    { name: 'Brain', icon: '🧠' },
    { name: 'Database', icon: '🗄️' },
    { name: 'Globe', icon: '🌐' }
  ];

  // Helper function to safely parse array fields from PostgreSQL
  const safelyParseArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        // Handle PostgreSQL array format like {"val1","val2"}
        if (value.startsWith('{') && value.endsWith('}')) {
          // Remove the curly braces
          const cleaned = value.slice(1, -1);
          if (!cleaned) return [];
          
          // Parse PostgreSQL array format
          const items = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              if (current.trim()) {
                let item = current.trim();
                if (item.startsWith('"') && item.endsWith('"')) {
                  item = item.slice(1, -1);
                }
                items.push(item);
              }
              current = '';
            } else {
              current += char;
            }
          }
          if (current.trim()) {
            let item = current.trim();
            if (item.startsWith('"') && item.endsWith('"')) {
              item = item.slice(1, -1);
            }
            items.push(item);
          }
          
          return items;
        }
        
        // Try JSON parse
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Failed to parse array:', value, e);
        return [];
      }
    }
    return [];
  };

  // Helper to convert string with line breaks to array
  const stringToArray = (str) => {
    if (!str) return [];
    return str.split('\n').filter(line => line.trim());
  };

  // Helper to convert array to string with line breaks for textareas
  const arrayToString = (arr) => {
    if (!arr || !Array.isArray(arr)) return '';
    return arr.join('\n');
  };

  // Check Supabase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('curriculum_modules').select('count', { count: 'exact', head: true });
        if (error) throw error;
        setConnectionError(false);
      } catch (error) {
        console.error('Supabase connection failed:', error);
        setConnectionError(true);
        toast.error('Database connection failed. Please check your network and try again.');
      }
    };
    checkConnection();
  }, []);

  // Load only modules first
  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const { data: modulesData, error: modulesError } = await supabase
        .from('curriculum_modules')
        .select('*')
        .order('order_number', { ascending: true });

      if (modulesError) throw modulesError;
      
      setModules(modulesData || []);
      setModulesLoaded(true);
      setConnectionError(false);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setConnectionError(true);
      toast.error('Failed to load modules: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load lessons for a specific module when expanded
  const loadModuleLessons = async (moduleId) => {
    if (lessons[moduleId]) return; // Already loaded

    setLoadingMore(true);
    try {
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('curriculum')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_number', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Parse all array fields for each lesson
      const parsedLessons = (lessonsData || []).map(lesson => ({
        ...lesson,
        prerequisites: safelyParseArray(lesson.prerequisites),
        learning_outcomes: safelyParseArray(lesson.learning_outcomes),
        key_takeaways: safelyParseArray(lesson.key_takeaways),
        common_mistakes: safelyParseArray(lesson.common_mistakes),
        code_examples: safelyParseArray(lesson.code_examples)
      }));

      const attachmentsMap = {};
      const projectsMap = {};

      if (parsedLessons && parsedLessons.length > 0) {
        const lessonIds = parsedLessons.map(l => l.id);
        
        const { data: attachmentsData } = await supabase
          .from('lesson_attachments')
          .select('*')
          .in('lesson_id', lessonIds)
          .order('display_order', { ascending: true });
        
        if (attachmentsData) {
          attachmentsData.forEach(att => {
            if (!attachmentsMap[att.lesson_id]) attachmentsMap[att.lesson_id] = [];
            attachmentsMap[att.lesson_id].push(att);
          });
        }
        
        const { data: projectsData } = await supabase
          .from('mini_projects')
          .select('*')
          .in('lesson_id', lessonIds);
        
        if (projectsData) {
          projectsData.forEach(proj => {
            projectsMap[proj.lesson_id] = proj;
          });
        }
      }

      setLessons(prev => ({ ...prev, [moduleId]: parsedLessons }));
      setAttachments(prev => ({ ...prev, ...attachmentsMap }));
      setMiniProjects(prev => ({ ...prev, ...projectsMap }));
    } catch (error) {
      console.error('Error loading lessons:', error);
      toast.error('Failed to load lessons: ' + error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleModule = async (moduleId) => {
    const isExpanding = !expandedModules[moduleId];
    
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: isExpanding
    }));

    if (isExpanding && !lessons[moduleId]) {
      await loadModuleLessons(moduleId);
    }
  };

  // ==================== MODULE CRUD ====================
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

  const openModuleModal = (module = null) => {
    if (module) {
      setEditingModule(module);
      setModuleForm({
        title: module.title,
        description: module.description || '',
        icon: module.icon || '📚',
        color: module.color || '#3B82F6',
        order_number: module.order_number,
        is_published: module.is_published
      });
    } else {
      setEditingModule(null);
      resetModuleForm();
    }
    setShowModuleModal(true);
  };

  const saveModule = async () => {
    if (!moduleForm.title.trim()) {
      toast.error('Module title is required');
      return;
    }

    try {
      const moduleData = {
        ...moduleForm,
        description: moduleForm.description || null
      };

      if (editingModule) {
        const { error } = await supabase
          .from('curriculum_modules')
          .update(moduleData)
          .eq('id', editingModule.id);
        if (error) throw error;
        toast.success('Module updated successfully');
      } else {
        const { error } = await supabase
          .from('curriculum_modules')
          .insert([moduleData]);
        if (error) throw error;
        toast.success('Module created successfully');
      }
      setShowModuleModal(false);
      fetchModules();
    } catch (error) {
      console.error('Save module error:', error);
      toast.error(error.message || 'Failed to save module');
    }
  };

  const deleteModule = async (module) => {
    if (window.confirm(`Delete "${module.title}" and ALL its lessons? This cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('curriculum_modules')
          .delete()
          .eq('id', module.id);
        
        if (error) throw error;
        
        toast.success('Module deleted');
        setLessons(prev => {
          const newLessons = { ...prev };
          delete newLessons[module.id];
          return newLessons;
        });
        fetchModules();
      } catch (error) {
        console.error('Delete module error:', error);
        toast.error('Failed to delete module: ' + error.message);
      }
    }
  };

  // ==================== LESSON CRUD ====================
  const resetLessonForm = () => {
    setLessonForm({
      title: '',
      description: '',
      difficulty: 'beginner',
      order_number: 0,
      estimated_time: 30,
      prerequisites: [],
      learning_outcomes: [],
      key_takeaways: [],
      common_mistakes: [],
      code_examples: [],
      is_published: true,
      module_id: selectedModuleId
    });
    setActiveTab('basic');
  };

  const openLessonEditor = (lesson = null, moduleId) => {
    setSelectedModuleId(moduleId);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title || '',
        description: lesson.description || '',
        difficulty: lesson.difficulty || 'beginner',
        order_number: lesson.order_number || 0,
        estimated_time: lesson.estimated_time || 30,
        prerequisites: safelyParseArray(lesson.prerequisites),
        learning_outcomes: safelyParseArray(lesson.learning_outcomes),
        key_takeaways: safelyParseArray(lesson.key_takeaways),
        common_mistakes: safelyParseArray(lesson.common_mistakes),
        code_examples: safelyParseArray(lesson.code_examples),
        is_published: lesson.is_published !== false,
        module_id: moduleId
      });
    } else {
      setEditingLesson(null);
      resetLessonForm();
      const currentLessons = lessons[moduleId] || [];
      setLessonForm(prev => ({ 
        ...prev, 
        module_id: moduleId, 
        order_number: currentLessons.length 
      }));
    }
    setShowLessonModal(true);
  };

  const saveLesson = async () => {
    if (!lessonForm.title.trim()) {
      toast.error('Lesson title is required');
      return;
    }

    try {
      // Ensure all array fields are proper arrays
      const prerequisites = Array.isArray(lessonForm.prerequisites) 
        ? lessonForm.prerequisites.filter(p => p && p.trim())
        : [];
      
      const learningOutcomes = Array.isArray(lessonForm.learning_outcomes) 
        ? lessonForm.learning_outcomes.filter(l => l && l.trim())
        : [];
      
      const keyTakeaways = Array.isArray(lessonForm.key_takeaways) 
        ? lessonForm.key_takeaways.filter(k => k && k.trim())
        : [];
      
      const commonMistakes = Array.isArray(lessonForm.common_mistakes) 
        ? lessonForm.common_mistakes.filter(c => c && c.trim())
        : [];
      
      const codeExamples = Array.isArray(lessonForm.code_examples) 
        ? lessonForm.code_examples.filter(example => example && (example.code || example.description))
        : [];
      
      const lessonData = {
        title: lessonForm.title,
        description: lessonForm.description || null,
        difficulty: lessonForm.difficulty,
        order_number: parseInt(lessonForm.order_number) || 0,
        estimated_time: parseInt(lessonForm.estimated_time) || 30,
        prerequisites: prerequisites.length > 0 ? prerequisites : null,
        learning_outcomes: learningOutcomes.length > 0 ? learningOutcomes : null,
        key_takeaways: keyTakeaways.length > 0 ? keyTakeaways : null,
        common_mistakes: commonMistakes.length > 0 ? commonMistakes : null,
        code_examples: codeExamples.length > 0 ? codeExamples : null,
        is_published: lessonForm.is_published,
        module_id: lessonForm.module_id
      };

      let savedLesson = null;

      if (editingLesson) {
        const { data, error } = await supabase
          .from('curriculum')
          .update(lessonData)
          .eq('id', editingLesson.id)
          .select();
        
        if (error) throw error;
        savedLesson = data?.[0];
        toast.success('Lesson updated successfully');
        
        if (lessonForm.module_id && lessons[lessonForm.module_id]) {
          const updatedLessons = lessons[lessonForm.module_id].map(l => 
            l.id === editingLesson.id ? { ...l, ...lessonData } : l
          );
          setLessons(prev => ({ ...prev, [lessonForm.module_id]: updatedLessons }));
        }
      } else {
        const { data, error } = await supabase
          .from('curriculum')
          .insert([lessonData])
          .select();
        
        if (error) throw error;
        savedLesson = data?.[0];
        toast.success('Lesson created successfully');
        
        if (savedLesson && lessonForm.module_id) {
          const currentLessons = lessons[lessonForm.module_id] || [];
          setLessons(prev => ({ 
            ...prev, 
            [lessonForm.module_id]: [...currentLessons, savedLesson] 
          }));
        }
      }
      setShowLessonModal(false);
    } catch (error) {
      console.error('Save lesson error:', error);
      toast.error(error.message || 'Failed to save lesson');
    }
  };

  const deleteLesson = async (lesson) => {
    if (window.confirm(`Delete lesson "${lesson.title}"?`)) {
      try {
        const { error } = await supabase
          .from('curriculum')
          .delete()
          .eq('id', lesson.id);
        
        if (error) throw error;
        
        toast.success('Lesson deleted');
        if (lesson.module_id && lessons[lesson.module_id]) {
          const updatedLessons = lessons[lesson.module_id].filter(l => l.id !== lesson.id);
          setLessons(prev => ({ ...prev, [lesson.module_id]: updatedLessons }));
        }
      } catch (error) {
        console.error('Delete lesson error:', error);
        toast.error('Failed to delete lesson: ' + error.message);
      }
    }
  };

  // ==================== CODE EXAMPLES ====================
  const addCodeExample = () => {
    setLessonForm({
      ...lessonForm,
      code_examples: [...(lessonForm.code_examples || []), { 
        code: '', 
        description: '', 
        output: '' 
      }]
    });
  };

  const updateCodeExample = (index, field, value) => {
    const currentExamples = lessonForm.code_examples || [];
    const newExamples = [...currentExamples];
    newExamples[index] = { ...newExamples[index], [field]: value };
    setLessonForm({ ...lessonForm, code_examples: newExamples });
  };

  const removeCodeExample = (index) => {
    const currentExamples = lessonForm.code_examples || [];
    const newExamples = currentExamples.filter((_, i) => i !== index);
    setLessonForm({ ...lessonForm, code_examples: newExamples });
  };

  // ==================== IMAGE ATTACHMENTS ====================
  const handleImageUpload = async (file, lessonId) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setPreviewImage(URL.createObjectURL(file));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${lessonId}-${Date.now()}.${fileExt}`;
      const filePath = `lesson-images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('curriculum')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('curriculum')
        .getPublicUrl(filePath);
      
      const currentAttachments = attachments[lessonId] || [];
      
      const { data: insertData, error: insertError } = await supabase
        .from('lesson_attachments')
        .insert({
          lesson_id: lessonId,
          type: 'image',
          title: file.name,
          url: publicUrl,
          description: '',
          display_order: currentAttachments.length
        })
        .select();
      
      if (insertError) throw insertError;
      
      toast.success('Image uploaded successfully');
      
      const { data: newAttachments } = await supabase
        .from('lesson_attachments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('display_order', { ascending: true });
      
      setAttachments(prev => ({ ...prev, [lessonId]: newAttachments || [] }));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      setPreviewImage(null);
    }
  };

  const deleteAttachment = async (attachmentId, lessonId) => {
    try {
      const { error } = await supabase
        .from('lesson_attachments')
        .delete()
        .eq('id', attachmentId);
      
      if (error) throw error;
      
      toast.success('Attachment deleted');
      const { data: newAttachments } = await supabase
        .from('lesson_attachments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('display_order', { ascending: true });
      
      setAttachments(prev => ({ ...prev, [lessonId]: newAttachments || [] }));
    } catch (error) {
      console.error('Delete attachment error:', error);
      toast.error('Failed to delete attachment: ' + error.message);
    }
  };

  // ==================== MINI PROJECT ====================
  const openProjectEditor = (lessonId) => {
    setSelectedLessonId(lessonId);
    const existingProject = miniProjects[lessonId];
    
    if (existingProject) {
      setEditingProject(existingProject);
      setProjectForm({
        title: existingProject.title || '',
        description: existingProject.description || '',
        difficulty: existingProject.difficulty || 'beginner',
        estimated_time: existingProject.estimated_time || 30,
        starter_code: existingProject.starter_code || '# Write your code here\n\ndef main():\n    # Your code here\n    pass\n\nif __name__ == "__main__":\n    main()',
        solution_code: existingProject.solution_code || '',
        expected_output: existingProject.expected_output || '',
        output_image_url: existingProject.output_image_url || '',
        hints: safelyParseArray(existingProject.hints),
        learning_goals: safelyParseArray(existingProject.learning_goals)
      });
    } else {
      setEditingProject(null);
      setProjectForm({
        title: '',
        description: '',
        difficulty: 'beginner',
        estimated_time: 30,
        starter_code: '# Write your code here\n\ndef main():\n    # Your code here\n    pass\n\nif __name__ == "__main__":\n    main()',
        solution_code: '',
        expected_output: '',
        output_image_url: '',
        hints: [],
        learning_goals: []
      });
    }
    setShowProjectModal(true);
  };

  const saveMiniProject = async () => {
    if (!projectForm.title.trim()) {
      toast.error('Project title is required');
      return;
    }

    try {
      const cleanHints = (projectForm.hints || []).filter(h => h && h.trim());
      const cleanGoals = (projectForm.learning_goals || []).filter(g => g && g.trim());

      const projectData = {
        title: projectForm.title,
        description: projectForm.description || null,
        difficulty: projectForm.difficulty,
        estimated_time: parseInt(projectForm.estimated_time) || 30,
        starter_code: projectForm.starter_code || null,
        solution_code: projectForm.solution_code || null,
        expected_output: projectForm.expected_output || null,
        output_image_url: projectForm.output_image_url || null,
        hints: cleanHints.length > 0 ? cleanHints : null,
        learning_goals: cleanGoals.length > 0 ? cleanGoals : null,
        lesson_id: selectedLessonId
      };
      
      let savedProject = null;

      if (editingProject) {
        const { data, error } = await supabase
          .from('mini_projects')
          .update(projectData)
          .eq('id', editingProject.id)
          .select();
        
        if (error) throw error;
        savedProject = data?.[0];
        toast.success('Project updated successfully');
        
        setMiniProjects(prev => ({ ...prev, [selectedLessonId]: savedProject || { ...editingProject, ...projectData } }));
      } else {
        const { data, error } = await supabase
          .from('mini_projects')
          .insert([projectData])
          .select();
        
        if (error) throw error;
        savedProject = data?.[0];
        toast.success('Project created successfully');
        
        if (savedProject) {
          setMiniProjects(prev => ({ ...prev, [selectedLessonId]: savedProject }));
        }
      }
      setShowProjectModal(false);
    } catch (error) {
      console.error('Save project error:', error);
      toast.error(error.message || 'Failed to save project');
    }
  };

  const deleteProject = async (lessonId) => {
    const project = miniProjects[lessonId];
    if (project && window.confirm('Delete this mini-project?')) {
      try {
        const { error } = await supabase
          .from('mini_projects')
          .delete()
          .eq('id', project.id);
        
        if (error) throw error;
        
        toast.success('Project deleted');
        setMiniProjects(prev => {
          const newProjects = { ...prev };
          delete newProjects[lessonId];
          return newProjects;
        });
      } catch (error) {
        console.error('Delete project error:', error);
        toast.error('Failed to delete project: ' + error.message);
      }
    }
  };

  // Project helpers
  const addHint = () => {
    setProjectForm({
      ...projectForm,
      hints: [...(projectForm.hints || []), '']
    });
  };

  const updateHint = (index, value) => {
    const newHints = [...(projectForm.hints || [])];
    newHints[index] = value;
    setProjectForm({ ...projectForm, hints: newHints });
  };

  const removeHint = (index) => {
    const newHints = (projectForm.hints || []).filter((_, i) => i !== index);
    setProjectForm({ ...projectForm, hints: newHints });
  };

  const addLearningGoal = () => {
    setProjectForm({
      ...projectForm,
      learning_goals: [...(projectForm.learning_goals || []), '']
    });
  };

  const updateLearningGoal = (index, value) => {
    const newGoals = [...(projectForm.learning_goals || [])];
    newGoals[index] = value;
    setProjectForm({ ...projectForm, learning_goals: newGoals });
  };

  const removeLearningGoal = (index) => {
    const newGoals = (projectForm.learning_goals || []).filter((_, i) => i !== index);
    setProjectForm({ ...projectForm, learning_goals: newGoals });
  };

  // Retry connection
  const retryConnection = () => {
    setConnectionError(false);
    fetchModules();
  };

  if (loading && !modulesLoaded) return <Loader />;

  if (connectionError) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">🔌</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Connection Error</h2>
          <p className="text-red-600 mb-4">Unable to connect to the database. Please check your network connection.</p>
          <button 
            onClick={retryConnection}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">📚 Curriculum Manager</h1>
          <p className="text-gray-600">Create lessons with images, code examples, and mini-projects</p>
        </div>
        <button 
          onClick={() => openModuleModal()} 
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <FaPlus /> New Module
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-500">Total Modules</div>
          <div className="text-2xl font-bold">{modules.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-500">Total Lessons</div>
          <div className="text-2xl font-bold">
            {Object.values(lessons).flat().length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-500">Images Uploaded</div>
          <div className="text-2xl font-bold">
            {Object.values(attachments).flat().length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-500">Mini-Projects</div>
          <div className="text-2xl font-bold">
            {Object.values(miniProjects).filter(p => p).length}
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {modules.map((module, moduleIdx) => {
          const moduleLessons = lessons[module.id] || [];
          const publishedLessons = moduleLessons.filter(l => l.is_published).length;
          
          return (
            <div key={module.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              {/* Module Header */}
              <div 
                className="p-5 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => toggleModule(module.id)}
                style={{ borderLeft: `6px solid ${module.color}` }}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{module.icon}</span>
                    <div>
                      <h2 className="text-xl font-bold">
                        Module {moduleIdx + 1}: {module.title}
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">{module.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-gray-500">{moduleLessons.length} lessons</span>
                        <span className="text-green-600">{publishedLessons} published</span>
                        {!module.is_published && (
                          <span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded">Draft</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openModuleModal(module); }} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit Module"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteModule(module); }} 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete Module"
                    >
                      <FaTrash />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleModule(module.id); }} 
                      className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                    >
                      {expandedModules[module.id] ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lessons List */}
              {expandedModules[module.id] && (
                <div className="border-t border-gray-100 bg-gray-50">
                  {loadingMore && !lessons[module.id] ? (
                    <div className="p-8 text-center">
                      <FaSpinner className="animate-spin text-2xl text-primary-600 mx-auto mb-2" />
                      <p className="text-gray-500">Loading lessons...</p>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-700">Lessons</h3>
                        <button
                          onClick={() => openLessonEditor(null, module.id)}
                          className="text-sm bg-primary-600 text-white px-3 py-1 rounded-lg hover:bg-primary-700 flex items-center gap-1"
                        >
                          <FaPlus size={12} /> Add Lesson
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {moduleLessons.length === 0 && (
                          <div className="text-center py-8 bg-white rounded-lg border">
                            <p className="text-gray-500">No lessons yet. Click "Add Lesson" to get started.</p>
                          </div>
                        )}
                        
                        {moduleLessons.map((lesson, lessonIdx) => (
                          <div key={lesson.id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition">
                            <div className="p-4">
                              <div className="flex justify-between items-start flex-wrap gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-gray-400 text-sm">#{lessonIdx + 1}</span>
                                    <h3 className="font-semibold text-lg">{lesson.title}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      lesson.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                                      lesson.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {lesson.difficulty}
                                    </span>
                                    {!lesson.is_published && (
                                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Draft</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{lesson.description?.substring(0, 100)}</p>
                                  
                                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><FaClock /> {lesson.estimated_time} min</span>
                                    {miniProjects[lesson.id] && (
                                      <span className="flex items-center gap-1 text-green-600 cursor-pointer hover:text-green-700" 
                                            onClick={() => openProjectEditor(lesson.id)}>
                                        <FaProjectDiagram /> Mini-project
                                      </span>
                                    )}
                                    {attachments[lesson.id]?.length > 0 && (
                                      <span className="flex items-center gap-1 text-purple-600">
                                        <FaImage /> {attachments[lesson.id].length} images
                                      </span>
                                    )}
                                    {lesson.code_examples && lesson.code_examples.length > 0 && (
                                      <span className="flex items-center gap-1 text-blue-600">
                                        <FaCode /> {lesson.code_examples.length} examples
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => openLessonEditor(lesson, module.id)} 
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                    title="Edit Lesson"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button 
                                    onClick={() => openProjectEditor(lesson.id)} 
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                    title={miniProjects[lesson.id] ? "Edit Mini-Project" : "Add Mini-Project"}
                                  >
                                    <FaProjectDiagram />
                                  </button>
                                  <button 
                                    onClick={() => deleteLesson(lesson)} 
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Delete Lesson"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>

                              {attachments[lesson.id]?.length > 0 && (
                                <div className="mt-3 pt-3 border-t flex flex-wrap gap-2 items-center">
                                  {attachments[lesson.id].map(att => (
                                    <div key={att.id} className="relative group">
                                      <img 
                                        src={att.url} 
                                        alt={att.title} 
                                        className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80"
                                        onClick={() => window.open(att.url, '_blank')}
                                      />
                                      <button
                                        onClick={() => deleteAttachment(att.id, lesson.id)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition text-xs"
                                      >
                                        <FaTimes size={8} />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = (e) => handleImageUpload(e.target.files[0], lesson.id);
                                      input.click();
                                    }}
                                    className="w-12 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 hover:text-primary-500 hover:border-primary-500 transition"
                                    title="Add Image"
                                  >
                                    <FaUpload />
                                  </button>
                                </div>
                              )}
                              
                              {(!attachments[lesson.id] || attachments[lesson.id].length === 0) && (
                                <div className="mt-3 pt-3 border-t">
                                  <button
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = (e) => handleImageUpload(e.target.files[0], lesson.id);
                                      input.click();
                                    }}
                                    className="text-xs text-gray-400 hover:text-primary-500 flex items-center gap-1"
                                  >
                                    <FaUpload size={10} /> Add image
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {modules.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
            <FaBookOpen className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Modules Yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first curriculum module</p>
            <button onClick={() => openModuleModal()} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 inline-flex items-center gap-2">
              <FaPlus /> Create First Module
            </button>
          </div>
        )}
      </div>

      {/* MODULE MODAL */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingModule ? 'Edit Module' : 'Create New Module'}</h2>
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
                  onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Python Basics"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="What students will learn in this module"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    value={moduleForm.icon}
                    onChange={(e) => setModuleForm({...moduleForm, icon: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {iconOptions.map(opt => (
                      <option key={opt.icon} value={opt.icon}>{opt.icon} {opt.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <select
                    value={moduleForm.color}
                    onChange={(e) => setModuleForm({...moduleForm, color: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{ backgroundColor: moduleForm.color + '20', color: moduleForm.color }}
                  >
                    {colorOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
                  <input
                    type="number"
                    value={moduleForm.order_number}
                    onChange={(e) => setModuleForm({...moduleForm, order_number: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                </div>
                
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={moduleForm.is_published}
                      onChange={(e) => setModuleForm({...moduleForm, is_published: e.target.checked})}
                      className="rounded text-primary-600"
                    />
                    <span className="text-sm text-gray-700">Published (visible to students)</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="border-t p-4 flex gap-2">
              <button onClick={() => setShowModuleModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={saveModule} className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                {editingModule ? 'Update' : 'Create'} Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LESSON MODAL */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</h2>
              <button onClick={() => setShowLessonModal(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex gap-1 border-b mb-6">
                {[
                  { id: 'basic', label: '📝 Basic Info' },
                  { id: 'content', label: '📖 Content' },
                  { id: 'code', label: '💻 Code Examples' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-t-lg transition ${
                      activeTab === tab.id 
                        ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Lesson Title"
                    value={lessonForm.title}
                    onChange={e => setLessonForm({...lessonForm, title: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-lg font-semibold"
                  />
                  
                  <textarea
                    placeholder="Lesson Description"
                    rows="3"
                    value={lessonForm.description}
                    onChange={e => setLessonForm({...lessonForm, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                      <select
                        value={lessonForm.difficulty}
                        onChange={e => setLessonForm({...lessonForm, difficulty: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="beginner">🐣 Beginner</option>
                        <option value="intermediate">📚 Intermediate</option>
                        <option value="advanced">🚀 Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time (minutes)</label>
                      <input
                        type="number"
                        value={lessonForm.estimated_time}
                        onChange={e => setLessonForm({...lessonForm, estimated_time: parseInt(e.target.value) || 30})}
                        className="w-full px-3 py-2 border rounded-lg"
                        min="5"
                        max="180"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisites (one per line)</label>
                    <textarea
                      rows="3"
                      placeholder="Variables&#10;Basic Python syntax&#10;Functions"
                      value={arrayToString(lessonForm.prerequisites)}
                      onChange={e => setLessonForm({...lessonForm, prerequisites: stringToArray(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                    />
                  </div>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={lessonForm.is_published}
                      onChange={e => setLessonForm({...lessonForm, is_published: e.target.checked})}
                      className="rounded text-primary-600"
                    />
                    <span className="text-sm text-gray-700">Publish this lesson</span>
                  </label>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Learning Outcomes (one per line)</label>
                    <textarea
                      rows="4"
                      placeholder="Understand what variables are&#10;Learn how to assign values&#10;Practice using different data types"
                      value={arrayToString(lessonForm.learning_outcomes)}
                      onChange={e => setLessonForm({...lessonForm, learning_outcomes: stringToArray(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Takeaways (one per line)</label>
                    <textarea
                      rows="3"
                      placeholder="Variables store data in memory&#10;Python has dynamic typing&#10;Use = to assign values"
                      value={arrayToString(lessonForm.key_takeaways)}
                      onChange={e => setLessonForm({...lessonForm, key_takeaways: stringToArray(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Common Mistakes to Avoid (one per line)</label>
                    <textarea
                      rows="3"
                      placeholder="Forgetting to define variables before using them&#10;Using incorrect variable names&#10;Mixing data types incorrectly"
                      value={arrayToString(lessonForm.common_mistakes)}
                      onChange={e => setLessonForm({...lessonForm, common_mistakes: stringToArray(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'code' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Code Examples</h3>
                    <button
                      onClick={addCodeExample}
                      className="text-sm bg-primary-600 text-white px-3 py-1 rounded-lg hover:bg-primary-700 flex items-center gap-1"
                    >
                      <FaPlus size={12} /> Add Example
                    </button>
                  </div>
                  
                  {(!lessonForm.code_examples || lessonForm.code_examples.length === 0) && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border">
                      <FaCode className="text-3xl text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No code examples yet. Add one to help students learn!</p>
                    </div>
                  )}
                  
                  {lessonForm.code_examples && lessonForm.code_examples.map((example, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-gray-700">Example {idx + 1}</span>
                        <button onClick={() => removeCodeExample(idx)} className="text-red-500 text-sm hover:text-red-700">
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="What does this example show?"
                        value={example.description || ''}
                        onChange={e => updateCodeExample(idx, 'description', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg mb-3"
                      />
                      <textarea
                        placeholder="Python Code"
                        rows="6"
                        value={example.code || ''}
                        onChange={e => updateCodeExample(idx, 'code', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-gray-900 text-gray-100"
                      />
                      <textarea
                        placeholder="Expected Output"
                        rows="3"
                        value={example.output || ''}
                        onChange={e => updateCodeExample(idx, 'output', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg font-mono text-sm mt-3"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t p-4 flex gap-2">
              <button onClick={() => setShowLessonModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={saveLesson} className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                <FaSave className="inline mr-2" /> {editingLesson ? 'Update' : 'Create'} Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MINI PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaProjectDiagram className="text-green-600" />
                {editingProject ? 'Edit Mini-Project' : 'Add Mini-Project'}
              </h2>
              <button onClick={() => setShowProjectModal(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Project Title"
                value={projectForm.title}
                onChange={e => setProjectForm({...projectForm, title: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-lg font-semibold"
              />
              
              <textarea
                placeholder="Project Description"
                rows="3"
                value={projectForm.description}
                onChange={e => setProjectForm({...projectForm, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={projectForm.difficulty}
                    onChange={e => setProjectForm({...projectForm, difficulty: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
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
                    value={projectForm.estimated_time}
                    onChange={e => setProjectForm({...projectForm, estimated_time: parseInt(e.target.value) || 30})}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="10"
                    max="240"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learning Goals (one per line)</label>
                <textarea
                  rows="3"
                  value={arrayToString(projectForm.learning_goals)}
                  onChange={e => setProjectForm({...projectForm, learning_goals: stringToArray(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  placeholder="Understand loops&#10;Practice conditionals&#10;Implement functions"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Starter Code</label>
                <textarea
                  rows="8"
                  value={projectForm.starter_code}
                  onChange={e => setProjectForm({...projectForm, starter_code: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-gray-900 text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Solution Code (Optional)</label>
                <textarea
                  rows="8"
                  value={projectForm.solution_code}
                  onChange={e => setProjectForm({...projectForm, solution_code: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-gray-900 text-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Students can view this if they get stuck</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Output</label>
                <textarea
                  rows="4"
                  value={projectForm.expected_output}
                  onChange={e => setProjectForm({...projectForm, expected_output: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  placeholder="What the program should output when run correctly"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hints (one per line)</label>
                <textarea
                  rows="3"
                  value={arrayToString(projectForm.hints)}
                  onChange={e => setProjectForm({...projectForm, hints: stringToArray(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                  placeholder="Check your indentation&#10;Remember to convert input to integer&#10;Use a loop to repeat the process"
                />
              </div>
            </div>
            
            <div className="border-t p-4 flex gap-2">
              <button onClick={() => setShowProjectModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={saveMiniProject} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                <FaSave className="inline mr-2" /> {editingProject ? 'Update' : 'Create'} Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCurriculum;