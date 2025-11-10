import { Helmet } from 'react-helmet-async';

/**
 * FAQ Schema for ivarberg.nu
 * Helps Google show rich results with common questions about Varberg events
 */
export function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Vad händer i Varberg idag?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "På ivarberg.nu hittar du en komplett översikt över alla evenemang i Varberg idag. Vi listar konserter, teaterföreställningar, sportevents, matupplevelser och familjeaktiviteter. Använd våra filter för att hitta aktiviteter som passar dig och din familj. Vi uppdaterar sidan dagligen med nya evenemang."
        }
      },
      {
        "@type": "Question",
        "name": "Hur hittar jag evenemang i Varberg i helgen?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Klicka på snabbfiltret 'I helgen' på startsidan eller använd datumfiltret för att välja specifika dagar. Vi visar alla evenemang som äger rum fredag-söndag, inklusive konserter, teater, sport och familjeaktiviteter i hela Varberg."
        }
      },
      {
        "@type": "Question",
        "name": "Kan jag lägga till mitt eget evenemang på ivarberg.nu?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja! Klicka på 'Tipsa oss' för att skicka in ditt evenemang. Det är helt kostnadsfritt att lägga till evenemang. Vi granskar alla inlämningar innan publicering för att säkerställa kvalitet och korrekt information. Detta hjälper fler att upptäcka ditt evenemang i Varberg."
        }
      },
      {
        "@type": "Question",
        "name": "Vilka typer av evenemang finns i Varberg?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "I Varberg hittar du ett brett utbud av evenemang: Scen och teater, konserter och musik, nattliv, sportevents, konstutställningar, föreläsningar, barn- och familjeaktiviteter, mat och dryck, julmarknader, film och bio, djur och natur, guidade visningar och lokala marknader. Vi samlar allt på ett ställe."
        }
      },
      {
        "@type": "Question",
        "name": "Kostar det att använda ivarberg.nu?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nej, ivarberg.nu är helt gratis att använda! Du kan söka, filtrera och upptäcka evenemang utan kostnad. Det är också gratis för arrangörer att lägga till sina evenemang. Vår målsättning är att göra det enkelt för alla att hitta och delta i Varbergs rika kulturliv."
        }
      },
      {
        "@type": "Question",
        "name": "Hur ofta uppdateras evenemangen på ivarberg.nu?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vi uppdaterar ivarberg.nu dagligen med nya evenemang. Arrangörer kan när som helst skicka in tips om nya evenemang via vår tipsfunktion. Vi granskar och publicerar nya evenemang löpande för att säkerställa att du alltid har tillgång till aktuell information om vad som händer i Varberg."
        }
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}

