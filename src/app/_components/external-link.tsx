import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { type AnchorHTMLAttributes } from "react";
import { cn } from "~/lib/cn";
import { buttonVariants } from "./ui/button";

export default function ExternalLink({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        buttonVariants({ variant: "link" }),
        "h-auto gap-0.5 rounded-none p-px text-sm",
      )}
      {...props}
    >
      {children}
      <ArrowTopRightIcon />
    </a>
  );
}
