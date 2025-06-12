'use client'

import React, { useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';  
import { Button } from '../ui/button';

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

export default function Editor() {
    const editor = useRef(null);
    const [content, setContent] = useState("");
    const { resolvedTheme } = useTheme(); 

    const config = useMemo(() => {
        const isDark = resolvedTheme === 'dark';

        return {
            theme: isDark ? 'dark' : 'default',
            style: {
                background: isDark ? '#1e1e1e' : '#fff',
                color: isDark ? '#fff' : '#000',
                minHeight: '300px',
            },
            toolbarAdaptive: false,
            toolbarSticky: false,
            uploader: {
                insertImageAsBase64URI: true,
                imagesExtensions: ['jpg', 'png', 'jpeg', 'gif', 'svg', 'webp'],
            },
        };
    }, [resolvedTheme]);

    const handleChange = (value: any) => {
        setContent(value);
    };

    return (
        <main className="flex justify-center items-center p-6">
            <div className="w-full rounded-lg shadow-lg p-4 bg-white dark:bg-[#1f1f1f]">
                <div className="mb-6">
                    <JoditEditor
                        ref={editor}
                        value={content}
                        config={config}
                        onChange={handleChange}
                        className="w-full"
                    />
                    <style>{`.jodit-wysiwyg{height:300px !important}`}</style>
                </div>
                <div className="flex justify-end gap-3">
                    <Button className="bg-red-500 hover:bg-red-600 text-white">
                        Cancel
                    </Button>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                        Save
                    </Button>
                </div>
            </div>
        </main>
    );
}
