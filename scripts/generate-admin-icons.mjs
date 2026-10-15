import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as icons from '@phosphor-icons/react/ssr';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
const names={dashboard:'SquaresFour',categories:'Folders',products:'Package',newsCategories:'Stack',articles:'Newspaper',inquiries:'EnvelopeSimple',tracking:'ChartLineUp',traffic:'ChartPieSlice',search:'MagnifyingGlass',media:'Images',sync:'ArrowsClockwise',users:'UsersThree',audit:'ClockCounterClockwise',settings:'GearSix',address:'MapPin',whatsapp:'WhatsappLogo',form:'Note',write:'NotePencil',success:'CheckCircle',arrowRight:'ArrowRight',arrowUp:'ArrowUpRight',external:'ArrowSquareOut',download:'DownloadSimple',upload:'UploadSimple',plus:'Plus',close:'X',edit:'PencilSimple',trash:'Trash',restore:'ArrowCounterClockwise',save:'FloppyDisk',refresh:'ArrowClockwise',logout:'SignOut',user:'UserCircle',menu:'List',calendar:'CalendarBlank',filter:'Funnel',eye:'Eye',eyeOff:'EyeSlash',lock:'LockKey',file:'FileText',copy:'Copy',globe:'GlobeHemisphereWest',warning:'WarningCircle',empty:'Tray',mail:'Envelope',shield:'ShieldCheck',chevronLeft:'CaretLeft',chevronRight:'CaretRight',check:'Check',language:'Translate',link:'LinkSimple'};
const dir=new URL('../public/images/admin/icons/',import.meta.url);await mkdir(dir,{recursive:true});
for(const [name,component] of Object.entries(names)){if(!icons[component])throw new Error(`Unknown icon: ${component}`);await writeFile(new URL(`${name}.svg`,dir),renderToStaticMarkup(createElement(icons[component],{size:24,weight:'regular',color:'#000'}))+'\n');}
await copyFile(new URL('../node_modules/@phosphor-icons/react/LICENSE',import.meta.url),new URL('LICENSE.txt',dir));
console.log(`Generated ${Object.keys(names).length} admin icons`);
