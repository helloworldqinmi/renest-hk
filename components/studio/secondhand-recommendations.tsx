'use client';
import Image from 'next/image';
import Link from '@/components/common/motion-link';
import {Recycle,Check} from 'lucide-react';
import {useLocale} from '@/components/locale-provider';
import {studioInventory} from '@/lib/studio-data';
import {findFoldingProduct} from '@/lib/folding-products';
export function SecondhandRecommendations({selectedIds,onTry}:{selectedIds:string[];onTry:(id:string)=>void}){
 const {t,tr}=useLocale();return <section className="secondhand-recommendations"><header><Recycle size={21}/><div><span>{tr('A SECOND LIFE, A BETTER FIT','让好家具，继续被使用','讓好傢俬，繼續被使用')}</span><h3>{tr('Second-hand alternatives','二手家具，也可以很合适','二手傢俬，也可以很合適')}</h3></div></header><p>{tr('Try pre-owned pieces alongside new folding furniture. Demo listings; confirm condition and collection before buying.','除了折叠新品，也可以选择二手家具。以下为演示商品，购买前需确认实物成色及自取安排。','除了摺疊新品，也可以選擇二手傢俬。以下為示範商品，購買前需確認實物成色及自取安排。')}</p><div className="secondhand-grid">{studioInventory.filter(i=>i.secondhand).map(item=>{const p=findFoldingProduct(item.productSlug!)!,replacement=studioInventory.find(v=>v.id===item.replacesId)!,newPrice=findFoldingProduct(replacement.productSlug!)!.price,selected=selectedIds.includes(item.id);return <article key={item.id}><div className="secondhand-photo"><Image src={p.image} alt={t(item.name)} fill sizes="(max-width:740px) 42vw, 220px"/><span>{tr('Pre-owned · Demo','二手 · Demo','二手 · Demo')}</span></div><h4>{t(item.name)}</h4><strong>HK${p.price}<small>{tr('Save ','比对应新品少 ','比對應新品少 ')}HK${newPrice-p.price}</small></strong><p>{tr('Good condition · local pickup','成色良好 · 本地自取','成色良好 · 本地自取')}</p><button onClick={()=>onTry(item.id)} disabled={selected}>{selected?<><Check size={13}/>{tr('In this layout','已加入布局','已加入佈局')}</>:tr('Try in a compatible layout','放入适配布局比较','放入適配佈局比較')}</button><Link href={`/store/${p.slug}?from=studio`}>{tr('View listing','查看二手商品','查看二手商品')} ↗</Link></article>;})}</div></section>;
}
