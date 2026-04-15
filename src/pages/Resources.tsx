import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDiscreetMode } from "@/hooks/useDiscreetMode";
import {
  Search,
  ExternalLink,
  Heart,
  Phone,
  BookOpen,
  Users,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";

type Category = "all" | "crisis" | "anxiety" | "therapy" | "self-help" | "community";

interface Resource {
  title: string;
  discreetTitle: string;
  description: string;
  discreetDescription: string;
  category: Category;
  url: string;
  icon: typeof Heart;
}

const CATEGORY_LABELS: Record<Category, { label: string; discreetLabel: string }> = {
  all: { label: "All Resources", discreetLabel: "All" },
  crisis: { label: "Crisis Support", discreetLabel: "Support Lines" },
  anxiety: { label: "Anxiety & Stress", discreetLabel: "Wellness" },
  therapy: { label: "Therapy & Professional", discreetLabel: "Professional Help" },
  "self-help": { label: "Self-Help Tools", discreetLabel: "Personal Tools" },
  community: { label: "Community Support", discreetLabel: "Group Support" },
};

const RESOURCES: Resource[] = [
  {
    title: "Crisis Text Line",
    discreetTitle: "24/7 Text Support",
    description: "Free, 24/7 crisis support via text message. Text HOME to 741741.",
    discreetDescription: "Free, 24/7 support via text message.",
    category: "crisis",
    url: "https://www.crisistextline.org",
    icon: Phone,
  },
  {
    title: "Find a Helpline",
    discreetTitle: "Find a Support Line",
    description: "Directory of mental health helplines worldwide.",
    discreetDescription: "Directory of support lines worldwide.",
    category: "crisis",
    url: "https://findahelpline.com",
    icon: Phone,
  },
  {
    title: "988 Suicide & Crisis Lifeline",
    discreetTitle: "988 Support Lifeline",
    description: "Call or text 988 for immediate emotional support, 24/7.",
    discreetDescription: "Call or text 988 for immediate support, 24/7.",
    category: "crisis",
    url: "https://988lifeline.org",
    icon: Phone,
  },
  {
    title: "Centre for Clinical Interventions — Anxiety",
    discreetTitle: "Wellness Self-Help Modules",
    description: "Free evidence-based workbooks for understanding and managing anxiety.",
    discreetDescription: "Free evidence-based workbooks for personal wellness.",
    category: "anxiety",
    url: "https://www.cci.health.wa.gov.au/Resources/Looking-after-yourself/anxiety",
    icon: BookOpen,
  },
  {
    title: "Anxiety & Depression Association of America",
    discreetTitle: "Wellness Education Association",
    description: "Articles, tips, and resources on anxiety disorders and treatment options.",
    discreetDescription: "Articles, tips, and resources on wellness and self-care.",
    category: "anxiety",
    url: "https://adaa.org",
    icon: BookOpen,
  },
  {
    title: "BetterHelp",
    discreetTitle: "Online Professional Sessions",
    description: "Affordable online therapy with licensed therapists.",
    discreetDescription: "Affordable online sessions with licensed professionals.",
    category: "therapy",
    url: "https://www.betterhelp.com",
    icon: ShieldCheck,
  },
  {
    title: "Psychology Today — Find a Therapist",
    discreetTitle: "Find a Professional",
    description: "Search therapists, psychiatrists, and counsellors near you.",
    discreetDescription: "Search professionals and counsellors near you.",
    category: "therapy",
    url: "https://www.psychologytoday.com/us/therapists",
    icon: ShieldCheck,
  },
  {
    title: "Headspace",
    discreetTitle: "Guided Relaxation App",
    description: "Meditation and mindfulness exercises for stress and anxiety relief.",
    discreetDescription: "Guided exercises for relaxation and focus.",
    category: "self-help",
    url: "https://www.headspace.com",
    icon: Lightbulb,
  },
  {
    title: "Calm",
    discreetTitle: "Relaxation & Sleep App",
    description: "Sleep stories, breathing exercises, and calming music.",
    discreetDescription: "Sleep stories, breathing exercises, and calming music.",
    category: "self-help",
    url: "https://www.calm.com",
    icon: Lightbulb,
  },
  {
    title: "7 Cups",
    discreetTitle: "Peer Support Community",
    description: "Free emotional support from trained volunteer listeners and community forums.",
    discreetDescription: "Free support from trained volunteers and community forums.",
    category: "community",
    url: "https://www.7cups.com",
    icon: Users,
  },
  {
    title: "NAMI Support Groups",
    discreetTitle: "Peer Group Meetings",
    description: "Free peer-led support groups for individuals and families.",
    discreetDescription: "Free peer-led group meetings for individuals and families.",
    category: "community",
    url: "https://www.nami.org/Support-Education/Support-Groups",
    icon: Users,
  },
];

const Resources = () => {
  const { discreetMode } = useDiscreetMode();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return RESOURCES.filter((r) => {
      if (activeCategory !== "all" && r.category !== activeCategory) return false;
      if (!q) return true;
      const title = discreetMode ? r.discreetTitle : r.title;
      const desc = discreetMode ? r.discreetDescription : r.description;
      return title.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    });
  }, [search, activeCategory, discreetMode]);

  const pageTitle = discreetMode ? "Wellness Resources" : "Resources Portal";

  return (
    <div className="gradient-hero min-h-screen px-6 py-8 pb-24">
      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold">{pageTitle}</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {discreetMode
            ? "Helpful tools and information for your journey."
            : "Mental health resources, support lines, and self-help tools."}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5 animate-fade-up animation-delay-100">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search resources…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Tabs */}
      <div className="mb-6 animate-fade-up animation-delay-200 overflow-x-auto">
        <Tabs
          value={activeCategory}
          onValueChange={(v) => setActiveCategory(v as Category)}
        >
          <TabsList className="w-max gap-1">
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-xs whitespace-nowrap">
                {discreetMode
                  ? CATEGORY_LABELS[cat].discreetLabel
                  : CATEGORY_LABELS[cat].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Resource Cards */}
      <div className="space-y-4 animate-fade-up animation-delay-300">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No resources match your search.
          </p>
        )}
        {filtered.map((resource) => {
          const Icon = resource.icon;
          const title = discreetMode ? resource.discreetTitle : resource.title;
          const desc = discreetMode
            ? resource.discreetDescription
            : resource.description;
          const catLabel = discreetMode
            ? CATEGORY_LABELS[resource.category].discreetLabel
            : CATEGORY_LABELS[resource.category].label;

          return (
            <Card key={resource.url} className="group">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold leading-tight">{title}</h3>
                      <Badge variant="secondary" className="text-[10px] px-2 py-0">
                        {catLabel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{desc}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() =>
                        window.open(resource.url, "_blank", "noopener,noreferrer")
                      }
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Visit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Resources;
