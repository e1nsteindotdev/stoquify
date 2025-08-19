interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const DownArrow = ({
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
      d="M5.37329 1.61621V14.1162"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M1.87324 11.2492L4.66622 14.0422C5.05675 14.4327 5.68991 14.4327 6.08043 14.0422L8.8734 11.2492"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

