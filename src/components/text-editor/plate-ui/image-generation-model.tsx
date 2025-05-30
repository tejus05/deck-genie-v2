import React, { useState } from "react";
import Image from "next/image";
import { usePresentationState } from "@/states/presentation-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEditorRef } from "@udecode/plate-core/react";
import { searchUnsplashImages, selectUnsplashImage, type UnsplashImage } from "@/app/_actions/image/unsplash";
import { toast } from "sonner";
import { insertNodes } from "@udecode/plate-common";
import { ImagePlugin } from "@udecode/plate-media/react";
import { FloatingInput } from "./input";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";

export function GenerateImageDialogContent({
  setOpen,
  isGenerating,
  setIsGenerating,
}: {
  setOpen: (value: boolean) => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}) {
  const editor = useEditorRef();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UnsplashImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<UnsplashImage | null>(null);

  const searchImages = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setIsGenerating(true);

    try {
      const result = await searchUnsplashImages(searchQuery);

      if (!result.success || !result.images) {
        throw new Error(result.error ?? "Failed to search images");
      }

      setSearchResults(result.images);
      if (result.images.length === 0) {
        toast.info("No images found for your search. Try different keywords.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to search images"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageSelect = async (image: UnsplashImage) => {
    setIsGenerating(true);

    try {
      const result = await selectUnsplashImage(image.id, searchQuery);

      if (!result.success || !result.selectedImage) {
        throw new Error(result.error ?? "Failed to select image");
      }

      insertNodes(editor, {
        children: [{ text: "" }],
        type: ImagePlugin.key,
        url: result.selectedImage.url,
        query: searchQuery,
      });

      setOpen(false);
      toast.success("Image added successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to select image"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Search Images</AlertDialogTitle>
        <AlertDialogDescription>
          Search for high-quality images from Unsplash to add to your presentation
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="space-y-4">
        <div className="flex gap-2">
          <FloatingInput
            id="search-query"
            className="flex-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isGenerating) void searchImages();
            }}
            label="Search for images..."
            type="text"
            autoFocus
            disabled={isGenerating}
          />
          <Button
            onClick={searchImages}
            disabled={isGenerating || !searchQuery.trim()}
            size="icon"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {isGenerating && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-video animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
              ))}
            </div>
            <div className="text-center text-sm text-gray-500">
              Searching for images...
            </div>
          </div>
        )}

        {searchResults.length > 0 && !isGenerating && (
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              {searchResults.map((image) => (
                <div
                  key={image.id}
                  className="group relative cursor-pointer overflow-hidden rounded-lg border-2 border-transparent hover:border-blue-500"
                  onClick={() => setSelectedImage(image)}
                >
                  <Image
                    src={image.url}
                    alt={image.altDescription ?? image.description ?? "Unsplash image"}
                    className="aspect-video w-full object-cover"
                    width={300}
                    height={200}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute bottom-2 left-2 text-xs text-white">
                      by {image.photographer}
                    </div>
                  </div>
                  {selectedImage?.id === image.id && (
                    <div className="absolute inset-0 bg-blue-500/20">
                      <div className="absolute right-2 top-2 rounded-full bg-blue-500 p-1">
                        <Download className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={isGenerating}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            if (selectedImage) {
              void handleImageSelect(selectedImage);
            }
          }}
          disabled={isGenerating || !selectedImage}
        >
          {isGenerating ? "Adding Image..." : "Add Image"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}

export default function ImageGenerationModel() {
  const { imageGenerationModelOpen, setImageGenerationModelOpen } =
    usePresentationState();
  const [isGenerating, setIsGenerating] = useState(false);
  return (
    <AlertDialog
      open={imageGenerationModelOpen}
      onOpenChange={(value) => {
        setImageGenerationModelOpen(value);
        setIsGenerating(false);
      }}
    >
      <AlertDialogContent className="gap-6">
        <GenerateImageDialogContent
          setOpen={setImageGenerationModelOpen}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}
