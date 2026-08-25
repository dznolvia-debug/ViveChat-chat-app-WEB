import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const MediaViewerModal: React.FC = () => {
  const { mediaViewerData, closeMediaViewer } = useChat();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!mediaViewerData || !mediaViewerData.isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaViewerData.url;
    link.download = `vivechat_${Date.now()}.${mediaViewerData.type === 'video' ? 'mp4' : 'jpg'}`;
    link.click();
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Top action bar */}
      <div className="w-full flex items-center justify-between text-white py-2 px-4">
        <span className="text-sm font-medium opacity-80 truncate max-w-xs">
          {mediaViewerData.title || (mediaViewerData.type === 'video' ? 'Video' : 'Foto')}
        </span>

        <div className="flex items-center gap-2">
          {mediaViewerData.type === 'image' && (
            <>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                title="Acercar"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                title="Alejar"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                title="Rotar"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            title="Descargar"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={closeMediaViewer}
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            title="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden p-2">
        {mediaViewerData.type === 'image' ? (
          <img
            src={mediaViewerData.url}
            alt="Preview"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl select-none"
          />
        ) : (
          <video
            src={mediaViewerData.url}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl"
          />
        )}
      </div>

      {/* Caption footer if exists */}
      {mediaViewerData.title && (
        <div className="text-white text-center text-sm py-2 px-4 max-w-xl bg-black/40 rounded-full mb-2">
          {mediaViewerData.title}
        </div>
      )}
    </div>
  );
};
