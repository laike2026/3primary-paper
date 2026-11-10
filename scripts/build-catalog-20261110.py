"""Rebuild the approved November 10 catalog from the checked-in product data.

Requires ReportLab and Pillow. The supplied SVG wordmark is rendered as paths.
Run from the repository root. No production credentials or network are used.
"""
from pathlib import Path
from io import BytesIO
import json, re, math, xml.etree.ElementTree as ET
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from xml.sax.saxutils import escape

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public/downloads/3primary-product-catalog-2026-11-10.pdf'
FONT_DIR=Path('C:/Windows/Fonts')
if (FONT_DIR/'arial.ttf').exists():
    for name,file in [('Body','arial.ttf'),('BodyBold','arialbd.ttf'),('Display','georgia.ttf')]:
        pdfmetrics.registerFont(TTFont(name,str(FONT_DIR/file)))
else:
    for name,base in [('Body','Helvetica'),('BodyBold','Helvetica-Bold'),('Display','Times-Roman')]:
        pdfmetrics.registerFont(pdfmetrics.Font(name,base,'WinAnsiEncoding'))
W,H=A4; M=40; CW=W-2*M
GREEN=HexColor('#203d30'); TEXT=HexColor('#3f5147'); MUTED=HexColor('#657268'); GOLD=HexColor('#b79b5c'); PAPER=HexColor('#fffdf8')
data=json.loads((ROOT/'data/material-products.json').read_text(encoding='utf8'))
products={p['id']:p for p in data}
PHOTO_CACHE={}

def photo(path):
    local=ROOT/'public'/path.lstrip('/')
    if local not in PHOTO_CACHE:
        im=Image.open(local).convert('RGB')
        im.thumbnail((1200,1200))
        b=BytesIO();im.save(b,format='JPEG',quality=87,optimize=True)
        PHOTO_CACHE[local]=ImageReader(BytesIO(b.getvalue()))
    return PHOTO_CACHE[local]

def text(c,value,x,top,width,size=10.5,leading=None,font='Body',color=TEXT):
    style=ParagraphStyle('body',fontName=font,fontSize=size,leading=leading or size*1.4,textColor=color,spaceAfter=0)
    p=Paragraph(escape(str(value)).replace('\n','<br/>'),style)
    _,height=p.wrap(width,1000)
    p.drawOn(c,x,top-height)
    return top-height

def svg_path(c,d):
    tokens=re.findall(r'[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',d)
    path=c.beginPath();i=0;cmd=None;point=(0,0);start=(0,0);control=None;last=''
    sizes={'M':2,'L':2,'H':1,'V':1,'C':6,'S':4,'Q':4,'T':2}
    while i<len(tokens):
        if tokens[i].isalpha():cmd=tokens[i];i+=1
        upper=cmd.upper();relative=cmd.islower()
        if upper=='Z':path.close();point=start;control=None;last='Z';cmd=None;continue
        n=sizes[upper];values=[float(v) for v in tokens[i:i+n]];i+=n
        def xy(k):return (values[k]+(point[0] if relative else 0),values[k+1]+(point[1] if relative else 0))
        if upper in ('M','L'):
            end=xy(0)
            if upper=='M':path.moveTo(*end);start=end;cmd='l' if relative else 'L'
            else:path.lineTo(*end)
            point=end;control=None
        elif upper=='H':point=(values[0]+(point[0] if relative else 0),point[1]);path.lineTo(*point);control=None
        elif upper=='V':point=(point[0],values[0]+(point[1] if relative else 0));path.lineTo(*point);control=None
        elif upper in ('C','S'):
            if upper=='C':a,b,end=xy(0),xy(2),xy(4)
            else:a=(2*point[0]-control[0],2*point[1]-control[1]) if last in ('C','S') and control else point;b,end=xy(0),xy(2)
            path.curveTo(*a,*b,*end);point=end;control=b
        elif upper in ('Q','T'):
            q,end=(xy(0),xy(2)) if upper=='Q' else (((2*point[0]-control[0],2*point[1]-control[1]) if last in ('Q','T') and control else point),xy(0))
            a=(point[0]+2/3*(q[0]-point[0]),point[1]+2/3*(q[1]-point[1]))
            b=(end[0]+2/3*(q[0]-end[0]),end[1]+2/3*(q[1]-end[1]))
            path.curveTo(*a,*b,*end);point=end;control=q
        last=upper
    return path

LOGO=ET.fromstring((ROOT/'public/images/brand/primary-wordmark-20261110.svg').read_text(encoding='utf8'))
STOPS=[(0,'#0789b5'),(.25,'#1b9d9c'),(.5,'#82b65c'),(.7,'#efc01b'),(.85,'#ee8b0d'),(1,'#e96e20')]
def svg_color(value):
    return HexColor('#'+''.join(ch*2 for ch in value[1:])) if len(value)==4 and value.startswith('#') else HexColor(value)
