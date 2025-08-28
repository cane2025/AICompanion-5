interface UngdomsLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function UngdomsLogo({ className = "", size = "md" }: UngdomsLogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl", 
    lg: "text-3xl",
    xl: "text-4xl"
  };

  return (
    <div className={`flex items-center font-bold text-primary ${className}`}>
      <div className={`${sizeClasses[size]} flex flex-col leading-tight`}>
        <span>UNGDOMS</span>
        <span className="text-xs text-muted-foreground">Öppenvård</span>
      </div>
    </div>
  );
}