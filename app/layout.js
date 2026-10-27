import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PulseCare Portal | Resilient Multi-AZ Clinical EHR & Diagnostics on AWS",
  description: "Enterprise Healthcare Electronic Health Records & Diagnostic Imaging Portal deployed on AWS with Multi-AZ ALB, Encrypted EBS, S3 Versioning, and Auto Scaling.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
