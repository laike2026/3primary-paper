const storageHost=/^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i;
const provider=/\b(?:ai|openai|chatgpt|codex|github|vercel|imagegen)\b|artificial intelligence|人工智能|AI生成/iu;
const retired={
  '/images/materials/product-01-2.webp':'/images/materials/product-01-2-20261110.webp',
  '/downloads/3primary-product-catalog-2026-11.pdf':'/downloads/3primary-product-catalog-2026-11-10.pdf',
};
export const retiredAssetPaths=Object.keys(retired);
export function isStorageUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&storageHost.test(u.hostname)&&!u.port&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname!=='/';}catch{return false;}}
export function canonicalAsset(row,index){
  const local=String(row.storage_key||'');
  if(index.files[local]&&row.sha256===index.files[local].sha256)return retired[local]||local;
  if(typeof row.url==='string'&&row.url.startsWith('/')&&!row.url.startsWith('//')&&!isStorageUrl(row.url))return retired[row.url]||row.url;
  return '/files/'+row.id;
}
export function assetAliases(media,index){
  const aliases=new Map(Object.entries(retired));
  for(const item of media){
    const url=canonicalAsset(item,index);
    for(const source of [item.url,item.storage_url,item.storage_key,'/files/'+item.id])if(source)aliases.set(source,url);
    for(const source of [item.thumbnail_url,item.thumbnail_storage_url])if(source)aliases.set(source,'/files/'+item.id+'?variant=thumbnail');
  }
  return aliases;
}
export function rewriteAssets(value,aliases){
  if(typeof value==='string')return aliases.get(value)||value;
  if(Array.isArray(value))return value.map(item=>rewriteAssets(item,aliases));
  if(value&&typeof value==='object'&&!(value instanceof Date))return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,rewriteAssets(item,aliases)]));
  return value;
}
export function cleanBusinessMetadata(value){
  if(typeof value==='string'){
    if(!provider.test(value))return value;
    return /illustrat|artwork|插画|示意图/i.test(value)?'Illustrative artwork':'';
  }
  if(Array.isArray(value))return value.map(cleanBusinessMetadata);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,cleanBusinessMetadata(item)]));
  return value;
}
export function operationalMessage(message,fallback='服务暂时不可用，请稍后重试'){
  return typeof message==='string'&&!provider.test(message)?message:fallback;
}
