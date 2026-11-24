import { config } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon, type FontAwesomeIconProps } from "@fortawesome/react-fontawesome";

// CSS Font Awesome sudah diimpor sekali di app/layout.tsx, jadi jangan disuntik ulang saat runtime.
config.autoAddCss = false;

/** Ikon Font Awesome (SVG). Dekoratif secara default; beri `title` bila ikon berdiri sendiri. */
export default function Icon(props: FontAwesomeIconProps) {
  return <FontAwesomeIcon {...props} />;
}
