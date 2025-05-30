"use server";

import { env } from "@/env";
import { createApi } from "unsplash-js";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

// Initialize Unsplash API
const unsplash = createApi({
  accessKey: env.UNSPLASH_API_KEY,
});

export interface UnsplashImage {
  id: string;
  url: string;
  downloadUrl: string;
  description?: string;
  altDescription?: string;
  photographer: string;
  photographerUrl: string;
  width: number;
  height: number;
}

export interface UnsplashSearchResult {
  success: boolean;
  images?: UnsplashImage[];
  selectedImage?: UnsplashImage;
  error?: string;
}

/**
 * Search for images on Unsplash based on a query
 */
export async function searchUnsplashImages(
  query: string,
  page = 1,
  perPage = 12
): Promise<UnsplashSearchResult> {
  // Get the current session
  const session = await auth();

  // Check if user is authenticated
  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in to search images",
    };
  }

  try {
    console.log(`Searching Unsplash for: ${query}`);

    const result = await unsplash.search.getPhotos({
      query,
      page,
      perPage,
      orientation: "landscape", // Prefer landscape for presentations
    });

    if (result.errors) {
      console.error("Unsplash API errors:", result.errors);
      return {
        success: false,
        error: "Failed to search images. Please try again.",
      };
    }

    if (!result.response) {
      return {
        success: false,
        error: "No response from Unsplash API",
      };
    }

    const images: UnsplashImage[] = result.response.results.map((photo) => ({
      id: photo.id,
      url: photo.urls.regular,
      downloadUrl: photo.urls.full,
      description: photo.description ?? undefined,
      altDescription: photo.alt_description ?? undefined,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      width: photo.width,
      height: photo.height,
    }));

    return {
      success: true,
      images,
    };
  } catch (error) {
    console.error("Error searching Unsplash images:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search images",
    };
  }
}

/**
 * Select and track an image from Unsplash for use in presentation
 * This will trigger a download to track usage as per Unsplash API guidelines
 */
export async function selectUnsplashImage(
  imageId: string,
  query: string
): Promise<UnsplashSearchResult> {
  // Get the current session
  const session = await auth();

  // Check if user is authenticated
  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in to select images",
    };
  }

  try {
    console.log(`Selecting Unsplash image: ${imageId}`);

    // Get the photo details
    const photoResult = await unsplash.photos.get({ photoId: imageId });

    if (photoResult.errors) {
      console.error("Unsplash API errors:", photoResult.errors);
      return {
        success: false,
        error: "Failed to get image details. Please try again.",
      };
    }

    if (!photoResult.response) {
      return {
        success: false,
        error: "No response from Unsplash API",
      };
    }

    const photo = photoResult.response;

    // Track download as per Unsplash API guidelines
    await unsplash.photos.trackDownload({ downloadLocation: photo.links.download_location });

    const selectedImage: UnsplashImage = {
      id: photo.id,
      url: photo.urls.regular,
      downloadUrl: photo.urls.full,
      description: photo.description ?? undefined,
      altDescription: photo.alt_description ?? undefined,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      width: photo.width,
      height: photo.height,
    };

    // Store the image selection in database for tracking
    const imageUsage = await db.imageUsage.create({
      data: {
        imageUrl: selectedImage.url,
        unsplashId: selectedImage.id,
        searchTerm: query,
        photographer: selectedImage.photographer,
        userId: session.user.id,
      },
    });

    console.log(`Selected Unsplash image stored with ID: ${imageUsage.id}`);

    return {
      success: true,
      selectedImage,
    };
  } catch (error) {
    console.error("Error selecting Unsplash image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to select image",
    };
  }
}

/**
 * Get a single high-quality image based on search query (for backward compatibility)
 * This searches Unsplash and automatically selects the first result
 */
export async function getUnsplashImageAction(
  query: string
): Promise<{ success: boolean; image?: { url: string; id: string }; error?: string }> {
  try {
    console.log(`Auto-selecting Unsplash image for query: ${query}`);

    // Search for images
    const searchResult = await searchUnsplashImages(query, 1, 1);
    
    if (!searchResult.success || !searchResult.images || searchResult.images.length === 0) {
      return {
        success: false,
        error: searchResult.error ?? "No images found for this query",
      };
    }

    // Automatically select the first result
    const firstImage = searchResult.images?.[0];
    if (!firstImage) {
      return {
        success: false,
        error: "No images found for the search term",
      };
    }
    
    const selectionResult = await selectUnsplashImage(firstImage.id, query);

    if (!selectionResult.success || !selectionResult.selectedImage) {
      return {
        success: false,
        error: selectionResult.error ?? "Failed to select image",
      };
    }

    // Return in the same format as the original generateImageAction
    const imageUsage = await db.imageUsage.findFirst({
      where: {
        imageUrl: selectionResult.selectedImage.url,
        searchTerm: query,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!imageUsage) {
      return {
        success: false,
        error: "Failed to store image in database",
      };
    }

    return {
      success: true,
      image: {
        url: imageUsage.imageUrl,
        id: imageUsage.id,
      },
    };
  } catch (error) {
    console.error("Error in getUnsplashImageAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get image",
    };
  }
}
