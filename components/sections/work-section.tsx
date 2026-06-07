"use client";

import { WorkGallery } from "@/components/work-gallery";

export function WorkSection() {
  return (
    <section className="relative flex h-screen w-screen shrink-0 snap-start items-center justify-center overflow-hidden">
      <WorkGallery />
    </section>
  );
}
