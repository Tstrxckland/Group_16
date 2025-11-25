import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Heart, Users, Shield, ChevronRight, Sparkles } from "lucide-react";

const welcomeSteps = [
  {
    icon: Leaf,
    title: "Welcome to SafeSpace",
    subtitle: "A gentle place to grow",
    description: "We're here to support you on your journey to feeling more confident in social situations. There's no rush—you set the pace.",
    color: "bg-primary/20",
  },
  {
    icon: Heart,
    title: "You're Not Alone",
    subtitle: "Connect with understanding",
    description: "Join a community of people who truly understand what you're going through. Share experiences, offer support, and grow together.",
    color: "bg-accent/20",
  },
  {
    icon: Shield,
    title: "Your Safe Space",
    subtitle: "Privacy first, always",
    description: "Choose to be anonymous or visible. Your comfort and privacy are our top priority. You're in complete control.",
    color: "bg-secondary",
  },
  {
    icon: Sparkles,
    title: "Small Steps, Big Growth",
    subtitle: "Celebrate every victory",
    description: "We'll guide you through gentle challenges at your own pace. Every small step forward is worth celebrating.",
    color: "bg-primary/10",
  },
];

const Welcome = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < welcomeSteps.length - 1) {
      setStep(step + 1);
    } else {
      navigate("/onboarding");
    }
  };

  const currentStep = welcomeSteps[step];
  const Icon = currentStep.icon;

  return (
    <div className="flex min-h-screen flex-col gradient-hero">
      {/* Skip button */}
      <div className="flex justify-end p-6">
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => navigate("/onboarding")}
        >
          Skip
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {/* Icon */}
        <div
          className={`mb-8 flex h-28 w-28 items-center justify-center rounded-full ${currentStep.color} animate-scale-in`}
          key={step}
        >
          <Icon className="h-14 w-14 text-primary animate-float" />
        </div>

        {/* Text content */}
        <div className="text-center animate-fade-up" key={`text-${step}`}>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            {currentStep.title}
          </h1>
          <p className="mb-4 text-lg font-medium text-primary">
            {currentStep.subtitle}
          </p>
          <p className="mx-auto max-w-sm text-muted-foreground leading-relaxed">
            {currentStep.description}
          </p>
        </div>
      </div>

      {/* Progress dots and button */}
      <div className="p-8">
        {/* Progress dots */}
        <div className="mb-8 flex justify-center gap-2">
          {welcomeSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setStep(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === step
                  ? "w-8 bg-primary"
                  : index < step
                  ? "w-2 bg-primary/50"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Next button */}
        <Button
          variant="hero"
          className="w-full"
          onClick={handleNext}
        >
          {step === welcomeSteps.length - 1 ? "Get Started" : "Continue"}
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Welcome;
