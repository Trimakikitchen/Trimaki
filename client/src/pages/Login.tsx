import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ChevronRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const initGoogle = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com',
          callback: handleGoogleResponse,
        });

        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-login-btn'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            shape: 'pill',
            text: 'signin_with',
          }
        );
      }
    };

    let interval: NodeJS.Timeout | null = null;

    if ((window as any).google?.accounts?.id) {
      initGoogle();
    } else {
      interval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          initGoogle();
          if (interval) clearInterval(interval);
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    setError('');
    try {
      const loggedInUser = await loginWithGoogle(response.credential);
      if (loggedInUser.role === 'admin') {
        navigate('/admin');
      } else if (loggedInUser.role === 'kitchen') {
        navigate('/kds');
      } else if (loggedInUser.role === 'delivery') {
        navigate('/delivery');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === 'admin') {
        navigate('/admin');
      } else if (loggedInUser.role === 'kitchen') {
        navigate('/kds');
      } else if (loggedInUser.role === 'delivery') {
        navigate('/delivery');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white border border-muted p-8 rounded-premium shadow-card space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-charcoal font-sans">Welcome Back</h2>
          <p className="text-muted-medium text-xs">Sign in to your premium sushi dining account</p>
        </div>

        {error && (
          <div className="bg-accent/10 border border-accent/20 text-accent p-3 rounded-lg text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-charcoal/60">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. customer@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-muted-dark rounded-lg text-sm focus:outline-none focus:border-primary"
              />
              <Mail className="w-4 h-4 text-muted-medium absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase text-charcoal/60">Password</label>
              <a href="#" className="text-xs text-primary hover:underline">Forgot?</a>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-muted-dark rounded-lg text-sm focus:outline-none focus:border-primary"
              />
              <Lock className="w-4 h-4 text-muted-medium absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-bold rounded-full transition-colors text-sm shadow-glow mt-4"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted"></div>
          </div>
          <span className="relative bg-white px-3 text-[10px] text-muted-medium font-bold uppercase tracking-wider">Or continue with</span>
        </div>

        <div className="flex justify-center">
          <div id="google-login-btn" className="w-full min-h-[40px] flex justify-center"></div>
        </div>

        <div className="border-t border-muted pt-4 text-center">
          <p className="text-xs text-muted-medium">
            New to TRIMAKI?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Create Account
            </Link>
          </p>
        </div>

        {/* Admin Login Help Indicator */}
        <div className="bg-muted p-4 rounded-xl text-[10px] text-muted-medium leading-relaxed">
          <p className="font-bold mb-1">💡 Sandbox Access Info:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Customer profile: use any customer credentials.</li>
            <li>Admin dashboard: use email containing <b>"admin"</b> (e.g. admin@trimaki.com).</li>
            <li>Kitchen staff: use email containing <b>"kitchen"</b> (e.g. kitchen@trimaki.com).</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
export default Login;
