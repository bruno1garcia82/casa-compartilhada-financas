import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold mb-4">
            Controle Financeiro
          </CardTitle>
          <CardDescription className="text-xl">
            Sistema para Julia e Bruno gerenciarem suas finanças domésticas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">✨ Funcionalidades</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Divisão configurável de gastos</li>
                <li>• Categorias personalizáveis</li>
                <li>• Controle de despesas</li>
                <li>• Relatórios mensais</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">👥 Usuários</h3>
              <p className="text-sm text-muted-foreground">
                Sistema compartilhado para o casal Julia e Bruno, com divisão padrão de 66% e 33% respectivamente.
              </p>
            </div>
          </div>
          <Button onClick={() => navigate("/auth")} size="lg" className="w-full">
            Acessar Sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
