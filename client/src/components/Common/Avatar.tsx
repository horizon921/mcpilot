"use client";

import * as React from "react";
import classNames from "classnames";

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "span" : "span"; // Simplified, can be Slot from @radix-ui/react-slot
    return (
      <Comp
        ref={ref}
        className={classNames(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      />
    );
  }
);
Avatar.displayName = "Avatar";

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  asChild?: boolean;
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "img" : "img"; // Simplified
    return (
      <Comp
        ref={ref}
        className={classNames("aspect-square h-full w-full", className)}
        {...props}
      />
    );
  }
);
AvatarImage.displayName = "AvatarImage";

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
  delayMs?: number;
}

const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ className, asChild = false, delayMs, ...props }, ref) => {
    const Comp = asChild ? "span" : "span"; // Simplified
    // Basic delay logic, can be more sophisticated
    const [canRender, setCanRender] = React.useState(delayMs === undefined);

    React.useEffect(() => {
      if (delayMs === undefined) return;
      const timer = setTimeout(() => {
        setCanRender(true);
      }, delayMs);
      return () => clearTimeout(timer);
    }, [delayMs]);

    if (!canRender && delayMs !== undefined) {
      return null;
    }

    return (
      <Comp
        ref={ref}
        className={classNames(
          "flex h-full w-full items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800",
          className
        )}
        {...props}
      />
    );
  }
);
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };