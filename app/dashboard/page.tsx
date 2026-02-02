'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Submission {
  id: string;
  dsaLink: string;
  difficulty: string;
  xPostLink: string | null;
  contestLink: string | null;
  submittedAt: string;
  challengeDay: {
    dayNumber: number;
    date: string;
    isSunday: boolean;
  };
  score: {
    dsaScore: number;
    xPostScore: number;
    contestScore: number;
    totalScore: number;
  } | null;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    dsaLink: '',
    difficulty: 'Medium',
    xPostLink: '',
    contestLink: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'USER') {
      router.push('/admin');
      return;
    }

    setUser(parsedUser);
    fetchSubmissions(token);
  }, [router]);

  const fetchSubmissions = async (token: string) => {
    try {
      const res = await fetch('/api/submissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to fetch submissions');

      const data = await res.json();
      setSubmissions(data.submissions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      setSuccess('Submission created successfully!');
      setFormData({ dsaLink: '', difficulty: 'Medium', xPostLink: '', contestLink: '' });
      fetchSubmissions(token!);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-12 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Dashboard</h1>
          <p className="text-muted text-sm">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-muted hover:text-white transition-colors px-3 py-1.5 border border-border rounded hover:bg-card-bg hover:border-zinc-700"
        >
          Logout
        </button>
      </div>

      <div className="minimal-card rounded-lg p-6 mb-12">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          Submit for Today
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted uppercase tracking-wider">
                DSA Question Link <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                required
                value={formData.dsaLink}
                onChange={(e) => setFormData({ ...formData, dsaLink: e.target.value })}
                className="w-full px-3 py-2 rounded minimal-input text-sm placeholder-zinc-700"
                placeholder="https://leetcode.com/problems/..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted uppercase tracking-wider">
                Difficulty <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-3 py-2 rounded minimal-input text-sm placeholder-zinc-700 bg-black text-white border-zinc-700"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted uppercase tracking-wider">
                X Post Link <span className="text-zinc-600 text-[10px] ml-1">(SUN)</span>
              </label>
              <input
                type="url"
                value={formData.xPostLink}
                onChange={(e) => setFormData({ ...formData, xPostLink: e.target.value })}
                className="w-full px-3 py-2 rounded minimal-input text-sm placeholder-zinc-700"
                placeholder="https://x.com/..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted uppercase tracking-wider">
                Contest Link <span className="text-zinc-600 text-[10px] ml-1">(SUN)</span>
              </label>
              <input
                type="url"
                value={formData.contestLink}
                onChange={(e) => setFormData({ ...formData, contestLink: e.target.value })}
                className="w-full px-3 py-2 rounded minimal-input text-sm placeholder-zinc-700"
                placeholder="Your ID of Platform"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded text-xs mt-2">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-2 rounded text-xs mt-2">
              {success}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-white/90 text-primary-foreground font-semibold py-2 px-6 rounded transition-colors text-xs disabled:opacity-70"
            >
              {submitting ? 'Submitting...' : 'Submit Entry'}
            </button>
          </div>
        </form>
      </div>

      <div className="minimal-card rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
          Your Submissions <span className="text-muted font-normal text-sm ml-2">({submissions.length}/75)</span>
        </h2>
        
        {submissions.length === 0 ? (
          <div className="text-muted text-center py-12 text-sm border border-dashed border-border rounded">
            No submissions yet. Start your journey today!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Day</th>
                  <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Difficulty</th>
                  <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">DSA</th>
                  <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider">Extra</th>
                  <th className="py-3 px-4 text-xs font-medium text-muted uppercase tracking-wider text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-white">Day {sub.challengeDay.dayNumber}</td>
                    <td className="py-3 px-4 text-muted text-xs">
                      {new Date(sub.challengeDay.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        sub.difficulty === 'Hard' ? 'text-red-400 border-red-400/20 bg-red-400/10' :
                        sub.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10' :
                        'text-emerald-400 border-emerald-400/20 bg-emerald-400/10'
                      }`}>
                        {sub.difficulty || 'Medium'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={sub.dsaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:underline text-xs"
                      >
                        View Solution
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-3 text-xs">
                        {sub.xPostLink && (
                          <a href={sub.xPostLink} target="_blank" className="text-muted hover:text-white">X Post</a>
                        )}
                        {sub.contestLink && (
                          <a href={sub.contestLink} target="_blank" className="text-muted hover:text-white">Contest</a>
                        )}
                        {!sub.xPostLink && !sub.contestLink && <span className="text-zinc-700">-</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {sub.score ? (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-zinc-800 text-white font-mono text-xs border border-zinc-700">
                          {sub.score.totalScore}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs italic">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
