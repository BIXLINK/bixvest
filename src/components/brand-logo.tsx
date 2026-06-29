import { bixvestLogoUrl } from "@/lib/brand-assets";

export function BrandLogo({ className = "h-8 w-8 rounded-lg" }: { className?: string }) {
  return <img src={bixvestLogoUrl} alt="BIXVEST" className={className} />;
}
