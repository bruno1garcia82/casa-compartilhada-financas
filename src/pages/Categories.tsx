import { useState } from "react";
import { useCategories, Category } from "@/hooks/useCategories";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const Categories = () => {
  const navigate = useNavigate();
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryParent, setNewCategoryParent] = useState("");
  const [editName, setEditName] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const parentCategories = categories.filter(cat => !cat.parent_category);
  const subcategories = categories.filter(cat => cat.parent_category);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome da categoria.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await addCategory(newCategoryName.trim(), newCategoryParent || undefined);
    
    if (error) {
      toast({
        title: "Erro ao adicionar categoria",
        description: typeof error === 'string' ? error : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Categoria adicionada!",
        description: "Nova categoria criada com sucesso.",
      });
      setNewCategoryName("");
      setNewCategoryParent("");
      setShowAddDialog(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editName.trim()) return;

    const { error } = await updateCategory(editingCategory.id, editName.trim());
    
    if (error) {
      toast({
        title: "Erro ao editar categoria",
        description: typeof error === 'string' ? error : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Categoria atualizada!",
        description: "Categoria editada com sucesso.",
      });
      setEditingCategory(null);
      setEditName("");
      setShowEditDialog(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (category.is_default && !category.parent_category) {
      toast({
        title: "Categoria principal padrão",
        description: "Categorias principais padrão não podem ser excluídas.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await deleteCategory(category.id);
    
    if (error) {
      toast({
        title: "Erro ao excluir categoria",
        description: typeof error === 'string' ? error : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Categoria excluída!",
        description: "Categoria removida com sucesso.",
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div>Carregando categorias...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Categorias</h1>
            <p className="text-muted-foreground">
              Gerencie as categorias de gastos do sistema
            </p>
          </div>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Categoria</DialogTitle>
              <DialogDescription>
                Crie uma nova categoria para organizar suas despesas.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-category-name">Nome da Categoria</Label>
                <Input
                  id="new-category-name"
                  placeholder="Ex: Academia"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-category-parent">Categoria Pai (Opcional)</Label>
                <Select value={newCategoryParent} onValueChange={setNewCategoryParent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria pai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma (categoria principal)</SelectItem>
                    {parentCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddCategory}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {parentCategories.map((parent) => (
          <Card key={parent.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {parent.name}
                    {parent.is_default && (
                      <Badge variant="secondary">Padrão</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {subcategories.filter(sub => sub.parent_category === parent.name).length} subcategorias
                  </CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(parent)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCategory(parent)}
                    disabled={parent.is_default}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {subcategories
                  .filter(sub => sub.parent_category === parent.name)
                  .map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{sub.name}</span>
                      <div className="flex gap-1">
                        {sub.is_default && (
                          <Badge variant="outline" className="text-xs">Padrão</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => openEditDialog(sub)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDeleteCategory(sub)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Altere o nome da categoria selecionada.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Nome da Categoria</Label>
              <Input
                id="edit-category-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCategory}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;