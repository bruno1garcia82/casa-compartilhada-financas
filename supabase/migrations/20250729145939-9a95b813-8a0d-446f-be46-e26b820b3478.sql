-- Fix infinite recursion in household_members RLS policies
-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Users can view their household members" ON household_members;

-- Create a simpler, non-recursive policy
CREATE POLICY "Users can view their household members" 
ON household_members 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Also ensure the households policy doesn't cause recursion
DROP POLICY IF EXISTS "Users can view their household" ON households;
DROP POLICY IF EXISTS "Users can update their household" ON households;

-- Create simpler household policies
CREATE POLICY "Users can view their household" 
ON households 
FOR SELECT 
TO authenticated
USING (id IN (
  SELECT hm.household_id 
  FROM household_members hm 
  WHERE hm.user_id = auth.uid()
));

CREATE POLICY "Users can update their household" 
ON households 
FOR UPDATE 
TO authenticated
USING (id IN (
  SELECT hm.household_id 
  FROM household_members hm 
  WHERE hm.user_id = auth.uid()
));

-- Add a policy to allow household creation
CREATE POLICY "Users can create households" 
ON households 
FOR INSERT 
TO authenticated
WITH CHECK (true);