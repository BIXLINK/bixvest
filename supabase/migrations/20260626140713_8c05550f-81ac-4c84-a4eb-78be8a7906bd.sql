
-- 1. Extend activation_codes
ALTER TABLE public.activation_codes
  ADD COLUMN IF NOT EXISTS payment_id uuid,
  ADD COLUMN IF NOT EXISTS generated_by text NOT NULL DEFAULT 'ADMIN' CHECK (generated_by IN ('SYSTEM','ADMIN')),
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS gateway text,
  ADD COLUMN IF NOT EXISTS amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS currency text;

CREATE INDEX IF NOT EXISTS idx_activation_codes_email ON public.activation_codes(lower(email));
CREATE INDEX IF NOT EXISTS idx_activation_codes_payment ON public.activation_codes(payment_id);

-- 2. Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  gateway text NOT NULL CHECK (gateway IN ('stripe','paystack','flutterwave')),
  payment_reference text NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed','refunded')),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  activation_code_id uuid REFERENCES public.activation_codes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gateway, payment_reference)
);

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments" ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins view all payments" ON public.payments
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 3. FK from activation_codes.payment_id
ALTER TABLE public.activation_codes
  DROP CONSTRAINT IF EXISTS activation_codes_payment_id_fkey;
ALTER TABLE public.activation_codes
  ADD CONSTRAINT activation_codes_payment_id_fkey
  FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;

-- 4. Ledger type for activation purchases
ALTER TYPE public.tx_type ADD VALUE IF NOT EXISTS 'activation_payment';
