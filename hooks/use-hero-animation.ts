import type { RefObject } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * Conjunto de referencias del DOM que conforman la sección hero.
 */
export interface HeroRefs {
  /** Elemento `<section>` raíz del hero. */
  sectionRef: RefObject<HTMLElement | null>
  /** Párrafo de etiqueta superior ("Pago IA para Mexico"). */
  taglineRef: RefObject<HTMLElement | null>
  /** Titular principal `<h1>`. */
  titleRef: RefObject<HTMLElement | null>
  /** Párrafo con el subtítulo descriptivo. */
  subtitleRef: RefObject<HTMLElement | null>
  /** Contenedor de los botones de llamada a la acción. */
  ctaRef: RefObject<HTMLElement | null>
  /** Escena 3D izquierda con órbitas y tarjetas flotantes. */
  sceneRef: RefObject<HTMLElement | null>
  /** Panel informativo derecho. */
  panelRef: RefObject<HTMLElement | null>
}

/**
 * Duración base en segundos para la animación de entrada del hero.
 */
const ENTRANCE_DURATION = 0.9

/**
 * Factor de suavizado para la animación de scroll (en segundos de retardo).
 */
const SCROLL_SCRUB = 1.2

/**
 * Configura la animación de entrada del hero al montar el componente.
 *
 * @param tl - Timeline de GSAP donde se encadenan los tweens de entrada.
 * @param refs - Referencias del DOM de los elementos animados.
 */
function buildEntranceTimeline(tl: gsap.core.Timeline, refs: HeroRefs): void {
  const { taglineRef, titleRef, subtitleRef, ctaRef, sceneRef, panelRef } = refs

  tl.from(taglineRef.current, {
    opacity: 0,
    y: 16,
    duration: 0.6,
  }, 0.15)
    .from(titleRef.current, {
      opacity: 0,
      y: 52,
      rotationX: 8,
      transformOrigin: "50% 100%",
      transformPerspective: 800,
      duration: ENTRANCE_DURATION,
    }, 0.28)
    .from(subtitleRef.current, {
      opacity: 0,
      y: 28,
      duration: 0.8,
    }, "-=0.55")
    .from(ctaRef.current, {
      opacity: 0,
      y: 20,
      scale: 0.95,
      ease: "back.out(1.7)",
      duration: 0.7,
    }, "-=0.45")
    .from(sceneRef.current, {
      opacity: 0,
      x: 40,
      duration: ENTRANCE_DURATION,
    }, 0.35)
    .from(panelRef.current, {
      opacity: 0,
      x: -30,
      duration: 0.9,
    }, 0.5)
}

/**
 * Configura la animación de salida y retorno del hero ligada al scroll.
 * Los elementos se desvanecen y ascienden al hacer scroll hacia abajo,
 * y regresan a su estado visible al volver hacia arriba.
 *
 * @param tl - Timeline de GSAP con ScrollTrigger ya asociado.
 * @param refs - Referencias del DOM de los elementos animados.
 */
function buildScrollExitTimeline(tl: gsap.core.Timeline, refs: HeroRefs): void {
  const { taglineRef, titleRef, subtitleRef, ctaRef, sceneRef, panelRef } = refs

  tl.to(
    [taglineRef.current, subtitleRef.current],
    { opacity: 0, y: -32, immediateRender: false },
    0,
  )
    .to(titleRef.current, {
      opacity: 0,
      y: -52,
      immediateRender: false,
    }, "<0.05")
    .to(ctaRef.current, {
      opacity: 0,
      y: -22,
      immediateRender: false,
    }, "<0.04")
    .to(sceneRef.current, {
      opacity: 0,
      y: -36,
      scale: 0.97,
      immediateRender: false,
    }, 0)
    .to(panelRef.current, {
      opacity: 0,
      y: -24,
      immediateRender: false,
    }, "<0.06")
}

/**
 * Registra y ejecuta las animaciones GSAP de la sección hero.
 *
 * Incluye una animación de entrada al montar el componente y
 * una animación bidireccional ligada al scroll: los elementos
 * se desvanecen al bajar y reaparecen al subir.
 *
 * Respeta la preferencia del sistema `prefers-reduced-motion`.
 *
 * @param refs - Referencias del DOM de los elementos del hero.
 */
export function useHeroAnimation(refs: HeroRefs): void {
  const { sectionRef } = refs

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ── Entrada al montar ─────────────────────────────────────────
        const entranceTl = gsap.timeline({
          defaults: { ease: "power3.out" },
        })
        buildEntranceTimeline(entranceTl, refs)

        // ── Salida / retorno al hacer scroll ──────────────────────────
        const scrollExitTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: SCROLL_SCRUB,
          },
        })
        buildScrollExitTimeline(scrollExitTl, refs)
      })

      return () => mm.revert()
    },
    { scope: sectionRef },
  )
}
