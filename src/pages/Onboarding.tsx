import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

const anxietyLevels = [
  { level: 1, label: "Mild", description: "Occasional nervousness in new situations" },
  { level: 2, label: "Moderate", description: "Regular discomfort in social settings" },
  { level: 3, label: "Significant", description: "Frequent avoidance of social situations" },
  { level: 4, label: "Severe", description: "Daily impact on work, school, or relationships" },
];

const goals = [
  { id: "confidence", label: "Build confidence", emoji: "💪" },
  { id: "friends", label: "Make new friends", emoji: "👥" },
  { id: "speaking", label: "Improve public speaking", emoji: "🎤" },
  { id: "work", label: "Feel comfortable at work", emoji: "💼" },
  { id: "dating", label: "Feel ready for dating", emoji: "💕" },
  { id: "events", label: "Attend social events", emoji: "🎉" },
];

const comfortPreferences = [
  { id: "anonymous", label: "Stay anonymous", description: "Keep your identity private" },
  { id: "slow", label: "Take it slow", description: "Gentle, gradual challenges" },
  { id: "community", label: "Join community", description: "Connect with others like you" },
  { id: "professional", label: "Access resources", description: "Mental health materials" },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [anxietyLevel, setAnxietyLevel] = useState<number | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const navigate = useNavigate();

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const togglePreference = (id: string) => {
    setPreferences(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      navigate("/auth");
    }
  };

  const canProceed = () => {
    if (step === 0) return anxietyLevel !== null;
    if (step === 1) return selectedGoals.length > 0;
    return preferences.length > 0;
  };

  return (
    <div className="flex min-h-screen flex-col gradient-hero px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {step > 0 ? (
            <Button variant="ghost" size="icon" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div />
          )}
          <span className="text-sm text-muted-foreground">
            Step {step + 1} of 3
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Anxiety Level */}
      {step === 0 && (
        <div className="flex-1 animate-fade-up">
          <h1 className="font-display text-2xl font-bold mb-2">
            How would you describe your social anxiety?
          </h1>
          <p className="text-muted-foreground mb-6">
            This helps us personalize your experience. There's no wrong answer.
          </p>

          <div className="space-y-3">
            {anxietyLevels.map((item) => (
              <Card
                key={item.level}
                className={`cursor-pointer transition-all duration-300 ${
                  anxietyLevel === item.level
                    ? "border-primary bg-primary/5 shadow-card"
                    : "hover:border-primary/30"
                }`}
                onClick={() => setAnxietyLevel(item.level)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      anxietyLevel === item.level
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {anxietyLevel === item.level ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      item.level
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Goals */}
      {step === 1 && (
        <div className="flex-1 animate-fade-up">
          <h1 className="font-display text-2xl font-bold mb-2">
            What are your goals?
          </h1>
          <p className="text-muted-foreground mb-6">
            Select all that apply. We'll help you work towards these.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {goals.map((goal) => (
              <Card
                key={goal.id}
                className={`cursor-pointer transition-all duration-300 ${
                  selectedGoals.includes(goal.id)
                    ? "border-primary bg-primary/5 shadow-card"
                    : "hover:border-primary/30"
                }`}
                onClick={() => toggleGoal(goal.id)}
              >
                <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                  <span className="text-2xl">{goal.emoji}</span>
                  <p className="text-sm font-medium">{goal.label}</p>
                  {selectedGoals.includes(goal.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Preferences */}
      {step === 2 && (
        <div className="flex-1 animate-fade-up">
          <h1 className="font-display text-2xl font-bold mb-2">
            What would help you feel comfortable?
          </h1>
          <p className="text-muted-foreground mb-6">
            Choose what matters most to you. You can change these anytime.
          </p>

          <div className="space-y-3">
            {comfortPreferences.map((pref) => (
              <Card
                key={pref.id}
                className={`cursor-pointer transition-all duration-300 ${
                  preferences.includes(pref.id)
                    ? "border-primary bg-primary/5 shadow-card"
                    : "hover:border-primary/30"
                }`}
                onClick={() => togglePreference(pref.id)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{pref.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {pref.description}
                    </p>
                  </div>
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                      preferences.includes(pref.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted"
                    }`}
                  >
                    {preferences.includes(pref.id) && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Continue button */}
      <div className="mt-8">
        <Button
          variant="hero"
          className="w-full"
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {step === 2 ? "Start My Journey" : "Continue"}
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
