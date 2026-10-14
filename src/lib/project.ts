/**
 * The business this deployment belongs to (works.md F27).
 *
 * Clone recipe for a new owner - the whole rebrand is three steps:
 *   1. edit this file (brand + contact),
 *   2. drop their logo at the path in `brand.logo.src` (public/),
 *   3. set the brand trio in `src/app/globals.css` (`--brand-*`).
 * Nothing else in the app hardcodes the company's identity - the name,
 * tagline, logo, and contact channels all render from here.
 */
export const PROJECT = {
  brand: {
    name: "Lendbook",
    tagline: "Lend clearly. Collect confidently.",
    description:
      "A minimal lend management system - track customers, lend transactions, repayments and outstanding dues in one calm dashboard.",
    logo: {
      src: "/images/logo.png",
      alt: "Lendbook logo",
      /** Shown in the gradient block when the logo image is missing. */
      fallbackText: "L",
    },
  },
  contact: {
    /** Shown on /contact and used by the mailto: links there. */
    email: "support@lendbook.morlabs.co",
    /** Support promise shown beside the e-mail. */
    responseTime: "Within one working day",
    /** Where the business operates from. */
    location: "Sylhet, Bangladesh",
  },
} as const;

export type ProjectBrand = (typeof PROJECT)["brand"];
export type ProjectContact = (typeof PROJECT)["contact"];
