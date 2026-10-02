import { FormEvent, useState } from 'react';
import { errorMessage, store } from '../lib/store';

export function ResetPasswordPanel({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    if (password !== form.get('confirmation')) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try { await store.resetPassword(password); onSuccess(); }
    catch (error) { setError(errorMessage(error)); }
    finally { setLoading(false); }
  };
  return <main className="auth-screen">
    <div className="auth-panel"><div className="app-dialog-card">
      <div className="app-dialog-header"><div><p className="kicker">Mikesta</p><h1>Choose a new password</h1></div></div>
      <div className="app-dialog-body">
        {error && <p role="alert">{error}</p>}
        <form className="edit-form" onSubmit={submit}>
          <label>New password<input name="password" type="password" autoComplete="new-password" minLength={6} required disabled={loading} /></label>
          <label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength={6} required disabled={loading} /></label>
          <button className="dialog-action" disabled={loading}>{loading ? 'Saving…' : 'Save password'}</button>
        </form>
      </div>
    </div></div>
  </main>;
}
