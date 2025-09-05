import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text = "Laddar...",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
      ></div>
      {text && <span className="ml-2 text-gray-600">{text}</span>}
    </div>
  );
};

// Full screen loading spinner
export const FullScreenSpinner: React.FC<{ text?: string }> = ({ text }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  </div>
);

// Inline loading spinner för knappar etc
export const InlineSpinner: React.FC<{ size?: "sm" | "md" }> = ({
  size = "sm",
}) => (
  <div className="inline-flex items-center">
    <div
      className={`animate-spin rounded-full border-b-2 border-current ${
        size === "sm" ? "h-4 w-4" : "h-6 w-6"
      }`}
    ></div>
  </div>
);
