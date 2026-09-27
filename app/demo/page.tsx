import { MovingStudio } from '@/components/studio/moving-studio';
import type { LayoutId } from '@/lib/studio-data';

export default async function DemoPage({searchParams}:{searchParams:Promise<{step?:string;resume?:string;layout?:string}>}){
 const {step,resume,layout}=await searchParams;
 const selected:LayoutId|undefined=layout==='a'||layout==='b'||layout==='c'?layout:resume==='work'?'c':resume==='host'?'b':resume==='keep'?'a':undefined;
 return <MovingStudio initialStep={step} initialLayout={selected}/>;
}
