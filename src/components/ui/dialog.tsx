import * as React from "react"
import { cn } from "@/lib/utils"

const Dialog = ({ children, open, onOpenChange, ...props }: any) => (
  open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange?.(false)} {...props}>
      <div className="bg-background rounded-lg shadow-lg p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  ) : null
)

const DialogTrigger = ({ children, asChild, ...props }: any) => (
  <span {...props}>{children}</span>
)

const DialogContent = ({ children, className, ...props }: any) => (
  <div className={cn("", className)} {...props}>{children}</div>
)

const DialogHeader = ({ children, className, ...props }: any) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props}>{children}</div>
)

const DialogTitle = ({ children, className, ...props }: any) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props}>{children}</h2>
)

const DialogDescription = ({ children, className, ...props }: any) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props}>{children}</p>
)

const DialogFooter = ({ children, className, ...props }: any) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props}>{children}</div>
)

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