def logo_shape(c,node,inherited):
    tag=node.tag.split('}')[-1]
    if tag in ('defs','title','desc'):return
    attrs={**inherited,**node.attrib}
    if tag in ('svg','g'):
        for child in node:logo_shape(c,child,attrs)
        return
    if tag=='path':p=svg_path(c,node.get('d',''))
    elif tag in ('circle','ellipse'):
        cx,cy=float(node.get('cx','0')),float(node.get('cy','0'))
        rx=float(node.get('rx',node.get('r','0')));ry=float(node.get('ry',node.get('r','0')))
        p=c.beginPath();p.ellipse(cx-rx,cy-ry,2*rx,2*ry)
    else:return
    fill=attrs.get('fill','#000');stroke=attrs.get('stroke','none')
    if fill.startswith('url('):
        c.saveState();c.clipPath(p,stroke=0,fill=0)
        c.linearGradient(0,0,166,0,[HexColor(s[1]) for s in STOPS],[s[0] for s in STOPS]);c.restoreState()
    elif fill!='none':c.setFillColor(svg_color(fill));c.drawPath(p,stroke=0,fill=1)
    if stroke!='none':c.setStrokeColor(svg_color(stroke));c.setLineWidth(float(attrs.get('stroke-width','1')));c.drawPath(p,stroke=1,fill=0)

def logo(c,x,y,width=124):
    height=width*50/166
    c.saveState();c.translate(x,y+height);c.scale(width/166,-height/50);logo_shape(c,LOGO,{});c.restoreState()

