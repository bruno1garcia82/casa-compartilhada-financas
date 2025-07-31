import { useMemo } from 'react';
import { useExpenses, useHousehold } from './useFinances';

export const useBalance = () => {
  const { household } = useHousehold();
  const { expenses } = useExpenses(household);

  const balance = useMemo(() => {
    console.log("useBalance - calculando saldo:", { household, expenses: expenses.length });
    
    if (!household || !expenses.length) {
      console.log("useBalance - sem household ou expenses");
      return { brunoOwesJulia: 0, juliaOwesBruno: 0 };
    }

    let brunoTotal = 0;
    let juliaTotal = 0;

    expenses.forEach((expense) => {
      console.log("Processando despesa:", { 
        description: expense.description, 
        amount: expense.amount, 
        is_shared: expense.is_shared, 
        paid_by_name: expense.profiles?.name 
      });
      
      if (expense.is_shared) {
        if (expense.profiles?.name === 'Bruno') {
          brunoTotal += expense.amount;
        } else if (expense.profiles?.name === 'Julia') {
          juliaTotal += expense.amount;
        }
      }
    });

    const totalSharedExpenses = brunoTotal + juliaTotal;
    const brunoShouldPay = totalSharedExpenses * (household.bruno_percentage / 100);
    const juliaShouldPay = totalSharedExpenses * (household.julia_percentage / 100);

    const brunoOwesJulia = Math.max(0, brunoShouldPay - brunoTotal);
    const juliaOwesBruno = Math.max(0, juliaShouldPay - juliaTotal);

    console.log("useBalance - resultado:", {
      brunoTotal,
      juliaTotal,
      totalSharedExpenses,
      brunoShouldPay,
      juliaShouldPay,
      brunoOwesJulia,
      juliaOwesBruno,
      percentages: { bruno: household.bruno_percentage, julia: household.julia_percentage }
    });

    return { brunoOwesJulia, juliaOwesBruno };
  }, [household, expenses]);

  return balance;
};
