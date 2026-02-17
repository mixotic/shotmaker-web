/*
  ShotMaker Web — TypeScript enums + shared style option lists.
  These are string enums intended to match the desktop (Mac) app.
*/

// ---------- Core visual enums ----------

export enum Medium {
  film16mm = "16mm Film",
  film35mm = "35mm Film",
  film70mm = "70mm Film",
  vhsCamera = "VHS Camera",
  dvCamera = "DV Camera",
  photorealistic = "Photorealistic",
  cgi3d = "3D CGI",
  animation2D = "2D Hand-drawn",
  stopMotion = "Stop Motion",
  claymation = "Claymation",
  pixelArt = "Pixel Art",
  watercolor = "Watercolor",
  oilPainting = "Oil Painting",
  comicBook = "Comic Book",
}

export enum FilmFormat {
  standard = "Standard",
  anamorphic = "Anamorphic",
  imax = "IMAX",
}

export enum FilmGrain {
  none = "None",
  subtle = "Subtle",
  moderate = "Moderate",
  heavy = "Heavy",
  vintage = "Vintage",
}

export enum DepthOfField {
  shallow = "Shallow (f/1.4-2.8)",
  moderate = "Moderate (f/4-5.6)",
  deep = "Deep (f/8-16)",
}

// ---------- Asset / camera enums ----------

export enum AssetType {
  character = "Character",
  object = "Object",
  set = "Set",
}

export enum ViewAngle {
  front = "Front View",
  back = "Back View",
  side = "Side View",
  threeQuarter = "3/4 View",
}

export enum ImageAspectRatio {
  square = "1:1",
  portrait34 = "3:4",
  landscape43 = "4:3",
  portrait916 = "9:16",
  landscape169 = "16:9",
}

export enum ShotAngle {
  extremeWide = "Extreme Wide Shot",
  wide = "Wide Shot",
  medium = "Medium Shot",
  mediumCloseUp = "Medium Close-up",
  closeUp = "Close-up",
  extremeCloseUp = "Extreme Close-up",
  twoShot = "Two Shot",
  overTheShoulder = "Over-the-shoulder",
}

export enum CameraPerspective {
  eyeLevel = "Eye Level",
  highAngle = "High Angle",
  lowAngle = "Low Angle",
  birdsEye = "Bird's Eye View",
  wormsEye = "Worm's Eye View",
  dutch = "Dutch Angle",
}

export enum CompositionRule {
  ruleOfThirds = "Rule of Thirds",
  goldenRatio = "Golden Ratio",
  centered = "Centered",
  leadingLines = "Leading Lines",
  frameWithinFrame = "Frame within Frame",
  symmetry = "Symmetry",
}

export enum LensType {
  none = "None",
  mm35 = "35mm",
  mm50 = "50mm",
  fisheye = "Fisheye",
  wideAngle = "Wide Angle",
  telephoto = "Telephoto",
  macro = "Macro",
  anamorphic = "Anamorphic",
}

export enum MotionBlurEffect {
  none = "None",
  motionBlur = "Motion Blur",
  softFocus = "Soft Focus",
  bokeh = "Bokeh",
  portrait = "Portrait",
  tiltShift = "Tilt-Shift",
}

export enum LightingStyle {
  none = "None",
  natural = "Natural",
  dramatic = "Dramatic",
  warm = "Warm",
  cold = "Cold",
  goldenHour = "Golden Hour",
  blueHour = "Blue Hour",
  neon = "Neon",
  cinematic = "Cinematic",
}

export enum CameraMovement {
  staticShot = "Static Shot",
  slowPushIn = "Slow Push In",
  slowPullOut = "Slow Pull Out",
  panLeft = "Pan Left",
  panRight = "Pan Right",
  tiltUp = "Tilt Up",
  tiltDown = "Tilt Down",
  trackingLeft = "Tracking Left",
  trackingRight = "Tracking Right",
  craneUp = "Crane Up",
  craneDown = "Crane Down",
  dollyForward = "Dolly Forward",
  dollyBackward = "Dolly Backward",
  arcLeft = "Arc Left",
  arcRight = "Arc Right",
  handheld = "Handheld",
  zoomIn = "Zoom In",
  zoomOut = "Zoom Out",
}

