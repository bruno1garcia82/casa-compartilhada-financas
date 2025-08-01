import { useMemo } from 'react';
import { useExpenses, useHousehold } from './useFinances';
import { usePayments } from './usePayments';
import { useAuth } from './useAuth';

export const useBalance = () => {
  const { user } = useAuth();
  const { household } = useHousehold();
  const { expenses } = useExpenses(household);
  const { payments } = usePayments(household?.id);

  const balance = useMemo(() => {
    console.log("useBalance - calculando saldo:", { household, expenses: expenses.length, payments: payments.length });
    
    if (!household || !expenses.length) {
      console.log("useBalance - sem household ou expenses");
      return { brunoOwesJulia: 0, juliaOwesBruno: 0 };
    }

    let brunoTotal = 0;
    let juliaTotal = 0;

    // Calculate totals from shared expenses
    expenses.forEach((expense) => {
      console.log("Processando despesa:", { 
        description: expense.description, 
        amount: expense.amount, 
        is_shared: expense.is_shared, 
        paid_by_name: expense.profiles?.name 
      });
      
      if (expense.is_shared) {
        const payerName = expense.profiles?.name || '';
        if (payerName.includes('Bruno')) {
          brunoTotal += expense.amount;
        } else if (payerName.includes('Julia')) {
          juliaTotal += expense.amount;
        }
      }
    });

    const totalSharedExpenses = brunoTotal + juliaTotal;
    const brunoShouldPay = totalSharedExpenses * (household.bruno_percentage / 100);
    const juliaShouldPay = totalSharedExpenses * (household.julia_percentage / 100);

    let brunoOwesJulia = Math.max(0, brunoShouldPay - brunoTotal);
    let juliaOwesBruno = Math.max(0, juliaShouldPay - juliaTotal);

    // Apply payments to reduce debts
    payments.forEach((payment) => {
      console.log("Processando pagamento:", {
        from: payment.from_name,
        to: payment.to_name,
        amount: payment.amount
      });

      const fromName = payment.from_name || '';
      const toName = payment.to_name || '';

      if (fromName.includes('Bruno') && toName.includes('Julia')) {
        brunoOwesJulia = Math.max(0, brunoOwesJulia - payment.amount);
      } else if (fromName.includes('Julia') && toName.includes('Bruno')) {
        juliaOwesBruno = Math.max(0, juliaOwesBruno - payment.amount);
      }
    });

    console.log("useBalance - resultado:", {
      brunoTotal,
      juliaTotal,
      totalSharedExpenses,
      brunoShouldPay,
      juliaShouldPay,
      brunoOwesJulia,
      juliaOwesBruno,
      percentages: { bruno: household.bruno_percentage, julia: household.julia_percentage },
      payments: payments.length
    });

    return { brunoOwesJulia, juliaOwesBruno };
  }, [household, expenses, payments, user?.id]);

  return balance;
};
