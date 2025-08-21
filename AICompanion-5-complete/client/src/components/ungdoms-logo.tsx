import logo2 from "@assets/logo2-01_1753913489671.png";

interface UngdomsLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function UngdomsLogo({ className = "", size = "md" }: UngdomsLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto", 
    lg: "h-16 w-auto",
    xl: "h-20 w-auto"
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logo2} 
        alt="UNGDOMS Logo" 
        className={sizeClasses[size]}
      />
    </div>
  );
}