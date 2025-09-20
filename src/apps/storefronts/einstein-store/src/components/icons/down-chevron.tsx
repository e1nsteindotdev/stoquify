type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
  color?: string;
  stroke?: number;
};

export function DownChevron({
  size = 24,
  color = "#4D4D4D",
  stroke = 2,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 13 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6.49998 5.00001L11.5 2L6.49998 14L1.49996 2.5L6.49998 5.00001Z"
        fill={color}
        stroke={color}
        strokeWidth={stroke}
      />
    </svg>
  );
}
