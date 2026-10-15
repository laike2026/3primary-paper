'use client';
import {useEffect,useRef} from 'react';
import {AdminIcon} from './AdminIcon';
export type ChartSeries={key:string;label:string;color:string};
export type ChartPoint={day:string;values:Record<string,number>};
export function TrendChart({points,series,loading=false}:{points:ChartPoint[];series:ChartSeries[];loading?:boolean}){
  const ref=useRef<HTMLCanvasElement>(null);
  const hasData=points.some(p=>series.some(s=>(p.values[s.key]||0)>0));
  useEffect(()=>{
    const canvas=ref.current;if(!canvas||!hasData)return;
    const draw=()=>{
      const rect=canvas.getBoundingClientRect(),ctx=canvas.getContext('2d');if(!ctx||!rect.width)return;
      const dpr=window.devicePixelRatio||1;canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;ctx.scale(dpr,dpr);
      const w=rect.width,h=rect.height,left=37,right=14,top=18,bottom=32,pw=w-left-right,ph=h-top-bottom;
      const max=Math.max(4,...points.flatMap(p=>series.map(s=>p.values[s.key]||0)));const ceiling=Math.ceil(max/4)*4;
      ctx.font='10px Arial, sans-serif';ctx.lineWidth=1;
      for(let i=0;i<=4;i++){const y=top+ph*(1-i/4);ctx.strokeStyle='#2d404d';ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(w-right,y);ctx.stroke();ctx.fillStyle='#9aafbd';ctx.textAlign='right';ctx.fillText(String(ceiling*i/4),left-8,y+3);}
      ctx.setLineDash([]);
      const x=(i:number)=>left+(points.length===1?pw/2:pw*i/(points.length-1));
      const y=(v:number)=>top+ph*(1-v/ceiling);
      for(const s of series){ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=2;ctx.beginPath();points.forEach((p,i)=>{if(i)ctx.lineTo(x(i),y(p.values[s.key]||0));else ctx.moveTo(x(i),y(p.values[s.key]||0));});ctx.stroke();if(points.length<=35)points.forEach((p,i)=>{ctx.beginPath();ctx.arc(x(i),y(p.values[s.key]||0),2.8,0,Math.PI*2);ctx.fill();});}
      const ticks=Math.min(points.length,w<400?3:5);ctx.fillStyle='#9aafbd';ctx.textAlign='center';
      for(let i=0;i<ticks;i++){const idx=ticks===1?0:Math.round(i*(points.length-1)/(ticks-1));ctx.fillText(points[idx].day.slice(5).replace('-','/'),x(idx),h-8);}
    };
    const observer=new ResizeObserver(draw);observer.observe(canvas);draw();return()=>observer.disconnect();
  },[points,series,hasData]);
  if(loading)return <div className="admin-chart-loading" role="status">加载中…</div>;
  if(!hasData)return <div className="admin-empty admin-chart-empty"><AdminIcon name="tracking"/>暂无趋势数据</div>;
  const total=series.map(s=>`${s.label} ${points.reduce((sum,p)=>sum+(p.values[s.key]||0),0)} 次`).join('，');
  return <div className="admin-chart" role="img" aria-label={`每日趋势：${total}`}><canvas ref={ref} aria-hidden="true"/></div>;
}
