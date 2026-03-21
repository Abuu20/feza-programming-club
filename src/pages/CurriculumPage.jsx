import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { curriculumService } from '../services/curriculum';
import { 
  FaCheckCircle, 
  FaCircle, 
  FaClock, 
  FaBookOpen, 
  FaTrophy, 
  FaChartLine,
  FaCode,
  FaRocket,
  FaStar,
  FaFire,
  FaGem,
  FaMedal,
  FaAward,
  FaGraduationCap,
  FaLaptopCode,
  FaBrain,
  FaDatabase,
  FaGlobe,
  FaChartBar,
  FaRobot,
  FaPalette,
  FaGamepad
} from 'react-icons/fa';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const CurriculumPage = () => {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);

  // Simple emoji icons for modules
  const moduleIcons = {
    'Python Fundamentals': '🐍',
    'Intermediate Python': '🎓',
    'Web Development & APIs': '🌐',
    'Data Science & Analytics': '📊',
    'Advanced Python': '⭐',
    'Professional Portfolio Projects': '💼'
  };

  // Simple emoji icons for projects
  const projectIcons = [
    '🎮', '🌐', '📱', '🎨', '📊', '🤖', '💡', '🔧', '📧', '🎯', '⚙️', '🏆',
    '🎲', '📝', '🖼️', '⏱️', '🎯', '🎨', '🕸️', '🤖', '👾', '🛒', '🔄', '📈'
  ];

  useEffect(() => {
    fetchCurriculum();
    if (user) {
      fetchUserProgress();
      fetchUserStats();
    }
  }, [user]);

  const fetchCurriculum = async () => {
    const { data, error } = await curriculumService.getFullCurriculum();
    if (!error && data) {
      setModules(data);
      // Expand first module by default
      if (data.length > 0) {
        setExpandedModules({ [data[0].id]: true });
      }
    }
    setLoading(false);
  };

  const fetchUserProgress = async () => {
    if (!user) return;
    const { data } = await curriculumService.getUserProgress(user.id);
    setUserProgress(data || {});
  };

  const fetchUserStats = async () => {
    if (!user) return;
    const { data } = await curriculumService.getUserStats(user.id);
    setUserStats(data);
  };

  const handleMarkComplete = async (lessonId, currentStatus, moduleId) => {
    if (!user) {
      toast.error('Please login to track your progress');
      return;
    }

    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    
    try {
      const { error } = await curriculumService.updateProgress(user.id, lessonId, newStatus);
      
      if (!error) {
        setUserProgress(prev => ({
          ...prev,
          [lessonId]: newStatus
        }));
        
        if (newStatus === 'completed') {
          toast.success('🎉 Lesson completed! Keep going!');
        } else {
          toast.success('Lesson marked as incomplete');
        }
        
        fetchUserStats();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return <FaCheckCircle className="text-green-500 text-xl" />;
      case 'in-progress':
        return <FaBookOpen className="text-yellow-500 text-xl animate-pulse" />;
      default:
        return <FaCircle className="text-gray-400 text-xl" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch(difficulty) {
      case 'beginner': return '🌱';
      case 'intermediate': return '🌿';
      case 'advanced': return '🌳';
      default: return '📘';
    }
  };

  const getModuleIcon = (moduleTitle) => {
    return moduleIcons[moduleTitle] || '📚';
  };

  // Get all projects from the portfolio module
  const portfolioModule = modules.find(m => m.title === 'Professional Portfolio Projects');
  const projects = portfolioModule?.lessons || [];

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container-custom">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary-100 px-4 py-2 rounded-full mb-4">
            <FaGraduationCap className="text-primary-600" />
            <span className="text-sm font-semibold text-primary-600">Your Learning Journey</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-primary-600 mb-6">
            Master Python
            <span className="block text-secondary-500 text-3xl md:text-4xl mt-2"></span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A complete, structured path from beginner to professional. 
            Learn Python through hands-on projects and real-world applications.
          </p>
        </div>

        {/* Progress Dashboard */}
        {user && userStats && (
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-xl p-8 mb-12 text-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-4 rounded-full">
                  <FaChartLine className="text-3xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Your Progress</h3>
                  <p className="text-primary-100">{userStats.completed} of {userStats.total} lessons mastered</p>
                </div>
              </div>
              
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{userStats.percentage}% Complete</span>
                    <span>Keep going!</span>
                  </div>
                  <div className="h-4 bg-white/30 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${userStats.percentage}%` }}
                      className="h-full bg-secondary-500 rounded-full transition-all duration-700 ease-out"
                    ></div>
                  </div>
                </div>
              </div>
              
              {userStats.percentage === 100 && (
                <div className="flex items-center gap-3 bg-yellow-400 text-primary-800 px-6 py-3 rounded-full">
                  <FaTrophy className="text-2xl" />
                  <span className="font-bold">Python Master!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-3xl mb-2">📚</div>
            <div className="text-2xl font-bold text-primary-600">{modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)}</div>
            <div className="text-sm text-gray-500">Lessons</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-3xl mb-2">💼</div>
            <div className="text-2xl font-bold text-primary-600">{projects.length}</div>
            <div className="text-sm text-gray-500">Projects</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-3xl mb-2">⏱️</div>
            <div className="text-2xl font-bold text-primary-600">82+</div>
            <div className="text-sm text-gray-500">Hours</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-primary-600">100</div>
            <div className="text-sm text-gray-500">Days of Code</div>
          </div>
        </div>

        {/* Learning Modules */}
        <div className="space-y-6 mb-16">
          {modules.map((module, moduleIndex) => {
            const completedLessons = module.lessons?.filter(lesson => 
              userProgress[lesson.id] === 'completed'
            ).length || 0;
            const moduleProgress = module.totalLessons > 0 
              ? Math.round((completedLessons / module.totalLessons) * 100) 
              : 0;

            return (
              <div key={module.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transition-all hover:shadow-xl">
                {/* Module Header */}
                <div
                  onClick={() => toggleModule(module.id)}
                  className="p-6 cursor-pointer group transition"
                  style={{ borderLeft: `6px solid ${module.color || '#3B82F6'}` }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-5">
                      <div className="text-5xl group-hover:scale-110 transition-transform">
                        {getModuleIcon(module.title)}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 group-hover:text-primary-600 transition">
                          {module.title}
                        </h2>
                        <p className="text-gray-500 mt-1">{module.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-gray-400">
                            {module.lessons?.length || 0} lessons
                          </span>
                          <span className="text-sm text-gray-400">
                            • {module.lessons?.reduce((sum, l) => sum + (l.estimated_time || 0), 0)} min
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-primary-600">{moduleProgress}%</div>
                        <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${moduleProgress}%`,
                              backgroundColor: module.color || '#3B82F6'
                            }}
                          ></div>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedModules[module.id] ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Module Lessons */}
                {expandedModules[module.id] && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-6 space-y-3">
                      {module.lessons?.map((lesson, lessonIndex) => {
                        const status = userProgress[lesson.id] === 'completed' ? 'completed' : 'not-started';
                        const isCompleted = status === 'completed';
                        
                        return (
                          <div
                            key={lesson.id}
                            className={`flex items-center justify-between p-4 rounded-xl transition group/lesson ${
                              isCompleted 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-white border border-gray-200 hover:border-primary-200 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                                isCompleted 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-gray-200 text-gray-600'
                              }`}>
                                {lessonIndex + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold ${isCompleted ? 'text-green-700' : 'text-gray-800'}`}>
                                    {lesson.title}
                                  </span>
                                  <span className="text-sm">{getDifficultyIcon(lesson.difficulty)}</span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-1">{lesson.description}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(lesson.difficulty)}`}>
                                    {lesson.difficulty}
                                  </span>
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <FaClock className="text-xs" />
                                    {lesson.estimated_time} min
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {user && (
                              <button
                                onClick={() => handleMarkComplete(lesson.id, status, module.id)}
                                className={`ml-4 px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                                  isCompleted
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : 'bg-gray-200 text-gray-600 hover:bg-primary-500 hover:text-white'
                                }`}
                              >
                                {getStatusIcon(status)}
                                <span className="text-sm font-medium">
                                  {isCompleted ? 'Completed' : 'Mark Complete'}
                                </span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* PROJECTS SHOWCASE - Beautiful Project Cards */}
        {projects.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-secondary-100 px-4 py-2 rounded-full mb-4">
                <FaGem className="text-secondary-600" />
                <span className="text-sm font-semibold text-secondary-600">Portfolio Projects</span>
              </div>
              <h2 className="text-4xl font-bold text-primary-600 mb-4">
                Build Your Portfolio
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Create real-world projects that showcase your skills to employers and clients
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => {
                const progressStatus = userProgress[project.id];
                const isCompleted = progressStatus === 'completed';
                
                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`group relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                      isCompleted ? 'border-2 border-green-500' : 'border border-gray-100'
                    }`}
                  >
                    {/* Project Card Top Bar */}
                    <div className="h-2 bg-gradient-to-r from-secondary-500 to-primary-500"></div>
                    
                    {/* Project Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-5xl transform group-hover:scale-110 transition-transform duration-300">
                          {projectIcons[index % projectIcons.length]}
                        </div>
                        {isCompleted && (
                          <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <FaCheckCircle size={10} />
                            <span>Completed</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary-600 transition">
                        {project.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {project.description}
                      </p>
                      
                      {/* Project Stats */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <FaClock /> {project.estimated_time} min
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${getDifficultyColor(project.difficulty)}`}>
                          {project.difficulty}
                        </span>
                      </div>
                      
                      {/* Progress Indicator */}
                      {user && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkComplete(project.id, progressStatus, portfolioModule?.id);
                            }}
                            className={`w-full py-2 rounded-lg text-sm font-medium transition ${
                              isCompleted
                                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                : 'bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                            }`}
                          >
                            {isCompleted ? '✅ Completed' : '📌 Start Project'}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Project Detail Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💼</span>
                  <h2 className="text-2xl font-bold text-primary-600">{selectedProject.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedProject.description}</p>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">What You'll Build</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {selectedProject.learning_objectives?.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    ⏱️ {selectedProject.estimated_time} minutes
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(selectedProject.difficulty)}`}>
                    📊 {selectedProject.difficulty}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {user && (
                    <button
                      onClick={() => {
                        handleMarkComplete(selectedProject.id, userProgress[selectedProject.id], portfolioModule?.id);
                        setSelectedProject(null);
                      }}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      {userProgress[selectedProject.id] === 'completed' ? 'Mark as Incomplete' : 'Mark as Complete'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action for Non-logged Users */}
        {!user && (
          <div className="mt-12 text-center bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-2">Ready to Start Your Journey?</h3>
            <p className="mb-6">Login to track your progress and earn achievements!</p>
            <div className="flex gap-4 justify-center">
              <a href="/student/login" className="bg-white text-primary-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
                Login
              </a>
              <a href="/student/request" className="bg-secondary-500 text-primary-800 px-6 py-2 rounded-lg font-semibold hover:bg-secondary-600 transition">
                Join the Club
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurriculumPage;
