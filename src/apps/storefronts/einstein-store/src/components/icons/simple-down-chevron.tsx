type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
  color?: string;
  strokeValue?: number;
};

export function SimpleChevronDownIcon({
  size = 24,
  color = "black",
  strokeValue = 2,
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 21 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M1.5 1.35083L10.3328 10.9867L19.1657 1.35083"
        stroke={color}
        strokeWidth={strokeValue}
      />
    </svg>
  );
}
