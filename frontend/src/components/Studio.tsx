import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Image as ImageIcon, Sliders, Download, RefreshCw, X } from 'lucide-react';
import { StudioProps } from '@/types/types';
import { ListScreenshots, GetScreenshotsBaseURL } from '../../wailsjs/go/main/App';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Studio({ onBackToPalette }: StudioProps) {
  const [images, setImages] = useState<string[]>([]);
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const imageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastOpenedImage = useRef<string | null>(null);

  const loadImages = async () => {
    try {
      setLoading(true);
      const files = await ListScreenshots();
      const url = await GetScreenshotsBaseURL();
      setBaseUrl(url);
      setImages(files);
    } catch (err) {
      console.error('Failed to load screenshots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    if (selectedImage === null && lastOpenedImage.current) {
      const ref = imageRefs.current[lastOpenedImage.current];
      if (ref) {
        setTimeout(() => {
          ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
    }
  }, [selectedImage]);

  const handleImageClick = (fileName: string) => {
    lastOpenedImage.current = fileName;
    setSelectedImage(fileName);
  };

  const handleBackToGallery = () => {
    setSelectedImage(null);
  };

  if (selectedImage) {
    const imageUrl = `${baseUrl}/${encodeURIComponent(selectedImage)}`;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black/95 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl overflow-hidden text-white relative">
        <button
          onClick={handleBackToGallery}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm border border-white/10 transition-all"
        >
          <X size={16} />
          <span>Back to Gallery</span>
        </button>

        <div className="absolute top-4 right-4 text-xs text-white/60 bg-black/50 px-3 py-1 rounded-full">
          {selectedImage}
        </div>

        <div className="w-full h-full p-8 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={selectedImage}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-start items-center rounded-3xl backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden text-white bg-black">
      <header className="flex items-center z-50 backdrop-blur-lg w-1/2 m-4 rounded-lg  justify-between px-6 py-4 border-b border-white/10 shrink-0 fixed">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/15 text-xs border border-white/10 text-white/80 hover:text-white transition-transform hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={14} />
            <span>Palette</span>
          </button>
          <h1 className="text-sm font-semibold text-white/90">GlowSnap Studio</h1>
        </div>

        <div className="flex items-center gap-2 ">
          <button
            onClick={loadImages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4 h-screen ">
        {loading && images.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/40">
            <RefreshCw size={32} className="animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-white/10 rounded-2xl p-6 text-center text-white/40">
            <ImageIcon size={48} className="mb-3 stroke-1" />
            <p className="text-sm">No screenshots yet. Capture your first screen!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max mt-[10vh]">
            {images.map((file) => (
              <div
                key={file}
                ref={(el) => { imageRefs.current[file] = el; }}
                onClick={() => handleImageClick(file)}
                className="relative group bg-white/5 rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer"
              >
                <img
                  src={`${baseUrl}/${encodeURIComponent(file)}`}
                  alt={file}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="p-2 text-xs truncate text-white/70">{file}</div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}