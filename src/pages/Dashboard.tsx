import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signOut } from "@/lib/auth";
import { useHousehold, useExpenses } from "@/hooks/useFinances";
import { useCategories } from "@/hooks/useCategories";
import AddExpenseDialog from "@/components/AddExpenseDialog";
import EditExpenseDialog from "@/components/EditExpenseDialog";
import BalanceCard from "@/components/BalanceCard";
import PaymentDialog from "@/components/PaymentDialog";
import { toast } from "@/hooks/use-toast";
import { usePayments } from "@/hooks/usePayments";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, isSameYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Settings, List, TrendingUp, ChevronLeft, ChevronRight, CreditCard } from "lucide-react";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { household } = useHousehold();
  const { expenses } = useExpenses(household);
  const { categories } = useCategories();
  const { payments } = usePayments(household?.id);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentToUser, setPaymentToUser] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [userKey, setUserKey] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (user) {
      // Update user key to force component refresh
      setUserKey(user.id + Date.now());
    }
  }, [user, loading, navigate]);

  // Memoize calculations to prevent unnecessary re-renders
  const dashboardData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Filter expenses for the selected month
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date + 'T12:00:00');
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });

    // Filter for current user: shared expenses + personal expenses of the logged user
    const userExpenses = monthlyExpenses.filter(expense => 
      expense.is_shared || expense.paid_by === user?.id
    );

    // Separate shared and personal expenses (filtered)
    const sharedExpenses = userExpenses.filter(expense => expense.is_shared);
    const personalExpenses = userExpenses.filter(expense => !expense.is_shared && expense.paid_by === user?.id);

    const totalSharedAmount = sharedExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const totalPersonalAmount = personalExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    return {
      monthlyExpenses: userExpenses,
      sharedExpenses,
      personalExpenses,
      totalSharedAmount,
      totalPersonalAmount,
      totalMonthly: totalSharedAmount + totalPersonalAmount,
      allMonthlyExpenses: monthlyExpenses // Keep all expenses for display
    };
  }, [expenses, currentMonth, user?.id]);

  const handleSignOut = async () => {
    try {
      // Forçar limpeza do estado local primeiro
      setUserKey("");
      
      const { error } = await signOut();
      if (error) {
        console.warn("Warning during logout:", error);
      }
      
      // Sempre navegar para auth independente do erro
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate("/auth");
    } catch (error: any) {
      console.warn("Error during logout:", error);
      // Mesmo com erro, navegar para auth
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado.",
      });
      navigate("/auth");
    }
  };

  const handlePayment = (toUserId: string, amount: number) => {
    setPaymentToUser(toUserId);
    setPaymentAmount(amount);
    setShowPaymentDialog(true);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleRefresh = () => {
    setUserKey(user?.id + Date.now());
  };

  const isCurrentMonth = isSameMonth(currentMonth, new Date()) && isSameYear(currentMonth, new Date());

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Categoria desconhecida";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Controle Financeiro</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Olá, {user.user_metadata?.name || user.email}
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button onClick={() => setShowAddExpense(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
          <Button variant="outline" onClick={() => navigate("/categories")} className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Categorias
          </Button>
          <Button variant="outline" onClick={() => navigate("/settings")} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
        </div>

        {/* Month Navigation */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="text-center">
                <h2 className="text-lg font-semibold">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </h2>
                {isCurrentMonth && (
                  <p className="text-sm text-muted-foreground">Mês atual</p>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="flex items-center gap-2"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalMonthly)}</div>
              <p className="text-xs text-muted-foreground">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas Conjuntas</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(dashboardData.totalSharedAmount)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                <div>Julia: {formatCurrency(dashboardData.totalSharedAmount * (household?.julia_percentage || 0) / 100)}</div>
                <div>Bruno: {formatCurrency(dashboardData.totalSharedAmount * (household?.bruno_percentage || 0) / 100)}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas Pessoais</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(dashboardData.totalPersonalAmount)}</div>
              <p className="text-xs text-muted-foreground">
                não divididas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
              <List className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.monthlyExpenses.length}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.sharedExpenses.length} conjuntas, {dashboardData.personalExpenses.length} pessoais
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Expense Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Divisão Atual</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Julia:</span>
                  <span className="font-medium">{household?.julia_percentage}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Bruno:</span>
                  <span className="font-medium">{household?.bruno_percentage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <BalanceCard key={userKey} onPayment={handlePayment} />
        </div>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Despesas Recentes</CardTitle>
            <CardDescription>
              Últimas movimentações registradas no sistema. Clique em uma despesa para editá-la.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.allMonthlyExpenses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Nenhuma despesa registrada para este mês.</p>
                <Button 
                  onClick={() => setShowAddExpense(true)} 
                  className="mt-4"
                >
                  Adicionar despesa
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Pago por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.allMonthlyExpenses.slice(0, 10).map((expense) => (
                    <TableRow 
                      key={expense.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setEditingExpense(expense)}
                    >
                      <TableCell>
                        {format(new Date(expense.expense_date + 'T12:00:00'), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryName(expense.category_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={expense.is_shared ? "default" : "secondary"}>
                          {expense.is_shared ? "Conjunta" : "Pessoal"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        {expense.profiles?.name || "Usuário"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        onExpenseAdded={handleRefresh}
      />
      
      {editingExpense && (
        <EditExpenseDialog
          open={!!editingExpense}
          onOpenChange={(open) => !open && setEditingExpense(null)}
          expense={editingExpense}
          onExpenseUpdated={handleRefresh}
        />
      )}

      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        toUserId={paymentToUser}
        amount={paymentAmount}
        onPaymentSuccess={handleRefresh}
      />
    </div>
  );
};

export default Dashboard;