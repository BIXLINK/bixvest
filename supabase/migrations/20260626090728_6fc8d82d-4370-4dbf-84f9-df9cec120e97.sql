CREATE OR REPLACE FUNCTION public.post_ledger(
  _user_id uuid,
  _type text,
  _amount numeric,
  _source text DEFAULT 'system',
  _destination text DEFAULT 'user',
  _note text DEFAULT '',
  _reference_table text DEFAULT NULL,
  _reference_id uuid DEFAULT NULL
) RETURNS TABLE(tx_id uuid, balance_after numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cur numeric;
  new_bal numeric;
  new_tx uuid;
  tx_kind public.tx_type;
BEGIN
  BEGIN
    tx_kind := _type::public.tx_type;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'Invalid ledger transaction type: %', _type;
  END;

  SELECT vst_balance INTO cur FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF cur IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  new_bal := cur + _amount;
  IF new_bal < 0 THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE public.profiles SET vst_balance = new_bal WHERE id = _user_id;

  INSERT INTO public.wallet_transactions(
    user_id,
    type,
    amount,
    balance_after,
    note,
    reference_table,
    reference_id,
    source,
    destination,
    status
  )
  VALUES (
    _user_id,
    tx_kind,
    _amount,
    new_bal,
    COALESCE(_note, ''),
    _reference_table,
    _reference_id,
    COALESCE(_source, 'system'),
    COALESCE(_destination, 'user'),
    'confirmed'
  )
  RETURNING id INTO new_tx;

  RETURN QUERY SELECT new_tx, new_bal;
END;
$$;