import * as React from "react"
import { cn } from "@/lib/utils"

const Command = ({ children, className, ...props }: any) => (
  <div className={cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className)} {...props}>
    {children}
  </div>
)

const CommandInput = ({ className, ...props }: any) => (
  <input className={cn("flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />
)

const CommandList = ({ children, className, ...props }: any) => (
  <div className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)} {...props}>{children}</div>
)

const CommandEmpty = ({ children, ...props }: any) => (
  <p className="py-6 text-center text-sm" {...props}>{children || "No results found."}</p>
)

const CommandGroup = ({ children, heading, ...props }: any) => (
  <div {...props}>
    {heading && <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{heading}</div>}
    {children}
  </div>
)

const CommandItem = ({ children, className, ...props }: any) => (
  <div className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground", className)} {...props}>
    {children}
  </div>
)

const CommandSeparator = ({ className, style, ...props }: any) => <div className={cn("h-px bg-border", className)} style={style} {...props} />

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator }
