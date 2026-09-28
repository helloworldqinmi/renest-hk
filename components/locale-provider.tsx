'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { Globe2 } from 'lucide-react';
import { translations } from '@/lib/translations';
export type Locale = 'en' | 'zh-CN' | 'zh-HK';
const LocaleContext = createContext({ locale: 'en' as Locale, setLocale: (_: Locale) => {}, t: (text: string) => text, tr: (en: string, cn: string, hk: string) => en });
export function LocaleProvider({children}: {children: React.ReactNode}) {
 const [locale,setLocale] = useState<Locale>('en');
 useEffect(()=>{try {const value=localStorage.getItem('renest-language');if(value==='en'||value==='zh-CN'||value==='zh-HK')setLocale(value);}catch{}},[]);
 function change(value: Locale){setLocale(value);try{localStorage.setItem('renest-language',value);}catch{}}
 useEffect(()=>{document.documentElement.lang=locale;},[locale]);
 const tr=(en:string,cn:string,hk:string)=>locale==='en'?en:locale==='zh-CN'?cn:hk;
 const t=(value:string)=>{const entry=translations[value.trim()];const result=entry?tr(value,entry[0],entry[1]):value;return locale==='en'?result:result.replace(/ft²/g,'平方呎').replace(/m²/g,locale==='zh-CN'?'平方米':'平方米');};
 return <LocaleContext.Provider value={{locale,setLocale:change,t,tr}}>{children}</LocaleContext.Provider>;
}
export const useLocale=()=>useContext(LocaleContext);
export function LocalText({children}:{children:string|undefined}){const {t}=useLocale();return <>{children?t(children):null}</>;}
export function LanguageSwitch(){
 const {locale,setLocale,tr}=useLocale();
 const currentLanguage={en:'English','zh-CN':'简体中文','zh-HK':'繁體中文'}[locale];
 return <label className="language-switch" title={`${tr('Language','语言','語言')}: ${currentLanguage}`}>
  <Globe2 size={18} strokeWidth={1.6} aria-hidden="true"/>
  <select aria-label="Language / 语言 / 語言" value={locale} onChange={e=>setLocale(e.target.value as Locale)}><option value="en">English</option><option value="zh-CN">简体中文</option><option value="zh-HK">繁體中文</option></select>
 </label>;
}
