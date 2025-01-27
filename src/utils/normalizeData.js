// utils/normalizeData.js
export const normalizeSchemes = (data) => {
    const schemes = [];
  
    Object.keys(data).forEach((parentScheme) => {
      if (typeof data[parentScheme] === "object" && !Array.isArray(data[parentScheme])) {
        Object.keys(data[parentScheme]).forEach((subScheme) => {
          schemes.push({
            schemeName: subScheme,
            parentScheme,
            strategies: data[parentScheme][subScheme] || [],
          });
        });
      } else {
        schemes.push({
          schemeName: parentScheme,
          parentScheme: null,
          strategies: data[parentScheme] || [],
        });
      }
    });
  
    return schemes;
  };
  