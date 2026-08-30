export function SiteFooter() {
  return (
    <footer className="mt-8 border-t-4 border-[#ff6a00] bg-[#05000a] py-10">
      <div className="section-wrap flex flex-col items-center gap-4 text-center">
        <p className="blink font-press text-[10px] text-[#ffcc00] sm:text-xs">
          ▶ PRESS START TO CONTINUE
        </p>
        <p className="font-press text-[8px] leading-6 text-[#c9a0ff] sm:text-[10px]">
          © 1985 VIPER3384
          <br />
          TILTED TOWERS MEMORIAL
          <br />
          NOT AFFILIATED WITH EPIC GAMES
        </p>
        <a
          href="#hero"
          className="font-press text-[10px] text-[#3cdcff] underline decoration-4 underline-offset-4"
        >
          WARP TO START
        </a>
      </div>
    </footer>
  );
}
