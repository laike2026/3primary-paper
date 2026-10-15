import {neon} from '@neondatabase/serverless';
import {categories, productRecords} from '../lib/content.ts';
import {articles} from '../lib/articles.ts';

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');
const sql = neon(url);
for (const [index, c] of categories.entries()) {
  await sql.query(`INSERT INTO content_categories(slug,name,summary,image,source,status,sort_order)
    VALUES($1,$2::jsonb,$3::jsonb,$4,$5,'published',$6) ON CONFLICT(slug) DO NOTHING`,
    [c.slug, JSON.stringify(c.name), JSON.stringify(c.summary), c.image, c.source, index]);
}
for (const [index, p] of productRecords.entries()) {
  await sql.query(`INSERT INTO content_products(id,slug,category_slug,name,summary,application,image,size,source,status,published_at,sort_order)
    VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8,$9,$10,now(),$11) ON CONFLICT(id) DO NOTHING`,
    [p.id,p.slug,p.category,JSON.stringify(p.name),JSON.stringify(p.summary),JSON.stringify(p.application),p.image,p.size||'',p.source,p.status,index]);
}
await sql.query(`INSERT INTO news_categories(slug,name,status) VALUES('resources','{"en":"Resources","ar":"الموارد","ru":"Материалы","es":"Recursos"}'::jsonb,'published') ON CONFLICT(slug) DO NOTHING`);
for (const a of articles) {
  await sql.query(`INSERT INTO content_articles(slug,category_slug,title,intro,sections,status,published_at)
    VALUES($1,'resources',$2::jsonb,$3::jsonb,$4::jsonb,'published',now()) ON CONFLICT(slug) DO NOTHING`,
    [a.slug,JSON.stringify(a.title),JSON.stringify(a.intro),JSON.stringify(a.sections)]);
}
process.stdout.write(`Seeded ${categories.length} categories, ${productRecords.length} products and ${articles.length} articles without overwriting edits.\n`);
