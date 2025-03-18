import type React from "react";
import Image from "next/image";
import clsx from "clsx";

import classes from "./StyledLink.module.css";
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";

export default function StyledLink({
  id,
  href,
  className,
  children,
  testProp,
  ...rest
}: React.ComponentProps<"a">) {
  return (
    <a href={href} className={clsx(classes.link, className)} {...rest}>
      {children}

      {/* <span style={{ position: "absolute", top: 0, right: 0 }}>{testProp}</span> */}
      {/* <ArrowDownTrayIcon
        style={{
          width: 30,
          height: 30,
          position: "absolute",
          bottom: 7,
          right: 7,
          color: "white",
        }}
      /> */}
    </a>
  );
}
