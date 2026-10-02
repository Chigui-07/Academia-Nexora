import type { Metadata } from "next";
import "./globals.css";
import "./theme.css";
import "./roomy.css";

const publicUrl = "https://chigui-07.github.io/Academia-Nexora/";

export const metadata: Metadata = {
  metadataBase: new URL(publicUrl),
  title: {
    default: "Academia Nexora",
    template: "%s · Academia Nexora",
  },
  description: "Plataforma educativa para aprender mediante cursos, clases, tareas, ejercicios y progreso académico por etapas y niveles.",
  applicationName: "Academia Nexora",
  keywords: ["Academia Nexora", "plataforma educativa", "estudios", "cursos", "tareas", "aprendizaje"],
  alternates: {
    canonical: publicUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "es_GT",
    url: publicUrl,
    siteName: "Academia Nexora",
    title: "Academia Nexora",
    description: "Aprende, avanza y organiza tu progreso académico por etapas y niveles.",
  },
};

const themeScript = `
  try {
    const saved = localStorage.getItem('nexora-theme');
    const theme = saved || 'dark';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
