"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function NewsBanner() {
    const [announcement, setAnnouncement] = useState<string | null>(null);

    useEffect(() => {
        // Fetch the active news/announcements from the existing API
        const fetchNews = async () => {
            try {
                const response = await axios.get("/api/user/news");
                if (response.data && response.data.length > 0) {
                    // Display the most recent active announcement
                    setAnnouncement(response.data[0].description);
                }
            } catch (error) {
                console.error("Failed to fetch news banner:", error);
            }
        };

        fetchNews();
    }, []);

    if (!announcement) return null;

    return (
        <div className= "sticky top-0 z-[100] bg-linear-to-r from-amber-500 to-orange-600 text-white text-[13px] sm:text-sm font-semibold py-2.5 px-4 text-center shadow-md border-b border-orange-700/50 flex items-center justify-center gap-2" >
        <svg
            className="w-4 h-4 animate-pulse shrink-0"
            fill = "none"
            viewBox = "0 0 24 24"
            stroke = "currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin = "round"
                strokeWidth = "2"
                d = "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
            </svg>
            <span className = "tracking-wide" dangerouslySetInnerHTML = {{ __html: announcement }
        } />
    </div>
  );
}
