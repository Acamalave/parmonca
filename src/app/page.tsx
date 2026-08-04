import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "PARMONCA",
  description: "PARMONCA - Partes y Montacargas",
};

export default function Home() {
  return (
    <main className="fixed inset-0 z-50 flex items-center justify-center bg-[#08080A]">
      {/* Resplandor sutil de marca detrás del logo */}
      <div
        aria-hidden
        className="absolute h-[420px] w-[420px] rounded-full opacity-[0.07] blur-3xl"
        style={{ background: "radial-gradient(circle, #E8821C 0%, transparent 70%)" }}
      />
      <Image
        src="/images/logo-white.png"
        alt="PARMONCA"
        width={360}
        height={98}
        priority
        className="relative h-auto w-[240px] object-contain sm:w-[320px]"
      />
    </main>
  );
}
