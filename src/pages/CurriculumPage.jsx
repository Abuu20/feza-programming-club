// src/pages/CurriculumPage.jsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/common/Loader';
import { achievementsService } from '../services/achievements';
import toast from 'react-hot-toast';
import { FaCheck, FaClock, FaProjectDiagram, FaImage, FaCode, FaGraduationCap, FaChevronRight, FaLock, FaHeart, FaSpinner } from 'react-icons/fa';

// Lazy load the heavy component
const LessonViewer = lazy(() => import('../components/curriculum/LessonViewer'));

const CurriculumPage = () => {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState({});
  const [attachments, setAttachments] = useState({});
  const [miniProjects, setMiniProjects] = useState({});
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLessonData, setSelectedLessonData] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);

  // Fetch modules and basic info first
  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      try {
        // Fetch published modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('curriculum_modules')
          .select('*')
          .eq('is_published', true)
          .order('order_number', { ascending: true });

        if (modulesError) throw modulesError;
        setModules(modulesData || []);

        if (modulesData && modulesData.length > 0) {
          // Fetch lessons for all modules
          const moduleIds = modulesData.map(m => m.id);
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('curriculum')
            .select('id, module_id, title, description, difficulty, estimated_time, order_number, is_published')
            .in('module_id', moduleIds)
            .eq('is_published', true)
            .order('order_number', { ascending: true });

          if (!lessonsError && lessonsData) {
            const lessonsMap = {};
            lessonsData.forEach(lesson => {
              if (!lessonsMap[lesson.module_id]) lessonsMap[lesson.module_id] = [];
              lessonsMap[lesson.module_id].push(lesson);
            });
            setLessons(lessonsMap);
          }

          // Fetch only attachment counts (not full data)
          const lessonIds = lessonsData?.map(l => l.id) || [];
          if (lessonIds.length > 0) {
            const { data: attachmentsData } = await supabase
              .from('lesson_attachments')
              .select('lesson_id, id, type, is_motivational')
              .in('lesson_id', lessonIds);

            if (attachmentsData) {
              const attachmentsMap = {};
              attachmentsData.forEach(att => {
                if (!attachmentsMap[att.lesson_id]) attachmentsMap[att.lesson_id] = [];
                attachmentsMap[att.lesson_id].push(att);
              });
              setAttachments(attachmentsMap);
            }

            // Fetch mini projects info
            const { data: projectsData } = await supabase
              .from('mini_projects')
              .select('lesson_id, id, title')
              .in('lesson_id', lessonIds);

            if (projectsData) {
              const projectsMap = {};
              projectsData.forEach(proj => {
                projectsMap[proj.lesson_id] = proj;
              });
              setMiniProjects(projectsMap);
            }
          }
        }

        // Fetch user progress
        if (user) {
          const { data: progressData } = await supabase
            .from('user_curriculum_progress')
            .select('curriculum_id, status')
            .eq('user_id', user.id);

          if (progressData) {
            const progressMap = {};
            progressData.forEach(p => {
              progressMap[p.curriculum_id] = p.status;
            });
            setProgress(progressMap);
          }
        }
      } catch (error) {
        console.error('Error fetching curriculum:', error);
        toast.error('Failed to load curriculum');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [user]);

  const loadFullLesson = async (lessonId) => {
    setIsLoadingLesson(true);
    try {
      // Show immediate feedback
      toast.loading('Loading lesson content...', { id: 'loading-lesson' });
      
      // Fetch full lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('curriculum')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;

      // Fetch attachments for this lesson
      const { data: attachmentsData } = await supabase
        .from('lesson_attachments')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('display_order', { ascending: true });

      // Fetch mini project for this lesson
      const { data: projectData } = await supabase
        .from('mini_projects')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      toast.dismiss('loading-lesson');
      toast.success('Lesson ready!');
      
      return {
        lesson: lessonData,
        attachments: attachmentsData || [],
        miniProject: projectData
      };
    } catch (error) {
      console.error('Error loading lesson:', error);
      toast.dismiss('loading-lesson');
      toast.error('Failed to load lesson content');
      return null;
    } finally {
      setIsLoadingLesson(false);
    }
  };

  const updateProgress = async (lessonId, status) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_curriculum_progress')
      .upsert({
        user_id: user.id,
        curriculum_id: lessonId,
        status: status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        last_accessed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,curriculum_id'
      });

    if (!error) {
      setProgress(prev => ({ ...prev, [lessonId]: status }));
      
      if (status === 'completed') {
        toast.success('🎉 Lesson completed! Great job!');
      }
    } else {
      toast.error('Failed to update progress');
    }
  };

  const handleLessonClick = async (module, lessonSummary) => {
    const moduleLessons = lessons[module.id] || [];
    const lessonIndex = moduleLessons.findIndex(l => l.id === lessonSummary.id);
    
    // Check if previous lesson is completed
    if (lessonIndex > 0) {
      const prevLesson = moduleLessons[lessonIndex - 1];
      if (progress[prevLesson.id] !== 'completed') {
        toast.error('Complete the previous lesson first!');
        return;
      }
    }
    
    // Immediately show the lesson viewer with loading state
    setSelectedModule(module);
    setSelectedLesson(lessonSummary);
    setSelectedLessonData(null); // Clear any old data
    
    // Load full content in background
    const fullLesson = await loadFullLesson(lessonSummary.id);
    if (fullLesson) {
      setSelectedLessonData(fullLesson);
    } else {
      // If loading failed, go back
      setSelectedLesson(null);
      setSelectedModule(null);
    }
    
    // Update progress to started
    if (!progress[lessonSummary.id]) {
      await updateProgress(lessonSummary.id, 'started');
    }
  };

  const getLessonStatus = (lessonId) => {
    if (progress[lessonId] === 'completed') return 'completed';
    if (progress[lessonId] === 'started') return 'in-progress';
    return 'locked';
  };

  const isLessonUnlocked = (lesson, moduleLessons) => {
    const lessonIndex = moduleLessons.findIndex(l => l.id === lesson.id);
    if (lessonIndex === 0) return true;
    const prevLesson = moduleLessons[lessonIndex - 1];
    return progress[prevLesson.id] === 'completed';
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Show loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse mx-auto mb-3"></div>
          <div className="h-6 w-96 bg-gray-200 rounded-lg animate-pulse mx-auto"></div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-md p-5">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Lesson Viewer Mode - Show immediately with loading state if data not ready
  if (selectedLesson && selectedModule) {
    // If data is still loading, show a nice loading screen
    if (!selectedLessonData && isLoadingLesson) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="animate-spin text-5xl text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Loading Lesson</h2>
            <p className="text-gray-500">Preparing {selectedLesson.title}...</p>
            <button 
              onClick={() => {
                setSelectedLesson(null);
                setSelectedModule(null);
              }}
              className="mt-4 text-primary-600 hover:text-primary-700 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    // If data is loaded, show the lesson
    if (selectedLessonData) {
      return (
        <Suspense fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <FaSpinner className="animate-spin text-5xl text-primary-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading lesson viewer...</p>
            </div>
          </div>
        }>
          <LessonViewer
            lesson={selectedLessonData.lesson}
            module={selectedModule}
            attachments={selectedLessonData.attachments}
            miniProject={selectedLessonData.miniProject}
            isCompleted={progress[selectedLesson.id] === 'completed'}
            onComplete={() => updateProgress(selectedLesson.id, 'completed')}
            onBack={() => {
              setSelectedLesson(null);
              setSelectedModule(null);
              setSelectedLessonData(null);
            }}
            user={user}
          />
        </Suspense>
      );
    }
  }

  // Calculate totals
  const totalLessons = Object.values(lessons).flat().length;
  const completedCount = Object.values(progress).filter(p => p === 'completed').length;

  // Curriculum List View
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">🐍 Python Curriculum</h1>
        <p className="text-gray-600 text-lg">Master Python step by step with interactive lessons and hands-on projects</p>
        {user && totalLessons > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            Your progress: {completedCount} / {totalLessons} lessons completed ({Math.round((completedCount / totalLessons) * 100)}%)
          </div>
        )}
      </div>

      <div className="space-y-6">
        {modules.map((module, moduleIdx) => {
          const moduleLessons = lessons[module.id] || [];
          const completedInModule = moduleLessons.filter(l => progress[l.id] === 'completed').length;
          const progressPercent = moduleLessons.length > 0 ? (completedInModule / moduleLessons.length) * 100 : 0;
          
          return (
            <div key={module.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div 
                className="p-5 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => toggleModule(module.id)}
                style={{ borderLeft: `6px solid ${module.color || '#4F46E5'}` }}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{module.icon || '📚'}</span>
                    <div>
                      <h2 className="text-xl font-bold">
                        Module {moduleIdx + 1}: {module.title}
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">{module.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{moduleLessons.length} lessons</span>
                        <span>{completedInModule} completed</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-gray-400">
                      {expandedModules[module.id] ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
              </div>

              {expandedModules[module.id] && (
                <div className="border-t border-gray-100 divide-y">
                  {moduleLessons.map((lesson, lessonIdx) => {
                    const status = getLessonStatus(lesson.id);
                    const unlocked = isLessonUnlocked(lesson, moduleLessons);
                    const hasProject = !!miniProjects[lesson.id];
                    const hasImages = attachments[lesson.id]?.length > 0;
                    const hasMotivational = attachments[lesson.id]?.some(att => att.is_motivational) || false;
                    
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonClick(module, lesson)}
                        className={`w-full p-4 text-left transition flex items-center justify-between hover:bg-gray-50
                          ${!unlocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        disabled={!unlocked}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                            ${status === 'completed' ? 'bg-green-500 text-white' : 
                              status === 'in-progress' ? 'bg-yellow-500 text-white' : 
                              'bg-gray-200 text-gray-600'}`}>
                            {status === 'completed' ? '✓' : lessonIdx + 1}
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2 flex-wrap">
                              {lesson.title}
                              {status === 'in-progress' && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">In Progress</span>
                              )}
                              {hasProject && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                                  <FaProjectDiagram size={10} /> Project
                                </span>
                              )}
                              {hasImages && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded flex items-center gap-1">
                                  <FaImage size={10} /> Materials
                                </span>
                              )}
                              {hasMotivational && (
                                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded flex items-center gap-1">
                                  <FaHeart size={10} /> Motivation
                                </span>
                              )}
                            </div>
                            <div className="flex gap-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1"><FaClock /> {lesson.estimated_time || 10} min</span>
                              <span className="capitalize">{lesson.difficulty || 'Beginner'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-gray-400">
                          {status === 'completed' ? (
                            <FaCheck className="text-green-500" />
                          ) : !unlocked ? (
                            <FaLock className="text-gray-400" />
                          ) : (
                            <FaChevronRight className="text-gray-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {modules.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <FaGraduationCap className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Curriculum coming soon! Check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurriculumPage;