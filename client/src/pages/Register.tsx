import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Phone } from 'lucide-react';

export const Register: React.FC = () => {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
          document.getElementById('google-register-btn'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            shape: 'pill',
            text: 'signup_with',
          }
        );
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGoogle();
      return;
    }

    const interval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        initGoogle();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(response.credential);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !phone || !password) {
      setError('Please fill in all the details.');
      return;
    }

    setLoading(true);
    try {
      await register(fullName, email, phone, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white border border-muted p-8 rounded-premium shadow-card space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-charcoal font-sans">Get Started</h2>
          <p className="text-muted-medium text-xs">Create your premium dining account</p>
        </div>

        {error && (
          <div className="bg-accent/10 border border-accent/20 text-accent p-3 rounded-lg text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-charcoal/60">Full Name</label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full pl-10 pr-4 py-2.5 border border-muted-dark rounded-lg text-sm focus:outline-none focus:border-primary"
              />
              <User className="w-4 h-4 text-muted-medium absolute left-3 top-3.5" />
            </div>
          </div>

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
            <label className="text-xs font-bold uppercase text-charcoal/60">Phone Number</label>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 99999 99999"
                className="w-full pl-10 pr-4 py-2.5 border border-muted-dark rounded-lg text-sm focus:outline-none focus:border-primary"
              />
              <Phone className="w-4 h-4 text-muted-medium absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-charcoal/60">Password</label>
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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted"></div>
          </div>
          <span className="relative bg-white px-3 text-[10px] text-muted-medium font-bold uppercase tracking-wider">Or continue with</span>
        </div>

        <div className="flex justify-center">
          <div id="google-register-btn" className="w-full min-h-[40px] flex justify-center"></div>
        </div>

        <div className="border-t border-muted pt-4 text-center">
          <p className="text-xs text-muted-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Register;
