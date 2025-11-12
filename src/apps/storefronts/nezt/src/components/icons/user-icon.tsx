interface IconProps {
  className?: string;
  size?: number;  // height in px
  color?: string;
}

export const UserIcon = ({
  className,
  size = 14,
  color = "#4D4D4D",
}: IconProps) => {
  const aspectRatio = 21 / 19; // from viewBox
  return (
    <svg
      className={className}
      style={{ height: size, width: size * aspectRatio, display: "block" }}
      viewBox="0 0 21 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="10.2361"
        cy="5.84617"
        r="4.44711"
        stroke={color}
        strokeWidth="2.05251"
      />
      <path
        d="M19.4726 18.1613L16.0518 13.7141H4.5919L1 18.1613"
        stroke={color}
        strokeWidth="2.05251"
      />
    </svg>
  );
};
