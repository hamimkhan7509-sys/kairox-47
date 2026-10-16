export const CREATOR_NAME = "Kairox 47";
export const CREATOR_YOUTUBE_URL = "https://youtube.com/@officialkairox47";
export const SITE_NAME = "mc-generator";
export const SITE_TAGLINE = "Free AI Add-on & Skin Pack Generator for Minecraft Bedrock";
export const BEDROCK_VERSION = "1.21.0";
export const LEGAL_DISCLAIMER = "Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.";

export interface UserSettings {
  includeCreatorCredit: boolean;
  autoSaveHistory: boolean;
  hapticFeedback: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  includeCreatorCredit: true,
  autoSaveHistory: true,
  hapticFeedback: true,
};

export const STORAGE_KEYS = {
  SETTINGS: 'mc_generator_settings',
  CREATIONS: 'mc_generator_creations',
};
