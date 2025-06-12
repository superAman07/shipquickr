'use client'

import React, { useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '../ui/button'; 

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

export default function Editor() {
    const editor = useRef(null);
    const [content, setContent] = useState("");

    const config = useMemo(
        () => ({
            uploader: {
                insertImageAsBase64URI: true,
                imagesExtensions: ['jpg', 'png', 'jpeg', 'gif', 'svg', 'webp']
            },
        }),
        []
    );
    const handleChange = (value: any) => {
        setContent(value);
    };

    return (
        <>
            <main>
                <div className=" flex items-center flex-col">
                    <div className="h-full">
                        <JoditEditor
                            ref={editor}
                            value={content}
                            config={config}
                            onChange={handleChange}
                            className="w-full h-[70%] text-[#202020] mt-10 bg-black"
                        />
                        <style>
                            {`.jodit-wysiwyg{height:300px !important}`}
                        </style>
                    </div>
                    <div className='flex justify-center'>
                        <Button
                            className="bg-red-500 mr-3 cursor-pointer hover:bg-red-600 text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-blue-500 cursor-pointer hover:bg-blue-600 text-white"
                        >
                            Save
                        </Button>
                    </div> 
                </div>
            </main>
        </>
    );
}