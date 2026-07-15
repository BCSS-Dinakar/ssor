/** Shared multi-layer animated wave used under marketing heroes */
function HeroWaves({ className = '' }) {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] z-10 pointer-events-none h-14 sm:h-16 md:h-20 lg:h-24 ${className}`}
      aria-hidden="true"
    >
      <svg className="absolute bottom-0 left-0 w-[200%] h-full animate-wave-slow" viewBox="0 0 2400 120" preserveAspectRatio="none">
        <path fill="#f8fafc" fillOpacity="0.3" d="M0,60 C300,100 300,20 600,60 C900,100 900,20 1200,60 C1500,100 1500,20 1800,60 C2100,100 2100,20 2400,60 L2400,120 L0,120 Z" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-[200%] h-full animate-wave-medium" viewBox="0 0 2400 120" preserveAspectRatio="none">
        <path fill="#f8fafc" fillOpacity="0.5" d="M0,80 C200,110 400,50 600,80 C800,110 1000,50 1200,80 C1400,110 1600,50 1800,80 C2000,110 2200,50 2400,80 L2400,120 L0,120 Z" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-[200%] h-full animate-wave-fast" viewBox="0 0 2400 120" preserveAspectRatio="none">
        <path fill="#f8fafc" fillOpacity="1" d="M0,90 C600,120 600,60 1200,90 C1800,120 1800,60 2400,90 L2400,120 L0,120 Z" />
      </svg>
    </div>
  );
}

export default HeroWaves;
