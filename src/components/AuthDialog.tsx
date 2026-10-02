import React, { FormEvent, useRef, useState } from 'react';
import { UserProfile, supabase } from '../lib/supabase';
import { errorMessage, store } from '../lib/store';
export type AuthMode = 'signin' | 'signup';
interface AuthDialogProps {
  mode: AuthMode; setMode: (mode: AuthMode) => void;
  onSuccess: (profile: UserProfile) => void; onClose: () => void;
  onAnnounce: (message: string, tone?: 'default' | 'error') => void;
  embedded?: boolean;
}
export const AuthDialog: React.FC<AuthDialogProps> = ({ mode, setMode, onSuccess, onClose, onAnnounce, embedded = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const emailRedirectTo = `${window.location.origin}/`;
  const resendConfirmation = async () => {
    const input = formRef.current?.elements.namedItem('email') as HTMLInputElement | null;
    if (!input?.reportValidity()) return;
    setLoading(true); setError(''); setMessage('');
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: input.value.trim(), options: { emailRedirectTo } });
      if (error) throw error;
      setMessage('Confirmation email requested. Open the newest email and use its link, then sign in here if it opens in another browser.');
    } catch (error) { setError(errorMessage(error)); }
    finally { setLoading(false); }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage(''); setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const username = String(form.get('username') || '').trim();
    try {
      const result = mode === 'signup'
        ? await supabase.auth.signUp({ email, password, options: { data: { username }, emailRedirectTo } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (!result.data.session) {
        setMessage('Check your email to confirm your account, then sign in.'); setMode('signin'); return;
      }
      const user = result.data.user;
      if (!user) throw new Error('Could not confirm your account. Please sign in again.');
      const lookup = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (lookup.error) throw lookup.error;
      if (!lookup.data) {
        const profile = { id: user.id, username: user.user_metadata?.username || username || email.split('@')[0], display_name: user.user_metadata?.username || username || email.split('@')[0], bio: '', avatar_url: null };
        const saved = await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
        if (saved.error) throw saved.error;
      }
      await store.syncWithSupabase();
      const profile = store.getCurrentUser();
      if (store.getAuthStatus() !== 'signedIn' || !profile) throw new Error(store.getSyncError() || 'Could not load your account. Please retry.');
      onSuccess(profile); onAnnounce('You are signed in.'); onClose();
    } catch (error) { setError(errorMessage(error)); }
    finally { setLoading(false); }
  };
  return <div className={embedded ? 'auth-panel' : 'app-dialog open'} role={embedded ? undefined : 'dialog'} aria-modal={embedded ? undefined : true} aria-labelledby="auth-heading">
    <div className="app-dialog-card" style={{ maxWidth: 440 }}>
      <div className="app-dialog-header">
        <div><p className="kicker">Your circle starts here</p><h2 id="auth-heading">{mode === 'signup' ? 'Create your account' : 'Sign in to Mikesta'}</h2></div>
        {!embedded && <button className="dialog-close" onClick={onClose} aria-label="Close">×</button>}
      </div>
      <div className="app-dialog-body">
        {error && <p role="alert" style={{ color: '#ad4938' }}>{error}</p>}
        {message && <p role="status">{message}</p>}
        <form ref={formRef} className="edit-form" onSubmit={submit}>
          <label>Email<input name="email" type="email" autoComplete="email" required disabled={loading} /></label>
          <label>Password<input name="password" type="password" minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required disabled={loading} /></label>
          {mode === 'signup' && <label>Username<input name="username" maxLength={30} pattern="[a-zA-Z0-9_.]+" autoComplete="username" required disabled={loading} /></label>}
          <button className="dialog-action" type="submit" disabled={loading}>{loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
          <button className="button-outline" type="button" disabled={loading} onClick={() => { setError(''); setMessage(''); setMode(mode === 'signup' ? 'signin' : 'signup'); }}>{mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create account'}</button>
          {mode === 'signin' && <button className="button-outline" type="button" disabled={loading} onClick={resendConfirmation}>Resend confirmation email</button>}
        </form>
      </div>
    </div>
  </div>;
};
