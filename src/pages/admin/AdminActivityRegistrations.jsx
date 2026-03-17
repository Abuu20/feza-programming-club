import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { registrationsService } from '../../services/registrations';
import { activitiesService } from '../../services/activities';
import { 
  FaArrowLeft, 
  FaCheck, 
  FaTimes, 
  FaDownload, 
  FaEnvelope, 
  FaUserCheck,
  FaUserTimes,
  FaFilter
} from 'react-icons/fa';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminActivityRegistrations = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [activityRes, registrationsRes] = await Promise.all([
        activitiesService.getById(id),
        registrationsService.getActivityRegistrations(id)
      ]);
      
      setActivity(activityRes.data);
      setRegistrations(registrationsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (registrationId, newStatus) => {
    const { error } = await registrationsService.updateStatus(registrationId, newStatus);
    if (!error) {
      toast.success(`Registration ${newStatus}`);
      fetchData();
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'School', 'Grade', 'Status', 'Registered Date'];
    const csvData = registrations.map(r => [
      r.name,
      r.email,
      r.phone || '',
      r.school || '',
      r.grade || '',
      r.status,
      formatDate(r.created_at)
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activity?.title || 'activity'}-registrations.csv`;
    a.click();
    toast.success('Export started');
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'attended': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesFilter = filter === 'all' || reg.status === filter;
    const matchesSearch = searchTerm === '' || 
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.school && reg.school.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/activities')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-4 transition"
        >
          <FaArrowLeft />
          <span>Back to Activities</span>
        </button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Activity Registrations</h1>
            <p className="text-gray-600 mt-1">{activity?.title}</p>
            <p className="text-sm text-gray-500">
              {formatDate(activity?.date)} | Organized by: {activity?.organizer || 'Club Organizer'}
            </p>
          </div>
          
          <button
            onClick={exportToCSV}
            className="btn-primary flex items-center gap-2"
          >
            <FaDownload />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'confirmed' ? 'bg-green-500 text-white' : 'bg-gray-200'
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilter('attended')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'attended' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Attended
          </button>
          
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or school..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field text-sm"
            />
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School/Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRegistrations.map((reg) => (
              <tr key={reg.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium">{reg.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">{reg.email}</div>
                  {reg.phone && (
                    <div className="text-xs text-gray-500">{reg.phone}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {reg.school && (
                    <div className="text-sm">{reg.school}</div>
                  )}
                  {reg.grade && (
                    <div className="text-xs text-gray-500">Grade: {reg.grade}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(reg.status)}`}>
                    {reg.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(reg.created_at)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {reg.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(reg.id, 'confirmed')}
                          className="text-green-600 hover:text-green-800"
                          title="Confirm"
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(reg.id, 'cancelled')}
                          className="text-red-600 hover:text-red-800"
                          title="Cancel"
                        >
                          <FaTimes />
                        </button>
                      </>
                    )}
                    {reg.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(reg.id, 'attended')}
                          className="text-blue-600 hover:text-blue-800"
                          title="Mark Attended"
                        >
                          <FaUserCheck />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(reg.id, 'cancelled')}
                          className="text-red-600 hover:text-red-800"
                          title="Cancel"
                        >
                          <FaTimes />
                        </button>
                      </>
                    )}
                    <a
                      href={`mailto:${reg.email}`}
                      className="text-blue-600 hover:text-blue-800"
                      title="Send Email"
                    >
                      <FaEnvelope />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRegistrations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No registrations found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivityRegistrations;
