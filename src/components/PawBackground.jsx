import "../styles/PawBackground.css";

// Inline SVG shapes
const StarFive = () => (
  <svg viewBox="0 0 316 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M158 0L195.299 114.59H316L218.351 185.41L255.649 300L158 229.18L60.3506 300L97.6494 185.41L0 114.59H120.701L158 0Z" fill="white"/>
  </svg>
);

const StarFour = () => (
  <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M150 0L190.514 109.486L300 150L190.514 190.514L150 300L109.486 190.514L0 150L109.486 109.486L150 0Z" fill="white"/>
  </svg>
);

const Cat = () => (
  <svg viewBox="0 0 288 302" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M272.295 1.47607C275.404 -1.63745 280.729 0.493934 280.831 4.89306L284.35 156.67C284.351 156.729 284.348 156.788 284.348 156.846C286.63 165.211 287.838 173.911 287.838 182.842C287.838 248.167 223.403 301.124 143.919 301.124C64.4348 301.124 2.25825e-05 248.167 0 182.842C0 174.903 0.953737 167.147 2.76855 159.646C2.1882 158.818 1.84892 157.798 1.875 156.67L5.39258 4.89306C5.4947 0.493863 10.8202 -1.63765 13.9297 1.47607L86.6504 74.2974C104.201 68.0344 123.566 64.561 143.919 64.561C163.811 64.561 182.76 67.8781 199.993 73.8755L272.295 1.47607Z" fill="white"/>
  </svg>
);

const Dog = () => (
  <svg viewBox="0 0 422 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M98.8999 38.0252C137.806 4.11708 194.918 -9.47776 250.789 6.96389C273.618 13.6819 293.897 24.7272 310.874 38.8207L312.656 37.8446C319.845 33.9041 331.782 31.8273 344.468 38.0268C357.149 44.2248 370.286 58.544 380.271 86.8084C392.622 121.769 408.971 168.546 417.044 208.693C421.077 228.751 423.078 247.313 421.411 261.986C419.747 276.624 414.344 287.94 403.04 292.51C392.32 296.844 382.185 297.12 373.085 294.155C364.008 291.197 356.099 285.063 349.704 276.805C342.885 267.999 337.736 256.719 334.677 244.079C296.669 289.569 230.964 310.22 166.888 291.364C134.907 281.952 107.93 264.049 88.0255 241.167C85.7048 255.918 80.594 269.215 73.2406 279.428C67.1381 287.904 59.4486 294.31 50.4806 297.582C41.489 300.862 31.3505 300.94 20.4858 296.983C9.02945 292.809 3.23424 281.689 1.05989 267.118C-1.11962 252.512 0.232387 233.891 3.56203 213.705C10.2265 173.301 24.9317 125.982 36.0533 90.6125C45.0448 62.0172 57.6729 47.249 70.1303 40.6127C81.0045 34.82 91.5293 35.3466 98.8999 38.0252Z" fill="white"/>
  </svg>
);

// Gradient definitions per variant
const GRADIENTS = {
  default: "radial-gradient(ellipse at 60% 35%, #e8eaf8 0%, #BEDBF4 50%, #96bedf 100%)",
  orange:  "radial-gradient(ellipse at 60% 35%, #FFD0A0 0%, #e8d2b0 55%, #d8bc88 100%)",
  yellow:  "radial-gradient(ellipse at 60% 35%, #FFF8C0 0%, #ececbe 55%, #ebdb82 100%)",
  purple:  "radial-gradient(ellipse at 60% 35%, #EDD8FF 0%, #d4abf3 55%, #b474ec 100%)",
};

// Element layout
// anim: 'a' floats up-first, 'b' floats down-first  |  rot: tilt in degrees
const ELEMENTS = [
  // Pets
  { Shape: Dog,      pos: { left: "14%",  top: "62%" }, size: 260, opacity: 0.88, anim: "b", delay: 1.2, dur: 8.5, rot:  25 },
  { Shape: Cat,      pos: { left: "62%",  top: "4%"  }, size: 220, opacity: 0.88, anim: "a", delay: 0.0, dur: 7.0, rot: -20 },
  // Stars
  { Shape: StarFive, pos: { left: "3%",   top: "3%"  }, size: 85,  opacity: 0.75, anim: "a", delay: 0.6, dur: 6.0, rot:  30 },
  { Shape: StarFour, pos: { left: "28%",  top: "1%"  }, size: 52,  opacity: 0.62, anim: "b", delay: 2.0, dur: 9.0, rot: -45 },
  { Shape: StarFour, pos: { left: "48%",  top: "5%"  }, size: 40,  opacity: 0.52, anim: "a", delay: 3.2, dur: 7.5, rot:  60 },
  { Shape: StarFour, pos: { left: "82%",  top: "2%"  }, size: 70,  opacity: 0.72, anim: "b", delay: 0.4, dur: 8.0, rot: -35 },
  { Shape: StarFive, pos: { left: "90%",  top: "20%" }, size: 65,  opacity: 0.65, anim: "a", delay: 2.5, dur: 7.0, rot:  45 },
  { Shape: StarFour, pos: { left: "91%",  top: "50%" }, size: 55,  opacity: 0.60, anim: "b", delay: 1.0, dur: 6.5, rot: -55 },
  { Shape: StarFive, pos: { left: "85%",  top: "74%" }, size: 72,  opacity: 0.68, anim: "a", delay: 3.5, dur: 8.5, rot:  40 },
  { Shape: StarFour, pos: { left: "55%",  top: "83%" }, size: 58,  opacity: 0.60, anim: "b", delay: 0.8, dur: 7.0, rot: -30 },
  { Shape: StarFive, pos: { left: "32%",  top: "86%" }, size: 68,  opacity: 0.65, anim: "a", delay: 2.2, dur: 9.0, rot:  55 },
  { Shape: StarFour, pos: { left: "6%",   top: "50%" }, size: 46,  opacity: 0.50, anim: "b", delay: 1.8, dur: 7.5, rot: -40 },
  { Shape: StarFive, pos: { left: "2%",   top: "78%" }, size: 55,  opacity: 0.55, anim: "a", delay: 3.0, dur: 6.5, rot:  35 },
];

// ── Component ─────────────────────────────────────────────────
export default function PawBackground({ variant = "default" }) {
  return (
    <div className="paw-bg">
      {/* Gradient layers -- only the active one is opaque */}
      {Object.entries(GRADIENTS).map(([key, grad]) => (
        <div
          key={key}
          className={`paw-bg-layer ${variant === key ? "active" : ""}`}
          style={{ background: grad }}
        />
      ))}

      {/* Floating decorative elements */}
      {ELEMENTS.map(({ Shape, pos, size, opacity, anim, delay, dur, rot }, i) => (
        <div
          key={i}
          className={`paw-bg-el anim-${anim}`}
          style={{
            ...pos,
            width: size,
            height: size,
            opacity,
            transform: `rotate(${rot}deg)`,
            animationDelay: `${delay}s`,
            animationDuration: `${dur}s`,
            "--rot": `${rot}deg`,
          }}
        >
          <Shape />
        </div>
      ))}
    </div>
  );
}
