type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
  color?: string;
  stroke?: number;
};

export function SimpleChevronUpIcon({
  size = 24,
  color = "#4D4D4D",
  stroke = 2,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M1.33398 12.0679L10.1668 2.43204L18.9997 12.0679"
        stroke={color}
        strokeWidth={stroke}
      />
    </svg>
  );
}
