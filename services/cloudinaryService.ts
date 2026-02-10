
/**
 * Cloudinary Service for handling file uploads.
 * This uses the "Unsigned" upload method to allow direct uploads from the browser.
 */

const CLOUDINARY_CLOUD_NAME = "dfmkfeqzt";
const CLOUDINARY_UPLOAD_PRESET = "Canal Denúncies";

export async function uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "canal_denuncies");

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Cloudinary Error Data:", errorData);
            throw new Error(errorData.error?.message || "Error al pujar a Cloudinary");
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Cloudinary Upload Exception:", error);
        throw error;
    }
}
