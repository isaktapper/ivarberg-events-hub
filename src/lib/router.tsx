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
import {
  Suspense,
  forwardRef,
  useCallback,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

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

/*
 * Query-strängen utan att sidorna blir dynamiska.
 *
 * Sidorna cachas (ISR) och renderas alltså utan att servern vet vilken
 * query-sträng besökaren har. Next:s useSearchParams skulle då tvinga hela
 * trädet upp till närmaste <Suspense> att renderas i webbläsaren i stället
 * för i HTML:en. I stället läser bara <SearchParamsSync> (i root-layouten,
 * egen Suspense) Next:s useSearchParams och lägger värdet i en liten store.
 * Komponenterna läser storen: tom query vid serverrendering och hydrering
 * (samma HTML för alla), riktig query direkt efteråt.
 */

let currentSearch = typeof window === "undefined" ? "" : window.location.search.replace(/^\?/, "");
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setCurrentSearch(next: string) {
  if (next === currentSearch) return;
  currentSearch = next;
  listeners.forEach((l) => l());
}

const getSearch = () => currentSearch;
const getServerSearch = () => "";

function SearchParamsSyncInner() {
  const nextParams = useNextSearchParams();
  const search = nextParams?.toString() ?? "";
  useLayoutEffect(() => setCurrentSearch(search), [search]);
  return null;
}

/** Monteras en gång i root-layouten */
export function SearchParamsSync() {
  return (
    <Suspense fallback={null}>
      <SearchParamsSyncInner />
    </Suspense>
  );
}

const noopSubscribe = () => () => {};

/** false under serverrendering och hydrering, true därefter */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

function useSearchString() {
  return useSyncExternalStore(subscribe, getSearch, getServerSearch);
}

type SearchParamsInit = URLSearchParams | Record<string, string> | string;

export function useSearchParams(): [URLSearchParams, (next: SearchParamsInit, options?: { replace?: boolean }) => void] {
  const search = useSearchString();
  const pathname = usePathname();

  const params = useMemo(() => new URLSearchParams(search), [search]);

  const setParams = useCallback(
    (next: SearchParamsInit, options?: { replace?: boolean }) => {
      const qs = new URLSearchParams(next as URLSearchParams).toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      // Som react-router: bara URL:en ändras, ingen ny hämtning från servern
      // och ingen scroll. Next.js synkar useSearchParams med history-API:t.
      if (options?.replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
      setCurrentSearch(qs);
    },
    [pathname]
  );

  return [params, setParams];
}

export function useLocation() {
  const pathname = usePathname();
  const search = useSearchString();
  return { pathname, search: search ? `?${search}` : "", hash: "" };
}
