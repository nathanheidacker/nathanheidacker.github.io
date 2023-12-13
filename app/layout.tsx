import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

//const inter = Inter({ subsets: ["latin"] });
const ibm = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700"],
});

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
            <body className={ibm.className}>{children}</body>
        </html>
    );
}
