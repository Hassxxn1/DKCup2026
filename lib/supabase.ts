import { createClient } from '@supabase/supabase-js';

// Publishable browser credentials. Access is enforced by database policies.
export const supabase = createClient(
  'https://qrfzdfbbunuhihpwqksf.supabase.co',
  'sb_publishable_K9Jn6RkdCboojENHU0s91A_zgEtw7E6',
);
