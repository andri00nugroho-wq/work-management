import Image from "next/image";
import logo from "@/public/brand/logo-rei-2.png";

type ReiLogoProps = {
  compact?: boolean;
  className?: string;
};

export default function ReiLogo({ compact = false, className = "" }: ReiLogoProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minWidth: 0,
        textAlign: "center",
      }}
    >
      <Image
        src={logo}
        alt="Logo Raja Emas Indonesia"
        width={100}
        loading="eager"
        style={{
          display: "block",
          width: compact ? "64px" : "100px",
          height: compact ? "64px" : "100px",
          maxWidth: "100%",
          objectFit: "contain",
          objectPosition: "center",
          flexShrink: 0,
          margin: "0 auto",
        }}
      />
    </div>
  );
}
