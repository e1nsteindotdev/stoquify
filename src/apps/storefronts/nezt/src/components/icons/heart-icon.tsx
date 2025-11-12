interface IconProps {
  className?: string;
  size?: number;  // height in px
  color?: string;
}

export const HeartIcon = ({
  className,
  size = 19,
  color = "#000",
}: IconProps) => {
  const aspectRatio = 20 / 15; // from viewBox
  return (
    <svg
      className={className}
      style={{ height: size, width: size * aspectRatio, display: "block" }}
      viewBox="0 0 20 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.2991 13.3391L18.5091 5.12902L16.1145 1.19504H12.8647L10.2991 4.10277L7.56238 1.19504H4.65465L1.91797 5.30007L10.2991 13.3391Z"
        stroke={color}
        strokeWidth="2.05251"
      />
    </svg>
  );
};
