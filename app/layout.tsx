import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "./ClientLayout" // Import the client component
import { AuthProvider } from "@/components/auth/AuthProvider"
import { NavProgressBar } from "@/components/NavProgressBar"
import { RootShell } from "./RootShell"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Abdul Basit | Snippets Gallery",
  description: "Essential code snippets and configuration files for developers",
  icons: {
    icon: [
      {
        url: "/favicon.png",
        sizes: "any",
      },
      {
        url: "/icon.png",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>{/* Removed duplicate link tags for icons */}</head>
      <body className={inter.className}>
        <NavProgressBar />
        <AuthProvider>
          <RootShell>
            <ClientLayout>{children}</ClientLayout>
          </RootShell>
        </AuthProvider>
      </body>
    </html>
  )
}
