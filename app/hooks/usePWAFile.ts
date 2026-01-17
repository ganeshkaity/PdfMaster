"use client";

import { useEffect, useState } from "react";
import { getSharedFile, clearSharedFile } from "../lib/pwa-file-store";
import toast from "react-hot-toast";

export function usePWAFile(onFileLoaded?: (file: File) => void) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkFile = async () => {
            try {
                const file = await getSharedFile();
                if (file) {
                    if (onFileLoaded) {
                        onFileLoaded(file);
                        toast.success(`Loaded ${file.name} from shared file`);
                        // Clear it so it doesn't persist on next reload unnecessarily, 
                        // unless we want it to. Usually good to clear once consumed.
                        await clearSharedFile();
                    }
                }
            } catch (error) {
                console.error("Error loading shared file:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkFile();
    }, []);

    return { isLoading };
}
