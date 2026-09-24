// One hand-drawn line-art picture per room, all sharing a single style: the same
// off-white stroke, a warm accent for anything that glows (the light, steam), and
// one roughen filter (feTurbulence + feDisplacementMap) that wobbles every stroke
// so nothing looks machine-straight. Keeping the filter and stroke in `sketch()`
// rather than on each drawing is what guarantees the four read as one hand.
// Colours are hard-coded rather than currentColor so the accent stays warm
// regardless of the surrounding text colour. Each value is an SVG string, injected
// via dangerouslySetInnerHTML (the content is static and author-controlled).
const INK = "#e9edf1";
const FAINT = "#8fb3c9"; // sea, distant scaffolding
const GLOW = "#ffd27d"; // matches the heading accent

function sketch(label: string, inner: string, seed: number): string {
  // Unique filter id per drawing so ids never collide if two are ever in the DOM.
  const fid = `rough-${seed}`;
  return (
    `<svg viewBox="0 0 220 150" role="img" aria-label="${label}" ` +
    `fill="none" stroke="${INK}" stroke-width="2.4" ` +
    `stroke-linecap="round" stroke-linejoin="round">` +
    `<title>${label}</title>` +
    `<defs><filter id="${fid}" x="-10%" y="-10%" width="120%" height="120%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" ` +
    `seed="${seed}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"/></filter></defs>` +
    `<g filter="url(#${fid})">${inner}</g>` +
    `</svg>`
  );
}

// A spiral stair reads best built from alternating treads fanning off a central
// newel post, so its treads are generated rather than hand-listed.
function spiralStairArt(): string {
  let treads = "";
  for (let i = 0; i < 8; i++) {
    const ty = 36 + i * 11;
    const w = i % 2 === 0 ? 30 : -30; // alternate the fan side each step down
    treads += `<path d="M108 ${ty} l${w} -7 l0 9 l${-w} 7 z"/>`;
  }
  return sketch(
    "A sketch of an iron spiral staircase",
    // central newel post + knob, the treads, and a base ring
    `<line x1="108" y1="24" x2="108" y2="128"/>` +
      `<circle cx="108" cy="22" r="3"/>` +
      treads +
      `<path d="M92 128 Q108 134 124 128" stroke="${FAINT}"/>`,
    4,
  );
}

