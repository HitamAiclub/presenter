export const uploadToCloudinary = async (file, resourceType = 'auto', folder = 'presenter') => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwva5ae36';
    const initialPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'Hitam_ai';

    const safeTitle = (file.name || 'file') + "_" + Date.now();
    const sanitizedFolder = folder.replace(/\s+/g, '_');

    const upload = async (preset) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', preset);
        formData.append('folder', sanitizedFolder);

        // Always use auto so Cloudinary correctly identifies video/audio/image
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error?.message || 'Upload failed');
        }
        return await res.json();
    };

    try {
        const data = await upload(initialPreset);
        return {
            url: data.secure_url,
            publicId: data.public_id,
            format: data.format,
            duration: data.duration || 0,
            folder: sanitizedFolder
        };
    } catch (err) {
        console.warn(`Preset ${initialPreset} failed (${err.message}). Retrying with fallbacks...`);
        const fallbacks = ['ml_default', 'default', 'cloud_default'];

        for (const fb of fallbacks) {
            try {
                const data = await upload(fb);
                return {
                    url: data.secure_url,
                    publicId: data.public_id,
                    format: data.format,
                    duration: data.duration || 0,
                    folder: sanitizedFolder
                };
            } catch (e) {
                console.warn(`Fallback preset ${fb} failed.`);
                continue;
            }
        }
        throw new Error("All Cloudinary upload attempts failed. Please check presets.");
    }
};

/**
 * Delete a file securely from Cloudinary via the Backend.
 * @param {string} publicId - Cloudinary public ID of the resource
 * @param {string} resourceType - 'image', 'video' or 'raw'. Audio is handled under 'video' natively.
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'video') => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
        const response = await fetch(`${backendUrl}/api/cloudinary/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId, resourceType }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Backend deletion failed');
        }
        return data;
    } catch (error) {
        console.error('Failed to securely delete from Cloudinary backend:', error);
        throw error;
    }
};

/**
 * Delete an entire folder and its contents securely from Cloudinary via the Backend.
 * @param {string} folderPath - Cloudinary folder path to delete
 */
export const deleteFolderFromCloudinary = async (folderPath) => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
        const response = await fetch(`${backendUrl}/api/cloudinary/delete-folder`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderPath }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Backend folder deletion failed');
        }
        return data;
    } catch (error) {
        console.error('Failed to securely delete folder from Cloudinary backend:', error);
        throw error;
    }
};

/**
 * Get a Cloudinary URL to render a specific page of a PDF as an image.
 * @param {string} url - Original Cloudinary PDF URL
 * @param {number} pageNumber - Page number to render (1-indexed)
 * @returns {string} Cloudinary URL for the requested page image
 */
export const getPdfPageUrl = (url, pageNumber = 1) => {
    if (!url || !url.includes('res.cloudinary.com')) return url;

    // Split the URL to insert the transformation
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    // Add page transformation and ensure the extension is .jpg
    // Original URL might end with .pdf, we replace it with .jpg for the image
    const basePath = parts[0] + '/upload';
    const transformation = `/pg_${pageNumber}`;
    const resourcePath = parts[1] ? parts[1].replace(/\.pdf$/i, '.jpg') : '';

    return `${basePath}${transformation}/${resourcePath}`;
};
