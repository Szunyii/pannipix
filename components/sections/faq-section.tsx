"use client"

import { useReveal } from "@/hooks/use-reveal"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
  {
    q: `Régi tetoválás átdolgozását – „felújítását" – takarását vállalod?`,
    a: `Nagyon ritka esetekben, ha látok benne fantáziát. A legtöbb esetben azonban ezeket a felkéréseket elutasítom, mert nem ez a fő profilom.`,
  },
  {
    q: `Hova NEM tetoválsz?`,
    a: `Arc, nyak, hónalj, borda, has, hát alsó része (nagyon ritka esetekben, ha a fenti mintát le kell vezetni), fenék, lábfej, talp.`,
  },
  {
    q: `Mivel készíthetem fel a bőrömet és a szervezetemet a tetováltatásra?`,
    a: `Nagyon fontos, hogy a tetoválásod elkészültekor egészséges legyél. Hasonlóan egy orvosi beavatkozáshoz: betegen, betegség után, várandósan, másnaposan, bármilyen tudatmódosító szer hatása alatt – vagy közvetlenül utána – nem tetováltatunk. További kizáró tényezők: szoptatás, vérhígító jellegű gyógyszer szedése, vérzékenység, tartósan magas vérnyomás, cukorbetegség.`,
  },
  {
    q: `Egyszer használatos tűvel és kellékekkel dolgozol?`,
    a: `Igen.`,
  },
  {
    q: `Érzékeny lehetek a festékre?`,
    a: `Kizárólag az EU-szabványoknak megfelelő, vegánbarát, hipoallergén, steril festékekkel dolgozom (Eclipse Tattoo Ink). Fontos azonban, hogy egyetlen tetoválónak sincs lehetősége teljesen kizárni az egyéni érzékenységet.`,
  },
  {
    q: `18 év alatt tetoválsz?`,
    a: `Nem.`,
  },
]

export function FaqSection() {
  const { ref, isVisible } = useReveal(0.3)

  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start flex-col overflow-y-auto px-6 pb-12 pt-20 [scrollbar-width:none] md:px-12 md:pb-0 md:pt-0 lg:px-16"
    >
      <div className="m-auto w-full max-w-3xl">
        <div
          className={`mb-8 transition-all duration-700 md:mb-12 ${
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
          }`}
        >
          <h2 className="mb-2 font-sans text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">
            GYIK
          </h2>
          <p className="font-mono text-sm text-foreground/60 md:text-base">/ Gyakran ismételt kérdések</p>
        </div>

        <div
          className={`transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-foreground/10">
                <AccordionTrigger className="font-sans text-base font-normal text-foreground hover:no-underline hover:text-foreground/70 md:text-lg">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-foreground/70 md:text-base">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
