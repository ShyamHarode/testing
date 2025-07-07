import * as React from "react";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

interface AccordionItemProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {}

interface AccordionTriggerProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {}

interface AccordionContentProps extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {}

const AccordionItem = React.forwardRef<React.ElementRef<typeof AccordionPrimitive.Item>, AccordionItemProps>(
  ({ className, ...props }, ref) => <AccordionPrimitive.Item ref={ref} className={cn("", className)} {...props} />
);

AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<React.ElementRef<typeof AccordionPrimitive.Trigger>, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header className="flex items-center justify-between">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all [&[data-state=open]>svg]:rotate-45",
          className
        )}
        {...props}
      >
        {children}
        <Plus className="h-6 w-6 text-black transition-transform duration-200 ml-3" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
);

AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<React.ElementRef<typeof AccordionPrimitive.Content>, AccordionContentProps>(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(
        "overflow-hidden text-sm transition-all",
        "data-[state=open]:animate-accordion-down",
        "data-[state=closed]:animate-accordion-up data-[state=closed]:invisible data-[state=closed]:h-0",
        className
      )}
      {...props}
    >
      {children}
    </AccordionPrimitive.Content>
  )
);

AccordionContent.displayName = "AccordionContent";

export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionPrimitive,
  AccordionTrigger,
  type AccordionContentProps,
  type AccordionItemProps,
  type AccordionTriggerProps,
};
