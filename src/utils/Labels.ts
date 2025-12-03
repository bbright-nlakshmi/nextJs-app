export const sizeLabelMap: Record<string, string> = {
  xs: "Extra Small",
  s: "Small",
  m: "Medium",
  l: "Large",
  xl: "Extra Large",
  xxl: "2X Large",
  xxxl: "3X Large",
};

export const getSizeLabel = (size: string): string => {
  return sizeLabelMap[size.toLowerCase()] || size;
};
