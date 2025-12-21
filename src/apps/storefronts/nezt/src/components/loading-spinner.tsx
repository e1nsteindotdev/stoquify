import { ClipLoader } from "react-spinners";

export function LoadingSpinner({ size = 50, color = "#000", className = "" }: { size?: number, color?: string, className?: string }) {
  return (
    <div className={`flex items-center justify-center w-full min-h-[100px] ${className}`}>
      <ClipLoader size={size} color={color} />
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <ClipLoader size={50} color="#000" />
    </div>
  );
}
