import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PiggyBank, Wallet } from "lucide-react";

function toMonthly(amount: number, interval: string) {
  return interval === "yearly" ? amount / 12 : amount;
}

export default function Savings() {
  const { user } = useAuth();
  const [monthlyRate, setMonthlyRate] = useState(200);
  const [years, setYears] = useState(20);
  const [returnRate, setReturnRate] = useState(7);
  const [freeBudget, setFreeBudget] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: inc }, { data: exp }] = await Promise.all([
        supabase.from("incomes").select("*").eq("user_id", user.id),
        supabase.from("fixed_expenses").select("*").eq("user_id", user.id),
      ]);
      const totalIncome = (inc || []).reduce((s: number, i: any) => s + toMonthly(Number(i.amount), i.interval), 0);
      const totalExpenses = (exp || []).reduce((s: number, e: any) => s + toMonthly(Number(e.amount), e.interval), 0);
      setFreeBudget(totalIncome - totalExpenses);
    };
    load();
  }, [user]);

  const chartData = useMemo(() => {
    const data = [];
    const monthlyReturn = returnRate / 100 / 12;
    let invested = 0;
    let total = 0;
    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        total = total * (1 + monthlyReturn) + monthlyRate;
        invested += monthlyRate;
      }
      data.push({
        year: `Jahr ${y}`,
        Eingezahlt: Math.round(invested),
        Zinsen: Math.round(total - invested),
      });
    }
    return data;
  }, [monthlyRate, years, returnRate]);

  const finalAmount = chartData.length > 0 ? chartData[chartData.length - 1].Eingezahlt + chartData[chartData.length - 1].Zinsen : 0;
  const totalInvested = chartData.length > 0 ? chartData[chartData.length - 1].Eingezahlt : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold">Spar-Rechner</h1>
        <p className="text-muted-foreground text-sm mt-1">Berechne dein Vermögenswachstum mit dem ETF-Sparplan-Rechner</p>
      </div>

      {/* Free budget info */}
      <Card>
        <CardContent className="p-5 flex items-center gap-3">
          <Wallet className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Monatlich frei verfügbar (basierend auf Fixkosten)</p>
            <p className="text-lg font-display font-bold text-primary">{freeBudget.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</p>
          </div>
        </CardContent>
      </Card>

      {/* Calculator inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">ETF-Sparplan Rechner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Monatliche Sparrate: {monthlyRate} €</Label>
            <Slider value={[monthlyRate]} onValueChange={([v]) => setMonthlyRate(v)} min={25} max={5000} step={25} />
            <Input type="number" value={monthlyRate} onChange={(e) => setMonthlyRate(Number(e.target.value))} className="mt-1" />
          </div>
          <div className="space-y-2">
            <Label>Laufzeit: {years} Jahre</Label>
            <Slider value={[years]} onValueChange={([v]) => setYears(v)} min={1} max={50} step={1} />
          </div>
          <div className="space-y-2">
            <Label>Erwartete Rendite: {returnRate}% p.a.</Label>
            <Slider value={[returnRate]} onValueChange={([v]) => setReturnRate(v)} min={1} max={15} step={0.5} />
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1"><PiggyBank className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Endvermögen</span></div>
            <p className="text-xl font-display font-bold text-primary">{finalAmount.toLocaleString("de-DE")} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1"><Wallet className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Davon eingezahlt</span></div>
            <p className="text-xl font-display font-bold">{totalInvested.toLocaleString("de-DE")} €</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Vermögensentwicklung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(years / 8) - 1)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("de-DE")} €`} />
                <Bar dataKey="Eingezahlt" stackId="a" fill="hsl(210, 15%, 80%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Zinsen" stackId="a" fill="hsl(160, 60%, 40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