// ---------- Character attribute enums ----------

export enum CharacterAge {
  child = "Child",
  teen = "Teen",
  youngAdult = "Young Adult",
  adult = "Adult",
  middleAged = "Middle-aged",
  elderly = "Elderly",
}

export enum CharacterBuild {
  slim = "Slim",
  average = "Average",
  athletic = "Athletic",
  curvy = "Curvy",
  muscular = "Muscular",
  heavyset = "Heavyset",
}

export enum CharacterClothing {
  casual = "Casual",
  formal = "Formal",
  business = "Business",
  streetwear = "Streetwear",
  athletic = "Athletic",
  uniform = "Uniform",
  armor = "Armor",
  traditional = "Traditional",
  fantasy = "Fantasy",
  sciFi = "Sci-Fi",
}

export enum CharacterHair {
  bald = "Bald",
  short = "Short",
  medium = "Medium",
  long = "Long",
  curly = "Curly",
  straight = "Straight",
  wavy = "Wavy",
  braided = "Braided",
  ponytail = "Ponytail",
}

export enum CharacterExpression {
  neutral = "Neutral",
  happy = "Happy",
  sad = "Sad",
  angry = "Angry",
  surprised = "Surprised",
  fearful = "Fearful",
  determined = "Determined",
  tired = "Tired",
}

export enum CharacterPosture {
  standing = "Standing",
  sitting = "Sitting",
  walking = "Walking",
  running = "Running",
  crouching = "Crouching",
  lyingDown = "Lying Down",
  leaning = "Leaning",
}

// ---------- Object attribute enums ----------

export enum ObjectSize {
  tiny = "Tiny",
  small = "Small",
  medium = "Medium",
  large = "Large",
  huge = "Huge",
}

export enum ObjectMaterial {
  wood = "Wood",
  metal = "Metal",
  plastic = "Plastic",
  glass = "Glass",
  fabric = "Fabric",
  stone = "Stone",
  paper = "Paper",
  organic = "Organic",
}

export enum ObjectCondition {
  new = "New",
  clean = "Clean",
  used = "Used",
  worn = "Worn",
  damaged = "Damaged",
  rusty = "Rusty",
  dirty = "Dirty",
}

export enum ObjectStyle {
  modern = "Modern",
  vintage = "Vintage",
  minimalist = "Minimalist",
  ornate = "Ornate",
  industrial = "Industrial",
  rustic = "Rustic",
  futuristic = "Futuristic",
}

export enum ObjectEra {
  ancient = "Ancient",
  medieval = "Medieval",
  victorian = "Victorian",
  early20th = "Early 20th Century",
  late20th = "Late 20th Century",
  contemporary = "Contemporary",
  farFuture = "Far Future",
}

export enum ObjectFunction {
  tool = "Tool",
  weapon = "Weapon",
  vehicle = "Vehicle",
  furniture = "Furniture",
  device = "Device",
  prop = "Prop",
  container = "Container",
  decoration = "Decoration",
}

// ---------- Set attribute enums ----------

export enum SetLocation {
  interior = "Interior",
  exterior = "Exterior",
  urban = "Urban",
  suburban = "Suburban",
  rural = "Rural",
  wilderness = "Wilderness",
  underwater = "Underwater",
  space = "Space",
}

export enum SetTime {
  dawn = "Dawn",
  morning = "Morning",
  noon = "Noon",
  afternoon = "Afternoon",
  sunset = "Sunset",
  night = "Night",
}

export enum SetWeather {
  clear = "Clear",
  cloudy = "Cloudy",
  overcast = "Overcast",
  rainy = "Rainy",
  stormy = "Stormy",
  snowy = "Snowy",
  foggy = "Foggy",
  windy = "Windy",
}

export enum SetScale {
  intimate = "Intimate",
  small = "Small",
  medium = "Medium",
  large = "Large",
  vast = "Vast",
}

