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

  const fetchHousehold = async () => {
    if (!user) return;
    
    setLoading(true);
    
    // First check if user is member of any household
    const { data: memberData, error: memberError } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData) {
      // Create a default household for the user
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

      if (!householdError && newHousehold) {
        // Add user as member
        await supabase
          .from("household_members")
          .insert([
            {
              household_id: newHousehold.id,
              user_id: user.id,
              role: "admin",
            },
          ]);
        
        setHousehold(newHousehold);
      }
    } else {
      // Fetch existing household
      const { data: householdData, error: householdError } = await supabase
        .from("households")
        .select("*")
        .eq("id", memberData.household_id)
        .single();

      if (!householdError && householdData) {
        setHousehold(householdData);
      }
    }
    
    setLoading(false);
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
    expenseDate: string
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