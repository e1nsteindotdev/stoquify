import React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
  color?: string;
};

export function RightChevron({
  size = 24,
  color = "black",
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 13 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3.98831 6.15695L1.49414 2L11.4708 6.15695L1.90984 10.3139L3.98831 6.15695Z"
        fill={color}
        stroke={color}
        strokeWidth={2}
      />
    </svg>
  );
}
