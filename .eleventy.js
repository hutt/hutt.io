module.exports = function(eleventyConfig) {

  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.addCollection("projekte", function(collectionApi) {
    return collectionApi
      .getFilteredByTag("projekte")
      .sort((a, b) => b.page.fileSlug.localeCompare(a.page.fileSlug));
  });

  eleventyConfig.addCollection("jobs", function(collectionApi) {
    return collectionApi
      .getFilteredByTag("jobs")
      .sort((a, b) => b.page.fileSlug.localeCompare(a.page.fileSlug));
  });

  eleventyConfig.addFilter("alleKategorien", function(collection) {
    const set = new Set();
    collection.forEach(item => {
      (item.data.kategorien || []).forEach(k => set.add(k));
    });
    return Array.from(set).sort();
  });

  eleventyConfig.addFilter("katSlug", function(kategorien) {
    return (kategorien || [])
      .map(k => k.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss').replace(/&/g, ''))
      .join(' ');
  });

  eleventyConfig.addFilter("slug", function(str) {
    return str.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss').replace(/&/g, '');
  });

  eleventyConfig.addShortcode("jahr", () => String(new Date().getFullYear()));

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
