import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const CATEGORY_COLORS = [
  "hsl(160, 60%, 40%)",
  "hsl(200, 70%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 72%, 51%)",
  "hsl(180, 50%, 45%)",
  "hsl(320, 60%, 50%)",
  "hsl(60, 70%, 45%)",
];

interface Income { id: string; name: string; amount: number; interval: string; }
interface Expense { id: string; name: string; amount: number; category: string; interval: string; }

function toMonthly(amount: number, interval: string) {
  return interval === "yearly" ? amount / 12 : amount;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: inc }, { data: exp }] = await Promise.all([
        supabase.from("incomes").select("*").eq("user_id", user.id),
        supabase.from("fixed_expenses").select("*").eq("user_id", user.id),
      ]);
      setIncomes((inc as Income[]) || []);
      setExpenses((exp as Expense[]) || []);
    };
    load();
  }, [user]);

  const totalIncome = incomes.reduce((s, i) => s + toMonthly(i.amount, i.interval), 0);
  const totalExpenses = expenses.reduce((s, e) => s + toMonthly(e.amount, e.interval), 0);
  const freeBudget = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((freeBudget / totalIncome) * 100) : 0;

  // Group by category
  const categoryData = expenses.reduce<Record<string, number>>((acc, e) => {
    const monthly = toMonthly(e.amount, e.interval);
    acc[e.category] = (acc[e.category] || 0) + monthly;
    return acc;
  }, {});
  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

  const statCards = [
    { label: "Einnahmen", value: totalIncome, icon: TrendingUp, color: "text-success" },
    { label: "Ausgaben", value: totalExpenses, icon: TrendingDown, color: "text-destructive" },
    { label: "Frei verfügbar", value: freeBudget, icon: Wallet, color: freeBudget >= 0 ? "text-primary" : "text-destructive" },
    { label: "Sparquote", value: savingsRate, icon: PiggyBank, color: "text-primary", suffix: "%" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Deine Finanzen auf einen Blick</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
              </div>
              <p className={`text-xl font-display font-bold ${s.color}`}>
                {s.suffix ? `${s.value}${s.suffix}` : `${s.value.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display">Ausgaben nach Kategorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v.toLocaleString("de-DE")} €`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {incomes.length === 0 && expenses.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center">
            <PiggyBank className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Noch keine Daten vorhanden. Gehe zu <span className="font-medium text-foreground">Fixkosten</span>, um deine Einnahmen und Ausgaben zu erfassen.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
