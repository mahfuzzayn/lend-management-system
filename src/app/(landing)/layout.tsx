import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
