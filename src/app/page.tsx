import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "PARMONCA",
  description: "PARMONCA - Partes y Montacargas",
};

export default function Home() {
  return (
    <main
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 px-6 text-center"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 38%, #FFF7EE 0%, transparent 60%), linear-gradient(180deg, #FFFFFF 0%, #F4F2EF 55%, #EDEAE5 100%)",
      }}
    >
      {/* Resplandor naranja sutil detrás del contenido */}
      <div
        aria-hidden
        className="pointer-events-none absolute h-[480px] w-[480px] rounded-full opacity-[0.14] blur-3xl"
        style={{ background: "radial-gradient(circle, #E8821C 0%, transparent 70%)" }}
      />

      <Image
        src="/images/logo.png"
        alt="PARMONCA - Partes y Montacargas"
        width={420}
        height={122}
        priority
        className="relative h-auto w-[260px] object-contain sm:w-[360px]"
      />

      <h1 className="relative max-w-[16ch] font-display text-[34px] font-bold leading-[1.1] tracking-tight text-[#111111] sm:text-[52px]">
        Tu próximo <span className="text-[#E8821C]">equipo</span> está aquí.
      </h1>
    </main>
  );
}
