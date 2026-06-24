const Image = require("@11ty/eleventy-img");
const sharp = require("@11ty/eleventy-img/node_modules/sharp");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const { minify } = require("terser");
const fs = require("fs");
const path = require("path");

// ── Logging-Helfer ──────────────────────────────────────────────
const c = {
  reset: "\x1b[0m", dim: "\x1b[2m", green: "\x1b[32m",
  yellow: "\x1b[33m", blue: "\x1b[34m", cyan: "\x1b[36m", red: "\x1b[31m",
};

function log(symbol, color, label, msg) {
  const time = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  console.log(`${c.dim}[${time}]${c.reset} ${color}${symbol} ${label}${c.reset} ${msg}`);
}

const logger = {
  img: (msg) => log("🖼 ", c.cyan, "[img]  ", msg),
  lcp: (msg) => log("⚡", c.green, "[lcp]  ", msg),
  css: (msg) => log("🎨", c.blue, "[css]  ", msg),
  js: (msg) => log("⚙️ ", c.yellow, "[js]   ", msg),
  err: (msg) => log("✘ ", c.red, "[error]", msg),
  info: (msg) => log("ℹ ", c.dim, "[info] ", msg),
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ────────────────────────────────────────────────────────────────

module.exports = function (eleventyConfig) {

  logger.info("Konfiguration wird geladen …");

  // ── Passthrough ──────────────────────────────────────────────
  eleventyConfig.addPassthroughCopy("src/assets/fonts");
  eleventyConfig.addPassthroughCopy("src/assets/css/lite-yt-embed.css");
  eleventyConfig.addPassthroughCopy("src/pubkey.asc");
  eleventyConfig.addPassthroughCopy("src/me/jannis_hutt.vcf");

  // ── Collections ──────────────────────────────────────────────
  eleventyConfig.addCollection("portfolio", function (collectionApi) {
    return collectionApi.getFilteredByGlob("./src/portfolio/*.md")
      .sort((a, b) => {
        const datumAusSlug = (slug) => {
          const match = slug.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/);
          if (!match) return new Date(0);
          return new Date(`${match[1]}-${match[2] ?? "01"}-${match[3] ?? "01"}`);
        };
        return datumAusSlug(b.page.fileSlug) - datumAusSlug(a.page.fileSlug);
      });
  });

  // ── Filter ───────────────────────────────────────────────────
  const umlaut = (str) => str
    .replace(/[äöüß]/g, c => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c]);

  eleventyConfig.addFilter("alleWerte", function (collection, feld) {
    const set = new Set();
    collection.forEach(item => {
      const val = item.data[feld];
      if (Array.isArray(val)) val.forEach(v => set.add(v));
      else if (val) set.add(val);
    });
    return Array.from(set).sort();
  });

  eleventyConfig.addFilter("dataSlug", function (werte) {
    return (werte || [])
      .map(w => umlaut(w.toString().toLowerCase())
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, ""))
      .join(" ");
  });

  eleventyConfig.addFilter("slug", function (str) {
    return umlaut(str.toString().toLowerCase())
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
  });

  eleventyConfig.addFilter("jahrAusSlug", function (slug) {
    const match = slug.match(/^(\d{4})/);
    return match ? match[1] : null;
  });

  eleventyConfig.addShortcode("jahr", () => String(new Date().getFullYear()));

  // ── Build: CSS + JS minifizieren ─────────────────────────────
  eleventyConfig.on("eleventy.before", async () => {
    // CSS: PostCSS → Autoprefixer → cssnano (ersetzt clean-css)
    const cssSrc = fs.readFileSync("./src/assets/css/style.css", "utf8");
    const cssResult = await postcss([autoprefixer, cssnano({ preset: "default" })])
      .process(cssSrc, { from: "./src/assets/css/style.css" });
    fs.mkdirSync("./_site/assets/css", { recursive: true });
    fs.writeFileSync("./_site/assets/css/style.min.css", cssResult.css);
    logger.css(`style.css → ${formatBytes(Buffer.byteLength(cssResult.css, "utf8"))} (minifiziert)`);

    // JS: lite-yt-embed minifizieren
    const lytSrc = "./src/assets/js/lite-yt-embed.js";
    if (fs.existsSync(lytSrc)) {
      const jsCode = fs.readFileSync(lytSrc, "utf8");
      const before = Buffer.byteLength(jsCode, "utf8");
      try {
        const result = await minify(jsCode, {
          compress: true,
          mangle: true,
          format: { comments: false }
        });
        const after = Buffer.byteLength(result.code, "utf8");
        fs.mkdirSync("./_site/assets/js", { recursive: true });
        fs.writeFileSync("./_site/assets/js/lite-yt-embed.js", result.code);
        logger.js(`lite-yt-embed.js: ${formatBytes(before)} → ${formatBytes(after)} (−${Math.round((1 - after / before) * 100)}%)`);
      } catch (err) {
        logger.err(`Terser lite-yt-embed: ${err.message}`);
        fs.copyFileSync(lytSrc, "./_site/assets/js/lite-yt-embed.js");
      }
    }

    // Easter-Egg-Bilder vorprozessieren
    const easterEggs = [
      "./src/assets/img/telephon.jpg",
    ];
    for (const src of easterEggs) {
      if (!fs.existsSync(src)) continue;
      await Image(src, {
        widths: [96, 176, 352, 480, 960],
        formats: ["avif", "webp", "jpeg"],
        outputDir: "./_site/assets/img/",
        urlPath: "/assets/img/",
        filenameFormat: (id, src, width, format) =>
          `${path.basename(src, path.extname(src))}-${width}w.${format}`,
      });
      logger.img(`Easter Egg: ${path.basename(src)} vorprozessiert`);
    }
  });

  // ── Critical CSS (nach dem Build) ────────────────────────────
  eleventyConfig.on("eleventy.after", async ({ runMode }) => {
    if (runMode === "serve") {
      logger.info("Critical CSS übersprungen (serve-Modus) — nur bei npm run build aktiv");
      return;
    }

    const { generate } = await import("critical");

    const pages = [
      { html: "_site/index.html", css: "_site/assets/css/critical-index.css" },
      { html: "_site/datenschutz/index.html", css: "_site/assets/css/critical-datenschutz.css" },
      { html: "_site/impressum/index.html", css: "_site/assets/css/critical-impressum.css" },
      { html: "_site/me/index.html", css: "_site/assets/css/critical-me.css" },
    ];

    for (const page of pages) {
      if (!fs.existsSync(page.html)) {
        logger.err(`Critical CSS: Datei nicht gefunden – ${page.html}`);
        continue;
      }

      try {
        const before = fs.statSync(page.html).size;

        await generate({
          base: "_site/",
          src: page.html,
          target: {
            html: page.html,
            css: page.css,
          },
          inline: true,
          width: 1440,
          height: 900,
          ignore: {
            atrule: ["@font-face"],
            rule: [/\.dust-puff/, /\.is-wobbling/],
          },
          rebase: false,
          concurrency: 2,
          penthouse: {
            puppeteer: {
              executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
              args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },
          },
        });

        // Temporäre CSS-Datei wieder aufräumen
        if (fs.existsSync(page.css)) fs.unlinkSync(page.css);

        const after = fs.statSync(page.html).size;
        logger.css(`Critical CSS: ${page.html} (${formatBytes(before)} → ${formatBytes(after)})`);
      } catch (err) {
        logger.err(`Critical CSS (${page.html}): ${err.message}`);
        if (fs.existsSync(page.css)) fs.unlinkSync(page.css);
      }
    }
  });

  // ── JS-Minifizierung (inline in Templates) ───────────────────
  eleventyConfig.addNunjucksAsyncFilter("jsmin", async function (code, cb) {
    const before = Buffer.byteLength(code, "utf8");
    try {
      const result = await minify(code, {
        compress: true,
        mangle: true,
        format: {
          comments: false
        }
      });
      const after = Buffer.byteLength(result.code, "utf8");
      logger.js(`${formatBytes(before)} → ${formatBytes(after)} (−${Math.round((1 - after / before) * 100)}% gespart)`);
      cb(null, result.code);
    } catch (err) {
      logger.err(`Terser: ${err.message}`);
      cb(null, code);
    }
  });

  // ── Standard-Bild-Shortcode ──────────────────────────────────
  eleventyConfig.addAsyncShortcode("image", async function (src, alt, sizes = "100vw") {
    const name = path.basename(src);
    logger.img(`Verarbeite: ${name}`);
    const metadata = await Image(src, {
      widths: [200, 350, 400, 600, 700, 800],
      formats: ["avif", "webp", "jpeg"],
      outputDir: "./_site/assets/img/",
      urlPath: "/assets/img/",
      filenameFormat: (id, src, width, format) =>
        `${path.basename(src, path.extname(src))}-${width}w.${format}`,
    });
    logger.img(`${name} → ${Object.values(metadata).flat().length} Varianten generiert`);
    return Image.generateHTML(metadata, { alt, sizes, loading: "lazy", decoding: "async" });
  });

  // ── LCP-Bild-Shortcode ───────────────────────────────────────
  eleventyConfig.addAsyncShortcode("imageLCP", async function (src, alt, sizes = "100vw") {
    const name = path.basename(src);
    logger.lcp(`LCP-Bild: ${name}`);

    const lqipBuffer = await sharp(src).resize(20).jpeg({ quality: 40 }).blur(2).toBuffer();
    const lqip = `data:image/jpeg;base64,${lqipBuffer.toString("base64")}`;
    logger.lcp(`LQIP generiert: ${formatBytes(lqipBuffer.length)}`);

    const metadata = await Image(src, {
      widths: [96, 176, 352, 480, 960],
      formats: ["avif", "webp", "jpeg"],
      outputDir: "./_site/assets/img/",
      urlPath: "/assets/img/",
      filenameFormat: (id, src, width, format) =>
        `${path.basename(src, path.extname(src))}-${width}w.${format}`,
    });
    logger.lcp(`${name} → ${Object.values(metadata).flat().length} Varianten (AVIF + WebP + JPEG)`);

    const lowest = metadata.jpeg[0];
    const highest = metadata.jpeg[metadata.jpeg.length - 1];

    return `<picture>
  <source type="image/avif" srcset="${metadata.avif.map(e => `${e.url} ${e.width}w`).join(", ")}" sizes="${sizes}">
  <source type="image/webp" srcset="${metadata.webp.map(e => `${e.url} ${e.width}w`).join(", ")}" sizes="${sizes}">
  <img src="${lowest.url}" srcset="${metadata.jpeg.map(e => `${e.url} ${e.width}w`).join(", ")}"
    sizes="${sizes}" alt="${alt}" width="${highest.width}" height="${highest.height}"
    loading="eager" decoding="async" fetchpriority="high"
    style="background-image:url('${lqip}');background-size:cover;background-position:center">
</picture>`;
  });

  // ── YouTube-Thumbnail-Shortcode ──────────────────────────────
  eleventyConfig.addAsyncShortcode("ytThumb", async function (videoId) {
    const thumbDir = "./src/assets/img/thumbs/";
    const localPath = `${thumbDir}${videoId}.jpg`;

    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(thumbDir, { recursive: true });
      const urls = [
        `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      ];
      let downloaded = false;
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const buffer = Buffer.from(await res.arrayBuffer());
          if (buffer.length > 10000) {
            fs.writeFileSync(localPath, buffer);
            logger.img(`YT-Thumb: ${videoId} (${formatBytes(buffer.length)})`);
            downloaded = true;
            break;
          }
        } catch { /* nächste URL versuchen */ }
      }
      if (!downloaded) {
        logger.err(`YT-Thumb nicht verfügbar: ${videoId}`);
        return "";
      }
    }

    const metadata = await Image(localPath, {
      widths: [200, 350, 400, 600, 700, 800],
      formats: ["avif", "webp", "jpeg"],
      outputDir: "./_site/assets/img/thumbs/",
      urlPath: "/assets/img/thumbs/",
      filenameFormat: (id, src, width, format) => `${videoId}-${width}w.${format}`,
    });

    const sizes = "(max-width: 600px) 100vw, 400px";
    const fallback = metadata.jpeg[metadata.jpeg.length - 1];
    return `<picture class="yt-thumb" aria-hidden="true">
  <source type="image/avif" srcset="${metadata.avif.map(e => `${e.url} ${e.width}w`).join(", ")}" sizes="${sizes}">
  <source type="image/webp" srcset="${metadata.webp.map(e => `${e.url} ${e.width}w`).join(", ")}" sizes="${sizes}">
  <img src="${fallback.url}" alt="" width="${fallback.width}" height="${fallback.height}" loading="lazy" decoding="async">
</picture>`;
  });

  logger.info("Konfiguration geladen ✓");

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
