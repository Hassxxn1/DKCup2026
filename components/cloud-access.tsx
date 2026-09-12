import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CloudAccess({ email, canEdit, dirty, saving, ready, publish, recover }: {
  email?: string; canEdit: boolean; dirty: boolean; saving: boolean; ready: boolean;
  publish: () => Promise<void>; recover: (key: string) => void;
}) {
  const [open, setOpen] = useState(false), [login, setLogin] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  return <div className="cloud-access shell">
    <div className="cloud-actions">
      {canEdit && <><button disabled={!dirty || saving || !ready} onClick={publish}>{saving ? 'Publishing…' : dirty ? 'Save & publish' : 'All changes published'}</button>
      <button disabled={saving || !ready} onClick={() => recover('cup-2026-local')}>Import this device’s tournament</button>
      <button disabled={saving || !ready} onClick={() => recover('dkcup2026-cloud-draft')}>Restore local draft</button></>}
      {email ? <><span>{canEdit ? 'Official' : 'Viewer'}: {email}</span><button disabled={saving} onClick={async () => {
        if (dirty && !confirm('Unpublished changes will be left in a local draft. Sign out?')) return;
        const result = await supabase.auth.signOut(); if (result.error) setError(result.error.message);
      }}>Sign out</button></> : <button onClick={() => setOpen(!open)}>Login</button>}
    </div>
    {dirty && <p>Changes are saved as a draft on this device. Select Save & publish to update everyone’s view.</p>}
    {email && !canEdit && <p>This account has view-only access. Ask the tournament administrator to authorize it.</p>}
    {open && !email && <form className="cloud-login" onSubmit={async e => {
      e.preventDefault(); setBusy(true); setError('');
      try {
        const result = await supabase.auth.signInWithPassword({email:login.trim(),password});
        if(result.error) setError(result.error.message); else {setPassword('');setOpen(false);}
      } catch {setError('Could not sign in. Check your connection and try again.');}
      finally {setBusy(false);}
    }}><label>Email<input type="email" autoComplete="username" required value={login} onChange={e=>setLogin(e.target.value)}/></label>
    <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <button disabled={busy} type="submit">{busy?'Signing in…':'Login'}</button></form>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
