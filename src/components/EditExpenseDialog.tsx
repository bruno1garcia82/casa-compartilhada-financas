import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/useCategories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHousehold, useExpenses } from "@/hooks/useFinances";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: any;
}

const EditExpenseDialog = ({ open, onOpenChange, expense }: EditExpenseDialogProps) => {
  const { categories } = useCategories();
  const { household } = useHousehold();
  const { updateExpense, deleteExpense } = useExpenses(household);
  
  const [categoryId, setCategoryId] = useState(expense?.category_id || "");
  const [description, setDescription] = useState(expense?.description || "");
  const [amount, setAmount] = useState(expense?.amount?.toString() || "");
  const [expenseDate, setExpenseDate] = useState(
    expense ? format(new Date(expense.expense_date), "yyyy-MM-dd") : ""
  );
  const [isShared, setIsShared] = useState(expense?.is_shared ?? true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !description || !amount || !expenseDate) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await updateExpense(
      expense.id,
      categoryId,
      description,
      parseFloat(amount),
      expenseDate,
      isShared
    );

    if (error) {
      toast({
        title: "Erro ao atualizar despesa",
        description: typeof error === 'string' ? error : error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Despesa atualizada",
        description: "A despesa foi atualizada com sucesso.",
      });
      onOpenChange(false);
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta despesa?")) return;
    
    setIsLoading(true);
    const { error } = await deleteExpense(expense.id);

    if (error) {
      toast({
        title: "Erro ao excluir despesa",
        description: typeof error === 'string' ? error : error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Despesa excluída",
        description: "A despesa foi excluída com sucesso.",
      });
      onOpenChange(false);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Despesa</DialogTitle>
          <DialogDescription>
            Modifique os dados da despesa abaixo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a despesa..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense_date">Data da Despesa *</Label>
            <Input
              id="expense_date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_shared"
              checked={isShared}
              onCheckedChange={setIsShared}
            />
            <Label htmlFor="is_shared">Despesa compartilhada</Label>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Excluir
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseDialog;