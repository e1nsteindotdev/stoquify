type TProps = {
  src: string
  alt?: string
  width?: number
  height?: number
  className?: string
}

export function Image({ src, alt, width, height, className }: TProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  )
}
