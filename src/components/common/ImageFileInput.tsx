'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, Link as LinkIcon, Image as ImageIcon, Check } from 'lucide-react';

interface ImageFileInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function ImageFileInput({
  value,
  onChange,
  label = 'Product Image',
  className = '',
}: ImageFileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Resize and compress image file to lightweight DataURL (<100KB)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        setIsProcessing(false);
        return;
      }

      // Create an image to check dimensions and resize if needed
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // 85% JPEG gives great fidelity while reducing 5MB+ phone photos to ~40-80KB
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onChange(compressedDataUrl);
        } else {
          onChange(result);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        onChange(result);
        setIsProcessing(false);
      };
      img.src = result;
    };
    reader.onerror = () => {
      setIsProcessing(false);
      alert('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setShowUrlInput(false);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block font-bold text-slate-700 text-xs">{label}</label>
        <button
          type="button"
          onClick={() => {
            setShowUrlInput(!showUrlInput);
            if (!showUrlInput && value && !value.startsWith('data:')) {
              setUrlInput(value);
            }
          }}
          className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 transition"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Choose from files' : 'Paste URL instead'}</span>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {showUrlInput ? (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/product.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyUrl();
              }
            }}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition"
          >
            Apply
          </button>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-slate-400 hover:text-rose-500 transition"
              title="Clear Image"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : value ? (
        <div className="relative flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Product preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-semibold text-slate-800 truncate">Image selected</p>
            <p className="text-[11px] text-slate-400">
              {value.startsWith('data:') ? 'Local file uploaded' : 'Web URL'}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:underline"
              >
                Change file
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-4 text-center transition flex flex-col items-center justify-center gap-1.5 ${
            isDragging
              ? 'border-teal-500 bg-teal-50/50'
              : 'border-slate-200 bg-slate-50/80 hover:bg-slate-50 hover:border-teal-400'
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs">
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">
              {isProcessing ? 'Processing image...' : 'Click to select image from files'}
            </p>
            <p className="text-[11px] text-slate-400">or drag and drop file here (PNG, JPG, WebP)</p>
          </div>
        </div>
      )}
    </div>
  );
}
