export interface LintViolation {
  ruleId: string;
  message: string;
  severity: "error" | "warning";
  location?: string;
}

export interface LintResult {
  pass: boolean;
  violations: LintViolation[];
}

export interface LintContext {
  kind: "post" | "dm" | "email" | "comment" | "article";
  channelType: "linkedin" | "facebook" | "reddit" | "x" | "email" | "blog";
  title?: string;
  hook?: string;
  body?: string;
  cta?: string;
  status?: string;
}

const ALL_TEXT = (ctx: LintContext): string =>
  [ctx.title, ctx.hook, ctx.body, ctx.cta].filter(Boolean).join("\n").toLowerCase();

const RULES: {
  id: string;
  check: (ctx: LintContext) => LintViolation | null;
}[] = [
  {
    id: "greeting-no-dear",
    check: (ctx) => {
      const text = ALL_TEXT(ctx);
      if (/\bdear\b/i.test(text) && ctx.channelType === "email") {
        return {
          ruleId: "greeting-no-dear",
          message: 'Emails must start with "Hi [Name]," never "Dear".',
          severity: "error",
          location: "body",
        };
      }
      return null;
    },
  },
  {
    id: "no-guarantee",
    check: (ctx) => {
      const text = ALL_TEXT(ctx);
      const prohibited = [
        /guarantee\s+(a|your|the)\s*job/i,
        /guaranteed\s+(placement|job|sponsorship|H-?1B|green\s*card|salary|visa)/i,
        /we\s+guarantee/i,
        /we\s+promise/i,
        /guaranteed\s+to\s+(get|land|secure|find)/i,
      ];
      for (const pattern of prohibited) {
        if (pattern.test(text)) {
          return {
            ruleId: "no-guarantee",
            message:
              "Never guarantee a job, placement timing, salary, sponsorship, H-1B, green card, or any immigration outcome.",
            severity: "error",
          };
        }
      }
      return null;
    },
  },
  {
    id: "no-free-language",
    check: (ctx) => {
      const text = ALL_TEXT(ctx);
      if (/\b(completely\s*)?(free|no\s*cost|no\s*charge|without\s*cost)\b/i.test(text)) {
        return {
          ruleId: "no-free-language",
          message:
            'Never say "free" or "no cost". Use the approved language: "There is no upfront fee. We only charge you if you successfully land a role through Skarion\'s support."',
          severity: "error",
        };
      }
      return null;
    },
  },
  {
    id: "no-exact-fee",
    check: (ctx) => {
      const text = ALL_TEXT(ctx);
      if (
        /\$\d[\d,]*\s*(fee|charge|cost|pay|price)/i.test(text) ||
        /(fee|charge|cost)\s*(of|is|:)\s*\$?\d/i.test(text)
      ) {
        return {
          ruleId: "no-exact-fee",
          message:
            "Never quote an exact fee amount. Use approved fee language only.",
          severity: "error",
        };
      }
      return null;
    },
  },
  {
    id: "no-sponsorship-promise",
    check: (ctx) => {
      const text = ALL_TEXT(ctx);
      const prohibited = [
        /we\s+(will|can|help\s+you\s+get)\s+(H-?1B|sponsorship|green\s*card|visa)/i,
        /sponsorship\s+is\s+(guaranteed|assured|certain|easy)/i,
        /(H-?1B|green\s*card)\s+is\s+(guaranteed|assured|easy|simple)/i,
      ];
      for (const pattern of prohibited) {
        if (pattern.test(text)) {
          return {
            ruleId: "no-sponsorship-promise",
            message:
              "Skarion is not an immigration law firm. Never promise or guarantee visa/immigration outcomes.",
            severity: "error",
          };
        }
      }
      return null;
    },
  },
  {
    id: "no-skarion-engineering-bleed",
    check: (ctx) => {
      const text = ALL_TEXT(ctx);
      if (/\bskarion\s+engineering\b/i.test(text)) {
        return {
          ruleId: "no-skarion-engineering-bleed",
          message:
            "Never mix 'Skarion Engineering' (separate B2B business) into candidate-facing content.",
          severity: "error",
        };
      }
      return null;
    },
  },
  {
    id: "no-invented-stats",
    check: (ctx) => {
      const text = ALL_TEXT(ctx);
      const patterns = [
        /(placed|helped|assisted)\s+\d+[\d,]*\s+(students|candidates|graduates)/i,
        /\d+[\d,]*\s+(students|candidates|graduates)\s+(placed|hired)/i,
        /(success\s*rate|placement\s*rate)\s*(of|is|:)/i,
        /(we\s+have|we've)\s+(placed|helped|secured)/i,
      ];
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return {
            ruleId: "no-invented-stats",
            message:
              "Never invent placement statistics, success stories, or employer relationships.",
            severity: "error",
          };
        }
      }
      return null;
    },
  },
  {
    id: "no-premature-booking-link",
    check: (ctx) => {
      const text = ALL_TEXT(ctx);
      if (/skarion\.com\/book/i.test(text)) {
        return {
          ruleId: "no-premature-booking-link",
          message:
            "Never include the booking link before the recipient has shown interest.",
          severity: "error",
          location: "body",
        };
      }
      return null;
    },
  },
  {
    id: "no-bootcamp-label",
    check: (ctx) => {
      const text = ALL_TEXT(ctx);
      if (
        /\b(just\s+a\s+bootcamp|merely\s+a\s+bootcamp|only\s+a\s+bootcamp|bootcamp\s+service|resume\s+service|profile[\s-]marketing\s+service|just\s+a\s+recruiter)\b/i.test(
          text
        )
      ) {
        return {
          ruleId: "no-bootcamp-label",
          message:
            "Never describe Skarion as only a bootcamp, resume service, profile-marketing service, or recruiter.",
          severity: "error",
        };
      }
      return null;
    },
  },
  {
    id: "linkedin-no-aggressive-pitch",
    check: (ctx) => {
      if (ctx.channelType !== "linkedin" && ctx.kind !== "dm") return null;
      const text = ALL_TEXT(ctx);
      const aggressive = [
        /we\s+can\s+get\s+you\s+a\s+job/i,
        /hurry|act\s+now|limited\s+time|don't\s+miss\s+out/i,
        /we\s+are\s+looking\s+for/i,
        /urgent\s+(hiring|opening)/i,
      ];
      for (const pattern of aggressive) {
        if (pattern.test(text)) {
          return {
            ruleId: "linkedin-no-aggressive-pitch",
            message:
              "LinkedIn messages: no aggressive pitching. Don't pretend to recruit for a specific opening.",
            severity: "error",
          };
        }
      }
      return null;
    },
  },
  {
    id: "reddit-no-repetition",
    check: (ctx) => {
      if (ctx.channelType !== "reddit") return null;
      const text = ALL_TEXT(ctx);
      if (/\bdm\s+me\b/i.test(text) && /\bdm\s+me\b.*\bdm\s+me\b/i.test(text)) {
        return {
          ruleId: "reddit-no-repetition",
          message:
            'Reddit: avoid repeating "DM me". Be helpful first, disclose Skarion transparently.',
          severity: "warning",
        };
      }
      return null;
    },
  },
  {
    id: "facebook-group-respect",
    check: (ctx) => {
      if (ctx.channelType !== "facebook") return null;
      const text = ALL_TEXT(ctx);
      if (/\b(we\s+are\s+hiring|job\s+opening|live\s+position)\b/i.test(text)) {
        return {
          ruleId: "facebook-group-respect",
          message:
            "Facebook: never imply a live job opening. Be useful before promotional.",
          severity: "error",
        };
      }
      return null;
    },
  },
  {
    id: "email-greeting-required",
    check: (ctx) => {
      if (ctx.channelType !== "email" && ctx.kind !== "email") return null;
      const text = ALL_TEXT(ctx);
      if (!/\bhi\s+\w+/i.test(text)) {
        return {
          ruleId: "email-greeting-required",
          message: 'Emails must start with "Hi [Name]," format.',
          severity: "warning",
        };
      }
      return null;
    },
  },
];

export function lintContent(ctx: LintContext): LintResult {
  const violations: LintViolation[] = [];

  for (const rule of RULES) {
    const violation = rule.check(ctx);
    if (violation) {
      violations.push(violation);
    }
  }

  const pass = violations.every((v) => v.severity !== "error");

  return { pass, violations };
}
