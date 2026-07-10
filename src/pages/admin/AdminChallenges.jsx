import React, { useState, useEffect } from 'react';
import { challengesService } from '../../services/challenges';
import { supabase } from '../../services/supabase';
import {
  FaEdit, FaTrash, FaPlus, FaCopy, FaToggleOn, FaToggleOff,
  FaChartBar, FaUsers, FaCheck, FaTimes, FaSearch, FaFilter,
  FaFlag, FaExclamationTriangle, FaEye, FaSort, FaSortUp, FaSortDown,
  FaDownload, FaTrophy, FaCode, FaClock
} from 'react-icons/fa';
import Loader from '../../components/common/Loader';
import ChallengeForm from '../../components/challenges/ChallengeForm';
import toast from 'react-hot-toast';

// ── Difficulty badge ──────────────────────────────────────────────────────────
const DiffBadge = ({ d }) => {
  const map = {
    easy:   'bg-green-100  text-green-700  border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    hard:   'bg-orange-100 text-orange-700 border-orange-200',
    expert: 'bg-red-100    text-red-700    border-red-200',
  };
  const icon = { easy: '🌱', medium: '🌿', hard: '🌳', expert: '🔥' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${map[d] || 'bg-gray-100 text-gray-600'}`}>
      {icon[d]} {d}
    </span>
  );
};

// ── Submissions drawer ────────────────────────────────────────────────────────
const SubmissionsDrawer = ({ challenge, onClose }) => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | correct | wrong | flagged

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('challenge_submissions')
        .select('*, members(name, email, photo_url), challenges(title)')
        .eq('challenge_id', challenge.id)
        .order('submitted_at', { ascending: false });
      setSubs(data || []);
      setLoading(false);
    };
    load();
  }, [challenge.id]);

  const filtered = subs.filter(s => {
    if (filter === 'correct')  return s.status === 'correct';
    if (filter === 'wrong')    return s.status !== 'correct';
    if (filter === 'flagged')  return s.flagged;
    return true;
  });

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Status', 'Points', 'Attempt', 'Flagged', 'Submitted At'],
      ...filtered.map(s => [
        s.members?.name || '-',
        s.members?.email || '-',
        s.status,
        s.points_earned || 0,
        s.attempt_number || 1,
        s.flagged ? 'YES' : 'no',
        new Date(s.submitted_at).toLocaleString(),
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${challenge.title}-submissions.csv`;
    a.click();
  };

  const flagged = subs.filter(s => s.flagged).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{challenge.title}</h3>
            <p className="text-sm text-gray-500">{subs.length} submissions total</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition">
              <FaDownload size={12} /> Export CSV
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3 p-4 border-b bg-gray-50">
          {[
            { label: 'Total',   val: subs.length,                             color: 'text-gray-700'  },
            { label: 'Solved',  val: subs.filter(s=>s.status==='correct').length, color: 'text-green-600' },
            { label: 'Failed',  val: subs.filter(s=>s.status!=='correct').length, color: 'text-red-500'   },
            { label: '⚠️ Flagged', val: flagged,                              color: 'text-orange-600'},
          ].map((s,i) => (
            <div key={i} className="text-center bg-white rounded-lg p-2 border">
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 py-3 border-b">
          {['all','correct','wrong','flagged'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition
                ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'flagged' ? '⚠️ Flagged' : f}
            </button>
          ))}
        </div>

        {/* Submissions list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <FaCode className="text-4xl text-gray-300 mx-auto mb-3" />
              <p>No submissions here</p>
            </div>
          ) : filtered.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 p-4 border-b hover:bg-gray-50 transition
              ${s.flagged ? 'bg-orange-50 border-l-4 border-orange-400' : ''}`}>
              <div className="flex-shrink-0">
                {s.members?.photo_url ? (
                  <img src={s.members.photo_url} alt={s.members.name}
                    className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                    {s.members?.name?.[0] || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {s.members?.name || 'Unknown'}
                  </p>
                  {s.flagged && (
                    <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                      <FaFlag size={9} /> AI suspected
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{s.members?.email}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                  <span>Attempt #{s.attempt_number || 1}</span>
                  <span>{new Date(s.submitted_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                {s.status === 'correct' ? (
                  <div>
                    <span className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                      <FaCheck size={11} /> Correct
                    </span>
                    <span className="text-xs text-yellow-600">+{s.points_earned || 0} pts</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-1 text-red-500 text-sm">
                    <FaTimes size={11} /> Wrong
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main AdminChallenges ──────────────────────────────────────────────────────
const AdminChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [viewingChallenge, setViewingChallenge] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDiff, setFilterDiff] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [sortDir, setSortDir] = useState('desc');
  const [submissionStats, setSubmissionStats] = useState({}); // { challengeId: { total, correct, flagged } }
  const [globalStats, setGlobalStats] = useState({
    total: 0, active: 0, totalSubmissions: 0,
    totalSolved: 0, flagged: 0
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: chs } = await challengesService.getAll({ includeInactive: true });
    setChallenges(chs || []);

    // Fetch submission stats per challenge
    const { data: subs } = await supabase
      .from('challenge_submissions')
      .select('challenge_id, status, flagged');

    if (subs) {
      const map = {};
      subs.forEach(s => {
        if (!map[s.challenge_id]) map[s.challenge_id] = { total: 0, correct: 0, flagged: 0 };
        map[s.challenge_id].total++;
        if (s.status === 'correct') map[s.challenge_id].correct++;
        if (s.flagged) map[s.challenge_id].flagged++;
      });
      setSubmissionStats(map);

      const total = subs.length;
      const totalSolved = subs.filter(s => s.status === 'correct').length;
      const flagged = subs.filter(s => s.flagged).length;
      const active = (chs || []).filter(c => c.is_active).length;
      setGlobalStats({ total: (chs || []).length, active, totalSubmissions: total, totalSolved, flagged });
    }
    setLoading(false);
  };

  const handleToggleActive = async (challenge) => {
    const { error } = await challengesService.update(challenge.id, { is_active: !challenge.is_active });
    if (!error) {
      toast.success(challenge.is_active ? 'Challenge deactivated' : 'Challenge activated');
      fetchAll();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this challenge? All submissions will also be deleted.')) return;
    const { error } = await challengesService.delete(id);
    if (!error) { toast.success('Deleted'); fetchAll(); }
  };

  const handleDuplicate = async (ch) => {
    const { error } = await challengesService.create({
      title: `${ch.title} (Copy)`,
      description: ch.description,
      difficulty: ch.difficulty,
      points: ch.points,
      category: ch.category,
      starter_code: ch.starter_code,
      test_cases: ch.test_cases,
      hints: ch.hints,
      is_active: false,
    });
    if (!error) { toast.success('Duplicated as inactive draft'); fetchAll(); }
  };

  const handleEdit = (ch) => { setEditingChallenge(ch); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); setEditingChallenge(null); fetchAll(); };

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <FaSort className="text-gray-300" size={10} />;
    return sortDir === 'asc' ? <FaSortUp className="text-primary-600" size={10} /> : <FaSortDown className="text-primary-600" size={10} />;
  };

  // Filter + sort
  const displayed = challenges
    .filter(c => {
      if (filterDiff !== 'all' && c.difficulty !== filterDiff) return false;
      if (filterStatus === 'active' && !c.is_active) return false;
      if (filterStatus === 'inactive' && c.is_active) return false;
      if (filterStatus === 'flagged' && !(submissionStats[c.id]?.flagged > 0)) return false;
      if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
          !c.category?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let va, vb;
      if (sortBy === 'title')   { va = a.title; vb = b.title; }
      if (sortBy === 'points')  { va = a.points; vb = b.points; }
      if (sortBy === 'subs')    { va = submissionStats[a.id]?.total || 0; vb = submissionStats[b.id]?.total || 0; }
      if (sortBy === 'solved')  { va = submissionStats[a.id]?.correct || 0; vb = submissionStats[b.id]?.correct || 0; }
      if (sortBy === 'created') { va = a.created_at; vb = b.created_at; }
      if (va === undefined) return 0;
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  if (loading) return <Loader />;

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coding Challenges</h1>
          <p className="text-gray-500 text-sm mt-0.5">Create, manage and monitor all challenges and student submissions</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 flex-shrink-0">
          <FaPlus /> New Challenge
        </button>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total Challenges', val: globalStats.total,            icon: FaCode,  color: 'bg-white border-gray-200',         txt: 'text-gray-900' },
          { label: 'Active',           val: globalStats.active,           icon: FaToggleOn, color: 'bg-green-50 border-green-200',   txt: 'text-green-700' },
          { label: 'Submissions',      val: globalStats.totalSubmissions,  icon: FaUsers, color: 'bg-blue-50 border-blue-200',        txt: 'text-blue-700' },
          { label: 'Solved',           val: globalStats.totalSolved,       icon: FaCheck, color: 'bg-purple-50 border-purple-200',    txt: 'text-purple-700' },
          { label: '⚠️ Flagged',       val: globalStats.flagged,           icon: FaFlag,  color: 'bg-orange-50 border-orange-200',    txt: 'text-orange-700' },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border p-4 shadow-sm ${s.color}`}>
            <div className="flex items-center justify-between mb-1">
              <s.icon className={s.txt} />
              <span className={`text-2xl font-bold ${s.txt}`}>{s.val}</span>
            </div>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters & search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search challenges or categories…"
            className="input-field pl-8 text-sm" />
        </div>
        <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)} className="input-field text-sm w-auto">
          <option value="all">All Difficulties</option>
          <option value="easy">🌱 Easy</option>
          <option value="medium">🌿 Medium</option>
          <option value="hard">🌳 Hard</option>
          <option value="expert">🔥 Expert</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-sm w-auto">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="flagged">⚠️ Flagged submissions</option>
        </select>
        <span className="text-sm text-gray-500 ml-auto">{displayed.length} challenge{displayed.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">
                  <button className="flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort('title')}>
                    Challenge <SortIcon field="title" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">Difficulty</th>
                <th className="px-4 py-3 text-left">
                  <button className="flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort('points')}>
                    Points <SortIcon field="points" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">
                  <button className="flex items-center gap-1 hover:text-gray-700 mx-auto" onClick={() => toggleSort('subs')}>
                    Submissions <SortIcon field="subs" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <button className="flex items-center gap-1 hover:text-gray-700 mx-auto" onClick={() => toggleSort('solved')}>
                    Solved <SortIcon field="solved" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">⚠️ Flagged</th>
                <th className="px-4 py-3 text-center">Success %</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayed.map(ch => {
                const st = submissionStats[ch.id] || { total: 0, correct: 0, flagged: 0 };
                const rate = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
                return (
                  <tr key={ch.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">{ch.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{ch.description}</p>
                      {ch.category && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {ch.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4"><DiffBadge d={ch.difficulty} /></td>
                    <td className="px-4 py-4 font-bold text-yellow-600">{ch.points}</td>
                    <td className="px-4 py-4 text-center">
                      <button onClick={() => handleToggleActive(ch)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition
                          ${ch.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {ch.is_active ? <FaToggleOn /> : <FaToggleOff />}
                        {ch.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-gray-700">{st.total}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-medium text-green-600">{st.correct}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {st.flagged > 0 ? (
                        <span className="flex items-center justify-center gap-1 text-orange-600 font-semibold">
                          <FaFlag size={11} /> {st.flagged}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center gap-1.5 justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${rate >= 60 ? 'bg-green-500' : rate >= 30 ? 'bg-yellow-500' : 'bg-red-400'}`}
                            style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {/* View submissions */}
                        <button onClick={() => setViewingChallenge(ch)}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition"
                          title="View Submissions">
                          <FaEye size={14} />
                        </button>
                        {/* Edit */}
                        <button onClick={() => handleEdit(ch)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit">
                          <FaEdit size={14} />
                        </button>
                        {/* Duplicate */}
                        <button onClick={() => handleDuplicate(ch)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                          title="Duplicate as Draft">
                          <FaCopy size={14} />
                        </button>
                        {/* Delete */}
                        <button onClick={() => handleDelete(ch.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                          title="Delete">
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {displayed.length === 0 && (
            <div className="text-center py-16">
              <FaTrophy className="text-5xl text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">
                {search || filterDiff !== 'all' || filterStatus !== 'all'
                  ? 'No challenges match your filters'
                  : 'No challenges yet — create your first one!'}
              </p>
              {!search && filterDiff === 'all' && filterStatus === 'all' && (
                <button onClick={() => setShowForm(true)}
                  className="mt-4 btn-primary">
                  <FaPlus className="inline mr-2" /> Create Challenge
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Flagged submissions alert */}
      {globalStats.flagged > 0 && (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
          <FaExclamationTriangle className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-800">
              {globalStats.flagged} submission{globalStats.flagged > 1 ? 's' : ''} flagged for possible AI use
            </p>
            <p className="text-sm text-orange-600 mt-0.5">
              Click the 👁 eye icon on any challenge to review flagged submissions. Flagged = code appeared very fast
              (large paste event detected). Use this alongside your verbal defence to identify students who may not
              understand what they submitted.
            </p>
          </div>
        </div>
      )}

      {/* Challenge form modal */}
      {showForm && (
        <ChallengeForm challenge={editingChallenge} onClose={handleCloseForm} />
      )}

      {/* Submissions drawer */}
      {viewingChallenge && (
        <SubmissionsDrawer
          challenge={viewingChallenge}
          onClose={() => setViewingChallenge(null)}
        />
      )}
    </div>
  );
};

export default AdminChallenges;