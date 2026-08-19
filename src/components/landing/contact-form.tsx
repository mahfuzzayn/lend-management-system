"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!name || !email || !message) {
      toast.error("Please fill in every field.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      toast.error("That e-mail address doesn't look right.");
      return;
    }

    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 700)); // mock submit
    setPending(false);
    form.reset();
    toast.success("Message sent", {
      description: "We'll get back to you within one working day.",
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="name" placeholder="Your name" autoComplete="name" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-email">E-mail</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          name="message"
          placeholder="What's on your mind?"
          rows={5}
        />
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
        {!pending && <HugeiconsIcon icon={SentIcon} strokeWidth={2} data-icon="inline-end" />}
      </Button>
      <p className="text-[0.625rem] text-muted-foreground">
        Demo form in v1 - messages aren&apos;t delivered yet.
      </p>
    </form>
  );
}
