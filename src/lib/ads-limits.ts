import type { AccountType } from "@/lib/auth-types";

export const ADS_LIMITS = {
  user: { maxAds: 3, maxImages: 5 },
  merchant: { maxAds: 10, maxImages: 5 },
  admin: { maxAds: 10, maxImages: 5 },
} as const;

export function maxAdsFor(accountType: AccountType): number {
  return ADS_LIMITS[accountType].maxAds;
}

export function maxImagesFor(accountType: AccountType): number {
  return ADS_LIMITS[accountType].maxImages;
}