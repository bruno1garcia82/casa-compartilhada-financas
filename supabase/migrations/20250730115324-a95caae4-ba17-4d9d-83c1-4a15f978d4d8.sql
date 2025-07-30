-- Fix RLS policies for household creation
-- The issue is that when creating a household, the user needs to be able to insert 
-- into household_members table, but the current policy requires user_id = auth.uid()
-- However, we're passing the user_id parameter instead of relying on auth.uid()

-- First, let's update the household_members policy to be more flexible for inserts
DROP POLICY IF EXISTS "Users can insert household members" ON public.household_members;

CREATE POLICY "Users can insert household members" 
ON public.household_members 
FOR INSERT 
WITH CHECK (
  -- User can add themselves to any household
  user_id = auth.uid() 
  OR 
  -- User can add others if they are admin of the household
  EXISTS (
    SELECT 1 FROM public.household_members hm 
    WHERE hm.household_id = household_members.household_id 
    AND hm.user_id = auth.uid() 
    AND hm.role = 'admin'
  )
);

-- Also ensure that the households table policy is correct
DROP POLICY IF EXISTS "Users can create households" ON public.households;

CREATE POLICY "Users can create households" 
ON public.households 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Add a policy to allow users to view households they created during the same transaction
-- This helps with the createDefaultHousehold flow
DROP POLICY IF EXISTS "Users can view their household" ON public.households;

CREATE POLICY "Users can view their household" 
ON public.households 
FOR SELECT 
USING (
  id IN (
    SELECT hm.household_id
    FROM public.household_members hm
    WHERE hm.user_id = auth.uid()
  )
);