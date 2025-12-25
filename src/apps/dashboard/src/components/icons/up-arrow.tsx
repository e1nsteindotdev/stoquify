interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const UpArrow = ({
  className,
  size = 14,
  color = "#4D4D4D",
}: IconProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 10 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.09741 14.3828V1.88281"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M1.59736 4.74884L4.39034 1.95588C4.78087 1.56536 5.41403 1.56536 5.80455 1.95588L8.59752 4.74884"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
