import type { ModerationResult } from "@/services/moderationService";

export type ToastArgs = {
  title: string;
  description?: string;
  variant?: string;
  duration?: number;
};

export function extractFlaggedCategories(moderation: Pick<ModerationResult, "flagged">): string[] {
  const categories = (moderation.flagged ?? []).map((f) => f.category);
  return Array.from(new Set(categories));
}

export function buildReplyBlockedToast(categories: string[]): ToastArgs {
  return {
    title: "Reply blocked by moderation",
    description: `Please revise your reply. Flagged categories: ${categories.join(", ")}.`,
    variant: "destructive",
  };
}

export async function submitReplyWithModeration<T>({
  content,
  moderateContentFn,
  toastFn,
  onAllowed,
}: {
  content: string;
  moderateContentFn: (text: string) => Promise<ModerationResult>;
  toastFn: (args: ToastArgs) => void;
  onAllowed: () => Promise<T>;
}): Promise<{ blocked: boolean; result?: T }> {
  const moderation = await moderateContentFn(content);

  if (!moderation.clean) {
    const categories = extractFlaggedCategories(moderation);
    toastFn(buildReplyBlockedToast(categories));
    return { blocked: true };
  }

  const result = await onAllowed();
  return { blocked: false, result };
}

