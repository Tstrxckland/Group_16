import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Moderation outcomes:
 * 1) "allowed" - content has no active prohibited phrases and can be posted.
 * 2) "flagged" - non-crisis prohibited phrases are found; content should be blocked or censored.
 * 3) "blocked_with_resources" - crisis phrases are found; content is blocked and response includes
 *    supportive guidance plus crisis resources for immediate help.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ContentCategory = "profanity" | "sensitive" | "crisis";

interface ModerateRequestBody {
  content?: unknown;
}

interface ModerationResponse {
  clean: boolean;
  flagged: Array<{ category: ContentCategory; term: string }>;
  outcome: "allowed" | "flagged" | "blocked_with_resources";
  supportiveMessage?: string;
  resources?: Array<{ label: string; url: string }>;
}

interface ModerationPhraseRow {
  phrase: string;
  category: ContentCategory;
}

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

const getFlaggedTerms = (
  content: string,
  phrasesByCategory: Record<ContentCategory, string[]>
): Array<{ category: ContentCategory; term: string }> => {
  const flagged: Array<{ category: ContentCategory; term: string }> = [];
  const seen = new Set<string>();

  (Object.keys(phrasesByCategory) as ContentCategory[]).forEach((category) => {
    phrasesByCategory[category].forEach((term) => {
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

const CRISIS_SUPPORT_MESSAGE =
  "It sounds like you may be going through something really hard right now. " +
  "You matter, and immediate support is available.";

const CRISIS_RESOURCES = [
  { label: "Find a Helpline", url: "https://findahelpline.com" },
  { label: "988 Lifeline (US)", url: "https://988lifeline.org" },
  { label: "Emergency services", url: "https://www.google.com/search?q=local+emergency+number" },
];

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
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
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
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
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
  const { data: phraseRows, error: phraseError } = await supabaseAdmin
    .from("moderation_phrases")
    .select("phrase, category")
    .eq("is_active", true);

  if (phraseError) {
    console.error("[moderate-content] failed to load moderation phrases", phraseError);
    return new Response(JSON.stringify({ error: "Failed to load moderation config" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const phrasesByCategory: Record<ContentCategory, string[]> = {
    profanity: [],
    sensitive: [],
    crisis: [],
  };
  ((phraseRows as ModerationPhraseRow[] | null) ?? []).forEach((row) => {
    if (row.phrase && row.category in phrasesByCategory) {
      phrasesByCategory[row.category].push(row.phrase);
    }
  });

  const flagged = content ? getFlaggedTerms(content, phrasesByCategory) : [];
  const hasCrisis = flagged.some((f) => f.category === "crisis");
  const result: ModerationResponse = hasCrisis
    ? {
        clean: false,
        flagged,
        outcome: "blocked_with_resources",
        supportiveMessage: CRISIS_SUPPORT_MESSAGE,
        resources: CRISIS_RESOURCES,
      }
    : flagged.length > 0
      ? {
          clean: false,
          flagged,
          outcome: "flagged",
        }
      : {
          clean: true,
          flagged: [],
          outcome: "allowed",
        };

  if (hasCrisis) {
    console.error("[moderate-content][CRISIS_BLOCK]", {
      userId: user.id,
      outcome: result.outcome,
      flagged,
      contentLength: content.length,
    });
  } else if (flagged.length > 0) {
    console.warn("[moderate-content][FLAGGED]", {
      userId: user.id,
      outcome: result.outcome,
      flagged,
      contentLength: content.length,
    });
  } else {
    console.info("[moderate-content][ALLOWED]", {
      userId: user.id,
      outcome: result.outcome,
      contentLength: content.length,
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
