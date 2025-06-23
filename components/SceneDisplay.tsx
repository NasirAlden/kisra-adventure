
import React from 'react';

interface SceneDisplayProps {
  imageSrc: string;
  description: string;
  isLoadingImage: boolean;
}

const SceneDisplay: React.FC<SceneDisplayProps> = ({ imageSrc, description, isLoadingImage }) => {
  return (
    <div className="mb-6 text-center">
      <div className="w-full aspect-video bg-slate-700 rounded-lg shadow-lg overflow-hidden mb-4 border-2 border-slate-600 relative">
        {isLoadingImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-700 bg-opacity-80">
            <div className="text-slate-300">جارٍ تحميل الصورة...</div>
          </div>
        )}
        {!isLoadingImage && imageSrc && (
           <img 
            src={imageSrc} 
            alt="مشهد من المغامرة" 
            className="w-full h-full object-cover transition-opacity duration-500 ease-in-out"
            onError={(e) => (e.currentTarget.src = 'https://picsum.photos/600/400?grayscale&random=' + Math.random())} // Fallback for broken images
          />
        )}
         {!isLoadingImage && !imageSrc && (
           <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
             <p className="text-slate-400">لم يتم تحميل الصورة.</p>
           </div>
         )}
      </div>
      {description ? (
        <p className="text-lg md:text-xl text-slate-200 leading-relaxed whitespace-pre-wrap p-3 bg-slate-800/50 rounded-md">
          {description}
        </p>
      ) : (
        <p className="text-lg md:text-xl text-slate-400 leading-relaxed p-3">
          جارٍ تحميل وصف المشهد...
        </p>
      )}
    </div>
  );
};

export default SceneDisplay;
