interface IconProps {
  className?: string;
  size?: number;   // height in px
  color?: string;
  stroke?: number; // stroke width
}

export const MenuIcon = ({
  className,
  size = 14,
  color = "#000",
  stroke = 2,
}: IconProps) => {
  const aspectRatio = 16 / 13; // from viewBox
  return (
    <svg
      className={className}
      style={{ height: size, width: size * aspectRatio, display: "block" }}
      viewBox="0 0 16 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 6.49997H14"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M2 11H14"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M2 1.99997H14"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="square"
        strokeLinejoin="round"
      />
    </svg>
  );
};