export enum SetArchitecture {
  modern = "Modern",
  brutalist = "Brutalist",
  gothic = "Gothic",
  victorian = "Victorian",
  futuristic = "Futuristic",
  rustic = "Rustic",
  traditional = "Traditional",
}

export enum SetAtmosphere {
  cozy = "Cozy",
  tense = "Tense",
  mysterious = "Mysterious",
  serene = "Serene",
  chaotic = "Chaotic",
  gritty = "Gritty",
  whimsical = "Whimsical",
  epic = "Epic",
}

// ---------- Style parameter option lists ----------

export type StyleParamKey =
  | "lighting"
  | "colorPalette"
  | "aesthetic"
  | "atmosphere"
  | "mood"
  | "motion"
  | "texture";

export const StyleParameterOptions: Record<StyleParamKey, string[]> = {
  lighting: [
    "",
    "Natural daylight",
    "Golden hour (sunrise/sunset)",
    "Cinematic dramatic lighting",
    "Soft and diffused",
    "Low-key dark lighting",
    "High-key bright lighting",
    "Neon lighting",
    "Studio three-point lighting",
    "Flat even lighting",
    "Dramatic shadows",
    "Backlit silhouette",
    "Candlelight/firelight",
    "Moonlight",
    "Overcast natural",
    "Volumetric god rays",
    "Rim lighting",
    "Split lighting",
  ],
  colorPalette: [
    "",
    "Rich cinematic colors",
    "Vibrant saturated colors",
    "Muted pastels",
    "Earth tones (browns, greens)",
    "Cool tones (blues, greens, purples)",
    "Warm tones (oranges, reds, golds)",
    "Monochrome",
    "Black and white",
    "Neon and electric colors",
    "Desaturated / washed out",
    "Limited palette colors",
    "High-contrast",
    "Teal and orange",
    "Sepia vintage",
  ],
  aesthetic: [
    "",
    "Cinematic blockbuster",
    "Epic cinematic",
    "Documentary realism",
    "Film noir",
    "Horror unsettling",
    "Fantasy medieval",
    "Futuristic sci-fi",
    "Western frontier",
    "Cyberpunk neon-noir",
    "Japanese anime",
    "Vector graphics geometric",
    "Watercolor painting",
    "Retro pixel graphics",
    "Comic book graphic novel",
    "Claymation handmade",
    "Puppet stop motion",
    "Minimalist modern",
    "Retro 80s",
    "Surreal dreamlike",
    "Art deco",
    "Steampunk",
    "Vaporwave",
    "Utopian",
    "Post-apocalyptic",
    "Nature documentary",
  ],
  atmosphere: [
    "",
    "Cinematic and immersive",
    "Grand and epic",
    "Intimate and personal",
    "Urban dystopian",
    "Mysterious",
    "Ethereal and dreamlike",
    "Clear and bright",
    "Gritty and raw",
    "Playful and whimsical",
    "Energetic",
    "Nostalgic retro",
    "Moody and foggy",
    "Dusty and sunbaked",
    "Cold sterile",
    "Warm cozy",
  ],
  mood: [
    "",
    "Neutral",
    "Epic and grand",
    "Dynamic",
    "Dark and gritty",
    "Ominous",
    "Whimsical",
    "Serene",
    "Heroic and adventurous",
    "Romantic",
    "Tense",
    "Melancholic",
  ],
  motion: [
    "",
    "Locked-off camera",
    "Smooth steady movement",
    "Sweeping camera movements",
    "Handheld natural camera",
    "Dynamic action poses",
    "Stop motion frame-by-frame",
    "Fluid organic motion",
    "Slow motion",
    "Fast whip pans",
    "Geometric transitions",
    "Subtle parallax drift",
    "Kinetic montage",
    "Pixel animation",
    "Floating dream drift",
  ],
  texture: [
    "",
    "Sharp and crisp",
    "Ultra-sharp with fine detail",
    "Fine detail cinematic grain",
    "Grainy / organic",
    "Clean cel-shaded",
    "Halftone dots ink lines",
    "Watercolor paper",
    "Pixelated",
    "Clay plasticine handmade",
    "Handmade miniature materials",
    "Soft matte",
    "Glossy",
    "Rough gritty",
    "High-frequency detail",
    "Painterly brush strokes",
    "Film dust and scratches",
  ],
};

