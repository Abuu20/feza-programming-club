import { supabase } from './supabase';
import { validateSolution } from './code-execution';

export const submissionsService = {
  // Submit a solution
  async submit(challengeId, userId, code) {
    try {
      console.log('Submitting solution for challenge:', challengeId);
      
      // Get challenge details
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;
      if (!challenge) throw new Error('Challenge not found');

      // Validate the solution
      const validation = await validateSolution(code, challenge);
      console.log('Validation result:', validation);

      // Get current attempt number
      const { data: previousAttempts, error: attemptsError } = await supabase
        .from('challenge_submissions')
        .select('attempt_number')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .order('attempt_number', { ascending: false })
        .limit(1);

      if (attemptsError) throw attemptsError;

      const attemptNumber = previousAttempts && previousAttempts.length > 0 
        ? previousAttempts[0].attempt_number + 1 
        : 1;

      // Save submission
      const submissionData = {
        challenge_id: challengeId,
        user_id: userId,
        code,
        status: validation.status,
        points_earned: validation.passed ? validation.points : 0,
        test_results: validation.results || [],
        execution_time: validation.executionTime || 0,
        error_message: validation.error,
        attempt_number: attemptNumber
      };

      const { data: submission, error: submitError } = await supabase
        .from('challenge_submissions')
        .insert([submissionData])
        .select()
        .single();

      if (submitError) throw submitError;

      // Update challenge stats
      if (validation.passed) {
        await supabase.rpc('increment_challenge_completed', { 
          challenge_id: challengeId 
        });
      }

      return {
        success: true,
        submission,
        validation,
        passed: validation.passed
      };
    } catch (error) {
      console.error('Submission error:', error);
      return { 
        success: false, 
        error: error.message,
        validation: {
          status: 'error',
          passed: false,
          results: [],
          error: error.message
        }
      };
    }
  },

  // Get user's submissions for a challenge
  async getUserSubmissions(challengeId, userId) {
    try {
      const { data, error } = await supabase
        .from('challenge_submissions')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .order('attempt_number', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting user submissions:', error);
      return { data: null, error };
    }
  },

  // Get user's overall stats
  async getUserStats(userId) {
    try {
      console.log('Fetching user stats for:', userId);
      
      // Get all submissions for this user
      const { data: submissions, error: submissionsError } = await supabase
        .from('challenge_submissions')
        .select(`
          *,
          challenges (
            id,
            title,
            difficulty,
            points
          )
        `)
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Calculate stats
      const stats = {
        total_submissions: submissions?.length || 0,
        correct_submissions: submissions?.filter(s => s.status === 'correct').length || 0,
        total_points: submissions?.reduce((sum, s) => sum + (s.points_earned || 0), 0) || 0,
        challenges_attempted: new Set(submissions?.map(s => s.challenge_id)).size || 0,
        challenges_solved: new Set(
          submissions?.filter(s => s.status === 'correct').map(s => s.challenge_id)
        ).size || 0,
        recent_submissions: submissions?.slice(0, 5) || []
      };

      stats.success_rate = stats.total_submissions > 0 
        ? Math.round((stats.correct_submissions / stats.total_submissions) * 100) 
        : 0;

      console.log('User stats calculated:', stats);
      return { data: stats, error: null };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return { data: null, error };
    }
  },

  // Get leaderboard
  async getLeaderboard(limit = 50) {
    try {
      console.log('Fetching leaderboard...');
      
      const { data, error } = await supabase
        .from('challenge_submissions')
        .select(`
          user_id,
          points_earned,
          status,
          challenge_id,
          auth.users!inner (
            email
          )
        `)
        .eq('status', 'correct');

      if (error) throw error;
      
      // Aggregate points by user
      const userPoints = {};
      data.forEach(sub => {
        if (!userPoints[sub.user_id]) {
          userPoints[sub.user_id] = {
            user_id: sub.user_id,
            email: sub.auth_users?.email || 'Anonymous',
            total_points: 0,
            solved_count: 0
          };
        }
        userPoints[sub.user_id].total_points += sub.points_earned || 0;
        userPoints[sub.user_id].solved_count += 1;
      });
      
      const leaderboard = Object.values(userPoints)
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, limit)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
      
      console.log('Leaderboard:', leaderboard);
      return { data: leaderboard, error: null };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return { data: null, error };
    }
  },

  // Get challenge statistics
  async getChallengeStats(challengeId) {
    try {
      const { data, error } = await supabase
        .from('challenge_submissions')
        .select('status')
        .eq('challenge_id', challengeId);
      
      if (error) throw error;
      
      const total = data.length;
      const correct = data.filter(s => s.status === 'correct').length;
      
      return {
        data: {
          total_submissions: total,
          correct_submissions: correct,
          success_rate: total > 0 ? (correct / total) * 100 : 0
        },
        error: null
      };
    } catch (error) {
      console.error('Error getting challenge stats:', error);
      return { data: null, error };
    }
  },

  // Check if user has solved a challenge
  async hasUserSolved(challengeId, userId) {
    try {
      const { data, error } = await supabase
        .from('challenge_submissions')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .eq('status', 'correct')
        .maybeSingle();
      
      if (error) throw error;
      return { solved: !!data, error: null };
    } catch (error) {
      console.error('Error checking if user solved:', error);
      return { solved: false, error };
    }
  }
};
