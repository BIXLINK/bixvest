
-- 1) Restrict column-level write access on profiles (lock down financial columns)
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, email) ON public.profiles TO authenticated;

-- 2) Remove direct insert path for campaign participations (server fn only)
DROP POLICY IF EXISTS "cp own insert" ON public.campaign_participations;
REVOKE INSERT ON public.campaign_participations FROM authenticated;

-- 3) Prevent duplicate task submissions at DB level
CREATE UNIQUE INDEX IF NOT EXISTS task_submissions_user_task_active_uniq
  ON public.task_submissions (user_id, task_id)
  WHERE status IN ('pending', 'approved');

-- 4) Lock down internal SECURITY DEFINER functions: only service_role can execute.
-- is_admin / has_role remain callable by authenticated because RLS policies invoke them.
REVOKE EXECUTE ON FUNCTION public.post_ledger(uuid, text, numeric, text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_audit(uuid, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_bix_score(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.post_ledger(uuid, text, numeric, text, text, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_audit(uuid, text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.recompute_bix_score(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) TO service_role;
