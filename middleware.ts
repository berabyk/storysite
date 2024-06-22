// import { NextRequest, NextResponse } from 'next/server';

// const locales = ['en', 'tr'];

// // Kullanıcının tercih ettiği dili belirleyen fonksiyon
// function getLocale(request: NextRequest): string {
//   // İstekten `Accept-Language` başlığını al
//   const acceptLanguage = request.headers.get('accept-language');
  
//   if (!acceptLanguage) {
//     // `Accept-Language` başlığı yoksa varsayılan olarak 'en' döner
//     return 'en';
//   }

//   // `Accept-Language` başlığını analiz edip tercih edilen diller listesini al
//   const preferredLanguages = acceptLanguage.split(',').map(lang => {
//     const [locale] = lang.split(';');
//     return locale.trim();
//   });

//   // Tercih edilen dillerden desteklenen ilk dili bul
//   for (const lang of preferredLanguages) {
//     if (locales.includes(lang)) {
//       return lang;
//     }
//   }

//   // Desteklenen dillerden biri bulunamazsa varsayılan olarak 'en' döner
//   return 'en';
// }

// // Middleware fonksiyonu
// export function middleware(request: NextRequest) {
//   // İsteğin yolunda desteklenen bir dil olup olmadığını kontrol et
//   const { pathname } = request.nextUrl;
//   const pathnameHasLocale = locales.some(
//     (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
//   );

//   // Eğer yol zaten bir dil içeriyorsa yönlendirme yapma
//   if (pathnameHasLocale) return;

//   // Yol bir dil içermiyorsa kullanıcının tercih ettiği dile yönlendir
//   const locale = getLocale(request);
//   request.nextUrl.pathname = `/${locale}${pathname}`;

//   // Örneğin, gelen istek /products ise yeni URL /en/products olur
//   return NextResponse.redirect(request.nextUrl);
// }

// // Middleware yapılandırması
// export const config = {
//   matcher: [
//     // İç yolları (_next) atla
//     '/((?!_next|public|api).*)',

//     // İsteğe bağlı: sadece kök (/) URL üzerinde çalıştır
//     // '/'
//   ],
// };


import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'tr'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Eğer yol _next, public, veya api ile başlıyorsa, devam et
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Eğer yol bir dil içeriyorsa, devam et
  const pathnameHasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);
  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Yol bir dil içermiyorsa, kullanıcıyı varsayılan dile yönlendir
  const defaultLocale = 'en'; // Varsayılan dil
  return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url));
}

export const config = {
  matcher: [
    '/((?!_next|public|api).*)',
  ],
};
