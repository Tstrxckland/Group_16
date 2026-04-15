type ErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function asErrorLike(error: unknown): ErrorLike {
  if (!error || typeof error !== "object") return {};
  return error as ErrorLike;
}

export function messageFromSupabaseError(error: unknown): string {
  const e = asErrorLike(error);

  // Undefined table relation (common when migrations are not applied yet).
  if (e.code === "42P01") {
    return "Community comments are not set up yet on this database. Run your latest Supabase migrations and try again.";
  }

  // RLS policy denied.
  if (e.code === "42501") {
    return "You do not have permission for this action.";
  }

  if (typeof e.message === "string" && e.message.trim()) {
    return e.message;
  }

  return "Please try again in a moment.";
}