export const art: Record<string, string> = {
  // Spiral stair (top left)
  "0,0": spiralStairArt(),

  // Lamp room (top right): a fresnel-lens drum throwing beams out through glass.
  "1,0": sketch(
    "A sketch of the lamp room lens throwing out beams of light",
    `<line x1="55" y1="124" x2="165" y2="124"/>` +
      `<path d="M92 46 L92 112 L128 112 L128 46 Z"/>` +
      `<path d="M92 46 Q110 40 128 46"/>` +
      `<path d="M92 112 Q110 118 128 112"/>` +
      `<line x1="92" y1="58" x2="128" y2="58"/>` +
      `<line x1="92" y1="68" x2="128" y2="68"/>` +
      `<line x1="92" y1="90" x2="128" y2="90"/>` +
      `<line x1="92" y1="100" x2="128" y2="100"/>` +
      `<path d="M100 112 L98 124 L122 124 L120 112"/>` +
      `<circle cx="110" cy="79" r="6" stroke="${GLOW}"/>` +
      `<path d="M128 66 L192 44" stroke="${GLOW}"/>` +
      `<path d="M128 79 L196 79" stroke="${GLOW}"/>` +
      `<path d="M128 92 L192 114" stroke="${GLOW}"/>` +
      `<path d="M92 66 L28 44" stroke="${GLOW}"/>` +
      `<path d="M92 79 L24 79" stroke="${GLOW}"/>` +
      `<path d="M92 92 L28 114" stroke="${GLOW}"/>`,
    7,
  ),

  // Keeper's kitchen (bottom left): stove with a pot, a steaming mug on a table,
  // a plain chair.
  "0,1": sketch(
    "A sketch of the keeper’s kitchen with a stove, a mug and a chair",
    `<line x1="20" y1="126" x2="200" y2="126"/>` +
      // stove
      `<path d="M34 74 L34 126 L86 126 L86 74 Z"/>` +
      `<line x1="30" y1="74" x2="90" y2="74"/>` +
      `<path d="M44 90 L76 90 L76 118 L44 118 Z"/>` +
      `<line x1="48" y1="86" x2="72" y2="86"/>` +
      // pot on top
      `<path d="M48 66 L48 74 L72 74 L72 66 Z"/>` +
      `<line x1="44" y1="66" x2="76" y2="66"/>` +
      `<line x1="60" y1="60" x2="60" y2="66"/>` +
      // table + steaming mug
      `<line x1="106" y1="122" x2="158" y2="122"/>` +
      `<line x1="114" y1="122" x2="114" y2="126"/>` +
      `<line x1="150" y1="122" x2="150" y2="126"/>` +
      `<path d="M120 100 L120 116 Q120 122 126 122 L134 122 Q140 122 140 116 L140 100 Z"/>` +
      `<line x1="120" y1="100" x2="140" y2="100"/>` +
      `<path d="M140 104 Q150 104 150 110 Q150 116 140 116"/>` +
      `<path d="M126 96 q6 -6 0 -12 q-6 -6 0 -12" stroke="${GLOW}"/>` +
      `<path d="M134 96 q6 -6 0 -12 q-6 -6 0 -12" stroke="${GLOW}"/>` +
      // chair
      `<path d="M176 80 L176 124"/>` +
      `<path d="M176 104 L198 104 L198 124"/>` +
      `<line x1="180" y1="84" x2="176" y2="84"/>`,
    11,
  ),

  // The rocks (bottom right): the lighthouse on the rocks, light lit, waves below.
  "1,1": sketch(
    "A sketch of the lighthouse standing on the rocks above the waves",
    `<path d="M20 132 q9 -7 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0" stroke="${FAINT}"/>` +
      `<path d="M45 120 L70 108 L92 120"/>` +
      `<path d="M126 120 L150 106 L176 120"/>` +
      `<path d="M97 118 L102 52 L118 52 L123 118 Z"/>` +
      `<path d="M99 52 L96 45 L124 45 L121 52"/>` +
      `<path d="M103 45 L103 31 L117 31 L117 45"/>` +
      `<line x1="110" y1="31" x2="110" y2="45"/>` +
      `<path d="M100 31 L110 21 L120 31"/>` +
      `<line x1="110" y1="21" x2="110" y2="15"/>` +
      `<line x1="99" y1="75" x2="121" y2="75"/>` +
      `<line x1="98" y1="98" x2="122" y2="98"/>` +
      `<path d="M106 118 L106 106 a4 4 0 0 1 8 0 L114 118"/>` +
      `<path d="M117 34 L150 26" stroke="${GLOW}"/>` +
      `<path d="M117 41 L152 44" stroke="${GLOW}"/>` +
      `<path d="M103 34 L70 26" stroke="${GLOW}"/>`,
    2,
  ),

  // The gallery (top, 1,-1): the railed walkway around the lantern, the beam
  // sweeping over a starry night.
  "1,-1": sketch(
    "A sketch of the open gallery around the lantern under a starry sky",
    // railing: two rails + balusters
    `<line x1="18" y1="118" x2="202" y2="118"/>` +
      `<line x1="18" y1="132" x2="202" y2="132"/>` +
      `<line x1="34" y1="118" x2="34" y2="132"/>` +
      `<line x1="58" y1="118" x2="58" y2="132"/>` +
      `<line x1="82" y1="118" x2="82" y2="132"/>` +
      `<line x1="106" y1="118" x2="106" y2="132"/>` +
      `<line x1="130" y1="118" x2="130" y2="132"/>` +
      // lantern housing at the right, with roof + finial
      `<path d="M150 118 L150 66 L192 66 L192 118"/>` +
      `<path d="M148 66 L171 50 L194 66"/>` +
      `<line x1="171" y1="50" x2="171" y2="42"/>` +
      `<line x1="150" y1="82" x2="192" y2="82"/>` +
      // the lit lamp and its beam sweeping out over the sea
      `<circle cx="171" cy="78" r="5" stroke="${GLOW}"/>` +
      `<path d="M150 76 L54 56" stroke="${GLOW}"/>` +
      `<path d="M150 92 L50 104" stroke="${GLOW}"/>` +
      // stars
      `<path d="M40 40 l0 6 M37 43 l6 0" stroke="${FAINT}"/>` +
      `<path d="M70 28 l0 6 M67 31 l6 0" stroke="${FAINT}"/>` +
      `<path d="M104 46 l0 6 M101 49 l6 0" stroke="${FAINT}"/>` +
      `<path d="M126 30 l0 5 M123 32 l6 0" stroke="${FAINT}"/>` +
      `<path d="M60 72 l0 5 M57 74 l6 0" stroke="${FAINT}"/>`,
    5,
  ),
};
