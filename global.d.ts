export {};

declare global {
  interface Window {
    Hotsite: Record<string, any>;
    PRESENTATIONS: Array<{
      slug: string;
      title: string;
      description: string;
      href: string;
    }>;
  }

  var Hotsite: Record<string, any>;
  var PRESENTATIONS: Window['PRESENTATIONS'];
}
