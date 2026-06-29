"use client"

/**
 * PasswordInput — drop-in replacement for `<Input type="password" />` that
 * adds an eye / eye-off toggle button on the right side.
 *
 * Forwards all extra props to the underlying <input>, so it slots into the
 * existing LoginForm / RegisterForm unchanged apart from the type prop.
 */
import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"

export interface PasswordInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)
    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={cn(
            // Mirrors the styling of components/ui/input.tsx but uses the
            // h-11 / focus-ring-blue-500 form used by the auth pages.
            "flex h-11 w-full rounded-md border-2 border-gray-200 bg-white px-3 pr-11 py-2 text-base",
            "ring-offset-background placeholder:text-gray-400",
            "focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-200",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center",
            "rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50",
            "focus:outline-none focus:ring-2 focus:ring-blue-300",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }