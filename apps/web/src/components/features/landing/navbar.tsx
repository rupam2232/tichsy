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
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Link from "next/link";

export default function NavbarComp() {
  const authenticated = useSelector((state: RootState) => state.auth.status);
  const navItems = [
    {
      name: "Features",
      link: "#features",
    },
    {
      name: "Pricing",
      link: "#pricing",
    },
    {
      name: "Contact",
      link: "#contact",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
              variant="primary"
              className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 font-medium hover:translate-none"
            >
              Open App
            </NavbarButton>
          ) : (
            <>
              <NavbarButton
                href="/signin"
                as={Link}
                variant="secondary"
                className="shadow-xs hover:bg-primary-foreground/10 font-medium hover:translate-none"
              >
                Sign in
              </NavbarButton>
              <NavbarButton
                href="/signup"
                as={Link}
                variant="primary"
                className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 font-medium hover:translate-none"
              >
                Get Started free
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
              className="relative text-neutral-600 dark:text-neutral-300"
            >
              <span className="block">{item.name}</span>
            </Link>
          ))}
          <div className="flex w-full gap-4">
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
                  Get Started free
                </NavbarButton>
              </>
            )}
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
