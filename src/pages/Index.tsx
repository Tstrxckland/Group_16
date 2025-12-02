import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Logo */}
        <div className="mb-8 animate-scale-in">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 mx-auto">
            <Heart className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Bridging the Social Gap
          </h1>
          <p className="text-muted-foreground">
            Your safe space for growth
          </p>
        </div>

        {/* Tagline */}
        <div className="mb-8 animate-fade-up animation-delay-200">
          <p className="text-lg text-foreground/80 max-w-xs mx-auto">
            Small steps toward big changes. At your own pace.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="w-full max-w-xs space-y-3 animate-fade-up animation-delay-300">
          <Button
            variant="hero"
            className="w-full"
            onClick={() => navigate("/welcome")}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Get Started
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/auth")}
          >
            I already have an account
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          Made with 💚 for those taking brave steps
        </p>
      </div>
    </div>
  );
};

export default Index;
