export const toTitleCase = (str: string = ''): string => {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

export const slugify = (str: string = ''): string => {
  return str.toLowerCase().replace(/[^A-Z0-9]+/gi, '-');
};
