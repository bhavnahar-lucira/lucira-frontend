/**
 * Instructional artwork for the ring sizer, authored as inline SVG.
 *
 * Deliberately illustration rather than photography: every one of these images
 * is explaining a physical ACTION (lie the phone flat, lay the card sideways,
 * rest the ring on the circle, wrap and mark the strip). Line art isolates the
 * action; a photo drags in a hand, a table, a lighting setup and a manicure,
 * all of which compete with the one thing the user needs to copy.
 *
 * They also cost no network requests, which matters on a page whose accuracy
 * depends on rendering at a known scale before the user starts measuring.
 *
 * Palette is shared with chrome.jsx. If real photography is supplied later,
 * these swap out one component at a time.
 */

const INK = "#3F2E2C";
const LINE = "#C9AFA6";
const SOFT = "#EFE4DF";
const GOLD = "#C8A15A";
const GOLD_DARK = "#A8823F";

/* ---------------------------------------------------------------- shared */

function Frame({ children, viewBox = "0 0 320 240", className = "" }) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
    >
      {children}
    </svg>
  );
}

/** Soft contact shadow used under objects resting on a surface. */
function Shadow({ cx, cy, rx, ry = 6, opacity = 0.16 }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={INK} opacity={opacity} />;
}

/* ------------------------------------------------------- intro hero */

/**
 * Intro screen: a phone lying flat with a card laid sideways across it -
 * the whole tool in one picture, including the overhang that surprises people.
 */
export function IntroHero({ className = "" }) {
  return (
    <Frame viewBox="0 0 320 240" className={className}>
      <rect width="320" height="240" fill="#FAEFE9" />

      {/* surface */}
      <line x1="0" y1="182" x2="320" y2="182" stroke={LINE} strokeWidth="1" />

      <Shadow cx="160" cy="184" rx="104" ry="9" />

      {/* phone, slight perspective */}
      <rect x="96" y="52" width="128" height="128" rx="14" fill="#fff" stroke={INK} strokeWidth="1.5" />
      <rect x="104" y="60" width="112" height="112" rx="8" fill={SOFT} />

      {/* card lying across, overhanging both edges */}
      <g>
        <rect x="52" y="96" width="216" height="40" rx="5" fill="#fff" stroke={INK} strokeWidth="1.5" />
        <rect x="52" y="96" width="216" height="12" rx="5" fill={GOLD} opacity="0.28" />
        <rect x="64" y="118" width="46" height="5" rx="2.5" fill={LINE} />
        <rect x="118" y="118" width="30" height="5" rx="2.5" fill={LINE} />
        <rect x="226" y="115" width="28" height="12" rx="2" fill={GOLD} opacity="0.55" />
      </g>

      {/* overhang callouts */}
      <path d="M52 152 L52 164 M52 158 L36 158" stroke={LINE} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M268 152 L268 164 M268 158 L284 158" stroke={LINE} strokeWidth="1.5" strokeLinecap="round" />
    </Frame>
  );
}

/* -------------------------------------------------- step 01: flat surface */

/**
 * Side elevation, because "flat" is a statement about the angle between the
 * phone and the table - which a top-down view cannot show at all.
 */
export function FlatSurfaceIllustration({ className = "" }) {
  return (
    <Frame viewBox="0 0 320 240" className={className}>
      <rect width="320" height="240" fill="#FAEFE9" />

      {/* table edge */}
      <line x1="24" y1="168" x2="296" y2="168" stroke={INK} strokeWidth="1.5" />
      <g opacity="0.35">
        {[40, 72, 104, 136, 168, 200, 232, 264].map((x) => (
          <line key={x} x1={x} y1="170" x2={x - 12} y2="186" stroke={LINE} strokeWidth="1.5" />
        ))}
      </g>

      <Shadow cx="160" cy="167" rx="86" ry="5" opacity={0.2} />

      {/* phone lying flat, seen almost edge-on */}
      <rect x="76" y="150" width="168" height="14" rx="6" fill="#fff" stroke={INK} strokeWidth="1.5" />
      <rect x="84" y="154" width="152" height="6" rx="3" fill={SOFT} />

      {/* level indicator - reads as "parallel to the surface" */}
      <g stroke={GOLD_DARK} strokeWidth="1.5" strokeLinecap="round">
        <line x1="76" y1="132" x2="244" y2="132" strokeDasharray="5 5" />
        <path d="M150 124 L160 132 L170 124" fill="none" />
      </g>

      {/* rejected: tilted phone */}
      <g opacity="0.4">
        <rect
          x="196"
          y="74"
          width="96"
          height="11"
          rx="5"
          fill="#fff"
          stroke={INK}
          strokeWidth="1.5"
          transform="rotate(-18 244 80)"
        />
        <circle cx="244" cy="60" r="11" stroke={INK} strokeWidth="1.5" fill="none" />
        <path d="M239 55 L249 65 M249 55 L239 65" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </Frame>
  );
}

/* --------------------------------------------- step 03: branch options */

