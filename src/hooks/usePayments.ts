import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface MemberPayment {
  id: string;
  household_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  description: string;
  payment_date: string;
  created_at: string;
  from_name?: string;
  to_name?: string;
}

export const usePayments = (householdId?: string) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<MemberPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    if (!user || !householdId) {
      setPayments([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any).rpc('get_household_payments', {
        p_household_id: householdId
      });

      if (error) {
        console.error("Erro ao buscar pagamentos:", error);
        setPayments([]);
      } else {
        setPayments((data as MemberPayment[]) || []);
      }
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const addPayment = async (
    toUserId: string,
    amount: number,
    description: string = "Acerto de contas"
  ) => {
    if (!user || !householdId) return { error: "Dados necessários não encontrados" };

    try {
      const { data, error } = await supabase.rpc("insert_member_payment", {
        p_household_id: householdId,
        p_from_user_id: user.id,
        p_to_user_id: toUserId,
        p_amount: amount,
        p_description: description,
        p_payment_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      await fetchPayments();
      return { error: null };
    } catch (error: any) {
      console.error("Erro ao adicionar pagamento:", error);
      return { error: error.message };
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user, householdId]);

  return {
    payments,
    loading,
    addPayment,
    refetch: fetchPayments
  };
};