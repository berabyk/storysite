import type { Locale } from "./types";

export const LOCALES: Locale[] = ["tr", "en"];
export const DEFAULT_LOCALE: Locale = "tr";

export function isLocale(value: string | undefined): value is Locale {
  return value === "tr" || value === "en";
}

type Dict = {
  siteName: string;
  tagline: string;
  nav: {
    stories: string;
    characters: string;
  };
  home: {
    heroKicker: string;
    heroTitle: string;
    heroSubtitle: string;
    browseStories: string;
    meetCharacters: string;
    latest: string;
    allStories: string;
    empty: string;
  };
  charactersPage: {
    title: string;
    subtitle: string;
    empty: string;
  };
  story: {
    back: string;
    read: string;
    notFound: string;
    notFoundBody: string;
  };
  character: {
    appearsIn: string;
    noStories: string;
    back: string;
    notFound: string;
  };
  footer: {
    builtWith: string;
    rights: string;
  };
  actions: {
    read: string;
    view: string;
  };
};

const dictionaries: Record<Locale, Dict> = {
  tr: {
    siteName: "Hikâye",
    tagline: "Kelimelerle kurulmuş bir dünya",
    nav: { stories: "Hikâyeler", characters: "Karakterler" },
    home: {
      heroKicker: "Kurgusal bir evren",
      heroTitle: "Okumak için tasarlanmış hikâyeler",
      heroSubtitle:
        "Kısa hikâyeler, karakterler ve birbirine dokunan anlatılar. Rahatına yerleş ve dilediğin yerden okumaya başla.",
      browseStories: "Hikâyelere göz at",
      meetCharacters: "Karakterlerle tanış",
      latest: "En yeni",
      allStories: "Tüm Hikâyeler",
      empty: "Henüz yayımlanmış bir hikâye yok.",
    },
    charactersPage: {
      title: "Karakterler",
      subtitle: "Bu evreni paylaşan yüzler.",
      empty: "Henüz karakter eklenmedi.",
    },
    story: {
      back: "Tüm hikâyeler",
      read: "Oku",
      notFound: "Hikâye bulunamadı",
      notFoundBody: "Aradığın hikâye taşınmış ya da hiç var olmamış olabilir.",
    },
    character: {
      appearsIn: "Yer aldığı hikâyeler",
      noStories: "Bu karakter henüz bir hikâyede yer almıyor.",
      back: "Tüm karakterler",
      notFound: "Karakter bulunamadı",
    },
    footer: {
      builtWith: "Notion ile yazıldı, sevgiyle yayımlandı.",
      rights: "Tüm hakları saklıdır.",
    },
    actions: { read: "Oku", view: "Karaktere göz at" },
  },
  en: {
    siteName: "Hikâye",
    tagline: "A world built from words",
    nav: { stories: "Stories", characters: "Characters" },
    home: {
      heroKicker: "A fictional universe",
      heroTitle: "Stories made for reading",
      heroSubtitle:
        "Short stories, characters, and narratives that touch one another. Settle in and start reading wherever you like.",
      browseStories: "Browse stories",
      meetCharacters: "Meet the characters",
      latest: "Latest",
      allStories: "All Stories",
      empty: "No published stories yet.",
    },
    charactersPage: {
      title: "Characters",
      subtitle: "The faces that share this universe.",
      empty: "No characters added yet.",
    },
    story: {
      back: "All stories",
      read: "Read",
      notFound: "Story not found",
      notFoundBody:
        "The story you are looking for may have moved or never existed.",
    },
    character: {
      appearsIn: "Appears in",
      noStories: "This character does not appear in any story yet.",
      back: "All characters",
      notFound: "Character not found",
    },
    footer: {
      builtWith: "Written in Notion, published with love.",
      rights: "All rights reserved.",
    },
    actions: { read: "Read", view: "View character" },
  },
};

export function getDictionary(locale: Locale): Dict {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
