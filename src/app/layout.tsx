import type { Metadata } from "next";
import MainLayout from "@/components/layout/MainLayout";
import { Toaster } from "react-hot-toast";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";

export const metadata: Metadata = {
  title: "Gestor de Pagos - Impor-Cami",
  description: "Aplicación para gestionar pagos a proveedores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ThemeRegistry>
          <Toaster position="top-right" />
          <MainLayout>{children}</MainLayout>
        </ThemeRegistry>
      </body>
    </html>
  );
}
