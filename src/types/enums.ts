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

  "70mm Epic": {
    medium: Medium.film70mm,
    filmFormat: FilmFormat.imax,
    filmGrain: FilmGrain.subtle,
    depthOfField: DepthOfField.moderate,
    detailLevel: 95,
    preset: {
      lighting: "Cinematic dramatic lighting",
      colorPalette: "Vibrant saturated colors",
      aesthetic: "Cinematic blockbuster",
      atmosphere: "Epic and grand",
      mood: "Heroic and adventurous",
      motion: "Sweeping camera movements",
      texture: "Ultra-sharp with fine detail",
    },
    manual: {
      lighting: "Dramatic three-point setup, 45-degree key with strong directional shadows. High contrast, balanced fill preserving detail. Backlight for separation and heroic rim lighting.",
      colorPalette: "Rich saturated primaries with warm undertones. Cool blues and purples in shadows, warm golds in highlights. Crushed blacks and bloomed highlights for large-format aesthetic.",
      aesthetic: "Sweeping 70mm IMAX blockbuster with massive scope. Every frame composed like a painting with perfect symmetry. Practical effects prioritized over digital.",
      atmosphere: "Grand epic scale evoking awe. Vast landscapes and monumental architecture dwarfing subjects. Rolling storm clouds, divine light shafts, swirling dust and mist.",
      mood: "Heroic and adventurous, inspiring courage. Triumphant tone with sacrifice and nobility undertones. Quiet introspection before explosive action.",
      motion: "Sweeping Technocrane and Steadicam movements. Slow deliberate push-ins building tension. Orbital reveals of scope. Crane-ups from intimate to epic. Locked-off for gravitas.",
      texture: "Ultra-sharp 70mm clarity with fine detail across frame. Extremely fine organic grain, barely perceptible. Tack-sharp foreground and background. Subtle halation on bright sources.",
    },
  },

  Anime: {
    medium: Medium.animation2D,
    filmFormat: null,
    filmGrain: null,
    depthOfField: null,
    detailLevel: 80,
    preset: {
      lighting: "Bright anime-style cel shading",
      colorPalette: "Vibrant saturated colors",
      aesthetic: "Japanese anime",
      atmosphere: "Energetic",
      mood: "Dynamic",
      motion: "Exaggerated action",
      texture: "Clean cel-shaded",
    },
    manual: {
      lighting: "Bright high-contrast cel shading with distinct light/shadow planes. Hard edge transitions, minimal gradation. Strong rim lighting on character edges. Pure white specular highlights on eyes and hair.",
      colorPalette: "Vibrant saturated primaries, pure even in shadows. Complementary colors for impact. Limited 3-5 color palettes per character. Desaturated backgrounds push focus to characters.",
      aesthetic: "Japanese anime with clean varying-weight linework. Large expressive eyes. Dynamic still frames, speed lines, impact frames. Detailed keyframes with simplified in-betweens.",
      atmosphere: "Energetic vibrant atmosphere with youthful enthusiasm. Dynamic compositions, dutch angles, dramatic perspective. Stylized graphic environments. Weather reflects emotions symbolically.",
      mood: "Dynamic emotionally expressive mood. Exaggerated expressions and body language. Rapid shifts from comedy to drama. Sakuga techniques for powerful action impact.",
      motion: "Exaggerated theatrical movement with anticipation poses. Smear frames and speed lines. Impact frames freeze at contact. Handheld-style pans and zooms. Bouncy follow-through animation.",
      texture: "Clean crisp cel-shaded with flat fills and sharp lineart. No grain - pure digital clarity. Screentones for effects. Pure white highlights, saturated shadow tones. Glow and bloom effects.",
    },
  },

  Cyberpunk: {
    medium: Medium.photorealistic,
    filmFormat: null,
    filmGrain: null,
    depthOfField: null,
    detailLevel: 90,
    preset: {
      lighting: "Neon lighting",
      colorPalette: "Neon colors",
      aesthetic: "Cyberpunk dystopian",
      atmosphere: "Rainy urban decay",
      mood: "Dark and gritty",
      motion: "Glitchy effects",
      texture: "Wet and reflective surfaces",
    },
    manual: {
      lighting: "Harsh neon with cyan/magenta LED color contamination. Volumetric fog scatter creating light shafts. Flickering fluorescents. Backlit steam and smoke. Crushed blacks in unlit areas.",
      colorPalette: "Electric cyan, hot magenta, toxic green, midnight blue. Sodium yellows versus LED blues. Saturation pushed uncomfortable. Desaturated sickly skin tones. Chromatic aberration artifacts.",
      aesthetic: "Dystopian cyberpunk with dense neon signage and holograms. High-tech corporate towers above grimy streets. Asian typography influences. Visible wiring and technological augmentation.",
      atmosphere: "Oppressive constant rain, fog, urban decay. Perpetual night. Steam from grates, wet surfaces. Claustrophobic density. Omnipresent surveillance. Corporate stratification above desperate streets.",
      mood: "Dark gritty dystopian hopelessness with rebellious defiance. Noir moral ambiguity. Systemic corruption. Paranoid surveillance undertones. Transhumanist transcendence moments.",
      motion: "Kinetic camera with glitchy artifacts. Rapid surveillance-style cuts. Handheld documentary feel. Smooth drone tracking. Time remapping. Scan lines, signal interference. Slow-motion action beats.",
      texture: "Wet reflective surfaces - rain-slicked streets, metal, glass. Neon mirror reflections. Grime and weathering everywhere. Digital noise artifacts. Lens flares and chromatic aberration.",
    },
  },

  Documentary: {
    medium: Medium.film16mm,
    filmFormat: FilmFormat.standard,
    filmGrain: FilmGrain.moderate,
    depthOfField: DepthOfField.deep,
    detailLevel: 70,
    preset: {
      lighting: "Natural daylight",
      colorPalette: "Desaturated / washed out",
      aesthetic: "Documentary realism",
      atmosphere: "Gritty and raw",
      mood: "Contemplative",
      motion: "Handheld / cinéma vérité",
      texture: "Grainy / organic",
    },
    manual: {
      lighting: "Natural available light only from practical sources - windows, fluorescents, streetlights. Ambient exposure even if suboptimal. Underexposed shadows, blown highlights acceptable. Backlit silhouettes.",
      colorPalette: "Muted realistic tones without stylized grading. Slight desaturation with fluorescent/tungsten color casts. Uncorrected mixed temperatures. Earth tones, realistic skin without enhancement.",
      aesthetic: "Cinéma vérité documentary realism prioritizing truth over beauty. Raw unpolished observational approach. Real locations and situations. Imperfect framing acceptable for genuine moments.",
      atmosphere: "Authentic real environments without set dressing. Spaces as they exist. Background activity suggesting life beyond frame. Environmental context showing socioeconomic reality.",
      mood: "Observational non-judgmental mood. Empathetic but not sentimental. Intimate psychological closeness. Sometimes uncomfortable confronting difficult realities. Humanistic dignity.",
      motion: "Handheld with natural shake and breathing. Reactive following rather than choreographed. Jerky corrections, momentary defocus. Visible zoom adjustments. Shoulder-mounted instability.",
      texture: "Organic 16mm grain visible in shadows and midtones. Slight softness, lower contrast. Natural halation on highlights. Gate weave. Dust and scratches as authenticity marks.",
    },
  },

  Claymation: {
    medium: Medium.stopMotion,
    filmFormat: null,
    filmGrain: null,
    depthOfField: DepthOfField.moderate,
    detailLevel: 75,
    preset: {
      lighting: "Soft and diffused",
      colorPalette: "Vibrant saturated colors",
      aesthetic: "Stop motion clay animation",
      atmosphere: "Playful and whimsical",
      mood: "Whimsical",
      motion: "Stop motion frame-by-frame",
      texture: "Clay plasticine handmade",
    },
    manual: {
      lighting: "Soft even studio lighting with diffused sources minimizing shadows. Miniature practicals in sets. Subtle rim for separation. Consistent across frames. Cool temperature.",
      colorPalette: "Vibrant saturated pigmented plasticine colors. Bold primaries with playful combinations. Distinctive character color schemes. Complementary background colors. Hand-mixed marbling variations.",
      aesthetic: "Handcrafted clay animation with visible fingerprints and tool marks. Expressive exaggerated character designs. Meticulous miniature sets. Everything physically constructed - no digital characters.",
      atmosphere: "Playful tactile handmade charm. Whimsical miniature worlds. Cozy contained character-scale spaces. Practical miniature effects. Environmental storytelling through tiny details.",
      mood: "Whimsical lighthearted with gentle humor and heart. Plasticine malleability for expression. Squash and stretch comedy. Earnest sincerity. Cozy domestic scenarios and small adventures.",
      motion: "Jerky stop-motion at 24fps on ones or twos. Visible strobing. Exaggerated anticipation and follow-through. Characters wobble, sets breathe. Miniature dolly and crane moves.",
      texture: "Rich clay texture with matte surface showing fingerprints and tool marks. Organic deformation under pressure. Hand-mixed color striations. Sculpted hair strands. Miniature set textures.",
    },
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
    manual: {
      lighting: "Dramatic chiaroscuro with deep blacks and hot highlights. Hard single sources casting venetian blind shadows. Shadowy areas hide faces for mystery. Rim lighting separation. Low-key dominant.",
      colorPalette: "High-contrast black and white. Crushed blacks, near-clipping highlights. Pure black shadows, near-white highlights. Silver nitrate aesthetic with rich midtone gradation. Strictly monochromatic.",
      aesthetic: "1940s-50s noir with Expressionist shadows. Low angles showing ceilings. Wet streets reflecting lights. Urban nightscape - alleys, diners, cheap hotels. Venetian blind shadows.",
      atmosphere: "Dark mysterious urban corruption. Rain-slicked streets, neon, cigarette smoke. Late night. Seedy bars, frosted offices. Interrogation rooms. Docks. Fog-obscured backgrounds.",
      mood: "Cynical brooding moral ambiguity and existential dread. Hardboiled worldview. Fatalistic corruption. Sexual tension, dangerous desire. Paranoid psychology. Doomed romance, tragic endings.",
      motion: "Deliberate purposeful composition. Dutch angles for unease. Low angles suggesting menace. Slow push-ins building tension. Lateral tracking. Crane reveals. Locked-off dramatic scenes.",
      texture: "Visible 35mm grain in shadows. Sharp face focus with soft bokeh backgrounds. High midtone definition. Hard shadow edges. Slight halation on brights. Classic silver halide response.",
    },
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
    manual: {
      lighting: "Deeply underexposed with impenetrable darkness. Limited practicals - candles, flashlights, moonlight. Extreme low-key, shadow-dominated. Sinister backlit silhouettes. Harsh sidelight.",
      colorPalette: "Heavily desaturated draining life. Strategic visceral red accents. Sickly decay greens. Cold blue moonlight. Jaundiced sodium skin. Near-monochrome with selective saturation. Teal-black shadows.",
      aesthetic: "Atmospheric horror with slow-burn psychological dread. Meticulous unsettling symmetry. Practical effects over CGI. Found-footage or elevated arthouse approach. Sustained unease and ambiguity.",
      atmosphere: "Eerie supernatural dread and psychological unraveling. Isolated remote houses, empty forests, abandoned institutions. Wrong-feeling time. Uncanny quiet with disturbing sounds. Being watched.",
      mood: "Creeping dread building to terror. Paranoid anxiety. Loss of control and sanity. Ancient evil or human monstrosity. Safe spaces violated. Helplessness. Nihilistic endings.",
      motion: "Slow deliberate movements building dread. Long static holds on empty spaces. Sudden violent shock cuts. Handheld panic sequences. Slow push-ins on terrified faces. Dark corridor POV.",
      texture: "Dark gritty prominent grain in shadows. Heavy contrast crushing detail. Practical blood and decay texture. Rough surfaces, peeling wallpaper, mold. Pushed film stock. Shallow depth isolation.",
    },
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
    manual: {
      lighting: "Magical otherworldly glow with mystical luminescence. Glowing crystals, enchanted artifacts, divine beams. Enhanced golden hour. Volumetric god rays. Purple/blue/gold rim lighting.",
      colorPalette: "Hyper-saturated jewel tones with metallic accents. Purple/magenta magic, emerald nature, golden divine. Sunset oranges. Natural skin against fantastical. Misty blue depth.",
      aesthetic: "Epic high fantasy with meticulous world-building. Medieval European mixed with fantastical. Matte paintings enhance sets. Realistic-imaginative creatures. Culturally-rich costumes.",
      atmosphere: "Awe-inspiring magical wonder. Ancient ruins. Misty towering forests. Castle spires against dramatic skies. Visible magic - glowing runes, particles. Supernatural weather.",
      mood: "Epic enchanting heroism and quest. Noble characters facing mythic challenges. Impossible romance. Sacrificial tragedy. Hope against darkness. Childlike wonder. Destiny-driven action.",
      motion: "Sweeping epic scale and spectacle. Crane shots revealing magical landscapes. Aerial armies and castles. Triumphant hero orbits. Slow-motion spell casting. Steadicam through elaborate environments.",
      texture: "Ultra-sharp digital clarity with fine costume, armor, environment detail. Aged leather, weathered metal, embroidered fabric. Ethereal translucent magic particles.",
    },
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
    manual: {
      lighting: "Cold artificial tech - LED panels, holograms, bioluminescence. Clinical overhead in sterile spaces. Blue operational, red alert accents. Single-source spaceship shadows. Volumetric light.",
      colorPalette: "Cool cyan, teal, ice blue with amber/orange human accents. Desaturated base with punchy interface colors. Organic-synthetic separation. White environments. Digital precision.",
      aesthetic: "Sleek futuristic with clean geometric precision. Believable near-future technology extrapolation. Minimalist sophistication avoiding clutter. Real sets with seamless CG. Functional technology design.",
      atmosphere: "Sterile controlled advanced civilization. Climate-controlled recycled air. Machinery hum. Antiseptic cleanliness. Vast minimal spaces. Alien vistas or deep space. Technological isolation.",
      mood: "Intellectually cold yet wonder-filled. Philosophical consciousness and identity questions. Cosmic awe. Space travel isolation. Balanced hope and fear. Cerebral detachment meets childlike wonder.",
      motion: "Precision robotic camera movements. Perfectly smooth tracking. Symmetrical geometric compositions. Slow deliberate cerebral tension. Zero-gravity floating camera. Gimbal impossible perspectives.",
      texture: "Pristine metallic synthetic surfaces with mirror reflections. Brushed aluminum, polished plastic, transparent displays. No organic weathering. Specular materials. Shallow depth. Digital sharpness.",
    },
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
    manual: {
      lighting: "Golden hour warm sunset/sunrise with long landscape shadows. Hard noon sun stark contrast. Dusty haze diffusing light. Oil lamp interiors. Campfire firelight. Desert sky silhouettes.",
      colorPalette: "Warm earth tones - dusty browns, leather tans, faded denim, rusty reds, golden wheat. Desaturated age and harshness. Sepia undertones. Deep orange sunsets. Bleached sun highlights.",
      aesthetic: "Classic Hollywood Western with Monument Valley vistas. One-street frontier towns, wooden boardwalks. Weathered Stetsons, bandanas, dusty boots. Widescreen anamorphic horizontal compositions.",
      atmosphere: "Harsh unforgiving frontier under relentless sun and endless skies. Vast landscapes of freedom and danger. Dust devils, tumbleweeds. Isolated settlements. Smoky saloons. Desert silence, wind, eagles.",
      mood: "Rugged individualist frontier spirit. Laconic decisive heroes. Personal justice. Frontier romance and brutal reality. Stoic hardship acceptance. Melancholy for passing era.",
      motion: "Wide establishing shots with tiny figures against nature. Slow standoff push-ins. Rapid action whip pans. Galloping horse dollies. Static weather-beaten faces. Crane wilderness reveals.",
      texture: "Subtle 35mm grain for period authenticity. Weathered wood, leather, worn denim, dusty boots. Sand, tumbleweeds, rough stone. Anamorphic sun flares. Dust particles in light shafts.",
    },
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
    manual: {
      lighting: "Completely flat ambient lighting with no shadows or highlights. Even illumination across all surfaces. No visible sources - conceptual not realistic. Occasional single-color mood tints.",
      colorPalette: "Limited curated 3-5 color palette plus black and white. Bold flat 100% saturation. Complementary colors for contrast. Purposeful color choices. Swiss/Bauhaus principles. No gradients.",
      aesthetic: "Pure vector graphics with geometric abstraction. Mathematical curves and straight lines. Swiss/Bauhaus design principles. Essential geometric forms only. No photographic or organic elements.",
      atmosphere: "Clean organized modern tech atmosphere. Minimalist sophisticated efficiency. Digital-native never mimicking physical. Abstract spatial relationships. Purposeful negative space as design element.",
      mood: "Professional minimalist for corporate and educational content. Friendly not childish. Modern forward-thinking. Visually clear and accessible. Confident simplicity. Optimistic without chaos.",
      motion: "Smooth mathematically perfect geometric transitions. Tweened morphing shapes. Perfect axis rotations. Ease-in ease-out timing curves. No motion blur or physics. Choreographed simultaneous movements.",
      texture: "Absolutely no texture - pure flat fills. Perfectly smooth mathematically clean edges. Anti-aliased digital smoothness. No grain, noise, or variation. Matte finish. Flat transparency percentages.",
    },
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
    manual: {
      lighting: "Controlled studio lighting for miniature scale. Soft diffused sources preventing harsh shadows. LED practicals in sets. Consistent lighting across days. Fiber optics for tiny details.",
      colorPalette: "Muted realistic miniature material colors - painted foam, carved wood, knitted fabric, molded resin. Slightly desaturated practicals. Distinctive character palettes. Subtle lighting gels for mood.",
      aesthetic: "Puppet stop-motion with sophisticated armatures. Incredible miniature set detail using hard and soft materials. Replacement face animation. CG enhancement celebrating handmade quality.",
      atmosphere: "Tangible handcrafted with everything physically real at exact scale. Complete environmental detail. Practical miniature effects. Dedicated craft and patience. Frame-by-frame magic.",
      mood: "Nostalgic charming childhood wonder. Whimsical scenarios grounded in puppet physicality. Emotional resonance despite non-human characters. Dark fairy tale sensibility. Earnest handmade celebration.",
      motion: "Frame-by-frame on ones or twos creating characteristic strobing. Subtle hand-adjustment vibration. Malleable squash and stretch. Multiple exposure blur. Motion control camera rigs.",
      texture: "Rich practical material texture - knit stitches, carved wood, brush strokes, silicone pores. Scaled miniature brick, stone, grass. Puppet seams visible. Handmade imperfections.",
    },
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
    manual: {
      lighting: "Soft luminous diffused daylight through morning mist or evening glow. No harsh shadows - gentle ambient bathing. Light emanates from within. Transparency suggests light rather than direct sources.",
      colorPalette: "Delicate pastel washes bleeding together. Optical color mixing at wet edges. Soft pinks, sky blues, lavender, mint, buttery yellow. Diluted desaturated pigments. Paper white as highlights.",
      aesthetic: "Traditional watercolor with blooms, bleeds, granulation, pooling. Loose gestural marks suggesting forms. Visible brush strokes and water movement. Paper texture through transparent washes.",
      atmosphere: "Ethereal dreamlike gentle memories. Soft-focus details dissolving to suggestion. Misty mornings, quiet afternoons, twilight. Transience and impermanence. Nostalgic contemplative stillness.",
      mood: "Serene peaceful meditation and reflection. Gentle emotion without dramatic intensity. Melancholy fleeting beauty. Simple scenes elevated artistically. Calming introspective. Wabi-sabi impermanence.",
      motion: "Fluid organic watercolor washing motion. Dissolving bleeding transitions. Gentle drifts rather than cuts. Subjects emerge from or dissolve into color washes. Liquid flowing quality. Slowed time.",
      texture: "Visible watercolor paper - cold or hot press surface. Pigment granulation in valleys. Backruns and blooms. Hard and soft edges. Salt texture. Authentic watercolor qualities.",
    },
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
    manual: {
      lighting: "Simplified palette-based lighting - shadows through darker hue shifts. Single pixel specular highlights. Directional via lighter pixels. Dithering for gradation illusion. Flat cel-shading.",
      colorPalette: "Strictly limited 8-bit (256) or 16-bit palette. Deliberate fixed-set color choices. Palette ramping with reserved shading hues. Dithering for in-between hues. Authentic retro restrictions.",
      aesthetic: "Authentic retro pixel art honoring 8/16-bit limitations. Pixel-by-pixel sprites and tiles. Isometric or side-scrolling perspective. Intentional pixel placement following arcade traditions.",
      atmosphere: "Nostalgic golden age arcade and console gaming. CRT scanline warmth implied. Chiptune energy. Evocative pixel environments - castles, caves, space stations. Lo-fi charm.",
      mood: "Playful retro celebrating gaming's past. Joyful nostalgia without pastiche. Creative limitations as strength. Indie underdog aesthetic. Earnest classic game heroism. Timeless simplicity.",
      motion: "Frame-by-frame sprite animation with limited choppy charm. 4-8 frame walk cycles. Minimal clear attack animations. Discrete tile scrolling. Parallax depth. Pixelated transitions.",
      texture: "Visible pixel grid - no anti-aliasing, sharp stair-stepping edges. Checkerboard and bayer dithering patterns. Hard upscaled edges. No subpixel positioning. Color variation suggests texture.",
    },
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
    manual: {
      lighting: "High contrast with deep blacks and bright highlights mimicking ink. Harsh directional bold shadow shapes. Rim lighting for outlines. Distinct light/shadow areas. Dramatic face shadows.",
      colorPalette: "Bold primaries with heavy black outlines. Flat fills within areas. Limited scene palettes. High saturation four-color process. Halftone depth patterns. Black-dominant. Sparse white.",
      aesthetic: "Classic comic book with heavy black ink and varying line weights. Ben-Day dots and halftone. Panel-like compositions. Dynamic action poses. Onomatopoeia and speed lines. Pop art.",
      atmosphere: "Dynamic action-packed superhero and noir atmosphere. Urban alleys and skylines. Constant motion energy. Dramatic lightning and rain. Graphic explosive effects. Heightened reality.",
      mood: "Energetic dramatic larger-than-life heroism and villainy. Exaggerated poses and expressions. Triumph and tragedy extremes. Bold good versus evil. Intensity at eleven. Exclamatory not contemplative.",
      motion: "Dynamic action poses held for impact. Speed lines radiating velocity. Multiple blur positions. Impact frames with force lines. Whip pans and dramatic zooms. Panel-like camera angles.",
      texture: "Bold ink lines with varying weights - thick outlines, thin details. Halftone dot tonal variation. Ben-Day vintage printing dots. Shadow crosshatching. Mechanical print texture over organic painting.",
    },
  },
};
