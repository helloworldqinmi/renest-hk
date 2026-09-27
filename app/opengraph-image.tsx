import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
export const alt='ReNest — The Moving Studio. Eighteen familiar pieces, a new beginning.';
export const size={width:1200,height:630};
export const contentType='image/png';
export default async function Image(){
 const image=await readFile(path.join(process.cwd(),'public/models/v2/previews/new-home-a.png'));
 return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',background:'#f4f6ef',color:'#2d4138',position:'relative',padding:'56px'}}><div style={{position:'absolute',right:0,top:95,width:730,height:535,display:'flex'}}><img src={`data:image/png;base64,${image.toString('base64')}`} width={730} height={535} alt="" style={{objectFit:'contain'}}/></div><div style={{display:'flex',flexDirection:'column',position:'relative',width:520}}><div style={{display:'flex',alignItems:'center',gap:16}}><svg width="40" height="46" viewBox="0 0 34 40" fill="none"><path d="M4.5 16.2 15.6 6.8a2.2 2.2 0 0 1 2.8 0l11.1 9.4a3.4 3.4 0 0 1 1.2 2.6V33a2.5 2.5 0 0 1-2.5 2.5H5.8A2.5 2.5 0 0 1 3.3 33V18.8c0-1 .4-1.9 1.2-2.6Z" stroke="#2d4138" strokeWidth="1.8"/><path d="M12.6 35.5V24.7a1.8 1.8 0 0 1 1.8-1.8h5.2a1.8 1.8 0 0 1 1.8 1.8v10.8" stroke="#2d4138" strokeWidth="1.8"/></svg><span style={{fontFamily:'serif',fontSize:45}}>ReNest</span></div><span style={{fontSize:11,letterSpacing:4,marginTop:15,color:'#8d9b80'}}>THE MOVING STUDIO</span><h1 style={{fontFamily:'serif',fontSize:69,lineHeight:1.05,fontWeight:400,marginTop:90,letterSpacing:-3}}>Same furniture.<br/>A whole new life.</h1><span style={{fontSize:15,color:'#889e78',marginTop:45}}>18 familiar pieces · 3 new possibilities</span></div></div>,size);
}
