import { useState } from "react";
import { Flag, HeartHandshake, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReportReason =
  | "inappropriate-language"
  | "harassment"
  | "spam"
  | "crisis-content"
  | "other";

interface PostReportFlowProps {
  postId: string;
  postAuthor?: string;
  onSubmitReport?: (payload: {
    postId: string;
    reason: ReportReason;
    details?: string;
  }) => Promise<void> | void;
}

const REPORT_REASONS: Array<{
  value: ReportReason;
  label: string;
  helper: string;
}> = [
  {
    value: "inappropriate-language",
    label: "Inappropriate language",
    helper: "Content feels hurtful or not supportive for this space.",
  },
  {
    value: "harassment",
    label: "Harassment or targeting",
    helper: "A person or group appears to be singled out unfairly.",
  },
  {
    value: "spam",
    label: "Spam or repetitive posting",
    helper: "Looks promotional or repeated in a way that disrupts discussion.",
  },
  {
    value: "crisis-content",
    label: "Possible crisis content",
    helper: "May need extra care or urgent support resources.",
  },
  {
    value: "other",
    label: "Something else feels off",
    helper: "Share context in your own words so moderators can review kindly.",
  },
];

/**
 * Standalone UI for post reporting.
 * - Subtle trigger for low-pressure access.
 * - Gentle reason selection and optional context.
 * - Reassuring confirmation state after submit.
 */
export function PostReportFlow({
  postId,
  postAuthor,
  onSubmitReport,
}: PostReportFlowProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setReason("");
    setDetails("");
    setSubmitting(false);
    setSubmitted(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
    }
  };

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await onSubmitReport?.({
        postId,
        reason,
        details: details.trim() || undefined,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Report post"
        >
          <Flag className="h-4 w-4" />
          <span className="hidden sm:inline">Report</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-2xl border-border/70 p-0 overflow-hidden">
        {!submitted ? (
          <>
            <div className="bg-muted/40 p-6 border-b border-border/60">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <HeartHandshake className="h-5 w-5 text-primary" />
                  Help us keep this space supportive
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed">
                  Thanks for looking out for the community. Reports are reviewed with care.
                  {postAuthor ? ` You are reporting a post by ${postAuthor}.` : ""}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  What feels concerning?
                </p>
                <RadioGroup
                  value={reason}
                  onValueChange={(value) => setReason(value as ReportReason)}
                  className="space-y-2"
                >
                  {REPORT_REASONS.map((item) => (
                    <Label
                      key={item.value}
                      htmlFor={`reason-${item.value}`}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-background p-3 transition-colors hover:bg-muted/40"
                    >
                      <RadioGroupItem
                        id={`reason-${item.value}`}
                        value={item.value}
                        className="mt-0.5"
                      />
                      <span className="space-y-1">
                        <span className="block text-sm font-medium text-foreground">
                          {item.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {item.helper}
                        </span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-details" className="text-sm font-medium">
                  Optional details
                </Label>
                <Textarea
                  id="report-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Share anything that might help the moderator review this gently and fairly."
                  className="min-h-[90px] rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  You do not need to explain everything. A short note is enough.
                </p>
              </div>
            </div>

            <DialogFooter className="border-t border-border/60 bg-muted/30 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="calm"
                onClick={handleSubmit}
                disabled={!reason || submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit report"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="p-6 sm:p-7 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Thank you for speaking up
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your report was sent successfully. Our team will review it thoughtfully to
                help keep SafeSpace respectful and supportive.
              </p>
            </div>
            <Button type="button" variant="calm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PostReportFlow;
