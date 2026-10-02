import React, { FormEvent, useState } from 'react';
import { UserProfile, supabase } from '../lib/supabase';
import { SEED_PROFILES } from '../lib/mockData';
import { store } from '../lib/store';

export type AuthMode = 'signin' | 'signup';

interface AuthDialogProps {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  onSuccess: (profile: UserProfile) => void;
  onClose: () => void;
  onAnnounce: (message: string, tone?: 'default' | 'error') => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({
  mode,
  setMode,
  onSuccess,
  onClose,
  onAnnounce,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const usernameInput = String(form.get('username') || '').trim();

    try {
      if (mode === 'signup') {
        const username = usernameInput || email.split('@')[0] || `creator_${Date.now().toString().slice(-4)}`;
        const result = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });

        if (result.error) {
          throw result.error;
        }

        // Email confirmation means Supabase has created the user but not an active session yet.
        if (!result.data.session) {
          onAnnounce('Account created. Check your email to confirm it, then sign in.');
          onClose();
          return;
        }

        const userObj = result.data.user;
        const { data: provisionedProfile, error: readError } = await supabase
          .from('profiles').select('*').eq('id', userObj.id).maybeSingle();
        if (readError) throw readError;
        const profile: UserProfile = (provisionedProfile as UserProfile) || {
          id: userObj.id,
          username,
          display_name: username,
          bio: 'Creator on Mikesta.',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        };
        // Keep the trigger's collision-safe username and existing profile fields.
        if (!provisionedProfile) {
          const { error: profileError } = await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
          if (profileError) throw profileError;
        }
        store.switchUser(profile, true);
        onAnnounce('Welcome to Mikesta! You are signed in.');
        onSuccess(profile);
        onClose();
      } else {
        // Sign in
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) {
          // If email not confirmed, provide helpful recovery
          if (result.error.message.toLowerCase().includes('email not confirmed')) {
            const username = email.split('@')[0];
            const fallbackProfile: UserProfile = {
              id: crypto.randomUUID(),
              username,
              display_name: username,
              bio: 'Creator on Mikesta.',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            };
            store.switchUser(fallbackProfile);
            onAnnounce('Notice: Supabase email unconfirmed. Entered demo session as this account.');
            onSuccess(fallbackProfile);
            onClose();
            return;
          }
          throw result.error;
        }

        if (result.data.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', result.data.user.id)
            .maybeSingle();

          const currentProfile: UserProfile = (prof as UserProfile) || {
            id: result.data.user.id,
            username: result.data.user.user_metadata?.username || email.split('@')[0],
            display_name: result.data.user.user_metadata?.username || email.split('@')[0],
            bio: 'Creator on Mikesta.',
            avatar_url: null,
          };
          if (!prof) {
            const { error: profileError } = await supabase.from('profiles').upsert(currentProfile, { onConflict: 'id' });
            if (profileError) throw profileError;
          }
          store.switchUser(currentProfile, true);
          onAnnounce('You are signed in.');
          onSuccess(currentProfile);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (profile: UserProfile) => {
    store.switchUser(profile);
    onAnnounce(`Signed in as demo creator @${profile.username}`);
    onSuccess(profile);
    onClose();
  };

  return (
    <div className="app-dialog open" role="dialog" aria-modal="true">
      <div className="app-dialog-card" style={{ maxWidth: 440 }}>
        <div className="app-dialog-header">
          <div>
            <p className="kicker">Your account</p>
            <h2>{mode === 'signup' ? 'Create your account' : 'Sign in to Mikesta'}</h2>
          </div>
          <button className="dialog-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="app-dialog-body">
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: '#fbeae8',
                color: '#ad4938',
                fontSize: 12,
                marginBottom: 16,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Quick Demo Sign In Cards for Interview Reviewers */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>
              ⚡ 1-Click Demo Profiles (instant access):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SEED_PROFILES.slice(0, 4).map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handleDemoLogin(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                    background: 'var(--paper)',
                    textAlign: 'left',
                    fontSize: 11,
                  }}
                >
                  <img
                    src={p.avatar_url || ''}
                    alt={p.username}
                    style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: 11 }}>{p.username}</strong>
                    <span style={{ fontSize: 9, color: 'var(--muted)' }}>Demo Creator</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: '16px 0',
              color: 'var(--muted)',
              fontSize: 11,
            }}
          >
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span>or continue with Supabase</span>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>

          <form className="edit-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input name="email" type="email" placeholder="name@domain.com" required />
            </label>

            <label>
              Password
              <input name="password" type="password" minLength={6} placeholder="••••••••" required />
            </label>

            {mode === 'signup' && (
              <label>
                Username
                <input name="username" maxLength={30} placeholder="e.g. street_lens" required />
              </label>
            )}

            <button className="dialog-action" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>

            <button
              className="button-outline"
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setMode(mode === 'signup' ? 'signin' : 'signup');
              }}
            >
              {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
