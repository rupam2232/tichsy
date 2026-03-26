"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Link from "next/link";
import { Kbd } from "@repo/ui/components/kbd";
import { Button } from "@repo/ui/components/button";
import { useRouter } from "next/navigation";

export default function NavbarComp() {
  const authenticated = useSelector((state: RootState) => state.auth.status);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const navItems = [
    {
      name: "Features",
      link: "/#features",
    },
    {
      name: "Pricing",
      link: "/pricing",
    },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        router.push("/home");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [router]);

  return (
    <Navbar className="fixed top-5">
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />
        <div className="flex items-center gap-4">
          {authenticated ? (
            <NavbarButton
              href="/home"
              as={Link}
              className="p-0 rounded-md bg-transparent hover:translate-none"
            >
              <Button>
                Open App{" "}
                <Kbd
                  data-icon="inline-end"
                  className="bg-black text-white translate-x-1"
                >
                  ⏎
                </Kbd>
              </Button>
            </NavbarButton>
          ) : (
            <>
              <NavbarButton
                href="/signin"
                as={Link}
                variant="secondary"
                className="shadow-xs hover:bg-primary-foreground/10 font-medium hover:translate-none"
              >
                Sign In
              </NavbarButton>
              <NavbarButton
                href="/signup"
                as={Link}
                variant="primary"
                className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 font-medium hover:translate-none"
              >
                Try for Free
              </NavbarButton>
            </>
          )}
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <MobileNavToggle
            className="cursor-pointer"
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => (
            <Link
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className="relative text-neutral-600 dark:text-neutral-300 w-full"
            >
              <span className="block">{item.name}</span>
            </Link>
          ))}
          <div className="flex flex-col sm:flex-row w-full gap-x-4 gap-y-2">
            {authenticated ? (
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                href="/home"
                as={Link}
                variant="primary"
                className="w-full bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 font-medium hover:translate-none"
              >
                Open App
              </NavbarButton>
            ) : (
              <>
                <NavbarButton
                  onClick={() => setIsMobileMenuOpen(false)}
                  href="/signin"
                  as={Link}
                  variant="secondary"
                  className="w-full text-primary-foreground shadow-xs bg-secondary/60 hover:bg-muted font-medium hover:translate-none flex justify-center items-center"
                >
                  Sign in
                </NavbarButton>
                <NavbarButton
                  onClick={() => setIsMobileMenuOpen(false)}
                  href="/signup"
                  as={Link}
                  variant="primary"
                  className="w-full bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 font-medium hover:translate-none"
                >
                  Try for Free
                </NavbarButton>
              </>
            )}
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
