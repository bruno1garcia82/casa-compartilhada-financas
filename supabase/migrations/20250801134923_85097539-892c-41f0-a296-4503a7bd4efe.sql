-- Create function to insert member payments
CREATE OR REPLACE FUNCTION public.insert_member_payment(
  p_household_id UUID,
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT,
  p_payment_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  payment_id UUID;
BEGIN
  INSERT INTO public.member_payments (
    household_id,
    from_user_id,
    to_user_id,
    amount,
    description,
    payment_date
  ) VALUES (
    p_household_id,
    p_from_user_id,
    p_to_user_id,
    p_amount,
    p_description,
    p_payment_date
  )
  RETURNING id INTO payment_id;
  
  RETURN json_build_object('success', true, 'payment_id', payment_id);
END;
$$;