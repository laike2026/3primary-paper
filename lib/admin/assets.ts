import 'server-only';
import index from '@/data/public-asset-index.json';
import {assetAliases,rewriteAssets,canonicalAsset} from '@/lib/business-assets.mjs';
import {db} from './db';
import {publicCache,refreshPublicData} from './public-cache';
import {isContentPreview} from './content-preview';

const readMedia=publicCache('media','aliases',async()=>{
  if(!process.env.DATABASE_URL||isContentPreview)return [];
  return db().query('SELECT id,url,thumbnail_url,storage_url,thumbnail_storage_url,storage_key,sha256 FROM media_assets WHERE deleted_at IS NULL');
});
export async function businessAssetReferences<T>(value:T):Promise<T>{
  return rewriteAssets(value,assetAliases(await readMedia(),index)) as T;
}
export function businessMediaItem<T extends {id:string;url:string;thumbnail_url?:string;storage_key?:string;sha256?:string}>(item:T){
  return {...item,url:canonicalAsset(item,index),thumbnail_url:item.thumbnail_url?'/files/'+item.id+'?variant=thumbnail':''};
}
export function refreshMedia(){refreshPublicData('media');}
