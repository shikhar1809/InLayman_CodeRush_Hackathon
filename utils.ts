
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result); 
    };
    reader.readAsDataURL(blob);
  });
};
