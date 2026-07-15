import HeroWaves from './HeroWaves';

/**
 * Marketing page hero — fills a sensible first-viewport band below the sticky nav,
 * with shared animated wave transition.
 */
function PageHero({ children, compact = false }) {
  return (
    <section
      className={`relative flex overflow-x-hidden ${
        compact
          ? 'min-h-[min(52svh,28rem)]'
          : 'min-h-[calc(100svh-4rem)] lg:min-h-[min(70dvh,40rem)]'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#0E2A4F] to-secondary" />
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[12%] left-[6%] w-[min(40vw,18rem)] h-[min(40vw,18rem)] bg-accent rounded-full filter blur-3xl" />
        <div className="absolute bottom-[10%] right-[8%] w-[min(48vw,22rem)] h-[min(48vw,22rem)] bg-blue-400 rounded-full filter blur-3xl" />
      </div>
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex w-full flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16 pb-20 sm:pb-24 lg:pb-28">
        {children}
      </div>

      <HeroWaves />
    </section>
  );
}

export default PageHero;
