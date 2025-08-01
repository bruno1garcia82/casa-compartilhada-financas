import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBalance } from "@/hooks/useBalance";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRightLeft, DollarSign, CreditCard } from "lucide-react";
import { USERS } from "@/constants/users";

interface BalanceCardProps {
  onPayment?: (toUserId: string, amount: number) => void;
}

const BalanceCard = ({ onPayment }: BalanceCardProps) => {
  const balance = useBalance();
  const { user } = useAuth();

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

  const getCurrentUserName = () => {
    return user?.user_metadata?.name || user?.email || '';
  };

  const canMakePayment = () => {
    const userName = getCurrentUserName();
    if (userName.includes('Bruno') && balance.brunoOwesJulia > 0) return true;
    if (userName.includes('Julia') && balance.juliaOwesBruno > 0) return true;
    return false;
  };

  const handlePaymentClick = () => {
    if (!onPayment) return;
    
    const userName = getCurrentUserName();
    if (userName.includes('Bruno') && balance.brunoOwesJulia > 0) {
      onPayment(USERS.JULIA.id, balance.brunoOwesJulia);
    } else if (userName.includes('Julia') && balance.juliaOwesBruno > 0) {
      onPayment(USERS.BRUNO.id, balance.juliaOwesBruno);
    }
  };

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
          <div className="mt-3 pt-3 border-t space-y-2">
            <p className="text-xs text-muted-foreground">
              Baseado na divisão atual das despesas conjuntas
            </p>
            
            {canMakePayment() && onPayment && (
              <Button
                size="sm"
                className="w-full flex items-center gap-2"
                onClick={handlePaymentClick}
              >
                <CreditCard className="h-4 w-4" />
                Registrar Pagamento
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
