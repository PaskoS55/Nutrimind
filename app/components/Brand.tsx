import Image from "next/image";
import Link from "next/link";

export default function Brand() {
  return (
    <Link
      className="brand"
      href="/"
      aria-label="NutriMind by Pasko — на главную"
    >
      <Image
        src="/brand/nutrimind-symbol.svg"
        width={68}
        height={34}
        alt=""
        priority
      />
      <span>
        <b>NutriMind</b>
        <small>by Pasko</small>
      </span>
    </Link>
  );
}
