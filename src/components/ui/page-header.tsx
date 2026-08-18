import type { LucideIcon } from "lucide-react";

type Props = {
  badge: string;
  badgeIcon?: LucideIcon;
  title: string;
  description: string;
  accent?: "default" | "email" | "whatsapp" | "templates";
  status?: React.ReactNode;
  action?: React.ReactNode;
};

const accents = {
  default: "from-card via-card to-primary/5",
  email: "from-card via-card to-blue-500/5",
  whatsapp: "from-card via-card to-emerald-500/10 dark:to-emerald-950/20",
  templates: "from-card via-card to-violet-500/5 dark:to-violet-950/20",
};

export function PageHeader({
  badge,
  badgeIcon: BadgeIcon,
  title,
  description,
  accent = "default",
  status,
  action,
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-border bg-gradient-to-br ${accents[accent]} p-6 shadow-sm md:p-8`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {BadgeIcon && <BadgeIcon className="h-3.5 w-3.5" />}
            {badge}
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        {action || status}
      </div>
    </div>
  );
}
