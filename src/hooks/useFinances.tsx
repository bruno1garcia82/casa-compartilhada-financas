import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Household {
  id: string;
  name: string;
  julia_percentage: number;
  bruno_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  household_id: string;
  category_id: string;
  description: string;
  amount: number;
  paid_by: string;
  expense_date: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    parent_category: string | null;
  } | null;
  profiles?: {
    name: string;
  } | null;
}

export const useHousehold = () => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

    const createDefaultHousehold = async (userId: string) => {
    try {
      console.log("Criando household padrão para usuário:", userId);
      
      const { data: newHousehold, error: householdError } = await supabase
        .from("households")
        .insert([
          {
            name: "Casa da Julia e Bruno",
            julia_percentage: 66.00,
            bruno_percentage: 33.00,
          },
        ])
        .select()
        .single();

      if (householdError) {
        console.error("Erro ao criar household:", householdError);
        throw householdError;
      }

      if (!newHousehold) {
        throw new Error("Household não foi criado");
      }

      console.log("Novo household criado:", newHousehold);

      // Adiciona usuário como membro
      const { error: memberError } = await supabase
        .from("household_members")
        .insert([
          {
            household_id: newHousehold.id,
            user_id: userId,
            role: "admin",
          },
        ]);

      if (memberError) {
        console.error("Erro ao adicionar membro:", memberError);
        throw memberError;
      }

      return newHousehold;
    } catch (error) {
      console.error("Falha completa na criação do household:", error);
      setError("Falha ao criar household padrão");
      return null;
    }
  };

  const fetchHousehold = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Buscando household para usuário:", user.id);
      
      // 1. Verifica se usuário é membro de algum household
      const { data: memberData, error: memberError } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .maybeSingle(); // Usando maybeSingle para evitar erros quando não encontra registro

      if (memberError) {
        console.error("Erro ao buscar household_members:", memberError);
        throw memberError;
      }

      // 2. Se não for membro, cria um novo household
      if (!memberData) {
        console.log("Usuário não tem household, criando um novo...");
        const newHousehold = await createDefaultHousehold(user.id);
        if (newHousehold) {
          setHousehold(newHousehold);
        }
        return;
      }

      // 3. Se for membro, busca os dados do household
      console.log("Usuário tem household, buscando dados...");
      const { data: householdData, error: householdError } = await supabase
        .from("households")
        .select("*")
        .eq("id", memberData.household_id)
        .single();

      if (householdError) {
        console.error("Erro ao buscar household:", householdError);
        throw householdError;
      }

      if (householdData) {
        console.log("Household encontrado:", householdData);
        setHousehold(householdData);
      }
    } catch (error) {
      console.error("Erro no fetchHousehold:", error);
      setError("Erro ao carregar household");
    } finally {
      setLoading(false);
    }
  };

  const updatePercentages = async (juliaPercentage: number, brunoPercentage: number) => {
    if (!user || !household) return { error: "Not authenticated or no household" };

    const { data, error } = await supabase
      .from("households")
      .update({
        julia_percentage: juliaPercentage,
        bruno_percentage: brunoPercentage,
      })
      .eq("id", household.id)
      .select()
      .single();

    if (!error && data) {
      setHousehold(data);
    }

    return { data, error };
  };

  useEffect(() => {
    fetchHousehold();
  }, [user]);

  return {
    household,
    loading,
    updatePercentages,
    refetch: fetchHousehold,
  };
};

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { household } = useHousehold();

  const fetchExpenses = async () => {
    if (!user || !household) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        categories (
          id,
          name,
          parent_category
        ),
        profiles!expenses_paid_by_fkey (
          name
        )
      `)
      .eq("household_id", household.id)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
    } else {
      setExpenses(data as any || []);
    }
    setLoading(false);
  };

  const addExpense = async (
    categoryId: string,
    description: string,
    amount: number,
    expenseDate: string,
    isShared: boolean = true
  ) => {
    if (!user || !household) return { error: "Not authenticated or no household" };

    const { data, error } = await supabase
      .from("expenses")
      .insert([
        {
          household_id: household.id,
          category_id: categoryId,
          description,
          amount,
          paid_by: user.id,
          expense_date: expenseDate,
          is_shared: isShared,
        },
      ])
      .select(`
        *,
        categories (
          id,
          name,
          parent_category
        ),
        profiles!expenses_paid_by_fkey (
          name
        )
      `)
      .single();

    if (!error && data) {
      setExpenses((prev) => [data as any, ...prev]);
    }

    return { data, error };
  };

  const updateExpense = async (
    id: string,
    categoryId: string,
    description: string,
    amount: number,
    expenseDate: string
  ) => {
    if (!user) return { error: "User not authenticated" };

    const { data, error } = await supabase
      .from("expenses")
      .update({
        category_id: categoryId,
        description,
        amount,
        expense_date: expenseDate,
      })
      .eq("id", id)
      .eq("paid_by", user.id) // Users can only update their own expenses
      .select(`
        *,
        categories (
          id,
          name,
          parent_category
        ),
        profiles!expenses_paid_by_fkey (
          name
        )
      `)
      .single();

    if (!error && data) {
      setExpenses((prev) =>
        prev.map((expense) => (expense.id === id ? data as any : expense))
      );
    }

    return { data, error };
  };

  const deleteExpense = async (id: string) => {
    if (!user) return { error: "User not authenticated" };

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("paid_by", user.id); // Users can only delete their own expenses

    if (!error) {
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    }

    return { error };
  };

  useEffect(() => {
    if (household) {
      fetchExpenses();
    }
  }, [user, household]);

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  };
};
