'use client';
import Image from 'next/image';
import Link from '@/components/common/motion-link';
import {ArrowRight,ShoppingBag,Recycle,Check} from 'lucide-react';
import {useLocale} from '@/components/locale-provider';
import type {StudioItem} from '@/lib/studio-data';
import {demoResalePrice} from '@/lib/resale-estimates';
import {findFoldingProduct} from '@/lib/folding-products';

export function MoveValuePanel({newCount,newCost,resaleItems,onNew,onResale}:{newCount:number;newCost:number;resaleItems:StudioItem[];onNew:()=>void;onResale:()=>void}){
 const {tr}=useLocale();const estimate=resaleItems.reduce((sum,item)=>sum+demoResalePrice(item),0);
 return <section className="move-value-panel" aria-label={tr('Furniture purchases and resale','新家具购置与旧家具转售','新傢俬購置與舊傢俬轉售')}><h3>{tr('Buy thoughtfully. Pass good pieces on.','添置有依据，旧物有去处。','添置有依據，舊物有去處。')}</h3><div className="move-value-grid">
  <article className="purchase-value"><span><ShoppingBag size={17}/>{tr('Selected additions','已选购置家具','已選購置傢俬')}</span><strong><small>HK$</small>{newCost.toLocaleString()}</strong><p>{newCount} {tr('pieces in this arrangement','件已加入当前布局','件已加入目前佈局')}</p><button onClick={onNew}>{tr('Review selected pieces','查看已选清单','查看已選清單')}<ArrowRight size={15}/></button></article>
  <article className="resale-value"><span><Recycle size={18}/>{tr('Old furniture for resale','旧家具可转售','舊傢俬可轉售')}</span><strong><small>HK$</small>{estimate.toLocaleString()}</strong><p>{resaleItems.length?`${resaleItems.length} ${tr('pieces · initial demo estimate','件 · 初步演示估价','件 · 初步示範估價')}`:tr('Every old piece is being reused','所有旧家具都已复用','所有舊傢俬都已重用')}</p><button onClick={onResale} disabled={!resaleItems.length}>{tr('Estimate & prepare posts','查看估价与帖子','查看估價與帖子')}<ArrowRight size={15}/></button></article>
 </div></section>;
}

export function SelectedFurniture({items,onPreview,onRemove,onCompare}:{items:StudioItem[];onPreview:(id:string)=>void;onRemove:(id:string)=>void;onCompare:()=>void}){
 const {tr,t}=useLocale();return <section id="recommended-furniture" className="selected-furniture-block"><header><div><span>{tr('COMPLETE YOUR HOME','为新家添置刚刚好','為新居添置剛剛好')}</span><h3>{tr('Furniture for your plan','为你推荐的家具','為你推薦的傢俬')}</h3></div><b>{items.length} {tr('pieces','件','件')}</b></header>{items.length>0&&<p className="recommendation-intro">{tr('See each piece in your layout, then explore its details and price.','已放入当前布局预览，了解适配理由、价格和商品详情。','已放入目前佈局預覽，了解適配理由、價格和商品詳情。')}</p>}{!items.length&&<p>{tr('No new furniture is selected. Your current arrangement reuses what you own.','当前没有选择新家具，此布局沿用已有家具。','目前沒有選擇新傢俬，此佈局沿用已有傢俬。')}</p>}{items.map(item=>{const product=findFoldingProduct(item.productSlug!)!;return <article key={item.id}><div className="selected-product-top"><button className="selected-product-image" onClick={()=>onPreview(item.id)} aria-label={tr('Preview ','预览','預覽')+t(item.name)}><Image src={product.image} alt={t(item.name)} fill sizes="100px"/></button><div><small><Check size={12}/>{item.secondhand?tr('Second-hand · in your layout','二手家具 · 已加入布局','二手傢俬 · 已加入佈局'):tr('New · in your layout','新品 · 已加入布局','新品 · 已加入佈局')}</small><h4>{t(item.name)}</h4><strong>HK${product.price.toLocaleString()}</strong></div></div><p className="selected-product-fit"><b>{tr('Why it fits','为什么适合','為甚麼適合')}</b>{t(product.fitNote)}</p><div className="feature-actions"><Link className="product-purchase-link" href={`/store/${product.slug}?from=studio`}>{tr('Explore this piece','查看商品与选购','查看商品與選購')}<ArrowRight size={14}/></Link><button onClick={()=>onPreview(item.id)}>{tr('3D preview','3D 预览','3D 預覽')}</button><button onClick={onCompare}>{tr('Compare','比较','比較')}</button><button onClick={()=>onRemove(item.id)}>{tr('Remove','移除','移除')}</button></div></article>;})}<Link className="furniture-collection-link" href="/recommendations?from=studio">{tr('Explore the furniture collection','浏览更多精选家具','瀏覽更多精選傢俬')}<ArrowRight size={15}/></Link></section>;
}
