'use client';
import {useState} from 'react';
import Image from 'next/image';
export function ProductGallery({images,name}:{images:string[];name:string}){const [selected,setSelected]=useState(images[0]);return <div className="material-product-gallery"><div className="detail-image"><Image src={selected} alt={name} width={700} height={700} sizes="(max-width:700px) 100vw, 45vw" priority/></div>{images.length>1&&<div className="material-thumbnails">{images.map((url,i)=><button type="button" key={url} aria-label={`${name} — ${i+1}`} aria-pressed={selected===url} onClick={()=>setSelected(url)}><Image src={url} alt="" width={90} height={90}/></button>)}</div>}</div>;}
