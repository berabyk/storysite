import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm shadow-sm transition-colors",
          "placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
