import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../public/',import.meta.url),files={};
async function visit(dir,prefix=''){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const path=prefix+'/'+entry.name,url=new URL(entry.name+(entry.isDirectory()?'/':''),dir);
    if(entry.isDirectory())await visit(url,path);
    else if(/\.(?:png|jpe?g|webp|svg|avif|pdf|docx|xlsx|pptx)$/i.test(path)){
      const source=await readFile(url),bytes=path.endsWith('.svg')?Buffer.from(source.toString('utf8').replaceAll('\r\n','\n')):source;
      files[path]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
    }
  }
}
await visit(root);
await writeFile(new URL('../data/public-asset-index.json',import.meta.url),JSON.stringify({files},null,2)+'\n');
console.log(JSON.stringify({publicAssets:Object.keys(files).length}));
