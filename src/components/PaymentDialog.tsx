import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useFinances";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toUserId?: string;
  amount?: number;
}

const PaymentDialog = ({ open, onOpenChange, toUserId, amount }: PaymentDialogProps) => {
  const { user } = useAuth();
  const { household } = useHousehold();
  const [paymentAmount, setPaymentAmount] = useState(amount ? amount.toString() : "");
  const [description, setDescription] = useState("Acerto de contas");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !household || !toUserId) {
      toast({
        title: "Erro",
        description: "Dados necessários não encontrados.",
        variant: "destructive",
      });
      return;
    }

    const amountValue = parseFloat(paymentAmount.replace(",", "."));
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira um valor válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.rpc('insert_member_payment', {
        p_household_id: household.id,
        p_from_user_id: user.id,
        p_to_user_id: toUserId,
        p_amount: amountValue,
        p_description: description,
        p_payment_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso.",
      });

      onOpenChange(false);
      setPaymentAmount("");
      setDescription("Acerto de contas");
    } catch (error: any) {
      console.error("Erro ao registrar pagamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="text"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Acerto de contas"
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Pagamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;