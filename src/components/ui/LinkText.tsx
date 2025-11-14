import Link from "next/link";

interface LinkTextProps {
  title: string;
  href: string;
}

export default function LinkText({ title, href }: LinkTextProps) {
  return (
    <Link className="font-semibold text-[#5A9CFF] hover:text-blue-400" href={href}>
      &nbsp;{title}
    </Link>
  );
}
