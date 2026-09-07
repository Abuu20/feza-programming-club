import { supabase } from './supabase';

export const curriculumService = {
  // Get all modules with their lessons
  async getFullCurriculum() {
    const { data: modules, error: modulesError } = await supabase
      .from('curriculum_modules')
      .select('*')
      .eq('is_published', true)
      .order('order_number', { ascending: true });

    if (modulesError) return { data: null, error: modulesError };

    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const { data: lessons, error: lessonsError } = await supabase
          .from('curriculum')
          .select('*')
          .eq('module_id', module.id)
          .eq('is_published', true)
          .order('order_number', { ascending: true });

        return {
          ...module,
          lessons: lessons || [],
          totalLessons: lessons?.length || 0
        };
      })
    );

    return { data: modulesWithLessons, error: null };
  },

  // Get user's progress
  async getUserProgress(userId) {
    const { data, error } = await supabase
      .from('user_curriculum_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) return { data: null, error };
    
    // Create progress map
    const progressMap = {};
    data.forEach(p => {
      progressMap[p.curriculum_id] = p.status;
    });
    
    return { data: progressMap, error: null };
  },

  // Update lesson progress
  async updateProgress(userId, curriculumId, status) {
    const { data, error } = await supabase
      .from('user_curriculum_progress')
      .upsert({
        user_id: userId,
        curriculum_id: curriculumId,
        status: status,
        completed_at: status === 'completed' ? new Date() : null,
        last_accessed_at: new Date()
      }, {
        onConflict: 'user_id,curriculum_id'
      })
      .select();

    return { data, error };
  },

  // Get curriculum stats for user
  async getUserStats(userId) {
    const { data: allLessons } = await supabase
      .from('curriculum')
      .select('id')
      .eq('is_published', true);
    
    const { data: completed } = await supabase
      .from('user_curriculum_progress')
      .select('curriculum_id')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    const totalLessons = allLessons?.length || 0;
    const completedLessons = completed?.length || 0;
    
    return {
      total: totalLessons,
      completed: completedLessons,
      percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    };
  }
};
