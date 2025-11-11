interface IconProps {
  className?: string;
  size?: number;  // height in px
  color?: string;
  stroke?: number,
}

export const CartIcon = ({
  className,
  size = 22,
  color = "#000",
  stroke = 2,
}: IconProps) => {
  const aspectRatio = 17 / 20; // from viewBox
  return (
    <svg
      className={className}
      style={{ height: size, width: size * aspectRatio, display: "block" }}
      viewBox="0 0 17 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1.93056"
        y="5.22707"
        width="13.6869"
        height="13.3315"
        stroke={color}
        strokeWidth={stroke}
      />
      <path
        d="M11.6849 7.99093V1H5.83203V7.99093"
        stroke={color}
        strokeWidth={stroke}
      />
    </svg>
  );
};
