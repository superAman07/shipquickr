'use client'

import React, { useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Button } from '../ui/button';

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

interface EditorProps {
    content: string;
    onChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
}

export default function Editor({ content, onChange, onSave, onCancel }: EditorProps) {
    const editor = useRef(null);
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
            toolbarSticky: true,
            buttons: [
                'source', '|',
                'bold', 'italic', 'underline', 'strikethrough', '|',
                'ul', 'ol', '|',
                'font', 'fontsize', 'brush', 'paragraph', '|',
                'image', 'table', 'link', '|',
                'align', 'left', 'center', 'right', 'justify', '|',
                'undo', 'redo', '|',
                'hr', 'eraser', 'copyformat', '|',
                'symbol', 'print', 'about', 'fullsize'
            ],
            uploader: {
                insertImageAsBase64URI: true,
                imagesExtensions: ['jpg', 'png', 'jpeg', 'gif', 'svg', 'webp'],
            },
            list: {
                defaultListType: 'UL'
            }, 
            showCharsCounter: true,
            showWordsCounter: true,
            iframe: false,
            askBeforePasteHTML: false,
            askBeforePasteFromWord: false,
            defaultActionOnPaste: 'insert_clear_html',
            disablePlugins: [
                'select', 
                'indent', 
                'outdent'
            ],
            controls: {
            ul: {
                data: {
                    elementList: 'ul'
                },
                list: null  
            },
            ol: {
                data: {
                    elementList: 'ol'
                },
                list: null  
            }
        }
        } as any;
    }, [resolvedTheme]);



    return (
        <main className="flex justify-center items-center p-6">
            <div className="w-full rounded-lg shadow-lg p-4 bg-white dark:bg-[#1f1f1f]">
                <div className="mb-6">
                    <JoditEditor
                        ref={editor}
                        value={content}
                        config={config}
                        onChange={onChange}
                        className="w-full"
                    />
                    <style>{`.jodit-wysiwyg{height:300px !important}`}</style>
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onCancel} className="bg-red-500 hover:bg-red-600 text-white">
                        Cancel
                    </Button>
                    <Button onClick={onSave} className="bg-blue-500 hover:bg-blue-600 text-white">
                        Save
                    </Button>
                </div>
            </div>
        </main>
    );
}
