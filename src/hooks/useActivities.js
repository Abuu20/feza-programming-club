import { useState, useEffect } from 'react';
import { activitiesService } from '../services/activities';
import toast from 'react-hot-toast';

export const useActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await activitiesService.getAll();
      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async (activity) => {
    try {
      const { data, error } = await activitiesService.create(activity);
      if (error) throw error;
      setActivities([data[0], ...activities]);
      toast.success('Activity created successfully');
      return { data, error: null };
    } catch (err) {
      toast.error(err.message);
      return { data: null, error: err };
    }
  };

  const updateActivity = async (id, updates) => {
    try {
      const { data, error } = await activitiesService.update(id, updates);
      if (error) throw error;
      setActivities(activities.map(a => a.id === id ? data[0] : a));
      toast.success('Activity updated successfully');
      return { data, error: null };
    } catch (err) {
      toast.error(err.message);
      return { data: null, error: err };
    }
  };

  const deleteActivity = async (id) => {
    try {
      const { error } = await activitiesService.delete(id);
      if (error) throw error;
      setActivities(activities.filter(a => a.id !== id));
      toast.success('Activity deleted successfully');
      return { error: null };
    } catch (err) {
      toast.error(err.message);
      return { error: err };
    }
  };

  return {
    activities,
    loading,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    refresh: fetchActivities
  };
};
