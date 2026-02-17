import type { VisualStyle, StyleParam } from "@/lib/validation/schemas";

function getActiveValue(param: StyleParam | undefined): string {
  if (!param) return "";
  if (typeof param === "string") return param;
  return param.activeValue ?? param.active ?? param.value ?? "";
}

/**
 * compileStyleValues(style) -> Record<string, string>
 *
 * Produces the exact placeholder keys used by the prompt templates.
 */
export function compileStyleValues(style: VisualStyle): Record<string, string> {
  return {
    VISUAL_MEDIUM: style.visualMedium ?? "",
    FILM_FORMAT: style.filmFormat ?? "",
    FILM_GRAIN: style.filmGrain ?? "",
    DEPTH_OF_FIELD: style.depthOfField ?? "",
    LIGHTING: getActiveValue(style.lighting),
    COLOR_PALETTE: getActiveValue(style.colorPalette),
    AESTHETIC: getActiveValue(style.aesthetic),
    ATMOSPHERE: getActiveValue(style.atmosphere),
    MOOD: getActiveValue(style.mood),
    MOTION: style.motion ?? "",
    TEXTURE: getActiveValue(style.texture),
    DETAIL_LEVEL: getActiveValue(style.detailLevel),
    CUSTOM_PROMPT: style.customPrompt ?? "",
  };
}
