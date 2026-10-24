import { copy, type Lang } from "../../content/copy";
import { PhoneIcon } from "./Icons";

/** A real tel: link, so a tap opens the phone's dialer. */
export function CallButton({ phone, who, lang, className }: { phone: string; who: string; lang: Lang; className: string }) {
  return (
    <a href={`tel:${phone}`} className={className} aria-label={copy.rider.callWho[lang](who)}>
      <PhoneIcon size={20} />
      <span>{copy.rider.call[lang]}</span>
    </a>
  );
}
