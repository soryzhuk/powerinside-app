import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  defaultLocale,
  LOCALE_COOKIE,
  negotiateLocale,
  pickLocale,
  type Locale,
} from "./config";

async function detectLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (fromCookie) {
    return pickLocale(fromCookie);
  }
  const hdrs = await headers();
  const acceptLanguage = hdrs.get("accept-language");
  return negotiateLocale(acceptLanguage);
}

export default getRequestConfig(async () => {
  const locale = await detectLocale();
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return {
    locale,
    messages,
  };
});
