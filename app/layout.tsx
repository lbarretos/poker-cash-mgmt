import type React from "react"
import type { Metadata } from "next"
import { Figtree } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Poker Cash",
  description: "Gerencie suas sessões de poker cash game",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${figtree.variable} font-[family-name:var(--font-figtree)]`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
