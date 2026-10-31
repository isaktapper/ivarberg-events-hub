"use client";

/**
 * Tunt lager som ger komponenterna samma API som react-router-dom hade
 * (Link to=, useNavigate, useParams, useSearchParams, useLocation), men
 * bygger på Next.js-routern. Gör att befintliga komponenter kunde flyttas
 * över oförändrade.
 */

import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import { forwardRef, useCallback, useMemo, type AnchorHTMLAttributes, type ReactNode } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  replace?: boolean;
  children?: ReactNode;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, replace, ...rest }, ref) {
  // Ingen förhämtning: varje eventsida renderas på servern med flera
  // databasfrågor, och listorna visar många länkar samtidigt
  return <NextLink ref={ref} href={to} replace={replace} prefetch={false} {...rest} />;
});

export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to: string | number, options?: { replace?: boolean }) => {
      if (typeof to === "number") {
        if (to < 0) router.back();
        else router.forward();
        return;
      }
      if (options?.replace) router.replace(to);
      else router.push(to);
    },
    [router]
  );
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  return (useNextParams() ?? {}) as T;
}

type SearchParamsInit = URLSearchParams | Record<string, string> | string;

export function useSearchParams(): [URLSearchParams, (next: SearchParamsInit, options?: { replace?: boolean }) => void] {
  const nextParams = useNextSearchParams();
  const pathname = usePathname();

  const params = useMemo(() => new URLSearchParams(nextParams?.toString() ?? ""), [nextParams]);

  const setParams = useCallback(
    (next: SearchParamsInit, options?: { replace?: boolean }) => {
      const qs = new URLSearchParams(next as URLSearchParams).toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      // Som react-router: bara URL:en ändras, ingen ny hämtning från servern
      // och ingen scroll. Next.js synkar useSearchParams med history-API:t.
      if (options?.replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    },
    [pathname]
  );

  return [params, setParams];
}

export function useLocation() {
  const pathname = usePathname();
  const nextParams = useNextSearchParams();
  const search = nextParams?.toString() ? `?${nextParams.toString()}` : "";
  return { pathname, search, hash: "" };
}
