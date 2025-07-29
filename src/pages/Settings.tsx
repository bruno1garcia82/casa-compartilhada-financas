import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { useHousehold } from "@/hooks/useFinances";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { household, updatePercentages } = useHousehold();
  const [juliaPercentage, setJuliaPercentage] = useState("");
  const [brunoPercentage, setBrunoPercentage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (household) {
      setJuliaPercentage(household.julia_percentage.toString());
      setBrunoPercentage(household.bruno_percentage.toString());
    }
  }, [household]);

  const handleSave = async () => {
    const juliaNum = parseFloat(juliaPercentage);
    const brunoNum = parseFloat(brunoPercentage);

    if (isNaN(juliaNum) || isNaN(brunoNum)) {
      toast({
        title: "Erro de validação",
        description: "Por favor, insira valores numéricos válidos.",
        variant: "destructive",
      });
      return;
    }

    if (juliaNum + brunoNum !== 100) {
      toast({
        title: "Erro de validação",
        description: "A soma das porcentagens deve ser igual a 100%.",
        variant: "destructive",
      });
      return;
    }

    if (juliaNum < 0 || brunoNum < 0 || juliaNum > 100 || brunoNum > 100) {
      toast({
        title: "Erro de validação",
        description: "As porcentagens devem estar entre 0% e 100%.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const { error } = await updatePercentages(juliaNum, brunoNum);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: typeof error === 'string' ? error : "Erro ao atualizar as configurações.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Configurações salvas",
        description: "As porcentagens foram atualizadas com sucesso.",
      });
    }
    setSaving(false);
  };

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Configurações</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Divisão de Despesas</CardTitle>
              <CardDescription>
                Configure como as despesas devem ser divididas entre os membros da casa.
                A soma das porcentagens deve ser igual a 100%.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="julia-percentage">Porcentagem da Julia (%)</Label>
                  <Input
                    id="julia-percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={juliaPercentage}
                    onChange={(e) => {
                      const value = e.target.value;
                      setJuliaPercentage(value);
                      if (value && !isNaN(parseFloat(value))) {
                        setBrunoPercentage((100 - parseFloat(value)).toString());
                      }
                    }}
                    placeholder="66.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bruno-percentage">Porcentagem do Bruno (%)</Label>
                  <Input
                    id="bruno-percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={brunoPercentage}
                    onChange={(e) => {
                      const value = e.target.value;
                      setBrunoPercentage(value);
                      if (value && !isNaN(parseFloat(value))) {
                        setJuliaPercentage((100 - parseFloat(value)).toString());
                      }
                    }}
                    placeholder="33.00"
                  />
                </div>
              </div>

              {juliaPercentage && brunoPercentage && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Total: {(parseFloat(juliaPercentage || "0") + parseFloat(brunoPercentage || "0")).toFixed(2)}%
                    {(parseFloat(juliaPercentage || "0") + parseFloat(brunoPercentage || "0")) !== 100 && (
                      <span className="text-destructive ml-2">
                        (deve ser 100%)
                      </span>
                    )}
                  </p>
                </div>
              )}

              <Button 
                onClick={handleSave} 
                disabled={saving || !juliaPercentage || !brunoPercentage}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>
                Detalhes da sua conta e perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  value={user.email || ""} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input 
                  value={user.user_metadata?.name || user.email || ""} 
                  disabled 
                  className="bg-muted"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;