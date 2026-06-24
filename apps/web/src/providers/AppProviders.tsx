"use client";

import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { DealershipBootstrap } from "@/providers/DealershipBootstrap";
import { DealershipProvider } from "@/providers/DealershipProvider";
import { AuthProvider } from "@/providers/AuthProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <DealershipProvider>
          <DealershipBootstrap />
          {children}
          <Toaster richColors position="top-center" />
        </DealershipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
