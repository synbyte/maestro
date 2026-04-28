"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import {
    Bold,
    Italic,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code,
    Undo,
    Redo
} from "lucide-react";

interface RichEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function RichEditor({ content, onChange, placeholder = "Write something...", disabled = false }: RichEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            Markdown,
        ],
        content: content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            // Get Markdown content
            onChange(editor.storage.markdown.getMarkdown());
        },
        editorProps: {
            handleKeyDown: (view, event) => {
                if (event.key === 'Tab') {
                    const { state, dispatch } = view;
                    const { tr, selection } = state;
                    dispatch(tr.insertText("\t", selection.from, selection.to));
                    return true;
                }
                return false;
            }
        },
        editable: !disabled,
    });

    useEffect(() => {
        if (editor && editor.isEditable !== !disabled) {
            editor.setEditable(!disabled);
        }
    }, [editor, disabled]);

    if (!editor) {
        return null;
    }

    const MenuButton = ({ onClick, isActive, children, title }: any) => (
        <button
            type="button"
            onClick={onClick}
            className={`p-1.5 rounded transition-colors ${isActive ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground hover:bg-[#333]"
                }`}
            title={title}
            disabled={disabled}
        >
            {children}
        </button>
    );

    return (
        <div className="flex flex-col w-full border border-border rounded-lg bg-[#121212] overflow-hidden focus-within:border-accent/50 transition-colors">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-border bg-[#1a1a1a]">
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive("heading", { level: 3 })}
                    title="Heading"
                >
                    <Heading3 size={16} />
                </MenuButton>
                <div className="w-px h-4 bg-border mx-1" />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive("bold")}
                    title="Bold"
                >
                    <Bold size={16} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive("italic")}
                    title="Italic"
                >
                    <Italic size={16} />
                </MenuButton>
                <div className="w-px h-4 bg-border mx-1" />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive("bulletList")}
                    title="Bullet List"
                >
                    <List size={16} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive("orderedList")}
                    title="Ordered List"
                >
                    <ListOrdered size={16} />
                </MenuButton>
                <div className="w-px h-4 bg-border mx-1" />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive("blockquote")}
                    title="Quote"
                >
                    <Quote size={16} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    isActive={editor.isActive("codeBlock")}
                    title="Code Block"
                >
                    <Code size={16} />
                </MenuButton>
                <div className="flex-1" />
                <MenuButton
                    onClick={() => editor.chain().focus().undo().run()}
                    title="Undo"
                >
                    <Undo size={14} />
                </MenuButton>
                <MenuButton
                    onClick={() => editor.chain().focus().redo().run()}
                    title="Redo"
                >
                    <Redo size={14} />
                </MenuButton>
            </div>

            {/* Editor Area */}
            <div
                className="p-4 min-h-[120px] prose prose-invert max-w-none prose-sm focus:outline-none cursor-text"
                onClick={() => editor.commands.focus()}
            >
                <EditorContent editor={editor} />
            </div>

            <style jsx global>{`
                .ProseMirror {
                    outline: none !important;
                    min-height: 120px;
                    height: 100%;
                    padding-bottom: 2rem;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #666;
                    pointer-events: none;
                    height: 0;
                }
                .ProseMirror blockquote {
                    border-left: 3px solid #333;
                    padding-left: 1rem;
                    color: #aaaaa5;
                }
                .ProseMirror code {
                    background: #1a1a1a;
                    padding: 0.2rem 0.4rem;
                    border-radius: 4px;
                    font-size: 0.85rem;
                }
                .ProseMirror pre {
                    background: #000;
                    color: #fff;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                }
                .ProseMirror ul, .ProseMirror ol {
                    padding-left: 1.2rem;
                }
            `}</style>
        </div>
    );
}
