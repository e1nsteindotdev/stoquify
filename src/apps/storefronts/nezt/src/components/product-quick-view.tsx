import { useRef, useState } from "react";

export function ProductQuickView({
  imgs,
}: {
  imgs:
    | {
        order: number;
        hidden: boolean;
        url?: string | undefined;
      }[]
    | undefined;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const visibleImages = imgs?.filter((img) => !img.hidden && img.url) || [];
  const selectedImage = visibleImages[selectedImageIndex];

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <div>
      <button
        onClick={() => open()}
        className="text-[12px] px-2 rounded-full border-1 border-black uppercase font-semibold font-inter"
      >
        voir rapidement
      </button>
      <dialog
        ref={dialogRef}
        className="w-screen h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] border-0 p-0"
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            close();
          }
        }}
      >
        <div className="bg-white w-full max-w-[90vw] max-h-[90vh] lg:max-w-[1400px] p-4 lg:p-8 rounded-lg flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              onClick={close}
              className="text-2xl font-bold text-black hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 overflow-auto">
            {/* Main large image */}
            <div className="flex items-center justify-center min-h-[300px] lg:min-h-[600px]">
              {selectedImage?.url ? (
                <img
                  src={selectedImage.url}
                  className="w-full h-full max-h-[600px] object-contain"
                  alt="Produit"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <p className="text-gray-400">Aucune image disponible</p>
                </div>
              )}
            </div>
            {/* Thumbnail grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4 max-h-[600px] overflow-auto">
              {visibleImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`border-2 transition-all ${
                    index === selectedImageIndex
                      ? "border-black"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <img
                    src={img.url}
                    className="w-full h-full object-cover aspect-square"
                    alt={`Miniature ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
