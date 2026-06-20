
REVOKE EXECUTE ON FUNCTION public.post_ledger(uuid, text, numeric, text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_bix_score(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, int, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_audit(uuid, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.post_ledger(uuid, text, numeric, text, text, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.recompute_bix_score(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_audit(uuid, text, text, text, jsonb) TO service_role;
