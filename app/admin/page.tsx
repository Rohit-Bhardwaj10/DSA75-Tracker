'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'submissions' | 'participants'>('submissions');
  const [filterDay, setFilterDay] = useState('');
  const [filterName, setFilterName] = useState('');
  const [editingScore, setEditingScore] = useState<string | null>(null);
  const [scoreData, setScoreData] = useState({
    dsaScore: 0,
    xPostScore: 0,
    contestScore: 0
  });

  const [leaderboardFilterName, setLeaderboardFilterName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchSubmissions(token);
    fetchLeaderboard(token);
  }, [router]);

  const fetchSubmissions = async (token: string, day?: string, name?: string) => {
    try {
      const params = new URLSearchParams();
      if (day) params.append('day', day);
      if (name) params.append('name', name);
      
      const url = params.toString() ? `/api/admin/submissions?${params.toString()}` : '/api/admin/submissions';
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to fetch submissions');

      const data = await res.json();
      setSubmissions(data.submissions);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (token: string, name?: string) => {
    try {
      const url = name ? `/api/admin/leaderboard?name=${name}` : '/api/admin/leaderboard';
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to fetch leaderboard');

      const data = await res.json();
      setLeaderboard(data.leaderboard);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleFilter = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchSubmissions(token, filterDay, filterName);
    }
  };

  const handleLeaderboardFilter = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchLeaderboard(token, leaderboardFilterName);
    }
  };

  const handleUserClick = (name: string) => {
    setFilterName(name);
    setActiveTab('submissions');
    const token = localStorage.getItem('token');
    if (token) {
      fetchSubmissions(token, filterDay, name);
    }
  };

  const handleScoreSubmit = async (submissionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          submissionId,
          ...scoreData
        })
      });

      if (!res.ok) throw new Error('Failed to update score');

      setEditingScore(null);
      fetchSubmissions(token!, filterDay, filterName);
      fetchLeaderboard(token!);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-muted text-sm">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-12 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Admin Panel</h1>
          <p className="text-muted text-sm">Manage users and submissions</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-muted hover:text-white transition-colors px-3 py-1.5 border border-border rounded hover:bg-card-bg hover:border-zinc-700"
        >
          Logout
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-2 text-sm font-medium transition-colors relative ${
            activeTab === 'submissions'
              ? 'text-white border-b-2 border-white'
              : 'text-muted hover:text-white'
          }`}
        >
          Submissions
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`pb-2 text-sm font-medium transition-colors relative ${
            activeTab === 'participants'
              ? 'text-white border-b-2 border-white'
              : 'text-muted hover:text-white'
          }`}
        >
          Leaderboard
        </button>
      </div>

      {activeTab === 'submissions' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <input
              type="number"
              min="1"
              max="75"
              placeholder="Day (1-75)"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="w-24 px-3 py-2 rounded minimal-input text-sm placeholder-zinc-700"
            />
            <input
              type="text"
              placeholder="Filter by name..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-48 px-3 py-2 rounded minimal-input text-sm placeholder-zinc-700"
            />
            <button
              onClick={handleFilter}
              className="bg-primary hover:bg-white/90 text-primary-foreground font-semibold px-4 py-2 rounded transition-colors text-xs"
            >
              Filter
            </button>
            <button
              onClick={() => {
                setFilterDay('');
                setFilterName('');
                const token = localStorage.getItem('token');
                if (token) fetchSubmissions(token);
              }}
              className="bg-accent hover:bg-zinc-800 text-foreground border border-border px-4 py-2 rounded transition-colors text-xs font-medium"
            >
              Reset
            </button>
          </div>

          <div className="minimal-card rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent/20 text-left">
                    <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">User</th>
                    <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Day</th>
                    <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Difficulty</th>
                    <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Submitted</th>
                    <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Links</th>
                    <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Score</th>
                    <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{sub.user.name}</div>
                        <div className="text-xs text-muted">{sub.user.email}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted">Day {sub.challengeDay.dayNumber}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                          sub.difficulty === 'Hard' ? 'text-red-400 border-red-400/20 bg-red-400/10' :
                          sub.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10' :
                          'text-emerald-400 border-emerald-400/20 bg-emerald-400/10'
                        }`}>
                          {sub.difficulty || 'Medium'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 text-xs">
                          <a href={sub.dsaLink} target="_blank" className="text-white hover:underline">DSA</a>
                          {sub.xPostLink && <a href={sub.xPostLink} target="_blank" className="text-muted hover:text-white">X</a>}
                          {sub.contestLink && <a href={sub.contestLink} target="_blank" className="text-muted hover:text-white">Contest</a>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {editingScore === sub.id ? (
                          <div className="flex flex-col gap-1 w-20">
                            <input
                              type="number"
                              placeholder="DSA"
                              value={scoreData.dsaScore}
                              onChange={(e) => setScoreData({ ...scoreData, dsaScore: Number(e.target.value) })}
                              className="px-2 py-1 text-xs rounded minimal-input"
                            />
                            {sub.challengeDay.isSunday && (
                              <>
                                <input
                                  type="number"
                                  placeholder="X"
                                  value={scoreData.xPostScore}
                                  onChange={(e) => setScoreData({ ...scoreData, xPostScore: Number(e.target.value) })}
                                  className="px-2 py-1 text-xs rounded minimal-input"
                                />
                                <input
                                  type="number"
                                  placeholder="Con"
                                  value={scoreData.contestScore}
                                  onChange={(e) => setScoreData({ ...scoreData, contestScore: Number(e.target.value) })}
                                  className="px-2 py-1 text-xs rounded minimal-input"
                                />
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-xs">{sub.score?.totalScore || 0}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingScore === sub.id ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleScoreSubmit(sub.id)}
                              className="text-xs text-emerald-400 hover:text-emerald-300"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingScore(null)}
                              className="text-xs text-muted hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingScore(sub.id);
                              setScoreData({
                                dsaScore: sub.score?.dsaScore || 0,
                                xPostScore: sub.score?.xPostScore || 0,
                                contestScore: sub.score?.contestScore || 0
                              });
                            }}
                            className="text-xs text-muted hover:text-white border border-border px-2 py-1 rounded hover:bg-accent"
                          >
                            Score
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {submissions.length === 0 && (
              <div className="text-center py-12 text-sm text-muted">
                No submissions found matching your filters.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search by name..."
              value={leaderboardFilterName}
              onChange={(e) => setLeaderboardFilterName(e.target.value)}
              className="w-48 px-3 py-2 rounded minimal-input text-sm placeholder-zinc-700"
            />
            <button
              onClick={handleLeaderboardFilter}
              className="bg-primary hover:bg-white/90 text-primary-foreground font-semibold px-4 py-2 rounded transition-colors text-xs"
            >
              Search
            </button>
            <button
              onClick={() => {
                setLeaderboardFilterName('');
                const token = localStorage.getItem('token');
                if (token) fetchLeaderboard(token);
              }}
              className="bg-accent hover:bg-zinc-800 text-foreground border border-border px-4 py-2 rounded transition-colors text-xs font-medium"
            >
              Reset
            </button>
          </div>

          <div className="minimal-card rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent/20 text-left">
                    <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider w-12">#</th>
                    <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Participant</th>
                    <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider text-right">Submissions</th>
                    <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider text-right">Total Score</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-border">
                {leaderboard.map((user, index) => (
                  <tr key={user.userId} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-muted">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => handleUserClick(user.name)}
                        className="font-medium text-white hover:text-blue-400 hover:underline text-left group-hover:text-blue-400 transition-colors"
                      >
                        {user.name}
                      </button>
                      <div className="text-xs text-muted">{user.email}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-accent text-xs font-mono">
                        {user.submissionCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-white tracking-tight">
                        {user.totalScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-sm text-muted">
              No participants registered yet.
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
