import ErrorBoundary from "@/utils/ErrorBoundry";
import type { Metadata } from "next";
import "../../src/index.scss";
import { I18nProvider } from "./i18n/i18n-context";
import { detectLanguage } from "./i18n/server";
import '@/app/globalProvider';
export const metadata: Metadata = {
  title: "RupeEcom Services",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lng = await detectLanguage();
  return (
    <I18nProvider language={lng}>
      <html lang='en'>
        <head>
          <link rel='shortcut icon' href='/images/favicon/favicon.ico' />
          <link href='https://fonts.googleapis.com/css?family=PT+Sans:400,700&amp;display=swap' rel='stylesheet' />
          <link href='https://fonts.googleapis.com/css?family=Raleway&amp;display=swap' rel='stylesheet' />
        </head>
        <body>
          <ErrorBoundary>{children}</ErrorBoundary>
        </body>
      </html>
    </I18nProvider>
  );
}


