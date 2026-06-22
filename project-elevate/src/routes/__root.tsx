import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { MotionProvider } from "../components/MotionProvider";
import { ThemeSwitcher } from "../components/ThemeSwitcher";

const themeBootstrap = `
(function(){try{
  var t=localStorage.getItem('songai:theme')||'dark';
  var p=localStorage.getItem('songai:palette')||'mint';
  document.documentElement.setAttribute('data-theme',t);
  document.documentElement.setAttribute('data-palette',p);
}catch(e){}})();
`;


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-aurora">۴۰۴</h1>
        <h2 className="mt-4 text-xl font-bold text-foreground">صفحه پیدا نشد</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          صفحه‌ای که می‌خواهید وجود ندارد یا جابه‌جا شده است.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-tape px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-tape-deep"
          >
            بازگشت به خانه
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl text-foreground">صفحه بارگذاری نشد</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          مشکلی پیش آمد. می‌توانید دوباره تلاش کنید یا به خانه برگردید.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-full bg-tape px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-tape-deep"
          >
            تلاش دوباره
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-border bg-white/[0.02] px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-white/[0.05]"
          >
            خانه
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0d1b2a" },
      { title: "songai · هدیه‌ای با صدای خودت" },
      {
        name: "description",
        content:
          "آهنگی شخصی با صدای واقعیِ کسی که دوستش داری — موسیقی، صدای کلون‌شده و ویدیو، در یک هدیه.",
      },
      { property: "og:title", content: "songai · هدیه‌ای با صدای خودت" },
      {
        property: "og:description",
        content:
          "با عکس و صدای خودت، یک آهنگ و ویدیوی شخصی بساز؛ هدیه‌ای که فقط برای یک نفر ساخته شده است.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "fa_IR" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css",
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Hind:wght@400;600;700&family=JetBrains+Mono:wght@500;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-theme="dark" data-palette="mint" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <HeadContent />
      </head>
      <body>
        <a href="#main" className="skip-link">پرش به محتوای اصلی</a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <Outlet />
        <ThemeSwitcher />
      </MotionProvider>
    </QueryClientProvider>
  );
}

