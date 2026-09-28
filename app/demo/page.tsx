import { MovingStudio } from '@/components/studio/moving-studio';
import type { LayoutId } from '@/lib/studio-data';

export default async function DemoPage({searchParams}:{searchParams:Promise<{step?:string;resume?:string;layout?:string;compare?:string}>}){
 const {step,resume,layout,compare}=await searchParams;
 const selected:LayoutId|undefined=layout==='a'||layout==='b'||layout==='c'?layout:resume==='work'?'c':resume==='host'?'b':resume==='keep'?'a':undefined;
 return <MovingStudio initialCompare={compare==='1'} initialStep={step} initialLayout={selected}/>;
}
