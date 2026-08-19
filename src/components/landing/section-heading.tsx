import { cn } from "@/lib/utils";

interface SectionHeadingProps extends Omit<React.ComponentProps<"div">, "title"> {
  kicker: string;
  title: React.ReactNode;
  description?: string;
}

/** Editorial section header: rule + mono kicker, oversized title, lede. */
export function SectionHeading({
  kicker,
  title,
  description,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-foreground/30" aria-hidden />
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.25em] text-muted-foreground">
          {kicker}
        </span>
      </div>
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-xl text-sm/relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
