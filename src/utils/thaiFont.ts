// Helper to load font file and convert to base64
export async function loadFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64Content = base64.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
