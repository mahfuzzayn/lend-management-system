"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_CREDENTIAL } from "@/lib/config";
import { fadeUp, staggerItem, staggerParent } from "@/lib/motion";
import { isMockAuthenticated, mockLogin } from "@/lib/auth-mock";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Already signed in? Straight to the dashboard.
  useEffect(() => {
    if (isMockAuthenticated()) router.replace("/dashboard/overview");
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: FieldErrors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid e-mail address.";
    if (!password) next.password = "Enter your password.";
    if (next.email || next.password) {
      setErrors(next);
      return;
    }
    setErrors({});

    setPending(true);
    const result = await mockLogin(email, password);
    setPending(false);

    if (!result.ok) {
      toast.error("Incorrect e-mail or password.", {
        description: "Hint - use the demo credentials shown below the form.",
      });
      return;
    }

    toast.success("Signed in", { description: "Welcome back to your ledger." });
    router.push(from && from.startsWith("/") ? from : "/dashboard/overview");
  }

  function fillDemo() {
    setEmail(DEMO_CREDENTIAL.email);
    setPassword(DEMO_CREDENTIAL.password);
    setErrors({});
  }

  return (
    <motion.div
      variants={staggerParent}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      <motion.form
        variants={staggerItem}
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="login-email">E-mail</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="admin@lendbook.morlabs.co"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && (
            <p className="text-[0.625rem] text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} strokeWidth={2} className="size-3" />
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && (
            <p className="text-[0.625rem] text-destructive">{errors.password}</p>
          )}
        </div>

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </motion.form>

      <motion.div variants={fadeUp} className="border bg-muted/40 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted-foreground">
              Demo credentials (v1)
            </p>
            <p className="font-mono text-xs">{DEMO_CREDENTIAL.email}</p>
            <p className="font-mono text-xs">{DEMO_CREDENTIAL.password}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={fillDemo}>
            Fill
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
