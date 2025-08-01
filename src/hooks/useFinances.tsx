import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { USERS } from '@/constants/users';  // Adicione esta linha

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
  const [error, setError] = useState<string | null>(null);
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
    if (user) {
      fetchHousehold();
    } else {
      setHousehold(null);
      setLoading(false);
    }
  }, [user?.id]);

  return {
    household,
    loading,
    updatePercentages,
    refetch: fetchHousehold,
  };
};

export const useExpenses = (household: Household | null = null) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

    const getPaidByName = (userId: string) => {
    if (userId === USERS.JULIA.id) return USERS.JULIA.name;
    if (userId === USERS.BRUNO.id) return USERS.BRUNO.name;
    return "Usuário";
  };

  const fetchExpenses = async () => {
    if (!user || !household) {
      setExpenses([]);  // Limpa despesas ao trocar de usuário
      return;
    }
  
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        categories (
          id,
          name,
          parent_category
        )
      `)
      .eq("household_id", household.id)
      .order("expense_date", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
      setExpenses([]);
    } else {
      console.log("Despesas brutas:", data);
      
      // Buscar profiles separadamente para obter nomes dos usuários
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name");

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      console.log("Profiles encontrados:", profilesData);

      const expensesWithProfiles = (data || []).map(expense => {
        const profile = profilesData?.find(p => p.user_id === expense.paid_by);
        return {
          ...expense,
          profiles: profile || { name: "Usuário" }
        };
      });
      
      console.log("Despesas com profiles:", expensesWithProfiles);
      setExpenses(expensesWithProfiles as any || []);
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
    // Validação EXTRA - Adicione esta parte
    if (!user?.id || !household?.id) {
      const errorMsg = !user?.id ? "Usuário não autenticado" : "Domicílio não carregado";
      console.error(errorMsg, { 
        user: user?.id, 
        household: household?.id 
      });
      return { error: errorMsg };
    }

    try {
    // Modifique a chamada do Supabase para esta versão
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          household_id: household.id,
          category_id: categoryId,
          description,
          amount: Number(amount.toFixed(2)), // Garante 2 decimais
          paid_by: user.id,
          expense_date: expenseDate,
          is_shared: isShared,
        })
        .select(`
          *,
          categories (
            id,
            name,
            parent_category
          )
        `)
        .single();

      if (error) throw error;
    
      // Buscar o nome do usuário que criou a despesa
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .single();

      const expenseWithProfile = {
        ...data,
        profiles: profileData || { name: "Usuário" }
      };
      
      console.log("Despesa cadastrada com sucesso:", expenseWithProfile);
      setExpenses((prev) => [expenseWithProfile as any, ...prev]);
      return { data: expenseWithProfile };

    } catch (error) {
      console.error("Erro detalhado ao cadastrar:", error);
      return { error: error.message };
    }
  };

  const updateExpense = async (
    id: string,
    categoryId: string,
    description: string,
    amount: number,
    expenseDate: string,
    isShared: boolean = true
  ) => {
    if (!user) return { error: "User not authenticated" };

    const { data, error } = await supabase
      .from("expenses")
      .update({
        category_id: categoryId,
        description,
        amount,
        expense_date: expenseDate,
        is_shared: isShared,
      })
      .eq("id", id)
      .eq("paid_by", user.id) // Users can only update their own expenses
      .select(`
        *,
        categories (
          id,
          name,
          parent_category
        )
      `)
      .single();

    if (!error && data) {
      // Buscar o nome do usuário que criou a despesa
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .single();

      const expenseWithProfile = {
        ...data,
        profiles: profileData || { name: "Usuário" }
      };

      setExpenses((prev) =>
        prev.map((expense) => (expense.id === id ? expenseWithProfile as any : expense))
      );
      // Trigger a refetch to ensure balance updates
      setTimeout(() => fetchExpenses(), 100);
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
      // Trigger a refetch to ensure balance updates
      setTimeout(() => fetchExpenses(), 100);
    }

    return { error };
  };

  useEffect(() => {
    console.log("useExpenses useEffect - user:", user?.id, "household:", household?.id);
    if (user && household) {
      fetchExpenses();
    } else {
      // Clear expenses when user changes or household is not available
      console.log("Limpando expenses - sem usuário ou household");
      setExpenses([]);
      setLoading(false);
    }
  }, [user?.id, household?.id]);

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
    getPaidByName,
  };
};
