import Link from "next/link";

export default function BotonRojo({
  href,
  children,
  type = "button",
  onClick,
  className = "",
  ...props
}) {
  const baseStyles =
    "text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none dark:focus:ring-red-800";

  const combinedStyles = `${baseStyles} ${className}`;

  if (href) {
    return (
      <Link href={href}>
        <button className={combinedStyles} {...props}>
          {children}
        </button>
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={combinedStyles} {...props}>
      {children}
    </button>
  );
}
