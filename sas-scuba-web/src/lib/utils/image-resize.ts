/**
 * Resizes an image file to a maximum dimension while maintaining aspect ratio
 * @param file - The image file to resize
 * @param maxSize - Maximum width or height in pixels (default: 300)
 * @returns Promise that resolves to a resized File object
 */
export async function resizeImage(file: File, maxSize: number = 300): Promise<File> {
    return new Promise((resolve, reject) => {
        // Create an image object
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        // Create object URL from file
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            // Calculate new dimensions maintaining aspect ratio
            let width = img.width;
            let height = img.height;

            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = (height / width) * maxSize;
                    width = maxSize;
                } else {
                    width = (width / height) * maxSize;
                    height = maxSize;
                }
            }

            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;

            // Draw resized image on canvas
            ctx.drawImage(img, 0, 0, width, height);

            // Convert canvas to blob
            canvas.toBlob(
                (blob) => {
                    // Clean up object URL
                    URL.revokeObjectURL(objectUrl);

                    if (!blob) {
                        reject(new Error('Failed to create blob from canvas'));
                        return;
                    }

                    // Create new File object from blob
                    const resizedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    resolve(resizedFile);
                },
                'image/jpeg',
                0.85 // Quality: 0.85 (85%)
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        };

        // Load image
        img.src = objectUrl;
    });
}

