"use client";

import { Shader, ChromaFlow, Swirl } from "shaders/react";
import { CustomCursor } from "@/components/custom-cursor";
import { GrainOverlay } from "@/components/grain-overlay";
import { WorkSection } from "@/components/sections/work-section";
import { FaqSection } from "@/components/sections/faq-section";
import { AboutSection } from "@/components/sections/about-section";
import { ContactSection } from "@/components/sections/contact-section";
import { MagneticButton } from "@/components/magnetic-button";
import { ArrowRight } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const SECTIONS = [
  { label: "Kezdőlap", slug: "kezdolap" },
  { label: "Munkáim", slug: "munkaim" },
  { label: "Kapcsolat", slug: "kapcsolat" },
  { label: "Rólam", slug: "rolam" },
  { label: "GYIK", slug: "gyik" },
] as const;

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const shaderContainerRef = useRef<HTMLDivElement>(null);
  const scrollThrottleRef = useRef<number>(null);

  useEffect(() => {
    const checkShaderReady = () => {
      if (shaderContainerRef.current) {
        const canvas = shaderContainerRef.current.querySelector("canvas");
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          setIsLoaded(true);
          return true;
        }
      }
      return false;
    };

    if (checkShaderReady()) return;

    const intervalId = setInterval(() => {
      if (checkShaderReady()) {
        clearInterval(intervalId);
      }
    }, 100);

    const fallbackTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500);

    return () => {
      clearInterval(intervalId);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const scrollToSection = (index: number, smooth = true) => {
    if (scrollContainerRef.current) {
      const sectionWidth = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: sectionWidth * index,
        behavior: smooth ? "smooth" : "auto",
      });
      setCurrentSection(index);
    }
  };

  // Keep the URL hash in sync with the current section so any section is
  // shareable/linkable. Skip the first run so it doesn't wipe an incoming
  // deep-link hash before the loader effect below can read it.
  const hashSynced = useRef(false);
  useEffect(() => {
    if (!hashSynced.current) {
      hashSynced.current = true;
      return;
    }
    const slug = SECTIONS[currentSection]?.slug;
    const url =
      currentSection === 0 || !slug
        ? window.location.pathname + window.location.search
        : `#${slug}`;
    window.history.replaceState(null, "", url);
  }, [currentSection]);

  // Deep-linking: on load (and on later hash changes) jump to the section named
  // in the URL hash, e.g. /#kapcsolat.
  useEffect(() => {
    const goToHash = (smooth: boolean) => {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      const idx = SECTIONS.findIndex((s) => s.slug === slug);
      if (idx > 0) scrollToSection(idx, smooth);
    };
    goToHash(false);
    const onHashChange = () => goToHash(true);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Touch input: no custom handlers — sections only change via native
  // horizontal swipes (snap scrolling); vertical swipes just scroll within
  // the active section.

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();

        if (!scrollContainerRef.current) return;

        scrollContainerRef.current.scrollBy({
          left: e.deltaY,
          behavior: "instant",
        });

        const sectionWidth = scrollContainerRef.current.offsetWidth;
        const newSection = Math.round(
          scrollContainerRef.current.scrollLeft / sectionWidth,
        );
        if (newSection !== currentSection) {
          setCurrentSection(newSection);
        }
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };
  }, [currentSection]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollThrottleRef.current) return;

      scrollThrottleRef.current = requestAnimationFrame(() => {
        if (!scrollContainerRef.current) {
          scrollThrottleRef.current = null;
          return;
        }

        const sectionWidth = scrollContainerRef.current.offsetWidth;
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const newSection = Math.round(scrollLeft / sectionWidth);

        if (
          newSection !== currentSection &&
          newSection >= 0 &&
          newSection <= 4
        ) {
          setCurrentSection(newSection);
        }

        scrollThrottleRef.current = null;
      });
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      if (scrollThrottleRef.current) {
        cancelAnimationFrame(scrollThrottleRef.current);
      }
    };
  }, [currentSection]);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-background">
      <CustomCursor />
      <GrainOverlay />

      <div
        ref={shaderContainerRef}
        className={`fixed inset-0 z-0 transition-opacity duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        style={{ contain: "strict" }}
      >
        <Shader className="h-full w-full">
          <Swirl
            colorA="#000000"
            colorB="#c8c8c8"
            opacity={0.32}
            speed={1.6}
            detail={0.8}
            blend={50}
            coarseX={40}
            coarseY={40}
            mediumX={40}
            mediumY={40}
            fineX={40}
            fineY={40}
          />
          <ChromaFlow
            baseColor="#000000"
            upColor="#f5d020"
            downColor="#f5d020"
            leftColor="#f5d020"
            rightColor="#f5d020"
            intensity={1.2}
            radius={1.8}
            momentum={25}
            blendMode="screen"
            opacity={1}
          />
        </Shader>
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <nav
        className={`fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-6 transition-opacity duration-700 md:px-12 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="mx-auto hidden items-center gap-8 md:flex">
          {SECTIONS.map(({ label: item }, index) => (
            <button
              key={item}
              onClick={() => scrollToSection(index)}
              className={`group relative font-sans text-sm font-medium transition-colors ${
                currentSection === index
                  ? "text-foreground"
                  : "text-foreground/80 hover:text-foreground"
              }`}
            >
              {item}
              <span
                className={`absolute -bottom-1 left-0 h-px w-full bg-foreground transition-transform duration-300 ${
                  currentSection === index
                    ? "origin-left scale-x-100"
                    : "origin-right scale-x-0 group-hover:origin-left group-hover:scale-x-100"
                }`}
              />
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile section navigation — dot indicators (desktop uses the top nav) */}
      <div
        className={`fixed left-1/2 top-6 z-50 flex -translate-x-1/2 items-center gap-3 transition-opacity duration-700 md:hidden ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        role="navigation"
        aria-label="Szekciók"
      >
        {SECTIONS.map(({ label }, index) => (
          <button
            key={label}
            type="button"
            onClick={() => scrollToSection(index)}
            aria-label={label}
            aria-current={currentSection === index ? "true" : undefined}
            className={`rounded-full transition-all duration-300 ${
              currentSection === index
                ? "h-1.5 w-6 bg-foreground"
                : "h-1.5 w-1.5 bg-foreground/40"
            }`}
          />
        ))}
      </div>

      {/* Mobile swipe hint — navigation is horizontal-only, cue points right */}
      <div
        aria-hidden
        className={`pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-foreground/15 bg-foreground/10 px-4 py-2 backdrop-blur-md transition-opacity duration-700 md:hidden ${
          isLoaded && currentSection === 0 ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/70">
          Görgess jobbra
        </span>
        <ArrowRight className="h-3.5 w-3.5 animate-[swipe-hint_1.5s_ease-in-out_infinite] text-foreground" />
      </div>

      <div
        ref={scrollContainerRef}
        data-scroll-container
        className={`relative z-10 flex h-screen snap-x snap-mandatory overflow-x-auto overflow-y-hidden transition-opacity duration-700 md:snap-none ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Hero Section */}
        <section className="flex h-screen w-screen shrink-0 snap-start flex-col overflow-y-auto px-6 pb-16 pt-24 [scrollbar-width:none] md:px-12 md:pb-24">
          <div className="m-auto flex max-w-4xl flex-col items-center text-center">
            {/* <div className="mb-4 inline-block animate-in fade-in slide-in-from-bottom-4 rounded-full border border-foreground/20 bg-foreground/15 px-4 py-1.5 backdrop-blur-md duration-700"></div> */}
            <h1 className="mb-6 animate-in fade-in slide-in-from-bottom-8 text-7xl font-normal uppercase leading-[0.95] tracking-tight text-foreground duration-1000 [font-family:var(--font-display)] md:text-8xl lg:text-[10rem]">
              pannipix
            </h1>
            <div className="mb-8 flex animate-in fade-in slide-in-from-bottom-4 flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-[0.3em] text-foreground/50 duration-1000 delay-200 md:text-sm">
              {["Vonal", "Forma", "Kifejezés", "Te"].map((word, i, arr) => (
                <span key={word} className="flex items-center gap-x-4">
                  <span
                    className={
                      i === arr.length - 1 ? "text-foreground" : undefined
                    }
                  >
                    {word}
                  </span>
                  {i < arr.length - 1 && (
                    <span
                      aria-hidden
                      className="h-1 w-1 rounded-full bg-foreground/30"
                    />
                  )}
                </span>
              ))}
            </div>
            <div className="flex animate-in fade-in slide-in-from-bottom-4 flex-col gap-4 duration-1000 delay-300 sm:flex-row sm:items-center sm:justify-center">
              <MagneticButton
                size="lg"
                variant="secondary"
                className="cursor-pointer"
                onClick={() => scrollToSection(2)}
              >
                Foglalás
              </MagneticButton>
            </div>
          </div>
        </section>

        <WorkSection />
        <ContactSection />
        <AboutSection scrollToSection={scrollToSection} />
        <FaqSection />
      </div>

      <style jsx global>{`
        div::-webkit-scrollbar,
        section::-webkit-scrollbar {
          display: none;
        }
        @keyframes swipe-hint {
          0%,
          100% {
            transform: translateX(0);
            opacity: 0.5;
          }
          50% {
            transform: translateX(4px);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
