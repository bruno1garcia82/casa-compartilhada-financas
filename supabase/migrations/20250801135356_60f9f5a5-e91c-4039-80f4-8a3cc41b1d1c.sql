-- Create function to get household payments with user names
CREATE OR REPLACE FUNCTION public.get_household_payments(p_household_id UUID)
RETURNS TABLE (
  id UUID,
  household_id UUID,
  from_user_id UUID,
  to_user_id UUID,
  amount NUMERIC,
  description TEXT,
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  from_name TEXT,
  to_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mp.id,
    mp.household_id,
    mp.from_user_id,
    mp.to_user_id,
    mp.amount,
    mp.description,
    mp.payment_date,
    mp.created_at,
    mp.updated_at,
    from_profile.name as from_name,
    to_profile.name as to_name
  FROM public.member_payments mp
  LEFT JOIN public.profiles from_profile ON mp.from_user_id = from_profile.user_id
  LEFT JOIN public.profiles to_profile ON mp.to_user_id = to_profile.user_id
  WHERE mp.household_id = p_household_id
  ORDER BY mp.created_at DESC;
END;
$$;