import Link from "next/link";

export default function BotonAzul({
  href,
  children,
  type = "button", // puede ser "submit" o "button"
  onClick,
  className = "",
  ...props
}) {
  const baseStyles =
    "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800";

  const combinedStyles = `${baseStyles} ${className}`;

  if (href) {
    // Navegación por Link
    return (
      <Link href={href}>
        <button className={combinedStyles} {...props}>
          {children}
        </button>
      </Link>
    );
  }

  // Botón normal (submit o click)
  return (
    <button type={type} onClick={onClick} className={combinedStyles} {...props}>
      {children}
    </button>
  );
}