def page(c,n,label):
    c.setFillColor(PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
    logo(c,M,H-68,122)
    c.setFillColor(MUTED);c.setFont('Body',8);c.drawRightString(W-M,H-48,label)
    c.setStrokeColor(GOLD);c.setLineWidth(.8);c.line(M,H-82,W-M,H-82)
    c.setFont('Body',8);c.setFillColor(MUTED)
    c.drawString(M,28,'tpc-paper.com');c.drawCentredString(W/2,28,'alex.chen@3primary.com');c.drawRightString(W-M,28,f'{n:02d}')
    c.linkURL('https://tpc-paper.com',(M,23,M+90,39),relative=0)
    c.linkURL('mailto:alex.chen@3primary.com',(W/2-80,23,W/2+80,39),relative=0)

def product_block(c,p,top,alternate=None):
    alternate=alternate or {}
    text(c,alternate.get('sku',p.get('id','')),M,top,CW,8,font='Body',color=MUTED)
    text(c,alternate.get('name',p.get('name',{}).get('en','')),M,top-17,CW,17,21,font='Display',color=GREEN)
    image=alternate.get('image',p.get('image'))
    c.drawImage(photo(image),M,top-248,width=185,height=185,preserveAspectRatio=True,anchor='c',mask='auto')
    y=top-66; ix=M+205;iw=CW-205
    fields=alternate.get('fields')
    if fields is None:
        fields=[]
        for s in p.get('specifications',[]):
            key=s['key']['en'];value=s['value']['en']
            if key=='Common sizes / width' and p.get('id') in ('TP-8080','TP-5740'):
                value=value.replace(' / Custom sizes available','\nCustom sizes available')
            if key in ('Common sizes / width','Paper grammage','Core / construction'):fields.append((key.replace(' / construction',''),value))
    for key,value in fields:
        y=text(c,key,ix,y,iw,10.3,font='BodyBold',color=GREEN)-6
        y=text(c,value,ix,y,iw,10.4,14)-17
    app=alternate.get('application',p.get('application',{}).get('en',''))
    text(c,app,M,top-263,CW,10.2,14,color=MUTED)

def build():
    OUT.parent.mkdir(parents=True,exist_ok=True)
    c=canvas.Canvas(str(OUT),pagesize=A4,pageCompression=1,invariant=1)
    c.setTitle('3PRIMARY Paper & Label Product Catalog - 10 November 2026')
    c.setAuthor('Zhejiang Three Primary Colors Paper Co., Ltd.')
    c.setSubject('Approved product formats, customization and purchasing information')
    page(c,1,'PRODUCT CATALOG / NOVEMBER 2026')
    y=text(c,'Paper & Label',M,713,CW,37,44,font='Display',color=GREEN)
    y=text(c,'Product Collection',M,y-4,CW,37,44,font='Display',color=GREEN)
    text(c,'Thermal paper, self-adhesive labels, carbonless paper and jumbo rolls for business procurement.',M,y-25,CW,12.5,18)
    tiles=[('Thermal paper',products['TP-8080']['image']),('Self-adhesive labels',products['LB-THERMAL']['image']),('Carbonless NCR paper','/images/products/carbonless-1.webp'),('Jumbo rolls',products['TP-JUMBO']['image'])]
    gap=12;tw=(CW-gap*3)/4;iy=365
    for i,(name,image) in enumerate(tiles):
        x=M+i*(tw+gap)
        c.setFillColor(Color(1,1,1));c.roundRect(x,iy,tw,158,4,stroke=0,fill=1)
        c.drawImage(photo(image),x+4,iy+27,width=tw-8,height=123,preserveAspectRatio=True,anchor='c',mask='auto')
        text(c,name,x+6,iy+21,tw-12,8.6,11,font='BodyBold',color=GREEN)
    c.setStrokeColor(GOLD);c.line(M,314,W-M,314)
    text(c,'SPECIFICATIONS / CUSTOMIZATION / PROCUREMENT',M,287,CW,9,14,color=GREEN)
    text(c,'Zhejiang Three Primary Colors Paper Co., Ltd.',M,252,CW,13,18,color=GREEN)
    text(c,'Revised 10 November 2026',M,213,CW,10,14,color=MUTED)
    c.showPage()
    page(c,2,'PRODUCT FORMATS')
    product_block(c,products['TP-8080'],733);product_block(c,products['TP-5740'],409)
    c.showPage()
    page(c,3,'PRODUCT FORMATS')
    product_block(c,products['TP-PRINTED'],733)
    product_block(c,{},409,{'sku':'NCR PAPER','name':'Carbonless Paper Rolls & Continuous Forms','image':'/images/products/carbonless-1.webp',
        'fields':[('Product formats','Carbonless paper rolls / Continuous forms'),('Quotation details','Share the dimensions, number of parts, printing, packing and quantity.')],
        'application':'Multi-part business records and office forms. Final specifications are confirmed for each order.'})
    c.showPage()
    page(c,4,'PRODUCT FORMATS');product_block(c,products['LB-THERMAL'],733);product_block(c,products['LB-FANFOLD'],409);c.showPage()
    page(c,5,'PRODUCT FORMATS');product_block(c,products['LB-TRANSFER'],733);product_block(c,products['LB-CUSTOM'],409);c.showPage()
    page(c,6,'PRODUCT FORMATS');product_block(c,products['TP-JUMBO'],733)
    text(c,'Plan the converting specification.',M,380,CW,25,32,font='Display',color=GREEN)
    text(c,'Confirm the required width, winding direction, core, coating grade, quantity and packing with our team before ordering.',M,333,CW,12,18)
    text(c,'Available widths',M,266,CW,10,font='BodyBold',color=GREEN)
    text(c,'405 / 565 / 636 / 790 / 795 mm',M,243,CW,18,24,color=GREEN)
    c.showPage()
    page(c,7,'PRODUCTION & CUSTOMIZATION')
    text(c,'From material to finished rolls.',M,730,CW,28,36,font='Display',color=GREEN)
    c.drawImage(photo('/images/materials/factory-converting.webp'),M,382,width=CW,height=275,preserveAspectRatio=True,anchor='c',mask='auto')
    text(c,'Plan your specification.',M,349,CW,22,28,font='Display',color=GREEN)
    y=306
    for i,item in enumerate(['Select the product and application.','Confirm width, roll diameter or length, core and material.','Prepare artwork, label construction and packing requirements.','Confirm samples, quantity, destination and quotation.'],1):
        y=text(c,f'{i}. {item}',M,y,CW,11,16)-16
    text(c,'Production photograph supplied by the company. Product availability and final specifications are confirmed for each order.',M,124,CW,9,13,color=MUTED)
    c.showPage()
    page(c,8,'PROCUREMENT & CONTACT')
    text(c,'Let us plan your next order.',M,730,CW,28,36,font='Display',color=GREEN)
    y=668
    sections=[('Quotation checklist','Send the product, complete dimensions, core, paper grammage or label material, printing, packing, quantity and destination.'),('Samples','Tell us the grade and format you want to evaluate. Sample availability, courier arrangements and costs are confirmed with our team.'),('Specifications','Paper grammage is basis weight, not thickness. Roll length and printer compatibility must be checked for the selected material and core.'),('Commercial terms','Current pricing, MOQ, production timing, shipping and payment terms are confirmed in the quotation and order agreement.')]
    for heading,body in sections:
        y=text(c,heading,M,y,CW,11,font='BodyBold',color=GREEN)-6
        y=text(c,body,M,y,CW,10.5,15)-22
    y=text(c,'Zhejiang Three Primary Colors Paper Co., Ltd.',M,y-3,CW,13,18,font='BodyBold',color=GREEN)-15
    for value,target in [('Website: https://tpc-paper.com','https://tpc-paper.com'),('Email: alex.chen@3primary.com','mailto:alex.chen@3primary.com'),('Phone / WhatsApp: +86 13661927136','https://wa.me/8613661927136')]:
        y=text(c,value,M,y,CW,11,16)
        c.linkURL(target,(M,y-2,M+pdfmetrics.stringWidth(value,'Body',11),y+14),relative=0)
        y-=7
    address='Room 206, 2nd Floor, Building 4, West of Phoenix Mountain, No. 8, Anji Avenue, Changshuo Subdistrict, Anji County, Huzhou City, Zhejiang Province.'
    text(c,address,M,y-4,CW,10,15)
    c.save()
    print(json.dumps({'pdf':str(OUT),'bytes':OUT.stat().st_size,'pages':8,'logo':'vector paths','email':'alex.chen@3primary.com'}))

if __name__=='__main__':build()
