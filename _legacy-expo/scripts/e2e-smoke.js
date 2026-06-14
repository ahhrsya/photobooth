// End-to-end smoke test for the photobooth web build.
// Uses puppeteer-core driving the system Chrome to walk through:
//   1) Open home
//   2) Click "Photo Strip"
//   3) Click first template
//   4) Click "Use <name> →"
//   5) On the camera screen (web mock), click "Use placeholders"
//   6) Wait for the print screen to render and capture the composed image
//   7) Confirm the "developing your photos..." overlay goes away
const puppeteer = require("puppeteer-core");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
    ],
    defaultViewport: { width: 400, height: 850, isMobile: true },
  });

  const page = await browser.newPage();
  page.on("console", (msg) => {
    const t = msg.text();
    if (
      t.includes("error") ||
      t.includes("Error") ||
      t.includes("warn") ||
      t.includes("fail")
    ) {
      console.log(`[browser ${msg.type()}] ${t}`);
    }
  });
  page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));
  page.on("requestfailed", (req) => {
    if (req.url().includes("favicon")) return;
    console.log(`[requestfailed] ${req.url()} -> ${req.failure()?.errorText}`);
  });

  const steps = [];
  const step = (msg) => {
    console.log(`STEP: ${msg}`);
    steps.push(msg);
  };

  try {
    step("1. open /");
    await page.goto("http://localhost:19006/", { waitUntil: "networkidle2", timeout: 30000 });

    step("2. wait for devel brand");
    await page.waitForFunction(
      () => document.body && document.body.innerText.includes("devel"),
      { timeout: 15000 }
    );
    step("3. click Photo Strip tile");
    // Find the Pressable wrapping the whole tile. Pressable in rn-web renders
    // as a div. The tile is a *sibling* of the text, not a parent of it, so
    // we need to find by structure: the tile contains both the preview and
    // the label.
    const tileHandle = await page.evaluateHandle(() => {
      const all = Array.from(document.querySelectorAll("*"));
      // The tile is the div that contains "3 frames, one roll" or "1 frame, classic feel"
      const labels = all.filter(
        (e) =>
          e.textContent &&
          (e.textContent.trim() === "3 frames, one roll" ||
            e.textContent.trim() === "1 frame, classic feel")
      );
      return labels[0] ? labels[0].parentElement : null;
    });
    if (!tileHandle) throw new Error("tile not found");
    await tileHandle.asElement().click({ delay: 30 });

    step("4. wait for template picker");
    await page.waitForFunction(
      () => {
        const t = (document.body && document.body.innerText) || "";
        return t.toLowerCase().includes("choose your vibe");
      },
      { timeout: 10000 }
    );

    step("5. click Classic template");
    await new Promise((r) => setTimeout(r, 800));
    const cardHandle = await page.evaluateHandle(() => {
      const all = Array.from(document.querySelectorAll("*"));
      const label = all.find(
        (e) => e.textContent && e.textContent.trim() === "Classic"
      );
      if (!label) return null;
      let card = label;
      for (let i = 0; i < 6 && card; i++) {
        if (
          card.tagName === "DIV" &&
          card.textContent &&
          card.textContent.includes("retro") &&
          card.textContent.includes("timeless")
        ) {
          return card;
        }
        card = card.parentElement;
      }
      return label.parentElement;
    });
    if (!cardHandle) throw new Error("Classic card not found");
    await cardHandle.asElement().click({ delay: 30 });
    step("6. wait for 'Use ...' button");
    await page.waitForFunction(
      () => {
        const t = ((document.body && document.body.innerText) || "").toLowerCase();
        return t.includes("use classic");
      },
      { timeout: 10000 }
    );
    step("7. click Use Classic button");
    const btnCoords = await page.evaluate(() => {
      // Find the actual button by its dark background color (black pill)
      const candidates = Array.from(document.querySelectorAll("div"));
      const dark = candidates.find((d) => {
        const style = getComputedStyle(d);
        return (
          (style.backgroundColor === "rgb(26, 26, 26)" ||
            style.backgroundColor === "rgb(0, 0, 0)") &&
          d.textContent &&
          d.textContent.toLowerCase().includes("use classic")
        );
      });
      if (!dark) return { error: "not found" };
      const r = dark.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (btnCoords.error) {
      const debug = await page.evaluate(() => {
        const candidates = Array.from(document.querySelectorAll("div"));
        return candidates
          .filter((d) => {
            const style = getComputedStyle(d);
            return (
              style.backgroundColor === "rgb(26, 26, 26)" ||
              style.backgroundColor === "rgb(0, 0, 0)"
            );
          })
          .map((d) => ({
            text: (d.textContent || "").slice(0, 50),
            area: d.getBoundingClientRect().width * d.getBoundingClientRect().height,
          }));
      });
      console.log("  → dark divs:", JSON.stringify(debug, null, 2));
      throw new Error("Use Classic button coords not found");
    }
    console.log("  → Use Classic coords:", btnCoords);
    await page.mouse.click(btnCoords.x, btnCoords.y);

    step("8. wait for camera screen / web mock");
    await page.waitForFunction(
      () => {
        const t = ((document.body && document.body.innerText) || "").toLowerCase();
        return t.includes("web preview mode");
      },
      { timeout: 10000 }
    );
    step("9. click Use placeholders");
    await new Promise((r) => setTimeout(r, 500));
    // Find a div containing the "Use placeholders" text and a pointer cursor
    const phCoords = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll("div"));
      const candidate = candidates.find((d) => {
        const style = getComputedStyle(d);
        const isClickable =
          style.cursor === "pointer" &&
          d.textContent &&
          d.textContent.includes("Use placeholders");
        return isClickable;
      });
      if (!candidate) {
        // Fallback: find the deepest div containing the text
        const labels = Array.from(document.querySelectorAll("*"));
        const label = labels.find(
          (e) => e.textContent && e.textContent.trim().includes("Use placeholders")
        );
        if (!label) return null;
        return (() => {
          const r = label.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        })();
      }
      const r = candidate.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!phCoords) throw new Error("Use placeholders coords not found");
    console.log("  → Use placeholders coords:", phCoords);
    await page.mouse.click(phCoords.x, phCoords.y);

    step("10. wait for developing your photos... to disappear");
    const t0 = Date.now();
    await page.waitForFunction(
      () => {
        const t = document.body.innerText || "";
        return !t.includes("developing your photos");
      },
      { timeout: 30000 }
    );
    step(`11. developing overlay gone after ${Date.now() - t0}ms`);

    step("12. wait for action buttons");
    await page.waitForFunction(
      () => {
        const t = ((document.body && document.body.innerText) || "").toLowerCase();
        return t.includes("save to gallery") && t.includes("share");
      },
      { timeout: 15000 }
    );

    step("13. wait for action buttons to appear");
    // After print animation, the action buttons take ~600ms more to fade in
    await new Promise((r) => setTimeout(r, 2500));
    step("14. screenshot final state");
    await page.screenshot({ path: "/tmp/photobooth-final.png" });
    console.log("Final screenshot saved to /tmp/photobooth-final.png");

    console.log("✅ ALL STEPS PASSED");
  } catch (e) {
    console.error("❌ TEST FAILED:", e.message);
    try {
      await page.screenshot({ path: "/tmp/photobooth-fail.png", fullPage: true });
      console.log("Failure screenshot at /tmp/photobooth-fail.png");
    } catch {}
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
