"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes"; // To adapt toast theme to app theme

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <SonnerToaster
      theme={theme as ToasterProps["theme"]} // Cast theme to the expected type
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "!bg-red-500 !text-white", // Example custom error style
          success: "!bg-green-500 !text-white", // Example custom success style
          warning: "!bg-yellow-500 !text-black", // Example custom warning style
          info: "!bg-blue-500 !text-white", // Example custom info style
        },
      }}
      position="bottom-right" // Or your preferred position
      richColors // Enables default rich colors for success, error, warning, info
      closeButton // Show close button on toasts
      {...props}
    />
  );
};

export { Toaster };