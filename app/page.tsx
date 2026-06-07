"use client";

import { Shader, ChromaFlow, Swirl } from "shaders/react";
import { CustomCursor } from "@/components/custom-cursor";
import { GrainOverlay } from "@/components/grain-overlay";
import { WorkSection } from "@/components/sections/work-section";
import { FaqSection } from "@/components/sections/faq-section";
import { AboutSection } from "@/components/sections/about-section";
import { ContactSection } from "@/components/sections/contact-section";
import { MagneticButton } from "@/components/magnetic-button";
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
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
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

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // The active section is the horizontal-scroll child at currentSection.
    const getActiveSection = () =>
      container.children[currentSection] as HTMLElement | undefined;

    const scrollState = (section: HTMLElement) => {
      const canScroll = section.scrollHeight > section.clientHeight + 1;
      const atTop = section.scrollTop <= 0;
      const atBottom =
        section.scrollTop + section.clientHeight >= section.scrollHeight - 1;
      return { canScroll, atTop, atBottom };
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - touchStartY.current;
      const dx = e.touches[0].clientX - touchStartX.current;
      // Horizontal gesture → let the container page natively between sections.
      if (Math.abs(dx) > Math.abs(dy)) return;

      const section = getActiveSection();
      if (section) {
        const { canScroll, atTop, atBottom } = scrollState(section);
        if (canScroll) {
          const movingUp = dy < 0; // finger up reveals content further down
          // Allow native vertical scroll inside the section; only block it
          // (so the swipe can page) when pinned at the relevant edge.
          if ((movingUp && atBottom) || (!movingUp && atTop)) {
            e.preventDefault();
          }
          return;
        }
      }
      // Non-scrollable section: block body scroll so the swipe can page.
      if (Math.abs(dy) > 10) e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      const deltaX = touchStartX.current - e.changedTouches[0].clientX;

      // Ignore horizontal or small swipes — horizontal paging is native.
      if (Math.abs(deltaY) <= Math.abs(deltaX) || Math.abs(deltaY) <= 50) return;

      const section = getActiveSection();
      if (section) {
        const { canScroll, atTop, atBottom } = scrollState(section);
        // Don't page while there is still content to scroll within the section.
        if (canScroll && deltaY > 0 && !atBottom) return;
        if (canScroll && deltaY < 0 && !atTop) return;
      }

      if (deltaY > 0 && currentSection < 4) {
        scrollToSection(currentSection + 1);
      } else if (deltaY < 0 && currentSection > 0) {
        scrollToSection(currentSection - 1);
      }
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentSection]);

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
          scrollThrottleRef.current = undefined;
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

        scrollThrottleRef.current = undefined;
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
            speed={0.8}
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
        className={`fixed right-4 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-3 transition-opacity duration-700 md:hidden ${
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
                ? "h-6 w-1.5 bg-foreground"
                : "h-1.5 w-1.5 bg-foreground/40"
            }`}
          />
        ))}
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
      `}</style>
    </main>
  );
}
