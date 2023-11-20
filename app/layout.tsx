import type { Metadata } from "next";
import { Inter, M_PLUS_1, M_PLUS_1_Code } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const m1 = M_PLUS_1({ subsets: ["latin"] });
const m1_code = M_PLUS_1_Code({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Nathan's Portfolio",
    description: "Nathan Heidacker's personal portfolio website",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
