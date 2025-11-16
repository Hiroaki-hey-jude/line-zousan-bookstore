import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="flex items-center h-14 px-3">
        <Image
          src="/header.png"
          alt="Zousan Books"
          width={160}  
          height={40}
          className="object-contain"
          priority
        />
      </div>
    </header>
  );
}