// ---------- Style presets ----------

export interface StylePreset {
  medium: Medium;
  filmFormat: FilmFormat | null;
  filmGrain: FilmGrain | null;
  depthOfField: DepthOfField | null;
  detailLevel: number; // 0-100
  preset: Record<StyleParamKey, string>;
  manual: Record<StyleParamKey, string>;
}

const cinematicManual: Record<StyleParamKey, string> = {
  lighting:
    "Cinematic, dramatic lighting with motivated sources and shaped shadows. Use strong key-to-fill contrast, gentle falloff, and controlled practicals to sculpt faces and environments. Add subtle rim or edge light where appropriate, and avoid flat, front-lit illumination.",
  colorPalette:
    "Rich cinematic colors with cohesive grading. Preserve natural skin tones, deepen blacks without crushing detail, and maintain smooth highlight roll-off. Aim for a filmic contrast curve with tasteful saturation—no garish clipping, just a polished theatrical look.",
  aesthetic:
    "Cinematic blockbuster aesthetic: high production value, careful art direction, and premium lensing. Naturalistic realism with stylized polish—clean compositions, clear subject separation, and deliberate visual hierarchy in every frame.",
  atmosphere:
    "Cinematic and immersive atmosphere with depth, layered backgrounds, and subtle environmental cues (haze, dust, practical light bloom). The world should feel tangible and dimensional, with a sense of scale and place.",
  mood:
    "Epic and grand mood that feels emotionally elevated. Convey awe, importance, and momentum through lighting and composition—confident framing, strong silhouettes, and a sense that the scene matters.",
  motion:
    "Sweeping camera movements that feel purposeful and stabilized—slow pushes, elegant arcs, and motivated tracking. Movement should enhance story beats and reveal information, not distract.",
  texture:
    "Fine detail with a gentle cinematic grain structure. Preserve micro-contrast and realistic surfaces while keeping noise tasteful. Avoid over-sharpening; keep the image filmic with subtle grain and organic texture.",
};

const defaultManualFromPreset = (preset: Record<StyleParamKey, string>): Record<StyleParamKey, string> => ({
  lighting: preset.lighting,
  colorPalette: preset.colorPalette,
  aesthetic: preset.aesthetic,
  atmosphere: preset.atmosphere,
  mood: preset.mood,
  motion: preset.motion,
  texture: preset.texture,
});

