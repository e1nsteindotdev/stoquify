import { useStore } from '@tanstack/react-form'
import { useFieldContext } from '@/hooks/form-context.tsx'
import { Label } from '@radix-ui/react-label'
import { useRef, useState } from 'react'
import { Button } from './button'

type PropsType = { productId: string, label?: string } & React.ComponentProps<"input">

type Image = {
  storageId: string,
  order: 1
}

export default function ImageField({ productId, label, className, type, ...props }: PropsType) {
  const imagesInputRef = useRef<HTMLInputElement>(null)
  const field = useFieldContext<Image[]>()

  const errors = useStore(field.store, (state) => state.meta.errors)
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);

  function handleClick() {
    imagesInputRef?.current?.click()
  }

  async function handleInputChange(files: FileList | null) {
    setSelectedImages(files)
    const convexSiteUrl = import.meta.env.VITE_CONVEX_URL
    for (let index in selectedImages) {
      const sendImageUrl = new URL(`${convexSiteUrl}/sendImage`);
      sendImageUrl.searchParams.set("productId", "productId");
      sendImageUrl.searchParams.set("hidden", "false");
      sendImageUrl.searchParams.set("order", index);
      const image = selectedImages[index]
      if (image) await fetch(sendImageUrl, {
        method: "POST",
        headers: { "Content-Type": image.type },
        body: image,
      });
    }
  }

  return (
    <div className="grid gap-2">
      {label && <Label className="font-semibold">{label}</Label>}
      <input
        className='hidden'
        ref={imagesInputRef}
        accept="image/*"
        type="file"
        multiple
        onChange={(event) => handleInputChange(event.target.files)}
        {...props}
      />

      {
        field.state.value ? <div className="border-1 border-black/30 rounded-[12px] border-dashed flex items-center justify-center h-[120px]">
          <Button type="button"
            className="bg-transparent text-[14px] text-[#6A4FFF] border-[#6A4FFF]/30 border-1 hover:bg-transparent"
            onClick={handleClick}>Add Photos</Button>
        </div> :
          <div>
            {/* list of images here */}
            <Button onClick={handleClick}>Add other photos</Button>
          </div>
      }

      {errors.map((error: string) => (
        <div key={error} style={{ color: 'red' }}>
          {error}
        </div>
      ))}

    </div>
  )
}

