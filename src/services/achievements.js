import { supabase } from './supabase';

export const achievementsService = {
  // Get all student achievements for public display with real names
  async getPublicAchievements(limit = 50) {
    try {
      const { data: achievements, error: achievementsError } = await supabase
        .from('student_achievements')
        .select(`
          id,
          user_id,
          achievement_name,
          achievement_description,
          achievement_type,
          completed_at
        `)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (achievementsError) throw achievementsError;
      if (!achievements || achievements.length === 0) return { data: [], error: null };

      const userIds = [...new Set(achievements.map(a => a.user_id))];
      
      // Fetch user details from members table using user_id
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('user_id, name, email, photo_url')
        .in('user_id', userIds);

      if (membersError) {
        console.error('Error fetching members:', membersError);
        return { data: [], error: membersError };
      }
      
      // Create user map from members
      const userMap = {};
      members?.forEach(member => {
        userMap[member.user_id] = {
          name: member.name,
          email: member.email,
          photo: member.photo_url
        };
      });
      
      // Format achievements with real names
      const formatted = achievements.map(achievement => ({
        ...achievement,
        student_name: userMap[achievement.user_id]?.name || 'Student',
        student_email: userMap[achievement.user_id]?.email,
        student_photo: userMap[achievement.user_id]?.photo
      }));
      
      return { data: formatted, error: null };
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return { data: [], error };
    }
  },

  // Get all milestones with real student names
  async getPublicMilestones(limit = 50) {
    try {
      const { data: milestones, error: milestonesError } = await supabase
        .from('student_milestones')
        .select(`
          id,
          user_id,
          milestone_name,
          milestone_description,
          milestone_icon,
          completed_at
        `)
        .eq('is_public', true)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (milestonesError) throw milestonesError;
      if (!milestones || milestones.length === 0) return { data: [], error: null };

      const userIds = [...new Set(milestones.map(m => m.user_id))];
      
      // Fetch user details from members table
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('user_id, name, email, photo_url')
        .in('user_id', userIds);

      if (membersError) {
        console.error('Error fetching members:', membersError);
        return { data: [], error: membersError };
      }
      
      const userMap = {};
      members?.forEach(member => {
        userMap[member.user_id] = {
          name: member.name,
          email: member.email,
          photo: member.photo_url
        };
      });
      
      const formatted = milestones.map(milestone => ({
        ...milestone,
        student_name: userMap[milestone.user_id]?.name || 'Student',
        student_email: userMap[milestone.user_id]?.email,
        student_photo: userMap[milestone.user_id]?.photo
      }));
      
      return { data: formatted, error: null };
    } catch (error) {
      console.error('Error fetching milestones:', error);
      return { data: [], error };
    }
  },

  // Get leaderboard with real student names
  async getLeaderboard(limit = 20) {
    try {
      // Get all users with completed lessons
      const { data: progress, error: progressError } = await supabase
        .from('user_curriculum_progress')
        .select(`
          user_id,
          status,
          curriculum_id
        `)
        .eq('status', 'completed');

      if (progressError) throw progressError;

      const userCompletedCount = {};
      progress?.forEach(p => {
        userCompletedCount[p.user_id] = (userCompletedCount[p.user_id] || 0) + 1;
      });

      const userIds = Object.keys(userCompletedCount);
      if (userIds.length === 0) return { data: [], error: null };

      // Get user details from members table using user_id
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('user_id, name, email, photo_url')
        .in('user_id', userIds);

      if (membersError) {
        console.error('Error fetching members:', membersError);
        return { data: [], error: membersError };
      }
      
      // Get achievements count
      const { data: achievements, error: achievementsError } = await supabase
        .from('student_achievements')
        .select('user_id');
      
      const userAchievementsCount = {};
      achievements?.forEach(a => {
        userAchievementsCount[a.user_id] = (userAchievementsCount[a.user_id] || 0) + 1;
      });
      
      // Create user map from members
      const userMap = {};
      members?.forEach(member => {
        userMap[member.user_id] = {
          name: member.name,
          email: member.email,
          photo: member.photo_url
        };
      });
      
      // Build leaderboard
      const leaderboard = userIds.map(userId => ({
        user_id: userId,
        student_name: userMap[userId]?.name || 'Student',
        email: userMap[userId]?.email,
        lessons_completed: userCompletedCount[userId] || 0,
        achievements_earned: userAchievementsCount[userId] || 0
      })).sort((a, b) => b.lessons_completed - a.lessons_completed).slice(0, limit);
      
      return { data: leaderboard, error: null };
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return { data: [], error };
    }
  },

  // Award a milestone to a student
  async awardMilestone(userId, milestoneType, milestoneName, milestoneDescription, milestoneIcon = '🏆') {
    try {
      // Get student name for the message
      const { data: member } = await supabase
        .from('members')
        .select('name')
        .eq('user_id', userId)
        .single();
      
      const studentName = member?.name || 'Student';
      const personalizedDescription = milestoneDescription.replace('{student}', studentName);
      
      const { data, error } = await supabase
        .from('student_milestones')
        .upsert({
          user_id: userId,
          milestone_type: milestoneType,
          milestone_name: milestoneName,
          milestone_description: personalizedDescription,
          milestone_icon: milestoneIcon,
          completed_at: new Date(),
          is_public: true
        }, {
          onConflict: 'user_id,milestone_type'
        })
        .select();
      
      if (error) throw error;
      console.log(`🏆 Awarded milestone: ${milestoneName} to ${studentName}`);
      return { data, error: null };
    } catch (error) {
      console.error('Error awarding milestone:', error);
      return { data: null, error };
    }
  },

  // Award an achievement
  async awardAchievement(userId, achievementName, achievementDescription, achievementType) {
    try {
      // Get student name
      const { data: member } = await supabase
        .from('members')
        .select('name')
        .eq('user_id', userId)
        .single();
      
      const studentName = member?.name || 'Student';
      const personalizedDescription = achievementDescription.replace('{student}', studentName);
      
      const { data, error } = await supabase
        .from('student_achievements')
        .insert({
          user_id: userId,
          achievement_name: achievementName,
          achievement_description: personalizedDescription,
          achievement_type: achievementType,
          completed_at: new Date()
        })
        .select();
      
      if (error) throw error;
      console.log(`🎉 Awarded achievement: ${achievementName} to ${studentName}`);
      return { data, error: null };
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return { data: null, error };
    }
  },

  // Check and award achievements when a lesson is completed
  async checkAndAwardAchievements(userId, completedLessonId, moduleId) {
    console.log('Checking achievements for user:', userId);
    const awarded = [];
    
    try {
      // Get user's completed lessons count
      const { data: completedLessons, error: lessonsError } = await supabase
        .from('user_curriculum_progress')
        .select('id, curriculum_id')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (lessonsError) {
        console.error('Error fetching completed lessons:', lessonsError);
        return [];
      }

      const completedCount = completedLessons?.length || 0;
      console.log('Completed lessons count:', completedCount);
      
      // Get student name for personalized messages
      const { data: member } = await supabase
        .from('members')
        .select('name')
        .eq('user_id', userId)
        .single();
      
      const studentName = member?.name || 'Student';
      
      // Check for milestones based on lesson count
      if (completedCount === 1) {
        const result = await this.awardMilestone(
          userId, 
          'first_code', 
          'First Steps', 
          `{student} wrote their first line of Python code! 🌟`,
          '🌟'
        );
        if (!result.error) awarded.push(result.data);
      }
      
      if (completedCount === 5) {
        const result = await this.awardMilestone(
          userId, 
          'five_lessons', 
          'Getting Started', 
          `{student} completed 5 lessons! Keep going! 📚`,
          '📚'
        );
        if (!result.error) awarded.push(result.data);
      }
      
      if (completedCount === 10) {
        const result = await this.awardMilestone(
          userId, 
          'ten_lessons', 
          'Dedicated Learner', 
          `{student} completed 10 lessons! Making great progress! ⚡`,
          '⚡'
        );
        if (!result.error) awarded.push(result.data);
      }
      
      if (completedCount === 25) {
        const result = await this.awardMilestone(
          userId, 
          'twenty_five_lessons', 
          'Rising Star', 
          `{student} completed 25 lessons! Becoming a Python pro! 🌟`,
          '🌟'
        );
        if (!result.error) awarded.push(result.data);
      }
      
      if (completedCount === 50) {
        const result = await this.awardMilestone(
          userId, 
          'fifty_lessons', 
          'Halfway Master', 
          `{student} completed 50 lessons! Halfway to mastery! ⚡`,
          '⚡'
        );
        if (!result.error) awarded.push(result.data);
      }
      
      if (completedCount === 75) {
        const result = await this.awardMilestone(
          userId, 
          'seventy_five_lessons', 
          'Advanced Coder', 
          `{student} completed 75 lessons! Advanced skills unlocked! 🚀`,
          '🚀'
        );
        if (!result.error) awarded.push(result.data);
      }
      
      if (completedCount === 100) {
        const result = await this.awardMilestone(
          userId, 
          'hundred_lessons', 
          'Python Pro', 
          `{student} completed ALL 100 lessons! Python Professional! 🏆`,
          '🏆'
        );
        if (!result.error) awarded.push(result.data);
      }
      
      // Check for module completion
      if (moduleId) {
        const { data: moduleLessons } = await supabase
          .from('curriculum')
          .select('id')
          .eq('module_id', moduleId);
        
        const moduleLessonIds = moduleLessons?.map(l => l.id) || [];
        const completedInModule = completedLessons?.filter(l => 
          moduleLessonIds.includes(l.curriculum_id)
        ).length || 0;
        
        if (completedInModule === moduleLessonIds.length && moduleLessonIds.length > 0) {
          const { data: moduleInfo } = await supabase
            .from('curriculum_modules')
            .select('title')
            .eq('id', moduleId)
            .single();
          
          const result = await this.awardMilestone(
            userId, 
            `module_${moduleId}`,
            `${moduleInfo?.title} Master`, 
            `{student} mastered the ${moduleInfo?.title} module! 🏅`,
            '🏅'
          );
          if (!result.error) awarded.push(result.data);
        }
      }
      
      return awarded;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }
};
