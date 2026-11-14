// llms.txt per stad. ivarberg.nu har en handskriven text (src/content/llms.varberg.ts),
// övriga städer får en kort beskrivning tills de har eget innehåll.

import { getSite } from "@/config/site.server";
import { VARBERG_SLUG } from "@/config/site";
import { LLMS_VARBERG } from "@/content/llms.varberg";

export const revalidate = 300;

export async function GET(): Promise<Response> {
  const site = await getSite();
  const headers = { "Content-Type": "text/plain; charset=utf-8" };

  if (site.slug === VARBERG_SLUG) {
    return new Response(LLMS_VARBERG, { headers });
  }

  const body = `# ${site.name}

> ${site.name} är en evenemangskalender för ${site.cityName}. Här samlas konserter, teater, sport, marknader, mat och aktiviteter för hela familjen på ett ställe.

## Sidor

- [Alla evenemang](${site.url}/): Kommande evenemang i ${site.cityName}, med filter för datum och kategori
- [Tipsa om evenemang](${site.url}/tips): Skicka in ett evenemang som saknas
- [Om oss](${site.url}/om-oss): Om ${site.name}
`;
  return new Response(body, { headers });
}
