DROP POLICY IF EXISTS "Users update own stakes" ON public.stakes;
REVOKE UPDATE ON public.stakes FROM authenticated;