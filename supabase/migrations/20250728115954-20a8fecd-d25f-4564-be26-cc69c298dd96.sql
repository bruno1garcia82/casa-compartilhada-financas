-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_category TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (readable by all authenticated users)
CREATE POLICY "All users can view categories" 
ON public.categories 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All users can manage categories" 
ON public.categories 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create household table for couples
CREATE TABLE public.households (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  julia_percentage DECIMAL(5,2) NOT NULL DEFAULT 66.00,
  bruno_percentage DECIMAL(5,2) NOT NULL DEFAULT 33.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for households
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- Create household_members table
CREATE TABLE public.household_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(household_id, user_id)
);

-- Enable RLS for household_members
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- Create policies for households
CREATE POLICY "Users can view their household" 
ON public.households 
FOR SELECT 
USING (
  id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their household" 
ON public.households 
FOR UPDATE 
USING (
  id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
);

-- Create policies for household_members
CREATE POLICY "Users can view their household members" 
ON public.household_members 
FOR SELECT 
USING (user_id = auth.uid() OR household_id IN (
  SELECT household_id 
  FROM public.household_members 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert household members" 
ON public.household_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_by UUID NOT NULL REFERENCES auth.users(id),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for expenses
CREATE POLICY "Users can view household expenses" 
ON public.expenses 
FOR SELECT 
USING (
  household_id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert expenses" 
ON public.expenses 
FOR INSERT 
WITH CHECK (
  auth.uid() = paid_by AND
  household_id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their expenses" 
ON public.expenses 
FOR UPDATE 
USING (
  auth.uid() = paid_by AND
  household_id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their expenses" 
ON public.expenses 
FOR DELETE 
USING (
  auth.uid() = paid_by AND
  household_id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
);

-- Insert default categories
INSERT INTO public.categories (name, parent_category, is_default) VALUES
-- Higiene Pessoal
('Higiene Pessoal', NULL, true),
('Saúde', 'Higiene Pessoal', true),
('Higiene', 'Higiene Pessoal', true),
('Exercícios', 'Higiene Pessoal', true),
('Cosméticos', 'Higiene Pessoal', true),

-- Lazer Pessoal
('Lazer Pessoal', NULL, true),
('Bar', 'Lazer Pessoal', true),
('Presente', 'Lazer Pessoal', true),
('Roupa', 'Lazer Pessoal', true),
('Eletrônico', 'Lazer Pessoal', true),
('Música', 'Lazer Pessoal', true),
('Streams', 'Lazer Pessoal', true),
('Viagem', 'Lazer Pessoal', true),
('Cigarro', 'Lazer Pessoal', true),

-- Transporte
('Transporte', NULL, true),
('Combustível', 'Transporte', true),
('Mecânico', 'Transporte', true),
('Impostos', 'Transporte', true),
('Seguro', 'Transporte', true),
('Pedágio', 'Transporte', true),

-- Alimentação
('Alimentação', NULL, true),
('Mercado', 'Alimentação', true),
('Restaurante', 'Alimentação', true),
('Orgânico', 'Alimentação', true),
('Restaurante C', 'Alimentação', true),

-- Moradia
('Moradia', NULL, true),
('Aluguel', 'Moradia', true),
('Lucia', 'Moradia', true),
('Contas', 'Moradia', true),
('Manutenção Casa', 'Moradia', true),
('Itens', 'Moradia', true),
('Barra', 'Moradia', true),

-- Lola (Pet)
('Lola', NULL, true),
('Pacote', 'Lola', true),
('Veterinária', 'Lola', true),
('Extra', 'Lola', true),
('Ração', 'Lola', true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();