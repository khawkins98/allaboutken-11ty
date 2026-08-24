module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter('renderedWordCount', (items) => {
    try {
      return (items || []).reduce((total, item) => {
        const text = String(item.templateContent || '').replace(/<[^>]*>/g, ' ');
        return total + (text.match(/\S+/g) || []).length;
      }, 0);
    } catch (error) {
      if (process.env.ELEVENTY_REPRO_CONTROL) {
        // This is the original application's defensive behavior. It proves
        // that swallowing the retry signal makes the build green but wrong.
        return 0;
      }
      throw error;
    }
  });

  return {
    dir: {
      input: 'src',
      output: '_site'
    }
  };
};
