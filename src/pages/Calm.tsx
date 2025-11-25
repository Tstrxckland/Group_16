import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Wind, Eye, Pause, Play, RotateCcw, ChevronRight } from "lucide-react";

type Exercise = "breathing" | "grounding" | "affirmations" | null;

const affirmations = [
  "I am safe in this moment",
  "I am capable and strong",
  "My feelings are valid",
  "I can handle this",
  "I am worthy of connection",
  "It's okay to take things slow",
  "I am doing my best",
  "This feeling will pass",
];

const Calm = () => {
  const [activeExercise, setActiveExercise] = useState<Exercise>(null);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathCount, setBreathCount] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [groundingStep, setGroundingStep] = useState(0);
  const [currentAffirmation, setCurrentAffirmation] = useState(0);

  // Breathing exercise logic
  useEffect(() => {
    if (!isBreathing || activeExercise !== "breathing") return;

    const phases = [
      { name: "inhale" as const, duration: 4000 },
      { name: "hold" as const, duration: 4000 },
      { name: "exhale" as const, duration: 4000 },
    ];

    let phaseIndex = phases.findIndex(p => p.name === breathPhase);
    
    const timer = setTimeout(() => {
      const nextIndex = (phaseIndex + 1) % phases.length;
      setBreathPhase(phases[nextIndex].name);
      if (nextIndex === 0) {
        setBreathCount(prev => prev + 1);
      }
    }, phases[phaseIndex].duration);

    return () => clearTimeout(timer);
  }, [isBreathing, breathPhase, activeExercise]);

  const groundingSteps = [
    { count: 5, sense: "things you can SEE", icon: "👁️" },
    { count: 4, sense: "things you can TOUCH", icon: "✋" },
    { count: 3, sense: "things you can HEAR", icon: "👂" },
    { count: 2, sense: "things you can SMELL", icon: "👃" },
    { count: 1, sense: "thing you can TASTE", icon: "👅" },
  ];

  const resetBreathing = () => {
    setIsBreathing(false);
    setBreathPhase("inhale");
    setBreathCount(0);
  };

  const exercises = [
    {
      id: "breathing" as const,
      title: "Breathing Exercise",
      description: "4-4-4 box breathing to calm your nervous system",
      icon: Wind,
      color: "bg-sage-100",
      iconColor: "text-primary",
    },
    {
      id: "grounding" as const,
      title: "5-4-3-2-1 Grounding",
      description: "Use your senses to ground yourself in the present",
      icon: Eye,
      color: "bg-cream-200",
      iconColor: "text-accent",
    },
    {
      id: "affirmations" as const,
      title: "Calming Affirmations",
      description: "Gentle reminders that you are safe and capable",
      icon: Heart,
      color: "bg-terracotta-100",
      iconColor: "text-terracotta-400",
    },
  ];

  return (
    <div className="gradient-hero min-h-screen px-6 py-8">
      {!activeExercise ? (
        <>
          {/* Header */}
          <div className="mb-8 text-center animate-fade-up">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-10 w-10 text-primary animate-pulse-soft" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">
              Take a Moment
            </h1>
            <p className="text-muted-foreground">
              Choose an exercise to help you feel calm and centered
            </p>
          </div>

          {/* Exercise Options */}
          <div className="space-y-4 animate-fade-up animation-delay-200">
            {exercises.map((exercise) => (
              <Card
                key={exercise.id}
                className="cursor-pointer hover:shadow-card transition-all"
                onClick={() => setActiveExercise(exercise.id)}
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${exercise.color}`}>
                    <exercise.icon className={`h-7 w-7 ${exercise.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{exercise.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {exercise.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Tip */}
          <Card className="mt-8 bg-muted/50 animate-fade-up animation-delay-300">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                💡 Tip: Save this page for quick access when you need it. 
                These exercises can be done anywhere, anytime.
              </p>
            </CardContent>
          </Card>
        </>
      ) : activeExercise === "breathing" ? (
        /* Breathing Exercise */
        <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-up">
          <Button
            variant="ghost"
            className="absolute top-6 left-6"
            onClick={() => { setActiveExercise(null); resetBreathing(); }}
          >
            ← Back
          </Button>

          <p className="text-sm text-muted-foreground mb-8">
            Cycle {breathCount + 1}
          </p>

          {/* Breathing Circle */}
          <div className="relative mb-8">
            <div
              className={`flex h-48 w-48 items-center justify-center rounded-full bg-primary/20 transition-all duration-[4000ms] ease-in-out ${
                breathPhase === "inhale" ? "scale-125" : breathPhase === "exhale" ? "scale-100" : "scale-125"
              }`}
            >
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/30">
                <div className="h-20 w-20 rounded-full bg-primary/50 flex items-center justify-center">
                  <Wind className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Phase Text */}
          <h2 className="font-display text-3xl font-bold mb-2 capitalize">
            {breathPhase}
          </h2>
          <p className="text-muted-foreground mb-8">
            {breathPhase === "inhale" && "Breathe in slowly through your nose"}
            {breathPhase === "hold" && "Hold your breath gently"}
            {breathPhase === "exhale" && "Release slowly through your mouth"}
          </p>

          {/* Controls */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={resetBreathing}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              variant="calm"
              size="lg"
              onClick={() => setIsBreathing(!isBreathing)}
            >
              {isBreathing ? (
                <>
                  <Pause className="h-5 w-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  {breathCount > 0 ? "Resume" : "Start"}
                </>
              )}
            </Button>
          </div>
        </div>
      ) : activeExercise === "grounding" ? (
        /* Grounding Exercise */
        <div className="flex flex-col min-h-[70vh] animate-fade-up">
          <Button
            variant="ghost"
            className="self-start mb-8"
            onClick={() => { setActiveExercise(null); setGroundingStep(0); }}
          >
            ← Back
          </Button>

          {groundingStep < groundingSteps.length ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className="text-6xl mb-6">{groundingSteps[groundingStep].icon}</span>
              <h2 className="font-display text-4xl font-bold mb-2">
                {groundingSteps[groundingStep].count}
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                {groundingSteps[groundingStep].sense}
              </p>
              <p className="text-sm text-muted-foreground mb-8 max-w-xs">
                Take your time to notice and name them in your mind
              </p>
              <Button
                variant="calm"
                onClick={() => setGroundingStep(groundingStep + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <span className="text-6xl mb-6">✨</span>
              <h2 className="font-display text-2xl font-bold mb-2">
                Well done!
              </h2>
              <p className="text-muted-foreground mb-8">
                You've grounded yourself in the present moment
              </p>
              <Button
                variant="calm"
                onClick={() => setGroundingStep(0)}
              >
                Do it again
              </Button>
            </div>
          )}

          {/* Progress dots */}
          <div className="flex justify-center gap-2 pb-8">
            {groundingSteps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i <= groundingStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Affirmations */
        <div className="flex flex-col min-h-[70vh] animate-fade-up">
          <Button
            variant="ghost"
            className="self-start mb-8"
            onClick={() => { setActiveExercise(null); setCurrentAffirmation(0); }}
          >
            ← Back
          </Button>

          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <Heart className="h-12 w-12 text-terracotta-300 mb-8 animate-pulse-soft" />
            <p className="font-display text-2xl font-bold leading-relaxed mb-8 text-foreground">
              "{affirmations[currentAffirmation]}"
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Take a deep breath and let this sink in
            </p>
            <Button
              variant="warm"
              onClick={() => setCurrentAffirmation((currentAffirmation + 1) % affirmations.length)}
            >
              Next affirmation <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Counter */}
          <p className="text-center text-sm text-muted-foreground pb-8">
            {currentAffirmation + 1} of {affirmations.length}
          </p>
        </div>
      )}
    </div>
  );
};

export default Calm;
