import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ContentCategory = "profanity" | "crisis" | "slurs";

interface ModerateRequestBody {
  content?: unknown;
}

interface ModerationResponse {
  clean: boolean;
  flagged: Array<{ category: ContentCategory; term: string }>;
}

const SENSITIVE_WORDS: Readonly<Record<ContentCategory, readonly string[]>> = {
  profanity: [
    "fuck",
    "fucking",
    "fucked",
    "fucks",
    "shit",
    "shits",
    "shitting",
    "damn",
    "damned",
    "damnit",
    "ass",
    "asshole",
    "asses",
    "bitch",
    "bitches",
    "bastard",
    "bastards",
    "crap",
    "crappy",
    "hell",
    "piss",
    "pissed",
  ],
  crisis: [
    "kill myself",
    "kill me",
    "end my life",
    "end it all",
    "want to die",
    "wanna die",
    "suicide",
    "suicidal",
    "self harm",
    "self-harm",
    "cut myself",
    "hurt myself",
  ],
  slurs: ["retard", "retarded", "faggot", "fag", "nigger", "nigga"],
} as const;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

const escapeRegExp = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createPattern = (word: string): RegExp => {
  const escaped = escapeRegExp(word);
  const pattern =
    word.includes(" ") || word.includes("-")
      ? escaped.replace(/-/g, "[-\\s]?")
      : `\\b${escaped}\\b`;
  return new RegExp(pattern, "gi");
};

const RATE_BUCKETS_KEY = "__moderation_rate_buckets__";
type RateBuckets = Map<string, number[]>;

const getRateBuckets = (): RateBuckets => {
  const scoped = globalThis as typeof globalThis & { [RATE_BUCKETS_KEY]?: RateBuckets };
  if (!scoped[RATE_BUCKETS_KEY]) {
    scoped[RATE_BUCKETS_KEY] = new Map<string, number[]>();
  }
  return scoped[RATE_BUCKETS_KEY]!;
};

const enforceRateLimit = (actorKey: string): boolean => {
  const now = Date.now();
  const buckets = getRateBuckets();
  const existing = buckets.get(actorKey) ?? [];
  const recent = existing.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    buckets.set(actorKey, recent);
    return false;
  }
  recent.push(now);
  buckets.set(actorKey, recent);
  return true;
};

const getFlaggedTerms = (content: string): Array<{ category: ContentCategory; term: string }> => {
  const flagged: Array<{ category: ContentCategory; term: string }> = [];
  const seen = new Set<string>();

  (Object.keys(SENSITIVE_WORDS) as ContentCategory[]).forEach((category) => {
    SENSITIVE_WORDS[category].forEach((term) => {
      if (createPattern(term).test(content)) {
        const key = `${category}:${term.toLowerCase()}`;
        if (!seen.has(key)) {
          flagged.push({ category, term });
          seen.add(key);
        }
      }
    });
  });

  return flagged;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    console.error("[moderate-content] missing env vars");
    return new Response(JSON.stringify({ error: "Service misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  const accessToken = authHeader?.replace("Bearer ", "");
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Missing access token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUserClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: userError,
  } = await supabaseUserClient.auth.getUser();
  if (userError || !user) {
    console.error("[moderate-content] auth error", userError);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!enforceRateLimit(user.id)) {
    console.warn("[moderate-content] rate-limit exceeded", { userId: user.id });
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: ModerateRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const raw = typeof body.content === "string" ? body.content : "";
  const content = raw.trim();
  const flagged = content ? getFlaggedTerms(content) : [];
  const result: ModerationResponse = {
    clean: flagged.length === 0,
    flagged,
  };

  console.info("[moderate-content] decision", {
    userId: user.id,
    clean: result.clean,
    flaggedCount: flagged.length,
    flagged,
    contentLength: content.length,
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
