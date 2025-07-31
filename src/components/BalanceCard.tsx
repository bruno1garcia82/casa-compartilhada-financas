import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBalance } from "@/hooks/useBalance";
import { ArrowRightLeft, DollarSign } from "lucide-react";

const BalanceCard = () => {
  const balance = useBalance();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const getBalanceMessage = () => {
    if (balance.brunoOwesJulia > 0 && balance.juliaOwesBruno === 0) {
      return {
        message: `Bruno deve pagar ${formatCurrency(balance.brunoOwesJulia)} para Julia`,
        variant: "destructive" as const,
        icon: "→"
      };
    } else if (balance.juliaOwesBruno > 0 && balance.brunoOwesJulia === 0) {
      return {
        message: `Julia deve pagar ${formatCurrency(balance.juliaOwesBruno)} para Bruno`,
        variant: "destructive" as const,
        icon: "←"
      };
    } else if (balance.brunoOwesJulia === 0 && balance.juliaOwesBruno === 0) {
      return {
        message: "Contas em dia! Ninguém deve nada.",
        variant: "default" as const,
        icon: "✓"
      };
    } else {
      return {
        message: "Calculando saldos...",
        variant: "secondary" as const,
        icon: "⚖️"
      };
    }
  };

  const balanceInfo = getBalanceMessage();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Saldo de Despesas Conjuntas</CardTitle>
        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{balanceInfo.icon}</span>
          <div className="flex-1">
            <Badge variant={balanceInfo.variant} className="text-xs">
              {balanceInfo.message}
            </Badge>
          </div>
        </div>
        
        {(balance.brunoOwesJulia > 0 || balance.juliaOwesBruno > 0) && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Baseado na divisão atual das despesas conjuntas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
