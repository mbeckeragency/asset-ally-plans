import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";

const CATEGORIES = ["Miete", "Versicherungen", "Abos", "Strom", "Internet", "Lebensmittel", "Transport", "Sonstiges"];

interface Income { id: string; name: string; amount: number; interval: string; }
interface Expense { id: string; name: string; amount: number; category: string; interval: string; }

function toMonthly(amount: number, interval: string) {
  return interval === "yearly" ? amount / 12 : amount;
}

export default function Expenses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"income" | "expense">("expense");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", amount: "", category: "Sonstiges", interval: "monthly" });

  const load = async () => {
    if (!user) return;
    const [{ data: inc }, { data: exp }] = await Promise.all([
      supabase.from("incomes").select("*").eq("user_id", user.id),
      supabase.from("fixed_expenses").select("*").eq("user_id", user.id),
    ]);
    setIncomes((inc as Income[]) || []);
    setExpenses((exp as Expense[]) || []);
  };

  useEffect(() => { load(); }, [user]);

  const openAdd = (type: "income" | "expense") => {
    setDialogType(type);
    setEditingId(null);
    setForm({ name: "", amount: "", category: "Sonstiges", interval: "monthly" });
    setDialogOpen(true);
  };

  const openEdit = (item: Income | Expense, type: "income" | "expense") => {
    setDialogType(type);
    setEditingId(item.id);
    setForm({
      name: item.name,
      amount: String(item.amount),
      category: "category" in item ? item.category : "Sonstiges",
      interval: item.interval,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    const data = {
      name: form.name,
      amount: parseFloat(form.amount),
      interval: form.interval,
      user_id: user.id,
      ...(dialogType === "expense" ? { category: form.category } : {}),
    };
    const table = dialogType === "income" ? "incomes" : "fixed_expenses";
    const { error } = editingId
      ? await supabase.from(table).update(data).eq("id", editingId)
      : await supabase.from(table).insert(data);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      setDialogOpen(false);
      load();
    }
  };

  const handleDelete = async (id: string, type: "income" | "expense") => {
    const table = type === "income" ? "incomes" : "fixed_expenses";
    await supabase.from(table).delete().eq("id", id);
    load();
  };

  const totalIncome = incomes.reduce((s, i) => s + toMonthly(i.amount, i.interval), 0);
  const totalExpenses = expenses.reduce((s, e) => s + toMonthly(e.amount, e.interval), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold">Fixkosten-Tracker</h1>
        <p className="text-muted-foreground text-sm mt-1">Verwalte deine regelmäßigen Einnahmen und Ausgaben</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-success" /><span className="text-xs text-muted-foreground">Einnahmen/Monat</span></div>
            <p className="text-lg font-display font-bold text-success">{totalIncome.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-destructive" /><span className="text-xs text-muted-foreground">Ausgaben/Monat</span></div>
            <p className="text-lg font-display font-bold text-destructive">{totalExpenses.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</p>
          </CardContent>
        </Card>
      </div>

      {/* Incomes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-display">Einnahmen</CardTitle>
          <Button size="sm" variant="outline" onClick={() => openAdd("income")} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Hinzufügen
          </Button>
        </CardHeader>
        <CardContent>
          {incomes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Noch keine Einnahmen erfasst</p>
          ) : (
            <div className="space-y-2">
              {incomes.map((i) => (
                <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.interval === "yearly" ? "Jährlich" : "Monatlich"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{Number(i.amount).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(i, "income")}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(i.id, "income")}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-display">Fixkosten</CardTitle>
          <Button size="sm" variant="outline" onClick={() => openAdd("expense")} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Hinzufügen
          </Button>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Noch keine Fixkosten erfasst</p>
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-sm font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.category} · {e.interval === "yearly" ? "Jährlich" : "Monatlich"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{Number(e.amount).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e, "expense")}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e.id, "expense")}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Bearbeiten" : "Hinzufügen"}: {dialogType === "income" ? "Einnahme" : "Fixkosten"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input type="number" placeholder="Betrag" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            {dialogType === "expense" && (
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={form.interval} onValueChange={(v) => setForm({ ...form, interval: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monatlich</SelectItem>
                <SelectItem value="yearly">Jährlich</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSave} className="w-full">Speichern</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
