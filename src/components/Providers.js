"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@material-tailwind/react";
import { CustomThemeProvider } from './ThemeContext';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CustomThemeProvider>
          {children}
        </CustomThemeProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
