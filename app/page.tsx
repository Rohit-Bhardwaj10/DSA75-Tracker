'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed top-6 right-6 md:right-auto md:left-6 z-50 pointer-events-none select-none">
        <img 
          src="/cc logo2.png" 
          alt="Logo" 
          className="w-32 md:w-48 h-auto opacity-90 drop-shadow-md"
        />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">DSA 75 challenge Tracker</h1>
          <p className="text-muted text-md">
            Laadle DSA Se hi naukri milti hai
          </p>
        </div>

        <div className="minimal-card rounded-lg p-6 shadow-none">
          <div className="flex bg-accent/50 p-1 rounded-md mb-6 border border-border">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded font-medium text-xs transition-colors ${
                isLogin
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded font-medium text-xs transition-colors ${
                !isLogin
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  required={!isLogin}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded minimal-input text-sm placeholder-zinc-700"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded minimal-input text-sm placeholder-zinc-700"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 rounded minimal-input text-sm placeholder-zinc-700"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-white/90 text-primary-foreground font-semibold py-2.5 px-4 rounded transition-colors text-sm disabled:opacity-70 mt-2"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border flex justify-center">
            <p className="text-[10px] text-muted/50 font-mono flex items-center gap-1.5 hover:text-emerald-500/80 transition-colors duration-500 cursor-default">
              <span>⚡</span>
              <span>conjured by sorcerer supreme</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
