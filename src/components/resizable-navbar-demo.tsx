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
import { HeaderSearchTrigger, HeaderSearchOverlay } from "@/components/HeaderSearch";
import { useState } from "react";

export default function NavbarDemo() {
  const navItems = [
    {
      name: "Alla evenemang",
      link: "/",
    },
    {
      name: "Om oss",
      link: "/om-oss",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            <HeaderSearchTrigger showLabel onClick={() => setIsSearchOpen(true)} />
            <NavbarButton variant="primary" href="/tips">Tipsa oss om evenemang</NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <div className="flex items-center gap-3">
              <HeaderSearchTrigger onClick={() => setIsSearchOpen(true)} />
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300 text-lg font-medium hover:text-[#10214B] transition-colors"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4 mt-4">
              <NavbarButton
                href="/tips"
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                Tipsa oss om evenemang
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Sököverlay - fixed, renderas utanför navbarens animationer */}
      <HeaderSearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
