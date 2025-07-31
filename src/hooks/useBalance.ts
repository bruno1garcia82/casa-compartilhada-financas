import { useMemo } from 'react';
import { useExpenses, useHousehold } from './useFinances';

export const useBalance = () => {
  const { household } = useHousehold();
  const { expenses } = useExpenses(household);

  const balance = useMemo(() => {
    if (!household || !expenses.length) {
      return { brunoOwesJulia: 0, juliaOwesBruno: 0 };
    }

    let brunoTotal = 0;
    let juliaTotal = 0;

    expenses.forEach((expense) => {
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

    return { brunoOwesJulia, juliaOwesBruno };
  }, [household, expenses]);

  return balance;
};
