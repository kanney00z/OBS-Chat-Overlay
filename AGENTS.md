# UI/UX Pro Max - Design Intelligence Rulebook (AGENTS.md)

This file contains the persistent design intelligence and guidelines for modifying, styling, and architecting user interfaces in this project. All AI developers working on this workspace must strictly adhere to these guidelines to ensure world-class UI/UX aesthetic, tactile kinetics, and functional clarity.

---

## 1. Visual Aesthetics & Themes

All UI alterations must align with one of the predefined elite visual styles, prioritising polish, unique brand character, and cohesive color mappings. 

### 🌌 Theme 1: Cosmic Slate / Neon Glow (Modernist Tech)
*   **Palette**: Dark Charcoal (#09090b, #18181b), Slate Blue (#3f3f46), neon cyan (#00f3ff), fuchsia pink (#ff007f), and radioactive amber.
*   **Aesthetics**: Glassmorphism containers with subtle borders (`border-white/10` or `border-[#00f3ff]/20`), strong neon outer glows/drop shadows (`drop-shadow-[0_0_15px_rgba(0,243,255,0.2)]`), and responsive kinetic hover scaling (`hover:scale-102`).
*   **Typography**: Industrial space-inspired headings ("Space Grotesk") combined with technical coding accents ("JetBrains Mono").

### 🌸 Theme 2: Aesthetic Sakura / Neko Paw (Kawaii & Playful)
*   **Palette**: Blossom Pink (#ffe3ec, #ffb3c1), Cherry Red (#ff4d6d, #ff758f), and Creamy White (#fff5f7).
*   **Aesthetics**: Delightfully rounded curves (`rounded-[36px]` or `rounded-full`), double borders, cat ear accents, and bouncy spring animations. Heart-shaped motifs and flowing cherry blossom paths style are highly encouraged.
*   **Typography**: Cute, friendly, accessible rounded display hierarchy combined with micro sans tags for descriptions.

### ❄️ Theme 3: Aesthetic Snow (Minimalist Etsy)
*   **Palette**: Soft Ice Blue (#f0f8ff), Pure White (#ffffff), Deep Navy (#0b0914), and Violet Glow (#8b5cf6).
*   **Aesthetics**: Ultra-fine white/gray borders (`border-slate-800/80` or `border-zinc-700/40`), high-contrast modern shadows, glass caps, and clean pill badges.
*   **Typography**: Airy, elegant, clean display sans-serif paired with code tags ("JetBrains Mono") for subheadings.

---

## 2. Interactive States & Kinetic Motion

Every user-facing event or state transition must be smooth, reactive, and visually communicative.

### Motion Principles (utilizing `motion` from `motion/react` or standard CSS transition)
*   **Transitions**: Never let elements instantly jump into layout unless they are heavy database lists. Use smooth ingress fade-and-rise animations:
    ```tsx
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    ```
*   **Hover Reactions**: Always enhance buttons, cards, and list-items with tactile cursor feedback:
    ```tailwind
    transition-all duration-300 hover:scale-103 active:scale-97 hover:bg-white/10
    ```
*   **Rhythm**: Stagger child entrances (`staggerChildren` in Framer Motion / motion/react) to create a premium, intentional flow rather than rendering everything at once.

---

## 3. Typography & Hierarchy Rules

Typography should feel highly curated and deliberately structured:
1.  **Display Headings**: Always use expressive fonts, bold weights (`font-extrabold` or `font-black`), and spacious tracking (`tracking-wide` or `tracking-[0.2em]`) for short labels.
2.  **Paragraphs**: Keep body text dark grey/off-white (`text-zinc-300` or `text-[#591e31]`), setting the line height to at least `leading-relaxed` for reading comfort.
3.  **Accent Metadata**: Style minor tags (such as time stamps, source platforms, or status codes) utilizing `font-mono text-[9px]` with upper casing for that deliberate developer touch.

---

## 4. Layout Architecture: Bento Grids & Density

*   **Asymmetrical Bento Grids**: Organize complex dashboards into grid structures with varying horizontal span sizes (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3` with some spanning `col-span-2`).
*   **Proportionate Margins & Paddings**: Prevent layout blockiness by avoiding exact equal spacing everywhere. Introduce varying densities (e.g. `p-6` for main cards, `p-3` for secondary logs, `py-1.5 px-3` for buttons).
*   **Empty State Delight**: Never show blank spaces or incomplete forms as empty white rects. Style empty-states with elegant illustration wrappers, muted colors, and subtle callouts.

---

## 5. Architectural Integrity (Anti-AI-Slop Guidelines)

1.  **No Margin Clutter**: Keep outer borders and marginal zones of overlay widgets pristine. Do not add mock terminal code lines, container port numbers, fake ping times, or author branding margins unless specifically requested.
2.  **Humbler, Literal Labels**: Always use accessible, straightforward naming (e.g., "Settings", "Overlay Center", "Theme Panel") rather than dramatic names like "Chronos Grid System" or "Apex Stream Dashboard".
3.  **Proper Icon Strategy**: Use `lucide-react` exclusively for icons. Choose simple, universally readable options (e.g., `Heart`, `Gift`, `UserPlus`, `Camera`, `Settings`). Never draft custom raw SVGs inside React classes.
