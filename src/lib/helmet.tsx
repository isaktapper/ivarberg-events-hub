"use client";

/**
 * Ersätter react-helmet-async. Sidornas grundmetadata (titel, beskrivning,
 * canonical, Open Graph) sätts nu på servern via generateMetadata i src/app.
 * Den här komponenten gör två saker:
 *  - JSON-LD-skript renderas direkt i HTML:en (syns utan JavaScript)
 *  - titel och beskrivning uppdateras i webbläsaren när de ändras efter
 *    laddning (t.ex. startsidans titel när ett filter väljs)
 */

import { Children, isValidElement, useEffect, type ReactElement, type ReactNode } from "react";

type AnyProps = { children?: ReactNode; [key: string]: unknown };

function textOf(children: ReactNode): string {
  return Children.toArray(children)
    .map((c) => (typeof c === "string" || typeof c === "number" ? String(c) : ""))
    .join("");
}

export function Helmet({ children }: { children?: ReactNode }) {
  let title: string | undefined;
  let description: string | undefined;
  const scripts: ReactElement<AnyProps>[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<AnyProps>;
    if (el.type === "title") title = textOf(el.props.children);
    if (el.type === "meta" && el.props.name === "description") description = String(el.props.content ?? "");
    if (el.type === "script" && el.props.type === "application/ld+json") scripts.push(el);
  });

  useEffect(() => {
    if (title && document.title !== title) document.title = title;
    if (description !== undefined) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta && meta.getAttribute("content") !== description) meta.setAttribute("content", description);
    }
  }, [title, description]);

  return (
    <>
      {scripts.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: textOf((s.props as AnyProps).children) }}
        />
      ))}
    </>
  );
}

export function HelmetProvider({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
