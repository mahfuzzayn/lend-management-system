"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClientError, api, errorMessage } from "@/lib/api-client";
import { staggerItem, staggerParent } from "@/lib/motion";

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: FieldErrors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid e-mail address.";
    if (password.length < 8) next.password = "Password needs at least 8 characters.";
    if (next.email || next.password) {
      setErrors(next);
      return;
    }
    setErrors({});

    setPending(true);
    try {
      const { admin } = await api.login(email.trim(), password);
      toast.success("Signed in", { description: `Welcome back, ${admin.name}.` });
      router.push(from && from.startsWith("/") ? from : "/dashboard/overview");
    } catch (error) {
      const description =
        error instanceof ApiClientError ? error.message : errorMessage(error);
      toast.error(
        error instanceof ApiClientError && error.status === 429
          ? "Too many attempts."
          : "Incorrect e-mail or password.",
        { description }
      );
    } finally {
      setPending(false);
    }
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
              className="flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
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
    </motion.div>
  );
}
