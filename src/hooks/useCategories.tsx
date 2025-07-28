import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Category {
  id: string;
  name: string;
  parent_category: string | null;
  is_default: boolean;
  created_at: string;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCategories = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("parent_category", { nullsFirst: true })
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const addCategory = async (name: string, parentCategory?: string) => {
    if (!user) return { error: "User not authenticated" };

    const { data, error } = await supabase
      .from("categories")
      .insert([
        {
          name,
          parent_category: parentCategory || null,
          is_default: false,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setCategories((prev) => [...prev, data]);
    }

    return { data, error };
  };

  const updateCategory = async (id: string, name: string) => {
    if (!user) return { error: "User not authenticated" };

    const { data, error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? data : cat))
      );
    }

    return { data, error };
  };

  const deleteCategory = async (id: string) => {
    if (!user) return { error: "User not authenticated" };

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("is_default", false); // Only allow deletion of non-default categories

    if (!error) {
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    }

    return { error };
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
};