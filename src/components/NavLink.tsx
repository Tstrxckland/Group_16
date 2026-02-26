import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

type RouterNavLinkProps = ComponentPropsWithoutRef<typeof RouterNavLink>;

interface NavLinkProps extends Omit<RouterNavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, pendingClassName, ...props }, ref) => {
    return (
      <RouterNavLink
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        ref={ref}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
