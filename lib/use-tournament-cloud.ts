import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export function useTournamentCloud<T>(fresh: () => T, normalize: (value: unknown) => T) {
  const [data, replace] = useState<T>(fresh);
  const [session, setSession] = useState<Session | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState('');
  const version = useRef(0), changed = useRef(false), busy = useRef(false), generation = useRef(0);
  const latest = useRef(data);
  const editable = useRef(false), loaded = useRef(false);
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setError(error.message);
      setSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, value) => setSession(value));
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    let active = true;
    const epoch = ++generation.current;
    loaded.current = false; setReady(false); setCanEdit(false); editable.current = false;
    changed.current = false; setDirty(false); version.current = 0;
    const empty = fresh(); latest.current = empty; replace(empty); setUpdated('');
    let loading = false;
    let editor = false;
    let initialized = false;
    const refresh = async () => {
      if (!initialized || loading || busy.current || changed.current || !active) return;
      loading = true;
      try {
        const table = editor ? 'tournament_state' : 'tournament_public';
        const metadata = await supabase.from(table).select('version,updated_at').eq('id', 'dkcup2026').maybeSingle();
        if (metadata.error) throw metadata.error;
        if (!active || changed.current || busy.current) return;
        if (metadata.data && (metadata.data.version !== version.current || version.current === 0)) {
          const result = await supabase.from(table).select('state,version,updated_at').eq('id', 'dkcup2026').single();
          if (result.error) throw result.error;
          const incoming = normalize(result.data.state);
          if (!active || changed.current || busy.current || epoch !== generation.current) return;
          latest.current = incoming; replace(incoming);
          version.current = result.data.version; setUpdated(result.data.updated_at);
        }
        loaded.current = true; setReady(true); setError('');
      } catch (e) {
        if (active) setError('Cloud data could not be loaded. ' + (e as Error).message);
      } finally { loading = false; }
    };
    const start = async () => {
      try {
        if (session?.user.id) {
          const access = await supabase.from('tournament_editors').select('user_id').eq('user_id', session.user.id).maybeSingle();
          if (access.error) throw access.error;
          editor = !!access.data;
        }
        if (!active) return;
        editable.current = editor; setCanEdit(editor); initialized = true;
        await refresh();
      } catch (e) { if (active) setError((e as Error).message); }
    };
    void start();
    const timer = window.setInterval(refresh, 10000);
    window.addEventListener('online', refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener('online', refresh); };
  }, [session?.user.id, fresh, normalize]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (changed.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  const setData = useCallback((action: SetStateAction<T>) => {
    if (!editable.current || !loaded.current || busy.current) return;
    const next = typeof action === 'function' ? (action as (old: T) => T)(latest.current) : action;
    latest.current = next; changed.current = true; setDirty(true); replace(next);
    try { localStorage.setItem('dkcup2026-cloud-draft', JSON.stringify(next)); }
    catch { setError('Could not save a local draft. Publish changes or export a backup before leaving.'); }
  }, []);
  const publish = async () => {
    if (!canEdit || !ready || busy.current || !changed.current) return;
    const epoch = generation.current;
    busy.current = true; setSaving(true); setError('');
    try {
      const result = await supabase.rpc('save_tournament', { next_state: latest.current, expected_version: version.current });
      if (result.error) throw result.error;
      if (epoch !== generation.current) return;
      version.current = result.data; changed.current = false; setDirty(false);
      setUpdated(new Date().toISOString());
      try { localStorage.removeItem('dkcup2026-cloud-draft'); } catch { /* Cloud save succeeded. */ }
    } catch (e) { setError('Not published: ' + (e as Error).message + ' Export a backup before reloading if you need to keep your changes.'); }
    finally { busy.current = false; setSaving(false); }
  };
  return { data, setData, ready, canEdit, session, dirty, saving, error, updated, publish };
}
