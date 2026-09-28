"use client";

import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/locale-provider';
import {allExistingIds,studioInventory,studioLayouts,parseStudioPlan,STUDIO_SESSION_KEY} from '@/lib/studio-data';
import {trySecondhand} from '@/lib/secondhand-layout';
import {placementIssue} from '@/lib/studio-placement';
import {defaultBrief} from '@/lib/living-brief';
import { useEffect, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/common/ui";

export function ProductActions({ name,slug }: { name: string;slug:string }) {
  const router=useRouter();const {tr,t}=useLocale();const item=studioInventory.find(i=>i.productSlug===slug);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    try { setAdded(JSON.parse(localStorage.getItem("renest-product-shortlist") ?? "[]").includes(name)); } catch { /* Browsing works without storage. */ }
  }, [name]);
  function saveProduct() {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("renest-product-shortlist") ?? "[]");
      localStorage.setItem("renest-product-shortlist", JSON.stringify([...new Set([...saved, name])]));
      setAdded(true);
      setError(false);
    } catch { setError(true); }
  }
  function compare(){if(!item)return;try{const saved=parseStudioPlan(sessionStorage.getItem(STUDIO_SESSION_KEY));if(item.secondhand){const result=trySecondhand(item.id,saved?.layout??'c',saved?.edits??{},saved?.selected??allExistingIds);if(!result){setError(true);return;}sessionStorage.setItem(STUDIO_SESSION_KEY,JSON.stringify({...saved,version:2,phase:'results',selected:saved?.selected??allExistingIds,habits:saved?.habits??['reuse'],note:saved?.note??'',brief:saved?.brief??defaultBrief,layout:result.layout,edits:{...saved?.edits,[result.layout]:result.placements}}));router.push('/demo?compare=1');return;}const preset=studioLayouts.find(l=>l.newIds.includes(item.id))!;const edits={...saved?.edits};const current=edits[preset.id]??preset.placements;if(!current.some(p=>p.id===item.id)){const placement=preset.placements.find(p=>p.id===item.id)!;if(placementIssue(placement,current)){setError(true);return;}edits[preset.id]=[...current,placement];}sessionStorage.setItem(STUDIO_SESSION_KEY,JSON.stringify({...saved,version:2,phase:'results',selected:saved?.selected??allExistingIds,habits:saved?.habits??['reuse'],note:saved?.note??'',brief:saved?.brief??defaultBrief,layout:preset.id,edits}));router.push('/demo?compare=1');}catch{setError(true);}}
  return (
    <div className="store-actions">{item&&<><Button type="button" onClick={compare}>{tr('Try in layout comparison','一键放入布局比较','一鍵放入佈局比較')}</Button><small>{tr('Opens a compatible arrangement and preserves your edits. If its position is occupied, clear space in the studio first.','打开适配方案并保留调整；若推荐位置被占用，请先在布置页腾出空间。','開啟適配方案並保留調整；若推薦位置被佔用，請先在佈置頁騰出空間。')}</small></>}
      <Button type="button" icon={added ? Check : ShoppingBag} onClick={saveProduct}>{added ? tr('Saved to shortlist','已加入收藏','已加入收藏') : tr('Save to shortlist','加入收藏','加入收藏')}</Button>
      <span role="status">{error ? tr('Cannot add this item: allow browser storage and ensure its placement is clear.','无法加入：请允许浏览器存储，并检查摆放位置是否被占用。','無法加入：請允許瀏覽器儲存，並檢查擺放位置是否被佔用。') : added ? t(name)+tr(' is saved on this device.','已保存在此设备。','已儲存在此裝置。') : tr('Demo collection · indicative prices and dimensions','演示商品 · 价格及尺寸仅供参考','示範商品 · 價格及尺寸僅供參考')}</span>
    </div>
  );
}