/** Option A: an existing ring resting on the on-screen circle. */
export function HasRingIllustration({ className = "" }) {
  return (
    <Frame viewBox="0 0 320 200" className={className}>
      <rect width="320" height="200" fill={SOFT} />

      {/* phone screen area */}
      <rect x="70" y="18" width="180" height="164" rx="10" fill="#fff" stroke={LINE} strokeWidth="1.5" />

      {/* faint measuring grid */}
      <g opacity="0.5">
        {[86, 102, 118, 134, 150, 166, 182, 198, 214, 230].map((x) => (
          <line key={`v${x}`} x1={x} y1="18" x2={x} y2="182" stroke={LINE} strokeWidth="0.5" />
        ))}
        {[34, 50, 66, 82, 98, 114, 130, 146, 162].map((y) => (
          <line key={`h${y}`} x1="70" y1={y} x2="250" y2={y} stroke={LINE} strokeWidth="0.5" />
        ))}
      </g>

      {/* target circle */}
      <circle cx="160" cy="100" r="38" stroke={INK} strokeWidth="1.5" fill="none" />

      {/* gold band sitting on top, just outside the circle */}
      <circle cx="160" cy="100" r="45" stroke={GOLD} strokeWidth="9" fill="none" />
      <circle cx="160" cy="100" r="45" stroke={GOLD_DARK} strokeWidth="1" fill="none" opacity="0.6" />
      <circle cx="160" cy="55" r="7" fill="#fff" stroke={GOLD_DARK} strokeWidth="1.2" />
    </Frame>
  );
}

/** Option B: a paper strip wrapped around a finger with the overlap marked. */
export function NoRingIllustration({ className = "" }) {
  return (
    <Frame viewBox="0 0 320 200" className={className}>
      <rect width="320" height="200" fill={SOFT} />

      {/* finger */}
      <path
        d="M136 190 L136 74 Q136 46 160 46 Q184 46 184 74 L184 190 Z"
        fill="#fff"
        stroke={INK}
        strokeWidth="1.5"
      />
      <path d="M146 62 Q160 54 174 62" stroke={LINE} strokeWidth="1.2" fill="none" />

      {/* paper strip wrapped around */}
      <rect x="124" y="104" width="72" height="30" rx="3" fill="#FBF3EF" stroke={INK} strokeWidth="1.5" />
      <path d="M196 104 L216 98 L216 128 L196 134 Z" fill="#F3E6E0" stroke={INK} strokeWidth="1.5" />

      {/* the mark at the overlap */}
      <line x1="196" y1="104" x2="196" y2="134" stroke={GOLD_DARK} strokeWidth="2.5" />
      <circle cx="196" cy="119" r="16" stroke={GOLD_DARK} strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
    </Frame>
  );
}

/* ------------------------------------------- paper branch: what you need */

export function PaperToolsHero({ className = "" }) {
  return (
    <Frame viewBox="0 0 320 240" className={className}>
      <rect width="320" height="240" fill="#FAEFE9" />
      <Shadow cx="160" cy="196" rx="106" ry="8" opacity={0.12} />

      {/* strip */}
      <rect x="40" y="92" width="180" height="26" rx="3" fill="#fff" stroke={INK} strokeWidth="1.5" />
      <line x1="168" y1="92" x2="168" y2="118" stroke={GOLD_DARK} strokeWidth="2.5" />

      {/* marker */}
      <g transform="rotate(-24 232 150)">
        <rect x="204" y="138" width="72" height="20" rx="4" fill={GOLD} opacity="0.85" />
        <path d="M276 140 L292 148 L276 156 Z" fill={INK} />
        <rect x="210" y="138" width="8" height="20" fill={GOLD_DARK} opacity="0.7" />
      </g>

      {/* scissors */}
      <g transform="translate(56 142)" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round">
        <line x1="6" y1="6" x2="46" y2="44" />
        <line x1="46" y1="6" x2="6" y2="44" />
        <circle cx="3" cy="50" r="7" />
        <circle cx="49" cy="50" r="7" />
      </g>
    </Frame>
  );
}

/* ------------------------------------------------- checklist item icons */

export function RingGlyph({ size = 22, className = "" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" className={className} role="presentation">
      <circle cx="12" cy="14.5" r="6.5" stroke={INK} strokeWidth="1.6" />
      <path d="M9.4 7.6 L12 4 L14.6 7.6" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function StripGlyph({ size = 22, className = "" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" className={className} role="presentation">
      <rect x="2.5" y="8" width="19" height="8" rx="1.5" stroke={INK} strokeWidth="1.6" />
      <line x1="16" y1="8" x2="16" y2="16" stroke={INK} strokeWidth="1.6" />
    </svg>
  );
}

/* ------------------------------------------------ result: product stand-in */

/**
 * Neutral ring glyph for the recommendation carousel until real product
 * imagery is wired in. Intentionally generic - it should read as "a ring goes
 * here", not as a specific Lucira piece.
 */
export function RingProductGlyph({ className = "" }) {
  return (
    <Frame viewBox="0 0 120 120" className={className}>
      <circle cx="60" cy="68" r="30" stroke={GOLD} strokeWidth="7" fill="none" />
      <circle cx="60" cy="68" r="30" stroke={GOLD_DARK} strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M60 24 L69 36 L60 48 L51 36 Z" fill="#fff" stroke={GOLD_DARK} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M51 36 L69 36" stroke={GOLD_DARK} strokeWidth="1" opacity="0.7" />
    </Frame>
  );
}
