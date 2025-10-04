'use server'

export const isError = (_object: unknown): _object is Error =>
  typeof _object === 'object' &&
  typeof _object !== null &&
  _object instanceof Error

/*
 * Using a route handler instead...
 *
export const svgToPngDataURL = (svgElement: SVGSVGElement | Element) => {
  return new Promise<string>((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const encodedSvgData = encodeURIComponent(svgData);
    const dataUrl = "data:image/svg+xml;charset=utf-8," + encodedSvgData;
    const image = new Image();
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      if (!ctx) throw new Error("Failed to get context");
      ctx.drawImage(image, 0, 0);
      const pngDataUrl = canvas.toDataURL("image/png");
      resolve(pngDataUrl);
    };
    image.onerror = (e) => {
      reject(e);
    };
    image.src = dataUrl;
  });
};
*/