export const STYLE_PRESETS: Record<string, StylePreset> = {
  Cinematic: {
    medium: Medium.film35mm,
    filmFormat: FilmFormat.anamorphic,
    filmGrain: FilmGrain.subtle,
    depthOfField: DepthOfField.shallow,
    detailLevel: 90,
    preset: {
      lighting: "Cinematic dramatic lighting",
      colorPalette: "Rich cinematic colors",
      aesthetic: "Cinematic blockbuster",
      atmosphere: "Cinematic and immersive",
      mood: "Epic and grand",
      motion: "Sweeping camera movements",
      texture: "Fine detail cinematic grain",
    },
    manual: cinematicManual,
  },

  // Provided explicitly in the spec (even though it wasn't listed among the 15 names).
  "70mm Epic": {
    medium: Medium.film70mm,
    filmFormat: FilmFormat.imax,
    filmGrain: FilmGrain.none,
    depthOfField: DepthOfField.deep,
    detailLevel: 95,
    preset: {
      lighting: "Natural daylight",
      colorPalette: "Vibrant saturated colors",
      aesthetic: "Epic cinematic",
      atmosphere: "Grand and epic",
      mood: "Epic and grand",
      motion: "Sweeping camera movements",
      texture: "Ultra-sharp with fine detail",
    },
    manual: defaultManualFromPreset({
      lighting: "Natural daylight",
      colorPalette: "Vibrant saturated colors",
      aesthetic: "Epic cinematic",
      atmosphere: "Grand and epic",
      mood: "Epic and grand",
      motion: "Sweeping camera movements",
      texture: "Ultra-sharp with fine detail",
    }),
  },

  Anime: {
    medium: Medium.animation2D,
    filmFormat: null,
    filmGrain: null,
    depthOfField: null,
    detailLevel: 70,
    preset: {
      lighting: "Flat even lighting",
      colorPalette: "Bright vivid primary colors",
      aesthetic: "Japanese anime",
      atmosphere: "Energetic",
      mood: "Dynamic",
      motion: "Dynamic action poses",
      texture: "Clean cel-shaded",
    },
    manual: defaultManualFromPreset({
      lighting: "Flat even lighting",
      colorPalette: "Bright vivid primary colors",
      aesthetic: "Japanese anime",
      atmosphere: "Energetic",
      mood: "Dynamic",
      motion: "Dynamic action poses",
      texture: "Clean cel-shaded",
    }),
  },

  Cyberpunk: {
    medium: Medium.photorealistic,
    filmFormat: null,
    filmGrain: null,
    depthOfField: DepthOfField.shallow,
    detailLevel: 90,
    preset: {
      lighting: "Neon lighting",
      colorPalette: "Neon and electric colors",
      aesthetic: "Cyberpunk neon-noir",
      atmosphere: "Urban dystopian",
      mood: "Dark and gritty",
      motion: "Smooth steady movement",
      texture: "Sharp and crisp",
    },
    manual: defaultManualFromPreset({
      lighting: "Neon lighting",
      colorPalette: "Neon and electric colors",
      aesthetic: "Cyberpunk neon-noir",
      atmosphere: "Urban dystopian",
      mood: "Dark and gritty",
      motion: "Smooth steady movement",
      texture: "Sharp and crisp",
    }),
  },

  Documentary: {
    medium: Medium.dvCamera,
    filmFormat: FilmFormat.standard,
    filmGrain: FilmGrain.subtle,
    depthOfField: DepthOfField.moderate,
    detailLevel: 70,
    preset: {
      lighting: "Natural daylight",
      colorPalette: "Muted pastels",
      aesthetic: "Documentary realism",
      atmosphere: "Intimate and personal",
      mood: "Neutral",
      motion: "Handheld natural camera",
      texture: "Grainy / organic",
    },
    manual: defaultManualFromPreset({
      lighting: "Natural daylight",
      colorPalette: "Muted pastels",
      aesthetic: "Documentary realism",
      atmosphere: "Intimate and personal",
      mood: "Neutral",
      motion: "Handheld natural camera",
      texture: "Grainy / organic",
    }),
  },

  Claymation: {
    medium: Medium.claymation,
    filmFormat: null,
    filmGrain: null,
    depthOfField: DepthOfField.moderate,
    detailLevel: 75,
    preset: {
      lighting: "Studio three-point lighting",
      colorPalette: "Bright vivid primary colors",
      aesthetic: "Claymation handmade",
      atmosphere: "Playful and whimsical",
      mood: "Whimsical",
      motion: "Stop motion frame-by-frame",
      texture: "Clay plasticine handmade",
    },
    manual: defaultManualFromPreset({
      lighting: "Studio three-point lighting",
      colorPalette: "Bright vivid primary colors",
      aesthetic: "Claymation handmade",
      atmosphere: "Playful and whimsical",
      mood: "Whimsical",
      motion: "Stop motion frame-by-frame",
      texture: "Clay plasticine handmade",
    }),
  },

  "Film Noir": {
    medium: Medium.film35mm,
    filmFormat: FilmFormat.standard,
    filmGrain: FilmGrain.moderate,
    depthOfField: DepthOfField.shallow,
    detailLevel: 85,
    preset: {
      lighting: "Low-key dark lighting",
      colorPalette: "Black and white",
      aesthetic: "Film noir",
      atmosphere: "Mysterious",
      mood: "Dark and gritty",
      motion: "Locked-off camera",
      texture: "Grainy / organic",
    },
    manual: defaultManualFromPreset({
      lighting: "Low-key dark lighting",
      colorPalette: "Black and white",
      aesthetic: "Film noir",
      atmosphere: "Mysterious",
      mood: "Dark and gritty",
      motion: "Locked-off camera",
      texture: "Grainy / organic",
    }),
  },

  Horror: {
    medium: Medium.film35mm,
    filmFormat: FilmFormat.standard,
    filmGrain: FilmGrain.moderate,
    depthOfField: DepthOfField.shallow,
    detailLevel: 85,
    preset: {
      lighting: "Low-key dark lighting",
      colorPalette: "Desaturated / washed out",
      aesthetic: "Horror unsettling",
      atmosphere: "Mysterious",
      mood: "Ominous",
      motion: "Slow motion",
      texture: "Grainy / organic",
    },
    manual: defaultManualFromPreset({
      lighting: "Low-key dark lighting",
      colorPalette: "Desaturated / washed out",
      aesthetic: "Horror unsettling",
      atmosphere: "Mysterious",
      mood: "Ominous",
      motion: "Slow motion",
      texture: "Grainy / organic",
    }),
  },

  Fantasy: {
    medium: Medium.photorealistic,
    filmFormat: null,
    filmGrain: null,
    depthOfField: DepthOfField.moderate,
    detailLevel: 95,
    preset: {
      lighting: "Cinematic dramatic lighting",
      colorPalette: "Vibrant saturated colors",
      aesthetic: "Fantasy medieval",
      atmosphere: "Ethereal and dreamlike",
      mood: "Epic and grand",
      motion: "Sweeping camera movements",
      texture: "Ultra-sharp with fine detail",
    },
    manual: defaultManualFromPreset({
      lighting: "Cinematic dramatic lighting",
      colorPalette: "Vibrant saturated colors",
      aesthetic: "Fantasy medieval",
      atmosphere: "Ethereal and dreamlike",
      mood: "Epic and grand",
      motion: "Sweeping camera movements",
      texture: "Ultra-sharp with fine detail",
    }),
  },

  "Sci-Fi": {
    medium: Medium.photorealistic,
    filmFormat: null,
    filmGrain: null,
    depthOfField: DepthOfField.shallow,
    detailLevel: 95,
    preset: {
      lighting: "Neon lighting",
      colorPalette: "Cool tones (blues, greens, purples)",
      aesthetic: "Futuristic sci-fi",
      atmosphere: "Clear and bright",
      mood: "Neutral",
      motion: "Smooth steady movement",
      texture: "Sharp and crisp",
    },
    manual: defaultManualFromPreset({
      lighting: "Neon lighting",
      colorPalette: "Cool tones (blues, greens, purples)",
      aesthetic: "Futuristic sci-fi",
      atmosphere: "Clear and bright",
      mood: "Neutral",
      motion: "Smooth steady movement",
      texture: "Sharp and crisp",
    }),
  },

  Western: {
    medium: Medium.film35mm,
    filmFormat: FilmFormat.anamorphic,
    filmGrain: FilmGrain.subtle,
    depthOfField: DepthOfField.deep,
    detailLevel: 85,
    preset: {
      lighting: "Golden hour (sunrise/sunset)",
      colorPalette: "Earth tones (browns, greens)",
      aesthetic: "Western frontier",
      atmosphere: "Gritty and raw",
      mood: "Heroic and adventurous",
      motion: "Sweeping camera movements",
      texture: "Grainy / organic",
    },
    manual: defaultManualFromPreset({
      lighting: "Golden hour (sunrise/sunset)",
      colorPalette: "Earth tones (browns, greens)",
      aesthetic: "Western frontier",
      atmosphere: "Gritty and raw",
      mood: "Heroic and adventurous",
      motion: "Sweeping camera movements",
      texture: "Grainy / organic",
    }),
  },

  "Vector Animation": {
    medium: Medium.animation2D,
    filmFormat: null,
    filmGrain: null,
    depthOfField: null,
    detailLevel: 50,
    preset: {
      lighting: "Flat even lighting",
      colorPalette: "Bright vivid primary colors",
      aesthetic: "Vector graphics geometric",
      atmosphere: "Clean and modern",
      mood: "Neutral",
      motion: "Geometric transitions",
      texture: "Clean cel-shaded",
    },
    manual: defaultManualFromPreset({
      lighting: "Flat even lighting",
      colorPalette: "Bright vivid primary colors",
      aesthetic: "Vector graphics geometric",
      atmosphere: "Clean and modern",
      mood: "Neutral",
      motion: "Geometric transitions",
      texture: "Clean cel-shaded",
    }),
  },

  "Stop Motion": {
    medium: Medium.stopMotion,
    filmFormat: null,
    filmGrain: null,
    depthOfField: DepthOfField.moderate,
    detailLevel: 80,
    preset: {
      lighting: "Studio three-point lighting",
      colorPalette: "Muted pastels",
      aesthetic: "Puppet stop motion",
      atmosphere: "Playful and whimsical",
      mood: "Whimsical",
      motion: "Stop motion frame-by-frame",
      texture: "Handmade miniature materials",
    },
    manual: defaultManualFromPreset({
      lighting: "Studio three-point lighting",
      colorPalette: "Muted pastels",
      aesthetic: "Puppet stop motion",
      atmosphere: "Playful and whimsical",
      mood: "Whimsical",
      motion: "Stop motion frame-by-frame",
      texture: "Handmade miniature materials",
    }),
  },

  "Watercolor Dream": {
    medium: Medium.watercolor,
    filmFormat: null,
    filmGrain: null,
    depthOfField: null,
    detailLevel: 60,
    preset: {
      lighting: "Soft and diffused",
      colorPalette: "Muted pastels",
      aesthetic: "Watercolor painting",
      atmosphere: "Ethereal and dreamlike",
      mood: "Serene",
      motion: "Fluid organic motion",
      texture: "Watercolor paper",
    },
    manual: defaultManualFromPreset({
      lighting: "Soft and diffused",
      colorPalette: "Muted pastels",
      aesthetic: "Watercolor painting",
      atmosphere: "Ethereal and dreamlike",
      mood: "Serene",
      motion: "Fluid organic motion",
      texture: "Watercolor paper",
    }),
  },

  "Pixel Art": {
    medium: Medium.pixelArt,
    filmFormat: null,
    filmGrain: null,
    depthOfField: null,
    detailLevel: 30,
    preset: {
      lighting: "Flat even lighting",
      colorPalette: "Limited palette colors",
      aesthetic: "Retro pixel graphics",
      atmosphere: "Nostalgic retro",
      mood: "Playful",
      motion: "Pixel animation",
      texture: "Pixelated",
    },
    manual: defaultManualFromPreset({
      lighting: "Flat even lighting",
      colorPalette: "Limited palette colors",
      aesthetic: "Retro pixel graphics",
      atmosphere: "Nostalgic retro",
      mood: "Playful",
      motion: "Pixel animation",
      texture: "Pixelated",
    }),
  },

  "Comic Book": {
    medium: Medium.animation2D,
    filmFormat: null,
    filmGrain: null,
    depthOfField: null,
    detailLevel: 75,
    preset: {
      lighting: "Dramatic shadows",
      colorPalette: "Bright vivid primary colors",
      aesthetic: "Comic book graphic novel",
      atmosphere: "Energetic",
      mood: "Dynamic",
      motion: "Dynamic action poses",
      texture: "Halftone dots ink lines",
    },
    manual: defaultManualFromPreset({
      lighting: "Dramatic shadows",
      colorPalette: "Bright vivid primary colors",
      aesthetic: "Comic book graphic novel",
      atmosphere: "Energetic",
      mood: "Dynamic",
      motion: "Dynamic action poses",
      texture: "Halftone dots ink lines",
    }),
  },
};
