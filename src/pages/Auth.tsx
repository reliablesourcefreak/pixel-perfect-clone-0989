import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast({ title: "Account created", description: "Check your email to verify your account." });
      } else {
        await signIn(email, password);
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <span className="catalog-num">Authentication</span>
          <h1 className="font-serif text-3xl mt-2 text-foreground">
            {isSignUp ? "Register" : "Sign In"}
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide">
            {isSignUp ? "Create an account to upload and archive your work" : "Access your archive"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 rounded-none"
              placeholder="researcher@archive.org"
            />
          </div>
          <div>
            <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1.5 rounded-none"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" variant="archive" className="w-full" disabled={loading}>
            {loading ? "Processing…" : isSignUp ? "Register" : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-mono text-xs text-muted-foreground hover:text-foreground tracking-wide transition-colors"
          >
            {isSignUp ? "Already have an account? Sign in" : "Need an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
