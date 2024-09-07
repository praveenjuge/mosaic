
import Script from "next/script";

export default function CounterscaleScript() {
  return (
    <>
      <Script id="counterscale-init" strategy="afterInteractive">
        {`
          (function () {
            window.counterscale = {
              q: [["set", "siteId", "mosaic-counter"], ["trackPageview"]],
            };
          })();
        `}
      </Script>
      <Script
        id="counterscale-script"
        src="https://counterscale.praveenjuge.com/tracker.js"
        strategy="afterInteractive"
        defer
      />
    </>
  );
}