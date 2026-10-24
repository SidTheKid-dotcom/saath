import type { Metadata } from "next";
import { Landing } from "../components/landing/Landing";

export const metadata: Metadata = {
  title: "Saath: share an auto from the Metro",
  description:
    "Share an auto from a Pune Metro exit and pay only your share of the legal metered fare (₹30 + ₹20/km, from 1 Sep 2026).",
};

export default function Home() {
  return <Landing />;
}
