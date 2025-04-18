import {
  ClerkProvider,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import type { Metadata } from "next";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import StreamClientProvider from "@/providers/StreamClientProvider";
import { SocketProvider } from "@/context/SocketContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DebateGuard",
  description: "AI-powered debate analysis platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <SocketProvider>
        <html lang="en" className="dark">
          <body className={`${inter.className} bg-[#0D1117] text-[#E5E7EB]`}>
            {children}
            <Toaster />
          </body>
        </html>
      </SocketProvider>
    </ClerkProvider>
  );
}
