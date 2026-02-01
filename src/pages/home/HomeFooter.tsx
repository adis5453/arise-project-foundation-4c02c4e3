import React from "react";
import { Link } from "react-router-dom";

export const HomeFooter = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"footer">>(
  function HomeFooter(_props, ref) {
    return (
    <footer ref={ref} className="bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between 2xl:max-w-[1400px] 2xl:px-10">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} arise hrm</p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link className="hover:text-foreground" to="/login">
            Login
          </Link>
          <Link className="hover:text-foreground" to="/dashboard">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
    );
  }
);

