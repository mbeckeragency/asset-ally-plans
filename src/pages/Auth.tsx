import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isForgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "E-Mail gesendet", description: "Prüfe deinen Posteingang für den Reset-Link." });
        setIsForgot(false);
      }
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast({ title: "Login fehlgeschlagen", description: error.message, variant: "destructive" });
      } else {
        navigate("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: window.location.origin,
        },
      });
      setLoading(false);
      if (error) {
        toast({ title: "Registrierung fehlgeschlagen", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Fast geschafft!", description: "Bitte bestätige deine E-Mail-Adresse." });
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">
            <span className="text-primary">Finanz</span>Manager
          </CardTitle>
          <CardDescription>
            {isForgot ? "Passwort zurücksetzen" : isLogin ? "Melde dich an" : "Erstelle einen Account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgot && (
              <Input
                placeholder="Dein Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            )}
            <Input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {!isForgot && (
              <Input
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Laden..."
                : isForgot
                ? "Reset-Link senden"
                : isLogin
                ? "Anmelden"
                : "Registrieren"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm space-y-2">
            {!isForgot && (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsForgot(true)}
              >
                Passwort vergessen?
              </button>
            )}
            <div>
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => { setIsLogin(!isLogin); setIsForgot(false); }}
              >
                {isLogin ? "Noch kein Account? Registrieren" : "Bereits registriert? Anmelden"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
