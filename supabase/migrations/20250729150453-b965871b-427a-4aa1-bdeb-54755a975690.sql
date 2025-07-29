-- Add column to distinguish between personal and shared expenses
ALTER TABLE public.expenses 
ADD COLUMN is_shared boolean NOT NULL DEFAULT true;

-- Add comment to explain the column
COMMENT ON COLUMN public.expenses.is_shared IS 'true for shared expenses (split according to percentages), false for personal expenses';