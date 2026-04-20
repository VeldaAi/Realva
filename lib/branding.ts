import type { User } from '@prisma/client';

export interface Branding {
  brokerageName: string;
  agentName: string;
  phone: string;
  email: string;
  website: string;
  licenseNumber: string;
  logoUrl: string;
  headshotUrl: string;
  brandColor: string;
  footerDisclaimer: string;
}

const DEFAULTS: Branding = {
  brokerageName: '',
  agentName: '',
  phone: '',
  email: '',
  website: '',
  licenseNumber: '',
  logoUrl: '',
  headshotUrl: '',
  brandColor: '#0f172a',
  footerDisclaimer:
    'This information is believed to be accurate but not guaranteed. Independently verify all details.',
};

export function resolveBranding(user: User): Branding {
  return {
    ...DEFAULTS,
    agentName: user.email.split('@')[0],
    email: user.email,
    phone: user.phone ?? '',
    website: user.website ?? '',
    licenseNumber: user.licenseNumber ?? '',
    logoUrl: user.logoUrl ?? '',
    headshotUrl: user.headshotUrl ?? '',
    brandColor: user.brandColor ?? DEFAULTS.brandColor,
    footerDisclaimer: user.footerDisclaimer ?? DEFAULTS.footerDisclaimer,
  };
}
