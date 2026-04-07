# Pending Tasks for Codex

## 1. Brand color pass — replace green with Glurk purple

The site uses `emerald-*` / `#10B981` as its primary accent color everywhere, but the Glurk logo and identity is purple (`#5B4FE8`). This makes the site look like two products glued together.

**The rule:** Replace all emerald/green accent usage with the Glurk purple palette.

### Color mapping
| Old (green) | New (purple) |
|---|---|
| `text-emerald-400` | `text-[#5B4FE8]` or `text-[#7B6FF8]` (lighter) |
| `bg-emerald-500` | `bg-[#5B4FE8]` |
| `bg-emerald-500/10` | `bg-[#5B4FE8]/10` |
| `border-emerald-500/20` | `border-[#5B4FE8]/20` |
| `hover:bg-emerald-400` | `hover:bg-[#6B5FF8]` |
| `stroke="#10B981"` | `stroke="#5B4FE8"` |
| `bg-emerald-400` dot/indicator | `bg-[#5B4FE8]` |

### Files to update
- `app/page.tsx` — hero h1 accent, "live" status badges, score ring stroke, CTA buttons, protocol layer cards, footer
- `app/consent/page.tsx` — Approve button, success checkmark, "Access Granted" ring, Glurk Score row
- `app/profile/page.tsx` — ScoreArc stroke color (`#10B981`), credential count badge, "live from devnet" label, CTA section, nav G lettermark
- `app/demo/lend/page.tsx` — already updated to purple ✅
- `app/demo/jobs/page.tsx` — Sign in button G icon, "Sign in with Glurk" button style

### What NOT to change
- Blue (`blue-*`) accents — those are intentional for the "contribution" side of the data exchange
- `text-white/X` opacity utility classes — leave those alone
- The `StaqLend` and `StaqJobs` demo app headers — those are separate apps, can keep their own colors

### Definition of done
- No `emerald` class names remain in any `app/` file
- No `#10B981` hex remains in any `app/` file
- The score ring in `profile/page.tsx` uses `#5B4FE8` stroke
- The Approve button in `consent/page.tsx` uses `bg-[#5B4FE8]`
- Build passes: `npm run build`
