{
/* ---------- Outils ---------- */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const clone=o=>JSON.parse(JSON.stringify(o));
const nf=new Intl.NumberFormat('fr-FR');
const num=v=>{const s=String(v??'').replace(/[\s  ]/g,'').replace(',','.');if(s==='')return null;const n=Number(s);return Number.isFinite(n)?n:null};
const fcfa=n=>nf.format(n)+' FCFA';
const fmtV=n=>nf.format(n)+' V';
const fmtA=n=>nf.format(n)+' A';
const has=v=>String(v??'').trim()!=='';
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toLowerCase();
const blob=id=>'/_blob/'+esc(id);

/* Le paiement n'est déclaré actif qu'après ouverture du compte marchand, intégration de la page de paiement hébergée
   et vérification de la confirmation côté serveur (notification du prestataire). Ce n'est pas encore le cas. */
let PAY_ACTIVE=false,PAY_TEST=false,PAY_PRIV=false,payBusy=false;
const WH=22.2,EFF=[0.75,0.85],MAXW=24;

const P={
plug:'<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>',
adapter:'<rect x="5" y="3" width="14" height="12" rx="2"/><path d="M12 15v3a2 2 0 0 0 2 2h5M9 7h6"/>',
battery:'<rect x="2.5" y="7" width="17" height="10" rx="2"/><path d="M21.5 10.5v3M6.5 10v4M10 10v4M13.5 10v4"/>',
router:'<rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 13 5.5 5M17 13l1.5-8M7.5 16.5h.01M10.5 16.5h.01"/>',
tower:'<path d="M12 10v11M8.5 21 12 10l3.5 11"/><path d="M7.8 5.2a6 6 0 0 0 0 8M16.2 5.2a6 6 0 0 1 0 8"/><circle cx="12" cy="9.2" r="1.4"/>',
card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
box:'<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
truck:'<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
chat:'<path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.5L3.5 21l1.6-4.4A8.5 8.5 0 1 1 20.5 12z"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
x:'<path d="M6 6l12 12M18 6 6 18"/>',
shield:'<path d="M12 3 4.5 6v6c0 4.4 3.2 8 7.5 9 4.3-1 7.5-4.6 7.5-9V6z"/><path d="m9 12 2 2 4-4"/>',
volt:'<path d="M13 3 5.5 13.5H11l-1 7.5 7.5-10.5H12z"/>',
split:'<path d="M4 12h6M10 12l5-5h5M10 12l5 5h5"/>',
info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
wait:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5h4"/>',
short:'<path d="M13 3 5.5 13.5H11l-1 7.5 7.5-10.5H12z"/><path d="M4 4l16 16"/>',
amp:'<circle cx="12" cy="12" r="9"/><path d="M9 16l3-8 3 8M10 13.5h4"/>',
full:'<rect x="2.5" y="7" width="17" height="10" rx="2"/><path d="M21.5 10.5v3M6 10h10v4H6z"/>',
low:'<rect x="2.5" y="7" width="17" height="10" rx="2"/><path d="M21.5 10.5v3M6 10h2v4H6z"/>',
lock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
phone:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
wifi:'<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.8 16a5 5 0 0 1 6.4 0"/><circle cx="12" cy="19.2" r="1.2"/>',
bars:'<path d="M5 20v-4M10 20v-8M15 20V8M20 20V4"/>',
refresh:'<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>',
mute:'<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/>',
work:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'
};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]||''}</svg>`;

/* ---------- Images du produit (photos du fabricant, légendes en français) ---------- */
const IMGS=[
 ['img/g-routeur.webp','Mini-onduleur WGP UPS1202A branché sur un routeur Wi-Fi'],
 ['img/g-face.webp','Mini-onduleur WGP UPS1202A, face avant avec sortie, entrée et interrupteur'],
 ['img/g-ports.webp','Sortie OUT et entrée IN en 12 V'],
 ['img/g-dessus.webp','Vue de dessus avec le voyant de fonctionnement'],
 ['img/g-profil.webp','Mini-onduleur vu de trois quarts'],
 ['img/g-cable.webp','Câble séparateur fourni : une sortie, deux fiches'],
 ['img/boite.webp','Contenu de la boîte']
];

/* ---------- Configuration par défaut (fiche du fabricant WGP UPS1202A) ---------- */
const MF='Données du fabricant (fiche WGP UPS1202A)';
const DEF={
 shop:{name:'Kontinu',confirmed:true,tagline:'Alimentation de secours pour votre Wi-Fi'},
 product:{name:'Mini-onduleur 12 V pour routeur Wi-Fi',brand:'WGP',ref:'UPS1202A',price:'10000',compare:'',maxQty:'5',pitch:'Quand le courant coupe, votre routeur reste allumé : le mini-onduleur prend le relais automatiquement et garde votre Wi-Fi actif.'},
 ship:{country:'GA',city:'Libreville',method:'Retrait chez notre partenaire de transport',fee:'0',days:'7',type:'ouvrés',start:'paiement',extra:'jusqu’à deux semaines selon les aléas du transport et des formalités douanières',logo:'img/aic-cargo.webp',office:'AIC Cargo (Africa International Cargo)',address:'Petit Paris, au Motel, juste à côté de DHL, Libreville',instructions:'Présentez une pièce d’identité au nom de la commande et votre référence de commande. Pour toute question, contactez uniquement notre service client : notre partenaire de transport ne traite pas les demandes des clients.',contactBy:''},
 support:{phone:'',whatsapp:'',email:'',hours:'',zone:''},
 seller:{name:'KONTINU',form:'',rccm:'',nif:'',address:'',rep:''},
 specs:[
  {k:'Marque et modèle',v:'WGP UPS1202A',ok:true},
  {k:'Entrée',v:'12 V DC, 2 A (adaptateur 12 V de votre appareil)',ok:true},
  {k:'Sortie',v:'12 V DC, 2 A, fiche jack DC',ok:true},
  {k:'Puissance de sortie maximale',v:'24 W',ok:true},
  {k:'Batterie',v:'Lithium-ion 18650, 6 000 mAh / 22,2 Wh',ok:true},
  {k:'Autonomie',v:'3 à 4 h pour un appareil d’environ 5 W',ok:true},
  {k:'Fonctionnement',v:'En ligne : l’appareil reste alimenté à travers le mini-onduleur',ok:true},
  {k:'Protections',v:'Court-circuit, surintensité, surcharge, décharge profonde',ok:true},
  {k:'Commandes',v:'Interrupteur marche/arrêt, voyant de fonctionnement',ok:true},
  {k:'Boîtier',v:'ABS noir',ok:true},
  {k:'Dimensions',v:'',ok:false},
  {k:'Poids',v:'',ok:false}
 ],
 outputs:[{t:'DC',v:'12',a:'2',ok:true}],
 box:[{v:'Mini-onduleur WGP UPS1202A',ok:true},{v:'Câble séparateur DC (une entrée, deux fiches)',ok:true},{v:'Notice d’utilisation',ok:true},{v:'Boîte d’origine',ok:true}],
 steps:[
  {v:'Mettez l’interrupteur sur ON : la batterie ne se charge qu’en position ON.',ok:true},
  {v:'Débranchez l’adaptateur 12 V de votre routeur et branchez-le sur l’entrée IN du mini-onduleur.',ok:true},
  {v:'Reliez la sortie OUT à votre routeur avec le câble fourni. Pour un routeur et un boîtier fibre, utilisez les deux fiches du câble séparateur.',ok:true},
  {v:'Laissez la batterie se charger complètement. Le voyant indique que le mini-onduleur fonctionne.',ok:true}
 ],
 warranty:{v:`Le mini-onduleur est garanti 3 mois à compter du retrait du colis contre les défauts de fabrication et les pannes survenant dans des conditions normales d’utilisation.

Pendant cette période, un produit reconnu défectueux est échangé contre un produit identique.

La garantie ne couvre pas : les dommages dus à une chute, à un choc, à l’humidité ou à une chaleur excessive ; le branchement d’un appareil ou d’un adaptateur qui n’est pas en 12 V ; l’ouverture ou la modification du boîtier ; une utilisation non conforme à la notice.

Pour en bénéficier, contactez le service client avec votre référence de commande.`,ok:true,short:'3 mois · échange si défectueux'},
 reviews:[],
 photos:[],
 pay:{provider:'',physical:false,cards:false,momo:false,gabon:false},
 legal:{cgv:`Article 1 – Vendeur
Les présentes conditions régissent les ventes conclues sur cette boutique par KONTINU (« le vendeur »). Les coordonnées du vendeur figurent dans les mentions vendeur et sur la page Contact.

Article 2 – Produit
Le produit proposé est le mini-onduleur WGP UPS1202A (sortie 12 V – 2 A, batterie 22,2 Wh). Ses caractéristiques sont celles communiquées par le fabricant et reprises sur la fiche produit. Il fournit une alimentation de secours à un appareil compatible : il ne rétablit pas l’électricité et ne garantit pas l’accès à Internet si le réseau de l’opérateur est interrompu.

Article 3 – Compatibilité
Il appartient au client de vérifier avant la commande que son appareil fonctionne en 12 V, avec une intensité de 2 A maximum et une fiche compatible. Le service client peut l’aider à le vérifier sur demande.

Article 4 – Prix
Les prix sont indiqués en francs CFA (XAF). Le retrait au point de retrait est inclus dans le prix. Les frais du prestataire de paiement, qui dépendent de l’opérateur Mobile Money choisi, s’ajoutent au prix et sont affichés sur la page de paiement avant toute validation.

Article 5 – Commande et paiement
Le paiement s’effectue par Mobile Money (Airtel Money, Moov Money), sur la page sécurisée du prestataire de paiement. Aucun code Mobile Money n’est saisi ni conservé par le vendeur. La commande n’est confirmée qu’après validation du paiement par le prestataire ; une référence de commande est alors communiquée au client.

Article 6 – Livraison et retrait
Les destinations desservies, les modes de livraison, les frais et les délais sont affichés lors de la commande. Pour un retrait en point relais, le délai annoncé est exprimé en jours ouvrés à compter de la confirmation du paiement. Il est indicatif et peut atteindre deux semaines selon les aléas du transport et des formalités douanières. Le client est contacté à l’arrivée du colis et le retire sur présentation d’une pièce d’identité au nom indiqué lors de la commande. Le transporteur partenaire ne traite pas les demandes des clients : toute question est adressée au service client du vendeur.

Article 7 – Échanges
Le produit n’est ni repris ni remboursé pour convenance personnelle ou pour incompatibilité avec le matériel du client. Un produit défectueux est échangé dans les conditions de la politique de retours et de la garantie.

Article 8 – Garantie
Le produit est garanti 3 mois à compter du retrait du colis, dans les conditions décrites sur la page Garantie.

Article 9 – Réclamations
Toute réclamation est adressée au service client avec la référence de commande, selon la procédure décrite sur la page Réclamations.

Article 10 – Données personnelles
Les données collectées lors de la commande sont traitées conformément à la politique de confidentialité.

Article 11 – Droit applicable
Les présentes conditions sont soumises au droit gabonais.`,privacy:`Données collectées : lors d’une commande, nous recueillons votre nom, votre numéro de téléphone, votre adresse e-mail, votre pays et votre ville.

Utilisation : ces données servent uniquement à traiter votre commande, à vous contacter à l’arrivée de votre colis et à assurer le service après-vente. Elles ne sont ni vendues ni cédées à des tiers à des fins commerciales.

Paiement : le paiement est réalisé sur la page sécurisée du prestataire de paiement. Nous ne recevons ni ne conservons vos codes Mobile Money.

Conservation : vos données sont conservées le temps nécessaire au traitement de la commande et de la garantie, et au respect des obligations comptables.

Sur ce site : votre panier et les champs du formulaire de commande sont enregistrés dans votre navigateur pour vous éviter de les saisir à nouveau. Les polices de caractères sont chargées depuis Google Fonts.

Vos droits : vous pouvez demander à consulter, corriger ou supprimer vos données en contactant le service client.`,returns:`Les produits sont échangés uniquement en cas de défaut.

Produit défectueux : si le mini-onduleur ne fonctionne pas au retrait ou tombe en panne pendant la garantie de 3 mois, contactez le service client avec votre référence de commande et une description du problème, avec une photo ou une vidéo si possible. Après vérification, il est échangé contre un produit identique.

Le produit doit être rapporté complet, avec le câble séparateur, la notice et la boîte d’origine, selon les modalités indiquées par le service client.

Ne sont ni repris ni échangés : un produit en bon état de fonctionnement retourné par changement d’avis, un produit incompatible avec votre matériel, un produit endommagé par une chute, l’humidité, un branchement non conforme ou l’ouverture du boîtier. Vérifiez la compatibilité avant de commander.

Les produits livrés ne sont pas remboursés : un produit défectueux est échangé.`,claims:`Pour toute réclamation, contactez le service client par WhatsApp ou par e-mail en indiquant votre référence de commande, votre nom et une description du problème, avec une photo si possible.

Nous accusons réception de votre demande et vous proposons une solution conforme aux conditions générales de vente, à la politique de retours et à la garantie.`},
 test:{enabled:true}
};
function merge(b,o){
 if(Array.isArray(b))return Array.isArray(o)?clone(o):clone(b);
 if(b&&typeof b==='object'){const r={};for(const k of Object.keys(b))r[k]=merge(b[k],o&&typeof o==='object'?o[k]:undefined);return r}
 return o===undefined||o===null||typeof o==='object'?b:o;
}
const getP=(o,p)=>p.split('.').reduce((a,k)=>a?.[k],o);
const setP=(o,p,v)=>{const ks=p.split('.');const last=ks.pop();const t=ks.reduce((a,k)=>a[k],o);t[last]=v};

/* ---------- Pays (noms en français) ---------- */
const CODES='AF ZA AL DZ DE AD AO AG SA AR AM AU AT AZ BS BH BD BB BE BZ BJ BT BY BO BA BW BR BN BG BF BI KH CM CA CV CF CL CN CY CO KM CG CD KR KP CR CI HR CU DK DJ DM EG AE EC ER ES EE SZ US ET FJ FI FR GA GM GE GH GR GD GT GN GQ GW GY HT HN HU IN ID IQ IR IE IS IL IT JM JP JO KZ KE KG KW LA LS LV LB LR LY LI LT LU MK MG MY MW MV ML MT MA MU MR MX MD MC MN ME MZ MM NA NP NI NE NG NO NZ OM UG UZ PK PA PG PY NL PE PH PL PT QA RO GB RU RW KN LC VC SV WS ST SN RS SC SL SG SK SI SO SD SS LK SE CH SR SY TJ TZ TD CZ TH TL TG TO TT TN TM TR UA UY VU VE VN YE ZM ZW'.split(' ');
let COUNTRIES=[];try{const dn=new Intl.DisplayNames(['fr'],{type:'region'});COUNTRIES=CODES.map(c=>[c,dn.of(c)||c]).sort((a,b)=>a[1].localeCompare(b[1],'fr'))}catch(e){COUNTRIES=CODES.map(c=>[c,c])}
const cname=c=>(COUNTRIES.find(x=>x[0]===c)||[c,c])[1];

/* ---------- État ---------- */
let cfg=merge(DEF,null),remote=null,dirty=false,OWNER=false,LOCAL=false,DB=null,ASSETS=null,USER=null,dbState='none';
if(LS.get('kt_preview',0)===1){LOCAL=true;OWNER=true;cfg=merge(DEF,LS.get('kt_cfg_local',null))}
let cart=LS.get('kt_cart',{qty:0});if(!(cart&&Number.isInteger(cart.qty)))cart={qty:0};
let order=LS.get('kt_order',null);
let form=LS.get('kt_form2',{});
let flowS='cut',selQty=1,gi=0,compatV={v:'',a:'',c:''},auto={w:'8',p:'r'},showJson=false,drawerOpen=false;

const price=()=>{const n=num(cfg.product.price);return n&&n>0?n:null};
const compare=()=>{const n=num(cfg.product.compare),p=price();return n&&p&&n>p?n:null};
const fee=()=>{const n=num(cfg.ship.fee);return n!==null&&n>=0?n:null};
const maxQ=()=>Math.max(1,Math.min(20,num(cfg.product.maxQty)||5));
const imgs=()=>cfg.photos.length?cfg.photos.map(p=>[blob(p.id),p.alt||cfg.product.name]):IMGS.map(([s,a])=>[s,a]);
const okOuts=()=>cfg.outputs.filter(o=>o.ok&&num(o.v)!==null);
const LBL={DC:'jack DC',USB:'USB-A','USB-C':'USB-C',PoE:'PoE'};
const todo=t=>OWNER?`<span class="todo">À compléter : ${esc(t)}</span>`:'';
const START={paiement:'de la confirmation du paiement',expedition:'de l’expédition de la commande'};
const delayTxt=()=>`${num(cfg.ship.days)||7} jours${cfg.ship.type?' '+cfg.ship.type:''}${cfg.ship.start?' à compter '+START[cfg.ship.start]:''}`;
const providerOK=()=>!!(cfg.pay.provider&&cfg.pay.physical&&cfg.pay.cards&&cfg.pay.gabon);
const reviews=()=>cfg.reviews.filter(r=>has(r.text)&&has(r.name)&&num(r.rating));
const shipOK=()=>form.country===cfg.ship.country&&norm(form.f_city)===norm(cfg.ship.city)&&norm(cfg.ship.city)!=='';

/* ---------- Schéma de la coupure ---------- */
const FLOW={
 on:{lab:'Courant présent',n:[['Prise murale','Courant présent',1],['Adaptateur 12 V','Alimente le mini-onduleur',1],['Mini-onduleur','Alimente le routeur, batterie en charge',1],['Routeur / ONU','Allumé',1],['Réseau de l’opérateur','Signal disponible',1]],l:[1,1,1,1],cap:'En temps normal, l’adaptateur de votre routeur alimente le mini-onduleur, qui alimente le routeur et garde sa batterie chargée.',r:[1,1]},
 cut:{lab:'Coupure de courant',n:[['Prise murale','Plus de courant',0],['Adaptateur 12 V','À l’arrêt',0],['Mini-onduleur','Sur batterie',2],['Routeur / ONU','Reste allumé',1],['Réseau de l’opérateur','Signal disponible',1]],l:[0,0,1,1],cap:'Pendant la coupure, la batterie prend le relais et alimente le routeur jusqu’à épuisement de sa charge. Le reste du logement reste sans électricité.',r:[1,1]},
 isp:{lab:'Réseau de l’opérateur coupé',n:[['Prise murale','Plus de courant',0],['Adaptateur 12 V','À l’arrêt',0],['Mini-onduleur','Sur batterie',2],['Routeur / ONU','Reste allumé',1],['Réseau de l’opérateur','Interrompu',0]],l:[0,0,1,0],cap:'Si le réseau de votre opérateur est lui-même interrompu, le routeur reste allumé mais il n’y a pas d’Internet : aucun onduleur n’y peut rien.',r:[1,0]}
};
function flowHTML(){const f=FLOW[flowS],icons=['plug','adapter','battery','router','tower'];let h='<div class="flow">';
 f.n.forEach((n,i)=>{if(i)h+=`<div class="lk${f.l[i-1]?'':' off'}" aria-hidden="true"></div>`;h+=`<div class="nd${n[2]===0?' off':n[2]===2?' bat':''}">${ic(icons[i])}<b>${n[0]}</b><span>${n[1]}</span></div>`});
 const net=f.r[1]?(flowS==='cut'?'Internet disponible si le réseau de l’opérateur fonctionne':'Internet disponible'):'Pas d’Internet';
 return h+`</div><p class="flowcap">${f.cap}</p><div class="res2"><span class="tag2"><i></i>Routeur alimenté</span><span class="tag2${f.r[1]?'':' ko'}"><i></i>${net}</span></div>`}

/* ---------- Autonomie (estimation) ---------- */
const hm=h=>{const m=Math.round(h*60/5)*5;return m>=60?`${Math.floor(m/60)} h${m%60?' '+String(m%60).padStart(2,'0'):''}`:`${m} min`};
function autoEval(){const w=num(auto.w);if(!w||w<=0)return null;if(w>MAXW)return{over:true,w};return{w,lo:WH*EFF[0]/w,hi:WH*EFF[1]/w}}
function autoRes(){const r=autoEval();
 if(!r)return `<p class="hint" style="margin-top:14px">Indiquez une consommation en watts.</p>`;
 if(r.over)return `<div class="res ko">${ic('x')}<span>${nf.format(r.w)} W dépasse la puissance maximale de ${MAXW} W de ce mini-onduleur : il ne convient pas à cette installation.</span></div>`;
 const pct=Math.min(100,Math.round(r.hi/8*100));
 return `<p class="hint" style="margin-top:18px">Autonomie estimée pour ${nf.format(r.w)} W</p><div class="big">${hm(r.lo)} à ${hm(r.hi)}</div><div class="meter" aria-hidden="true"><span style="width:${pct}%"></span></div><p class="hint" style="margin-top:12px">Estimation théorique, batterie neuve et chargée, à partir des 22,2 Wh annoncés par le fabricant et de 15 à 25 % de pertes de conversion. Ce n’est pas une garantie : la consommation réelle de votre appareil, l’âge de la batterie et la chaleur la font varier.</p>`}
const PRESETS=[['o','Boîtier fibre (ONU)','5'],['r','Routeur Wi-Fi','8'],['ro','Routeur + ONU','13']];

/* ---------- Compatibilité ---------- */
function compatEval(){const V=num(compatV.v),A=num(compatV.a),T=compatV.c,outs=okOuts();
 if(V===null)return['idle','Indiquez la tension lue sur l’adaptateur de votre routeur (ligne OUTPUT).'];
 const same=outs.filter(o=>Math.abs(num(o.v)-V)<0.05);
 if(!same.length)return['ko',`Ce mini-onduleur fournit uniquement ${outs.map(o=>fmtV(num(o.v))).join(', ')}. Un appareil en ${fmtV(V)} n’est pas compatible : ne le branchez pas.`];
 if(T==='USB'||T==='USB-C')return['ko',`Votre appareil est alimenté par ${T}. Ce mini-onduleur a une sortie à fiche ronde (jack DC) : il ne convient pas.`];
 if(A===null)return['warn','Indiquez aussi l’intensité (A) lue sur l’étiquette.'];
 const o=same[0],mx=num(o.a);
 if(mx!==null&&A>mx)return['ko',`Votre adaptateur indique ${fmtA(A)}, plus que les ${fmtA(mx)} maximum de ce mini-onduleur. Contactez-nous avant de commander.`];
 return['ok',`Tension et intensité compatibles : sortie ${fmtV(num(o.v))}, ${fmtA(mx)} maximum.${T==='DC'?'':' Vérifiez aussi que votre appareil se branche avec une fiche ronde.'} Contrôlez la taille de la fiche : en cas de doute, envoyez-nous une photo de l’étiquette et de la prise.`]}
const compatRes=()=>{const[k,t]=compatEval();return `<div class="res ${k}" aria-live="polite">${ic(k==='ok'?'check':k==='idle'?'info':'x')}<span>${esc(t)}</span></div>`};

/* ---------- FAQ ---------- */
function faqs(){const s=cfg.ship;return[
 ['Mon routeur est-il compatible ?','Il doit être alimenté en 12 V, avec une intensité de 2 A maximum et une fiche ronde (jack DC). Ces informations figurent sur l’étiquette de son adaptateur, à la ligne OUTPUT. Les appareils alimentés en 9 V, 19 V ou par USB ne sont pas compatibles. En cas de doute, envoyez-nous une photo de l’étiquette avant de commander.'],
 ['Puis-je alimenter mon routeur et mon boîtier fibre en même temps ?','Oui, s’ils fonctionnent tous les deux en 12 V : le câble séparateur fourni a deux fiches. Leur consommation totale doit rester dans la limite de 2 A (24 W), et l’autonomie est alors partagée entre les deux.'],
 ['Combien de temps tient-il pendant une coupure ?','Comptez 3 à 4 h pour un appareil d’environ 5 W, comme un boîtier fibre ou un petit routeur. Avec un routeur plus gourmand, ou un routeur et un boîtier fibre branchés ensemble, l’autonomie est plus courte.'],
 ['Le produit garantit-il Internet pendant une coupure ?','Non. Il garde votre routeur allumé tant que sa batterie le permet. Si le réseau de votre opérateur est lui-même coupé, il n’y aura pas d’Internet. Il ne rétablit pas non plus l’électricité dans le logement.'],
 ['L’adaptateur secteur est-il fourni ?','Non : comme le prévoit le fabricant, vous réutilisez l’adaptateur 12 V de votre routeur, que vous branchez sur l’entrée IN du mini-onduleur.'],
 ['Comment entretenir la batterie ?','Laissez l’interrupteur sur ON : la batterie ne se charge qu’en position ON. Avant un rangement prolongé, chargez-la complètement, puis rechargez-la tous les 3 à 5 mois si vous ne l’utilisez pas, selon les recommandations du fabricant.'],
 ['Où et quand vais-je recevoir ma commande ?','Les modes de livraison, les frais et le délai disponibles pour votre adresse s’affichent à l’étape de commande, avant le paiement. Le délai annoncé est indicatif et peut s’allonger selon les aléas du transport. Lorsque votre colis est disponible au point de retrait, nous vous contactons avec les informations nécessaires pour le retirer.'],
 ['Quels moyens de paiement acceptez-vous ?',`Par Mobile Money (Airtel Money, Moov Money), sur la page de paiement sécurisée de notre prestataire. Votre code Mobile Money n’est jamais saisi ni conservé sur notre site.${PAY_ACTIVE?'':' Le paiement en ligne ouvrira très prochainement.'}`],
 ...(cfg.warranty.ok&&has(cfg.warranty.v)?[['Que se passe-t-il si le produit est défectueux\u00a0?',`Il est garanti ${cfg.warranty.short?cfg.warranty.short.split('·')[0].trim():''} à compter du retrait du colis. Contactez-nous avec votre référence de commande : un produit reconnu défectueux est échangé contre un produit identique. Un produit fonctionnel mais incompatible avec votre matériel n’est ni repris ni échangé.`]]:[]),
 ['Que faire si mon paiement est refusé ?','Une commande n’est confirmée qu’après validation du paiement par notre prestataire. Vérifiez que le solde de votre compte Mobile Money couvre le prix et les frais de paiement, puis réessayez. Si votre compte a été débité sans confirmation, ne payez pas une seconde fois : contactez-nous avec la référence affichée.']
]}

/* ---------- Contacts ---------- */
function contacts(){const s=cfg.support,a=[];
 if(s.whatsapp&&s.whatsapp.replace(/\D/g,''))a.push(['WhatsApp',`<a href="https://wa.me/${s.whatsapp.replace(/\D/g,'')}">${esc(s.whatsapp)}</a>`]);
 if(s.phone)a.push(['Téléphone',`<a href="tel:${esc(s.phone.replace(/[^\d+]/g,''))}">${esc(s.phone)}</a>`]);
 if(s.email)a.push(['E-mail',/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(s.email)?`<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`:`<b>${esc(s.email)}</b>`]);
 if(s.hours)a.push(['Horaires',`<b>${esc(s.hours)}</b>`]);
 return a}
const contactList=()=>{const a=contacts();return a.length?`<ul class="clist">${a.map(([k,v])=>`<li><span>${k}</span>${v}</li>`).join('')}</ul>`:`<p class="mute">Les coordonnées du service client seront publiées ici avant l’ouverture des commandes.</p>${todo('WhatsApp ou téléphone du service client')}`};
const LEGALS=[['cgv','Conditions générales de vente'],['livraison','Livraison'],['retours','Retours et échanges'],['garantie','Garantie'],['confidentialite','Confidentialité'],['reclamations','Réclamations'],['vendeur','Mentions vendeur']];
const legalLinks=()=>`<div class="links">${LEGALS.map(([h,t])=>`<a href="#${h}">${t}</a>`).join('')}</div>`;

/* ---------- Blocs fiche ---------- */
function specTable(){const rows=cfg.specs.filter(s=>s.ok&&has(s.v));
 return rows.length?`<div style="overflow-x:auto"><table class="spec"><tbody>${rows.map(s=>`<tr><th scope="row">${esc(s.k)}</th><td>${esc(s.v)}</td></tr>`).join('')}</tbody></table></div><p class="src">Caractéristiques communiquées par le fabricant.</p>`:'<p>Caractéristiques en cours de publication.</p>'}
const boxList=()=>{const b=cfg.box.filter(x=>x.ok&&has(x.v));return `<ul class="ticks">${b.map(x=>`<li>${ic('check')}<span>${esc(x.v)}</span></li>`).join('')}</ul><p class="src">Adaptateur secteur non fourni : vous réutilisez celui de votre routeur 12 V.</p>`};
const stepsList=()=>{const st=cfg.steps.filter(x=>x.ok&&has(x.v));return st.length?`<ol class="steps">${st.map(x=>`<li><span style="color:var(--ink);font-size:16px">${esc(x.v)}</span></li>`).join('')}</ol>`:''};
function stars(n){const r=Math.round(n);return '★★★★★'.slice(0,r)+'☆☆☆☆☆'.slice(0,5-r)}

/* ---------- Page produit (accueil) ---------- */
function pgHome(){const c=cfg,p=price(),cp=compare(),I=imgs(),rv=reviews(),avg=rv.length?rv.reduce((a,r)=>a+num(r.rating),0)/rv.length:0;
 gi=Math.min(gi,I.length-1);selQty=Math.min(Math.max(1,selQty),maxQ());
 const w=c.warranty.ok&&has(c.warranty.v),wm=w?(c.warranty.short||'').split('·')[0].trim():'';
 return `<section class="hero"><div class="hin"><div class="ht">
<span class="kicker">${ic('volt')}Spécial coupures de courant</span>
<h1>Le courant coupe, <span class="mark">votre Wi&#8209;Fi reste allumé.</span></h1>
<p class="sub">Vos appels, vos réunions et vos séries continuent pendant la coupure. Le mini-onduleur prend le relais automatiquement, sans bruit et sans groupe électrogène.</p></div>
<div class="himg"><img src="img/hero.webp" alt="Mini-onduleur WGP branché sur un routeur Wi-Fi"><span class="seal"><span><b class="sb">3 à 4 h</b>d’autonomie<small>pendant la coupure*</small></span></span></div>
<div class="hc"><ul class="hbul"><li>${ic('check')}<span><b>3 à 4 h d’autonomie</b> pendant la coupure*</span></li><li>${ic('check')}Installé en 2 minutes, sans outil</li><li>${ic('check')}Routeur et boîtier fibre alimentés ensemble</li></ul>
<div class="hcta"><button class="btn" data-act="buy"${p?'':' disabled'}>${p?'Commander maintenant':'Bientôt disponible'}</button><div class="hp">${p?fcfa(p):''}<small>${p?'Livraison précisée à la commande':''}</small></div></div><p class="fn">* Pour un appareil d’environ 5 W (boîtier fibre ou petit routeur) ; autonomie plus courte avec un équipement plus gourmand ou deux appareils.</p></div></div></section>
<section class="strip"><div class="in"><div class="it">${ic('battery')}<div>3 à 4 h d’autonomie<span>Selon l’appareil branché</span></div></div><div class="it">${ic('clock')}<div>Installation 2 min<span>Sans outil, sans réglage</span></div></div><div class="it">${ic('shield')}<div>${w?'Garantie '+esc(wm):'Garantie'}<span>${w?'Échange si défectueux':'Conditions à l’ouverture'}</span></div></div><div class="it">${ic('chat')}<div>Aide avant achat<span>Compatibilité vérifiée avec vous</span></div></div></div></section>
<section class="band" id="benefices"><div class="wrap"><h2 class="center">Ce que ça change pour vous</h2><p class="lead center" style="margin:14px auto 0;max-width:40em">Une coupure ne vous déconnecte plus du monde.</p><div class="bens">
<div class="ben"><span class="bi">${ic('wifi')}</span><h3>Le Wi&#8209;Fi reste allumé</h3><p>Quand le courant saute, votre routeur continue de diffuser le Wi‑Fi pendant 3 à 4 h. Téléphones et ordinateurs portables restent connectés.</p></div>
<div class="ben"><span class="bi">${ic('chat')}</span><h3>Vos appels ne coupent plus</h3><p>Appels WhatsApp, réunions en ligne, cours à distance : la conversation continue pendant la coupure.</p></div>
<div class="ben"><span class="bi">${ic('bars')}</span><h3>Votre forfait mobile est épargné</h3><p>Plus besoin de basculer sur vos données mobiles à chaque coupure.</p></div>
<div class="ben"><span class="bi">${ic('refresh')}</span><h3>Fini l’attente au retour du courant</h3><p>La box ne s’éteint plus à chaque micro-coupure : pas de redémarrage, pas de reconnexion à attendre.</p></div>
<div class="ben"><span class="bi">${ic('mute')}</span><h3>Sans groupe électrogène</h3><p>Inutile d’allumer le groupe juste pour Internet : le mini-onduleur est silencieux et ne consomme pas de carburant.</p></div>
<div class="ben"><span class="bi">${ic('work')}</span><h3>Travail et paiements sans interruption</h3><p>Envoyez vos fichiers, finalisez un paiement en ligne, suivez vos commandes, même pendant la coupure.</p></div>
</div><p class="src center" style="margin-top:22px">Internet reste disponible tant que la batterie tient et que le réseau de votre opérateur fonctionne.</p></div></section>
<section class="pdp" id="produit">
<div class="gal"><div class="stage"><div class="gmain" id="gmain" tabindex="0" aria-label="Photos du produit">${I.map(([s,a],i)=>`<div class="gs"><img src="${s}" alt="${esc(a)}"${i?' loading="lazy"':''}></div>`).join('')}</div>
<button class="gbtn p" data-act="gstep" data-d="-1" aria-label="Photo précédente">‹</button><button class="gbtn n" data-act="gstep" data-d="1" aria-label="Photo suivante">›</button><span class="gcount" id="gcount">${gi+1} / ${I.length}</span>
</div><div class="dots" id="dots">${I.map((_,i)=>`<i class="${i===gi?'on':''}"></i>`).join('')}</div><div class="thumbs">${I.map(([s,a],i)=>`<button data-act="gto" data-i="${i}" aria-label="Photo ${i+1}" aria-current="${i===gi}"><img src="${s}" alt=""></button>`).join('')}</div></div>
<div class="buy"><p class="brand">${esc(c.product.brand)} · Réf. ${esc(c.product.ref)}</p>
<h1>${esc(c.product.name)}</h1>
${rv.length?`<a class="rate" href="#avis"><span class="stars" aria-hidden="true">${stars(avg)}</span><span>${nf.format(Math.round(avg*10)/10)}/5 · ${rv.length} avis</span></a>`:''}
<div class="price${p?'':' none'}">${p?fcfa(p):'Prix bientôt disponible'}${cp?`<s class="small mute" style="font:500 18px var(--f2)">${fcfa(cp)}</s>`:''}${p?'<small>Livraison précisée à la commande</small>':''}</div>${p?'':todo('prix de vente')}
<p class="pitch">${esc(c.product.pitch)}</p>
<div class="chips"><div class="chip">${ic('volt')}<span><b>12 V · 2 A</b>sortie jack DC</span></div><div class="chip">${ic('battery')}<span><b>3 à 4 h d’autonomie</b>batterie 22,2 Wh</span></div><div class="chip">${ic('split')}<span><b>2 appareils</b>câble séparateur fourni</span></div><div class="chip">${ic('shield')}<span><b>4 protections</b>court-circuit, surcharge…</span></div></div>
<div class="opt"><p class="lb">Sortie : <b>12 V – 2 A</b></p><div class="pills"><span class="pill" aria-pressed="true">12 V – 2 A</span></div></div>
<div class="opt"><p class="lb">Couleur : <b>Noir</b></p><div class="pills"><span class="pill" aria-pressed="true"><span class="sw"></span>Noir</span></div></div>
<div class="qc">${ic('info')}<div><b>Votre routeur est-il en 12 V&nbsp;?</b><p>Regardez l’étiquette de son adaptateur : elle doit indiquer 12V et 2A au maximum. <button class="lnk" data-go="compatibilite">Vérifier en 30 secondes</button></p></div></div>
<div class="qrow"><div class="qty" role="group" aria-label="Quantité"><button data-act="sq" data-d="-1" aria-label="Diminuer la quantité">−</button><output id="selq" aria-live="polite">${selQty}</output><button data-act="sq" data-d="1" aria-label="Augmenter la quantité">+</button></div><button class="btn sec" data-act="add" id="addbtn"${p?'':' disabled'}>Ajouter au panier</button></div>
<div class="ctas"><button class="btn wide" data-act="buy"${p?'':' disabled'}>Acheter maintenant</button></div>
<p class="stat"><span class="dot ${PAY_ACTIVE&&p?'on':'off'}"></span>${PAY_ACTIVE&&p?'Disponible':'Ouverture des commandes très prochainement'}</p>
<div class="trust"><div>${ic('lock')}<span><b>Paiement sécurisé</b>Mobile Money, page sécurisée</span></div><div>${ic('truck')}<span><b>Livraison</b>Options et délai selon votre adresse</span></div><div>${ic('chat')}<span><b>Aide avant achat</b>Envoyez-nous l’étiquette de votre adaptateur</span></div><div>${ic('shield')}<span><b>Garantie</b>${w?esc(c.warranty.short||'Voir les conditions'):'Conditions précisées à l’ouverture'}</span></div></div>
<div class="acc">
<details open><summary>Description</summary><div class="in"><p>Ce mini-onduleur s’installe entre l’adaptateur de votre routeur et le routeur lui-même. Tant que le courant est là, il alimente le routeur et recharge sa batterie. Quand le courant coupe, la batterie prend le relais et le Wi-Fi reste allumé.</p><p>Avec le câble séparateur fourni, il alimente aussi un boîtier fibre (ONU) en 12 V, dans la limite de 2 A au total.</p></div></details>
<details><summary>Caractéristiques techniques</summary><div class="in">${specTable()}</div></details>
<details><summary>Contenu de la boîte</summary><div class="in">${boxList()}</div></details>
<details><summary>Livraison, garantie et retours</summary><div class="in"><p>Les modes de livraison, frais et délais disponibles pour votre adresse s’affichent à l’étape de commande, avant le paiement.</p>${w?`<p>Garantie ${esc(c.warranty.short)}. Les produits fonctionnels ne sont ni repris ni échangés : vérifiez la compatibilité avant de commander.</p>`:''}<p><a href="#livraison">Livraison</a> · <a href="#garantie">Garantie</a> · <a href="#retours">Retours et échanges</a></p></div></details>
</div></div></section>

<section class="band"><div class="wrap"><h2 class="center">Sans ou avec mini-onduleur</h2><div class="vs">
<div class="col no"><h3>${ic('x')}Sans</h3><ul><li>${ic('x')}<span>Le Wi-Fi s’éteint à chaque coupure</span></li><li>${ic('x')}<span>Appels et réunions en ligne interrompus</span></li><li>${ic('x')}<span>La box redémarre à chaque micro-coupure</span></li><li>${ic('x')}<span>Il faut attendre le retour du courant</span></li></ul></div>
<div class="col yes"><h3>${ic('check')}Avec le mini-onduleur</h3><ul><li>${ic('check')}<span>Le routeur reste allumé 3 à 4 h pendant la coupure*</span></li><li>${ic('check')}<span>Vous restez connecté si le réseau de l’opérateur fonctionne</span></li><li>${ic('check')}<span>Plus de redémarrage de la box à chaque micro-coupure</span></li><li>${ic('check')}<span>Batterie rechargée automatiquement au retour du courant</span></li></ul></div>
</div></div></section>

<section class="band cut" id="fonctionnement"><div class="wrap"><h2>Coupure de courant&nbsp;: ce qui se passe</h2><p class="lead">Il fournit une alimentation de secours à votre routeur. Il ne rétablit pas l’électricité dans le logement et ne remplace pas le réseau de votre opérateur.</p>
<div class="seg" role="group" aria-label="Choisir une situation">${Object.entries(FLOW).map(([k,v])=>`<button data-act="flow" data-k="${k}" aria-pressed="${k===flowS}">${v.lab}</button>`).join('')}</div><div id="flow">${flowHTML()}</div></div></section>

<section class="band"><div class="duo"><div class="pic"><img src="img/g-cable.webp" alt="Câble séparateur fourni : une sortie, deux fiches 12 V" loading="lazy"></div>
<div><h2>Routeur et boîtier fibre, en même temps</h2><p class="lead">Résultat : toute votre connexion tient pendant la coupure, pas seulement le routeur. Beaucoup d’installations ont deux boîtiers, l’ONU de la fibre et le routeur Wi‑Fi : si l’un s’éteint, Internet tombe.</p><ul class="ticks"><li>${ic('check')}<span>Câble séparateur fourni : une sortie, deux fiches 12 V.</span></li><li>${ic('check')}<span>Jusqu’à 2 A au total, soit 24 W pour les deux appareils.</span></li><li>${ic('check')}<span>L’autonomie se partage alors entre les deux appareils.</span></li></ul></div></div></section>

<section class="band soft" id="installation"><div class="duo rev"><div class="pic"><img src="img/g-ports.webp" alt="Sortie OUT et entrée IN du mini-onduleur" loading="lazy"></div>
<div><h2>Installé en deux minutes, sans outil</h2><p class="lead">Vous gardez l’adaptateur de votre routeur : le mini-onduleur se place simplement entre les deux.</p>${stepsList()}<p class="note">L’adaptateur secteur n’est pas fourni : vous réutilisez celui de votre routeur 12 V, comme le prévoit le fabricant.</p></div></div></section>

<section class="band" id="autonomie"><div class="nums"><div><b>3 à 4 h</b><span>d’autonomie pendant la coupure*</span></div><div><b>12 V · 2 A</b><span>sortie jack DC</span></div><div><b>24 W</b><span>puissance maximale</span></div><div><b>22,2 Wh</b><span>batterie 6 000 mAh</span></div></div><p class="fn" style="max-width:1240px;margin:22px auto 0">* Pour un appareil d’environ 5 W (boîtier fibre ou petit routeur) ; autonomie plus courte avec un équipement plus gourmand ou deux appareils.</p></section>



<section class="band" id="compatibilite"><div class="tool"><div><h2>Vérifiez la compatibilité avant d’acheter</h2><p class="lead" style="margin-top:14px">C’est la première cause de retour pour ce type de produit. Comparez l’étiquette de l’adaptateur de votre routeur avec ce mini-onduleur.</p>
<div class="plate" aria-label="Exemple d’étiquette d’adaptateur"><div>INPUT&nbsp;: 100-240V~ 50/60Hz 0.4A</div><div><span class="hi">OUTPUT&nbsp;: 12V ⎓ 1.0A</span></div></div><p class="hint" style="margin-top:8px">Exemple : la ligne OUTPUT indique la tension et l’intensité à comparer.</p></div>
<div class="panel"><div class="fl"><label for="cv">Tension indiquée (OUTPUT)</label><div class="unit"><input id="cv" type="text" inputmode="decimal" placeholder="12" value="${esc(compatV.v)}">V</div></div>
<div class="fl"><label for="ca">Intensité indiquée</label><div class="unit"><input id="ca" type="text" inputmode="decimal" placeholder="1" value="${esc(compatV.a)}">A</div></div>
<div class="fl"><label for="cc">Type de prise sur le routeur</label><select id="cc">${[['','Choisir…'],['DC','Fiche ronde (jack DC)'],['USB','USB-A'],['USB-C','USB-C'],['?','Je ne sais pas']].map(([v,t])=>`<option value="${v}"${compatV.c===v?' selected':''}>${t}</option>`).join('')}</select></div>
<div id="cres">${compatRes()}</div></div></div></section>

<section class="band soft"><div class="duo"><div class="pic"><img src="img/g-profil.webp" alt="Mini-onduleur WGP UPS1202A, vue de trois quarts" loading="lazy"></div>
<div><h2>Une batterie lithium-ion protégée</h2><p class="lead">Un pack 18650 de 6 000 mAh et une carte électronique qui surveille la charge et la sortie.</p><div class="prot"><div>${ic('short')}<span><b>Court-circuit</b>Coupure de la sortie en cas de défaut</span></div><div>${ic('amp')}<span><b>Surintensité</b>Limite le courant demandé</span></div><div>${ic('full')}<span><b>Surcharge</b>Arrête la charge batterie pleine</span></div><div>${ic('low')}<span><b>Décharge profonde</b>Préserve la batterie</span></div></div><p class="src">Protections annoncées par le fabricant.</p></div></div></section>

<section class="band"><div class="duo rev"><div class="pic"><img src="img/boite.webp" alt="Contenu de la boîte : mini-onduleur, notice, câble séparateur, boîte" loading="lazy"></div>
<div><h2>Dans la boîte</h2>${boxList()}<p class="mute" style="margin-top:22px">Compact, il tient dans la main et se glisse derrière votre box ou votre routeur.</p></div></div></section>

${rv.length?`<section class="band soft" id="avis"><div class="reviews"><h2>Avis clients</h2><p class="lead" style="margin-top:10px"><span class="stars">${stars(avg)}</span> ${nf.format(Math.round(avg*10)/10)}/5 sur ${rv.length} avis</p><div class="rgrid">${rv.map(r=>`<div class="rv"><span class="stars" aria-label="${num(r.rating)} sur 5">${stars(num(r.rating))}</span><p>${esc(r.text)}</p><p class="who"><b style="color:var(--ink)">${esc(r.name)}</b>${r.country?' · '+esc(cname(r.country)):''}${r.date?' · '+esc(r.date):''}${r.verified?' · Achat vérifié':''}</p></div>`).join('')}</div></div></section>`:OWNER?`<section class="band soft" id="avis"><div class="reviews"><h2>Avis clients</h2><p class="mute" style="margin-top:10px">Cette section apparaîtra dès que vous aurez ajouté de vrais avis d’acheteurs dans l’administration.</p>${todo('avis réels d’acheteurs')}</div></section>`:''}

<section class="band final"><div class="fin"><div class="card"><img src="img/g-face.webp" alt="Mini-onduleur WGP UPS1202A" loading="lazy"></div>
<div><h2>Ne perdez plus votre connexion à chaque coupure.</h2><p>Un petit boîtier, deux minutes d’installation, et votre routeur reste allumé quand le courant saute.</p>
<div class="hcta"><button class="btn" data-act="buy"${p?'':' disabled'}>${p?'Commander maintenant':'Bientôt disponible'}</button><div class="hp">${p?fcfa(p):''}<small>${p?'Livraison précisée à la commande':''}</small></div></div>
<div class="badges"><span>${ic('battery')}3 à 4 h d’autonomie*</span><span>${ic('lock')}Paiement Mobile Money</span>${w?`<span>${ic('shield')}Garantie ${esc(wm)}</span>`:''}<span>${ic('chat')}Aide à la compatibilité</span></div></div></div></section>

<section class="band${rv.length||OWNER?'':' soft'}" id="questions"><div class="wrap"><h2 class="center">Questions fréquentes</h2><div class="faq">${faqs().map(([q,a],i)=>`<details${i?'':' open'}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></div></section>

<section class="band soft" id="contact"><div class="ctc"><div><h2>Une question avant de commander&nbsp;?</h2><p class="lead" style="margin-top:14px;max-width:34em">Envoyez-nous une photo de l’étiquette de l’adaptateur de votre routeur : nous vous disons s’il est compatible.</p>${legalLinks()}</div><div>${contactList()}</div></div></section>`}

/* ---------- Panier latéral ---------- */
function drawerHTML(){const p=price(),q=cart.qty,I=imgs();
 return `<div class="dh"><h3 style="font-size:20px">Votre panier</h3><button class="icb" data-act="close" aria-label="Fermer le panier">${ic('x')}</button></div>
<div class="db">${q?`<div class="line"><div class="thumb"><img src="${I[0][0]}" alt=""></div><div><b>${esc(cfg.product.name)}</b><p class="small mute">12 V – 2 A · Noir</p><div style="display:flex;gap:12px;align-items:center;margin-top:10px;flex-wrap:wrap"><div class="qty sm" role="group" aria-label="Quantité"><button data-act="cq" data-d="-1" aria-label="Diminuer">−</button><output>${q}</output><button data-act="cq" data-d="1" aria-label="Augmenter">+</button></div><button class="lnk small" data-act="crm">Retirer</button></div></div><div class="amt">${p?fcfa(p*q):'—'}</div></div>`:'<p class="mute">Votre panier est vide.</p>'}</div>
${q?`<div class="df"><dl class="tot"><dt>Sous-total</dt><dd>${p?fcfa(p*q):'À confirmer'}</dd></dl><p class="small mute" style="margin:8px 0 14px">Mode de livraison précisé à l’étape suivante, selon votre adresse.</p><a class="btn wide" href="#commande" data-act="close">Commander</a></div>`:`<div class="df"><button class="btn sec wide" data-act="close">Continuer mes achats</button></div>`}`}
function openDrawer(o){drawerOpen=o;const d=$('#drawer');if(o)d.innerHTML=drawerHTML();d.classList.toggle('on',o);d.setAttribute('aria-hidden',!o);$('#ovl').classList.toggle('on',o);if(o)d.querySelector('button')?.focus()}

/* ---------- Commande ---------- */
const inp=(id,l,t,ac,h,ph)=>`<div class="fl"><label for="${id}">${l}</label><input id="${id}" type="${t}" autocomplete="${ac}" value="${esc(form[id]||'')}"${ph?` placeholder="${esc(ph)}"`:''}>${h?`<p class="hint">${h}</p>`:''}</div>`;
function shipBlock(){const s=cfg.ship,f=fee();
 if(!form.country)return '<p class="hint">Choisissez votre pays et votre ville pour voir les modes de livraison disponibles.</p>';
 if(!has(form.f_city))return '<p class="hint">Saisissez votre ville pour voir les modes de livraison disponibles.</p>';
 if(!shipOK())return `<div class="res warn">${ic('info')}<span>Aucun mode de livraison n’est disponible pour cette adresse pour le moment. Contactez-nous : nous vous dirons si une solution existe.</span></div>`;
 return `<div class="ship sel"><div class="row"><span>${esc(s.method)}</span><span>${f===null?'À confirmer':f===0?'Inclus':fcfa(f)}</span></div>
<div class="relay">${/^img\/[a-z0-9-]+\.(webp|png|jpg)$/.test(s.logo||'')?`<img src="${s.logo}" alt="" width="52" height="52">`:''}<div><b>${esc(s.office)}</b>${s.address?`<p class="small mute">${esc(s.address)}</p>`:''}</div></div>
<p class="small mute" style="margin-top:8px">Délai annoncé : ${esc(delayTxt())}${s.extra?`, ${esc(s.extra)}`:''}. Nous vous contactons${s.contactBy?' '+esc(s.contactBy):''} dès que votre colis est disponible.${s.instructions?' '+esc(s.instructions):''}</p>${f===null||!s.type||!s.start?todo('frais, type de jours et point de départ du délai'):''}${s.contactBy?'':todo('mode de contact à l’arrivée du colis')}</div>`}
function sumHTML(){const p=price(),f=fee(),q=cart.qty,ok=shipOK()&&f!==null,I=imgs();
 return `<div class="line" style="grid-template-columns:64px minmax(0,1fr) auto"><div class="thumb" style="width:64px;height:64px"><img src="${I[0][0]}" alt=""></div><div><b>${esc(cfg.product.name)}</b><p class="small mute">12 V – 2 A · Noir · Quantité ${q}</p></div><div class="amt">${p?fcfa(p*q):'—'}</div></div>
<dl class="tot" style="margin-top:18px"><dt>Sous-total</dt><dd>${p?fcfa(p*q):'À confirmer'}</dd><dt>Livraison</dt><dd>${shipOK()?(f===null?'À confirmer':f===0?'Incluse':fcfa(f)):'Selon l’adresse'}</dd><dt class="grand">Total (XAF)</dt><dd class="grand">${p&&ok?fcfa(p*q+f):'—'}</dd></dl>`}
function payArea(){const p=price(),f=fee(),ok=!!(p&&f!==null&&shipOK()),tot=ok?p*cart.qty+f:null;
 const pm='momo';
 const head=`<div class="pms" role="radiogroup" aria-label="Moyen de paiement"><label class="pm sel"><input type="radio" name="pm" value="momo" checked>${ic('phone')}<span><b>Mobile Money</b>Airtel Money, Moov Money</span></label></div><p class="small mute" style="margin-top:10px">Vous validez le paiement sur la page sécurisée ${providerOK()?'de '+esc(cfg.pay.provider):'du prestataire de paiement'}, puis sur votre téléphone. Votre code Mobile Money n’est jamais saisi sur ce site.</p>`;
 if(PAY_ACTIVE)return head+(PAY_TEST?'<p class="testban" style="margin-top:12px">Mode test : aucun débit réel</p>':PAY_PRIV?'<p class="testban" style="margin-top:12px">Paiement réel, visible par vous seul : tout paiement est réellement débité</p>':'')+`<button class="btn wide" id="paybtn" style="margin-top:16px" type="submit"${ok&&!payBusy?'':' disabled'}>${payBusy?'Redirection vers le paiement…':'Payer '+(ok?fcfa(tot):'')}</button><p class="small mute" style="margin-top:10px">Les frais du prestataire de paiement s’ajoutent à ce total selon l’opérateur choisi ; leur montant s’affiche sur la page de paiement, avant toute validation.</p>`;
 if(OWNER&&cfg.test.enabled)return head+`<div class="testbox"><b>Mode test</b><p class="small">Visible uniquement par vous. Aucune transaction réelle.</p><div class="fl"><label for="simres">Réponse simulée du prestataire</label><select id="simres"><option value="confirme">Paiement confirmé</option><option value="refuse">Paiement refusé</option><option value="annule">Paiement annulé</option><option value="attente">Paiement en attente</option></select></div></div><button class="btn wide" style="margin-top:16px" type="submit"${ok?'':' disabled'}>Simuler le paiement${ok?' de '+fcfa(tot):''}</button>`;
 return head+`<button class="btn wide" style="margin-top:16px" type="button" disabled>Paiement bientôt disponible</button><p class="small mute" style="margin-top:10px">Le paiement en ligne ouvrira très prochainement : aucune somme ne peut être débitée pour l’instant.</p>`}
function pgCheckout(){if(!cart.qty)return `<section class="band"><div class="wrap narrow"><h1>Votre panier est vide</h1><p style="margin-top:24px"><a class="btn" href="#">Voir le produit</a></p></div></section>`;
 return `<section class="band"><div class="co"><form id="coform" novalidate><h1 style="margin-bottom:20px">Commande</h1><details class="msum"><summary><span>Récapitulatif</span><b id="msumt">${(()=>{const p=price(),f=fee();return p?fcfa(p*cart.qty+(shipOK()&&f!==null?f:0)):''})()}</b></summary><div id="sumb2">${sumHTML()}</div></details>
<fieldset><legend>Contact</legend>${inp('f_email','Adresse e-mail','email','email','')}${inp('f_phone','Téléphone','tel','tel','Pour vous prévenir à l’arrivée de votre colis.','Avec l’indicatif du pays')}</fieldset>
<fieldset><legend>Livraison</legend>
<div class="fl"><label for="f_country">Pays</label><select id="f_country" autocomplete="country"><option value="">Choisir un pays</option>${COUNTRIES.map(([c,n])=>`<option value="${c}"${form.country===c?' selected':''}>${esc(n)}</option>`).join('')}</select></div>
<div class="grid2">${inp('f_city','Ville','text','address-level2','')}${inp('f_name','Nom complet','text','name','Tel qu’il figure sur votre pièce d’identité.')}</div>
<p class="legend" style="font-weight:600;margin-top:22px">Mode de livraison</p><div id="shipb">${shipBlock()}</div></fieldset>
<label class="ck"><input type="checkbox" id="f_compat"${form.f_compat?' checked':''}><span>J’ai vérifié que mon appareil fonctionne en 12 V, 2 A maximum, avec une fiche ronde.</span></label>
<label class="ck" style="margin-bottom:24px"><input type="checkbox" id="f_cgv"${form.f_cgv?' checked':''}><span>J’accepte les <a href="#cgv">conditions générales de vente</a>.</span></label>
<fieldset style="margin:0"><legend>Paiement</legend><div id="payb">${payArea()}</div></fieldset>
<p class="err" id="ferr" role="alert"></p></form>
<aside class="sum" aria-label="Récapitulatif"><h2 class="h3" style="font:600 20px var(--f1);margin-bottom:16px">Récapitulatif</h2><div id="sumb">${sumHTML()}</div></aside></div></section>`}
function refreshCheckout(){const a=$('#shipb'),b=$('#sumb'),c=$('#payb'),b2=$('#sumb2'),t=$('#msumt');if(a)a.innerHTML=shipBlock();if(b)b.innerHTML=sumHTML();if(b2)b2.innerHTML=sumHTML();if(t){const p=price(),f=fee();t.textContent=p?fcfa(p*cart.qty+(shipOK()&&f!==null?f:0)):''}if(c){const v=$('#simres')?.value;c.innerHTML=payArea();if(v&&$('#simres'))$('#simres').value=v}}

const RES={
 confirme:['check','','Commande confirmée',()=>`Votre commande est confirmée. Vous serez contacté lorsque votre colis arrivera à notre point de retrait de ${esc(cfg.ship.city||'votre ville')}.`],
 refuse:['x','ko','Paiement refusé',()=>'Votre paiement n’a pas été accepté. Aucune commande n’a été confirmée.'],
 annule:['x','ko','Paiement annulé',()=>'Le paiement a été annulé. Votre commande n’est pas confirmée et votre panier est conservé.'],
 attente:['wait','wait','Paiement en cours de vérification',()=>'Votre paiement attend la confirmation de notre prestataire. Ne relancez pas de paiement : votre commande sera confirmée dès réception de cette confirmation.']
};
function pgRes(st){const o=order;
 if(!o||o.status!==st)return `<section class="band"><div class="wrap narrow"><h1>Aucune commande en cours</h1><p class="lead" style="margin-top:12px">Nous ne trouvons pas de commande avec ce statut dans ce navigateur.</p><p style="margin-top:24px"><a class="btn" href="#">Retour à la boutique</a></p></div></section>`;
 const [i,k,t,m]=RES[st];
 const acts={confirme:'<a class="btn" href="#">Retour à la boutique</a>',refuse:'<a class="btn" href="#commande">Réessayer le paiement</a><a class="btn sec" href="#contact">Contacter le service client</a>',annule:'<a class="btn" href="#commande">Reprendre le paiement</a><button class="btn sec" data-act="cart">Voir le panier</button>',attente:'<button class="btn" data-act="refresh">Actualiser le statut</button><a class="btn sec" href="#contact">Contacter le service client</a>'}[st];
 return `<section class="band"><div class="wrap narrow">${o.test?'<p class="testban">Simulation de test : aucune transaction réelle</p>':''}<div class="result"><div class="rico ${k}">${ic(i)}</div><div><h1>${t}</h1><p class="lead" style="margin-top:14px;color:var(--ink)">${m()}</p>
<div class="refbox"><span class="mute">Référence de commande</span><b>${esc(o.ref)}</b></div>
<dl class="tot"><dt>${esc(cfg.product.name)} × ${o.qty}</dt><dd>${fcfa(o.unit*o.qty)}</dd><dt>Livraison</dt><dd>${o.fee===0?'Incluse':fcfa(o.fee)}</dd><dt class="grand">Total (XAF)</dt><dd class="grand">${fcfa(o.total)}</dd></dl>
${st==='confirme'?`<p class="small mute" style="margin-top:16px">Point de retrait : ${esc(cfg.ship.office)}${cfg.ship.address?', '+esc(cfg.ship.address):''}. Délai annoncé : ${esc(delayTxt())}${cfg.ship.extra?', '+esc(cfg.ship.extra):''}. Pour toute question, contactez uniquement notre service client.</p>`:''}
${o.test&&st==='attente'?'<div class="testbox"><b>Simuler la réponse du prestataire</b><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="btn sm" data-act="simto" data-s="confirme">Confirmer</button><button class="btn sec sm" data-act="simto" data-s="refuse">Refuser</button></div></div>':''}
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:26px">${acts}</div></div></div></div></section>`}

const LEGAL={cgv:['Conditions générales de vente','legal.cgv'],confidentialite:['Politique de confidentialité','legal.privacy'],retours:['Retours et échanges','legal.returns'],reclamations:['Traitement des réclamations','legal.claims'],garantie:['Garantie','warranty.v']};
function pgLegal(k){const[t,p]=LEGAL[k];let v=getP(cfg,p);if(k==='garantie'&&!cfg.warranty.ok)v='';
 const body=has(v)?String(v).trim().split(/\n{2,}/).map(x=>`<p>${esc(x).replace(/\n/g,'<br>')}</p>`).join(''):`<p class="mute">Ce document sera publié avant l’ouverture des commandes.</p>${todo(t.toLowerCase())}`;
 return `<section class="band"><div class="wrap narrow"><h1>${t}</h1><div class="prose" style="margin-top:10px">${body}</div>${legalLinks()}</div></section>`}
const pgShipping=()=>`<section class="band"><div class="wrap narrow"><h1>Livraison</h1><div class="prose" style="margin-top:10px"><p>Les destinations desservies, les modes de livraison, les frais et les délais s’affichent à l’étape de commande dès que vous saisissez votre pays et votre ville. Ils figurent dans le récapitulatif avant le paiement.</p><p>Le délai affiché est indicatif : il peut s’allonger jusqu’à deux semaines selon les aléas du transport et des formalités douanières.</p><p>Lorsque le colis est disponible au point de retrait, nous vous contactons avec les informations nécessaires pour le retirer, sur présentation d’une pièce d’identité au nom indiqué lors de la commande. Pour toute question, contactez uniquement notre service client.</p><p>Si aucune option ne s’affiche pour votre adresse, contactez-nous : nous vous dirons si une solution existe.</p></div>${legalLinks()}</div></section>`;
function pgSeller(){const s=cfg.seller,rows=[['Vendeur',s.name],['Forme juridique',s.form],['RCCM',s.rccm],['NIF',s.nif],['Adresse',s.address],['Représentant',s.rep]].filter(r=>has(r[1]));
 return `<section class="band"><div class="wrap narrow"><h1>Mentions vendeur</h1>${rows.length?`<ul class="clist" style="margin-top:24px">${rows.map(([k,v])=>`<li><span>${k}</span><b>${esc(v)}</b></li>`).join('')}</ul>`:`<p class="mute" style="margin-top:14px">L’identité légale du vendeur sera publiée avant l’ouverture des commandes.</p>${todo('informations légales du vendeur')}`}<h2 style="margin-top:40px;font-size:24px">Service client</h2><div style="margin-top:16px">${contactList()}</div>${legalLinks()}</div></section>`}

/* ---------- Administration ---------- */
function checks(){const c=cfg,s=c.ship,sp=c.support;return[
 ['Nom de la boutique validé',c.shop.name&&c.shop.confirmed],['Prix de vente (XAF)',price()],['Frais de livraison',fee()!==null],
 ['Délai : jours ouvrés ou calendaires, point de départ',s.type&&s.start],['Point de retrait, consignes et mode de contact',s.office&&s.instructions&&s.contactBy],
 ['Contact du service client',sp.phone||sp.whatsapp],['Garantie et politique de retour',c.warranty.ok&&has(c.warranty.v)&&has(c.legal.returns)],
 ['CGV et politique de confidentialité',has(c.legal.cgv)&&has(c.legal.privacy)],['Informations légales du vendeur',c.seller.name&&c.seller.address],
 ['Prestataire de paiement autorisé (confirmations écrites)',providerOK()],['Paiement intégré et vérifié',PAY_ACTIVE]
].map(([l,ok])=>({l,ok:!!ok}))}
function readyHTML(){const l=checks(),d=l.filter(x=>x.ok).length;return `<p style="margin-top:22px"><b>${d}/${l.length}</b> points prêts pour l’ouverture</p><div class="mtr"><span style="width:${Math.round(d/l.length*100)}%"></span></div><ul class="ready">${l.map(x=>`<li class="${x.ok?'ok':''}">${x.ok?ic('check'):'<i></i>'}<span>${x.l}</span></li>`).join('')}</ul>`}
const F=(l,p,o={})=>{const v=getP(cfg,p),id='f-'+p.replace(/\W/g,'-'),h=o.hint?`<p class="hint">${o.hint}</p>`:'';
 if(o.type==='check')return `<label class="ck"><input type="checkbox" id="${id}" data-p="${p}"${v?' checked':''}><span>${l}</span></label>`;
 if(o.type==='area')return `<div class="fl"><label for="${id}">${l}</label><textarea id="${id}" data-p="${p}" rows="${o.rows||4}" placeholder="${esc(o.ph||'')}">${esc(v)}</textarea>${h}</div>`;
 if(o.type==='select')return `<div class="fl"><label for="${id}">${l}</label><select id="${id}" data-p="${p}">${o.opts.map(([val,t])=>`<option value="${esc(val)}"${String(v)===val?' selected':''}>${esc(t)}</option>`).join('')}</select>${h}</div>`;
 return `<div class="fl"><label for="${id}">${l}</label><input id="${id}" data-p="${p}" type="${o.type==='tel'?'tel':o.type==='email'?'email':'text'}"${o.num?' inputmode="decimal"':''} value="${esc(v)}" placeholder="${esc(o.ph||'')}">${h}</div>`};
const ASECS=[['boutique','Boutique'],['produit','Produit et prix'],['livraison','Livraison'],['service','Service client'],['vendeur','Vendeur'],['carac','Caractéristiques'],['avis','Avis clients'],['photos','Photos'],['paiement','Paiement'],['legal','Textes légaux'],['outils','Test et export']];
const rowEd=(arr,i,x,lbl)=>`<div class="rw"><input type="text" data-arr="${arr}" data-i="${i}" data-f="v" value="${esc(x.v)}" aria-label="${lbl}"><label class="ck"><input type="checkbox" data-arr="${arr}" data-i="${i}" data-f="ok"${x.ok?' checked':''}>Publié</label><button class="btn sec sm" data-act="adel" data-arr="${arr}" data-i="${i}">Retirer</button></div>`;
function pgAdmin(){
 if(!OWNER)return `<section class="band"><div class="wrap narrow"><h1>Espace réservé</h1><p class="lead" style="margin-top:12px">L’administration de la boutique est réservée à son propriétaire.</p><p style="margin-top:24px"><a class="btn" href="#">Retour à la boutique</a></p></div></section>`;
 const c=cfg,chariow=/chariow/i.test(c.pay.provider);
 const where=DB?(dbState==='err'?'<p class="warnline">Configuration partagée injoignable : les modifications risquent de ne pas être enregistrées.</p>':''):'<p class="warnline">Aperçu local : les modifications sont enregistrées dans ce navigateur uniquement.</p>';
 return `<section class="band"><div class="adm"><aside class="aside"><h1 style="font-size:34px">Administration</h1><p class="small mute" style="margin-top:10px">Seules les informations complétées apparaissent sur la boutique. Rien n’est inventé à votre place.</p><div id="ready">${readyHTML()}</div><nav class="anav" aria-label="Sections">${ASECS.map(([id,t])=>`<button class="lnk" data-go="a-${id}">${t}</button>`).join('')}</nav></aside>
<div>${where}
<div class="asec" id="a-boutique"><h2>Boutique</h2><div class="grid2">${F('Nom de la boutique','shop.name')}${F('Phrase d’accroche (pied de page)','shop.tagline')}</div>${F('Je valide ce nom pour l’ouverture','shop.confirmed',{type:'check'})}<p class="hint">« Kontinu » est une proposition : remplacez-le par le nom retenu.</p></div>
<div class="asec" id="a-produit"><h2>Produit et prix</h2>${F('Nom du produit','product.name')}<div class="grid2">${F('Marque','product.brand')}${F('Référence','product.ref')}${F('Prix de vente (XAF)','product.price',{num:1,ph:'Montant en FCFA'})}${F('Ancien prix barré (XAF, facultatif)','product.compare',{num:1,hint:'Uniquement s’il s’agit d’un prix réellement pratiqué auparavant.'})}${F('Quantité maximale par commande','product.maxQty',{num:1})}</div>${F('Accroche sous le titre','product.pitch',{type:'area',rows:2})}</div>
<div class="asec" id="a-livraison"><h2>Livraison</h2><p class="hint" style="margin-top:8px">La boutique ne mentionne aucune destination : le client choisit son pays et sa ville à la commande, et ce mode n’apparaît que pour la destination indiquée ici.</p>
<div class="grid2">${F('Pays desservi','ship.country',{type:'select',opts:COUNTRIES.map(([k,n])=>[k,n])})}${F('Ville desservie','ship.city')}${F('Nom du mode de livraison','ship.method')}${F('Frais de livraison (XAF)','ship.fee',{num:1,ph:'0 si inclus'})}${F('Délai annoncé (jours)','ship.days',{num:1})}
${F('Type de jours','ship.type',{type:'select',opts:[['','À préciser'],['ouvrés','Jours ouvrés'],['calendaires','Jours calendaires']]})}${F('Point de départ du délai','ship.start',{type:'select',opts:[['','À préciser'],['paiement','Confirmation du paiement'],['expedition','Expédition de la commande']]})}${F('Point de retrait','ship.office')}${F('Adresse du point de retrait','ship.address')}${F('Délai possible (petits caractères)','ship.extra')}${F('Logo du point de retrait (chemin)','ship.logo')}</div>
${F('Consignes de retrait','ship.instructions',{type:'area',rows:3,ph:'Pièce d’identité, référence de commande, horaires…'})}${F('Contact à l’arrivée du colis','ship.contactBy',{type:'select',opts:[['','À préciser'],['par appel téléphonique','Appel téléphonique'],['par SMS','SMS'],['par WhatsApp','WhatsApp'],['par appel ou WhatsApp','Appel ou WhatsApp'],['par e-mail','E-mail']]})}</div>
<div class="asec" id="a-service"><h2>Service client</h2><div class="grid2">${F('WhatsApp','support.whatsapp',{type:'tel',ph:'Avec l’indicatif du pays'})}${F('Téléphone','support.phone',{type:'tel'})}${F('E-mail','support.email',{type:'email'})}${F('Horaires','support.hours')}</div></div>
<div class="asec" id="a-vendeur"><h2>Vendeur</h2><div class="grid2">${F('Raison sociale ou nom','seller.name')}${F('Forme juridique','seller.form')}${F('RCCM','seller.rccm')}${F('NIF','seller.nif')}${F('Adresse','seller.address')}${F('Représentant légal','seller.rep')}</div></div>
<div class="asec" id="a-carac"><h2>Caractéristiques</h2><p class="hint" style="margin-top:8px">Préremplies d’après la fiche du fabricant WGP UPS1202A. Décochez « Publié » si une valeur ne correspond pas aux unités reçues.</p>
${c.specs.map((s,i)=>`<div class="fl"><label for="sp-${i}">${esc(s.k)}</label><div class="rw" style="margin:0"><input type="text" id="sp-${i}" data-arr="specs" data-i="${i}" data-f="v" value="${esc(s.v)}"><label class="ck"><input type="checkbox" data-arr="specs" data-i="${i}" data-f="ok"${s.ok?' checked':''}>Publié</label></div></div>`).join('')}
<h3>Contenu de la boîte</h3>${c.box.map((x,i)=>rowEd('box',i,x,'Élément')).join('')}<button class="btn sec sm" style="margin-top:12px" data-act="aadd" data-arr="box">Ajouter un élément</button>
<h3>Étapes d’installation</h3>${c.steps.map((x,i)=>rowEd('steps',i,x,'Étape')).join('')}<button class="btn sec sm" style="margin-top:12px" data-act="aadd" data-arr="steps">Ajouter une étape</button></div>
<div class="asec" id="a-avis"><h2>Avis clients</h2><p class="warnline">Uniquement de vrais avis d’acheteurs, publiés avec leur accord. La section reste masquée tant qu’il n’y en a aucun.</p>
${c.reviews.map((r,i)=>`<div class="box2"><div class="grid2"><div class="fl" style="margin:0"><label>Prénom ou initiales</label><input type="text" data-arr="reviews" data-i="${i}" data-f="name" value="${esc(r.name)}"></div><div class="fl" style="margin:0"><label>Pays</label><select data-arr="reviews" data-i="${i}" data-f="country"><option value="">—</option>${COUNTRIES.map(([k,n])=>`<option value="${k}"${r.country===k?' selected':''}>${esc(n)}</option>`).join('')}</select></div><div class="fl" style="margin:0"><label>Note sur 5</label><select data-arr="reviews" data-i="${i}" data-f="rating">${[5,4,3,2,1].map(n=>`<option value="${n}"${String(r.rating)===String(n)?' selected':''}>${n}</option>`).join('')}</select></div><div class="fl" style="margin:0"><label>Date</label><input type="text" data-arr="reviews" data-i="${i}" data-f="date" value="${esc(r.date)}" placeholder="ex. mars 2027"></div></div><div class="fl" style="margin:0"><label>Avis</label><textarea rows="2" data-arr="reviews" data-i="${i}" data-f="text">${esc(r.text)}</textarea></div><div class="rw" style="margin:0"><label class="ck"><input type="checkbox" data-arr="reviews" data-i="${i}" data-f="verified"${r.verified?' checked':''}>Achat vérifié (commande retrouvée)</label><button class="btn sec sm" data-act="adel" data-arr="reviews" data-i="${i}">Retirer</button></div></div>`).join('')}
<button class="btn sec sm" style="margin-top:12px" data-act="aadd" data-arr="reviews">Ajouter un avis reçu</button></div>
<div class="asec" id="a-photos"><h2>Photos</h2><p class="hint" style="margin-top:8px">La boutique affiche les photos du fabricant. Ajoutez vos propres photos des unités reçues pour les remplacer.</p>
${ASSETS?'<label class="btn sec sm" for="upl" style="margin-top:14px">Ajouter des photos</label><input id="upl" type="file" accept="image/*" multiple hidden>':'<p class="warnline">Le téléversement est disponible depuis la page publiée de la boutique.</p>'}
<div class="phs">${c.photos.map((p,i)=>`<div class="ph"><img src="${blob(p.id)}" alt=""><input type="text" data-arr="photos" data-i="${i}" data-f="alt" value="${esc(p.alt)}" placeholder="Description" aria-label="Description de la photo"><button class="btn sec sm" data-act="adel" data-arr="photos" data-i="${i}">Retirer</button></div>`).join('')}</div></div>
<div class="asec" id="a-paiement"><h2>Paiement (carte et Mobile Money)</h2>${F('Prestataire de paiement','pay.provider',{ph:'Nom du prestataire retenu'})}
${chariow?'<p class="warnline">Chariow interdit la vente de produits physiques sur sa plateforme. Ne le retenez pas pour ce mini-onduleur sans accord écrit de Chariow.</p>':''}
${F('Confirmation écrite : la vente de produits physiques est autorisée','pay.physical',{type:'check'})}${F('Visa et Mastercard acceptées','pay.cards',{type:'check'})}${F('Airtel Money et Moov Money acceptés','pay.momo',{type:'check'})}${F('Encaissement autorisé pour une activité basée au Gabon','pay.gabon',{type:'check'})}
<p class="note">Paiement en ligne : non activé. L’activation demande le compte marchand et l’intégration de la page de paiement hébergée avec confirmation côté serveur.</p></div>
<div class="asec" id="a-legal"><h2>Textes légaux</h2>${F('Conditions générales de vente','legal.cgv',{type:'area',rows:6})}${F('Politique de confidentialité','legal.privacy',{type:'area',rows:5})}${F('Retours et échanges','legal.returns',{type:'area',rows:4})}${F('Garantie','warranty.v',{type:'area',rows:3,ph:'Durée et conditions'})}${F('Résumé de la garantie (fiche produit)','warranty.short')}${F('Publier la garantie','warranty.ok',{type:'check'})}${F('Traitement des réclamations','legal.claims',{type:'area',rows:3})}</div>
<div class="asec" id="a-outils"><h2>Test et export</h2>${F('Afficher le simulateur de paiement (visible uniquement par vous)','test.enabled',{type:'check'})}
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="btn sec sm" data-act="export">Copier la configuration</button>${LOCAL?'<button class="btn sec sm" data-act="resetlocal">Effacer l’aperçu local</button>':''}</div>${showJson?`<textarea class="jsonbox" readonly aria-label="Configuration">${esc(JSON.stringify(cfg,null,2))}</textarea>`:''}</div>
<div class="savebar"><span id="savest">${dirty?'Modifications non enregistrées':'Tout est enregistré'}</span><button class="btn sec sm" data-act="cancel"${dirty?'':' disabled'}>Annuler</button><button class="btn sm" data-act="save"${dirty?'':' disabled'}>Enregistrer</button></div>
</div></div></section>`}

/* ---------- Habillage, routage ---------- */
const PAGES={commande:pgCheckout,'paiement-confirme':()=>pgRes('confirme'),'paiement-refuse':()=>pgRes('refuse'),'paiement-annule':()=>pgRes('annule'),'paiement-attente':()=>pgRes('attente'),cgv:()=>pgLegal('cgv'),confidentialite:()=>pgLegal('confidentialite'),retours:()=>pgLegal('retours'),garantie:()=>pgLegal('garantie'),reclamations:()=>pgLegal('reclamations'),livraison:pgShipping,vendeur:pgSeller,admin:pgAdmin};
const route=()=>{const h=decodeURIComponent(location.hash.slice(1));return PAGES[h]?{p:h}:{p:'',a:h==='panier'?'':h,cart:h==='panier'}};
function chrome(){const n=cfg.shop.name||'Boutique';$('#brand').textContent=n;
 const cn=$('#cartn');cn.textContent=cart.qty;cn.hidden=!cart.qty;
 $('#ann').innerHTML=`<span>${PAY_ACTIVE?'Paiement par Mobile Money':'Ouverture des commandes très prochainement'}</span><span>Livraison calculée selon votre adresse</span><span>Aide à la compatibilité avant achat</span>`;
 const miss=checks().filter(x=>!x.ok).length;
 $('#obar').innerHTML=OWNER?`<div class="obar"><div><span class="dot"></span><b>Aperçu propriétaire</b><span>${miss} point${miss>1?'s':''} à compléter avant l’ouverture${dbState==='slow'?' · configuration partagée lente à répondre':''}</span><a href="#admin">Ouvrir l’administration</a></div></div>`:'';
 $('#foot').innerHTML=`<div class="fgrid"><div><a class="logo" href="#">${$('.logo svg').outerHTML}<span>${esc(n)}</span></a><p style="margin-top:14px;max-width:24em">${esc(cfg.shop.tagline)}.</p></div>
<div><h3>Boutique</h3><ul><li><a href="#produit">Le produit</a></li><li><a href="#autonomie">Autonomie</a></li><li><a href="#compatibilite">Compatibilité</a></li><li><a href="#questions">Questions fréquentes</a></li></ul></div>
<div><h3>Informations</h3><ul>${LEGALS.map(([h,t])=>`<li><a href="#${h}">${t}</a></li>`).join('')}</ul></div>
<div><h3>Service client</h3><ul>${contacts().map(([k,v])=>`<li>${k} : ${v}</li>`).join('')||'<li>Coordonnées publiées à l’ouverture</li>'}<li><a href="#contact">Nous écrire</a></li></ul></div></div>
<div class="fbot"><span>Paiement par Mobile Money, sur la page sécurisée du prestataire. Aucun code Mobile Money n’est saisi ni conservé sur ce site.</span><span>© ${new Date().getFullYear()} ${esc(n)}</span></div>`;
 const I=imgs(),p=price();
 $('#sbar').innerHTML=`<img src="${I[0][0]}" alt=""><div><b>${esc(cfg.product.name)}</b>${p?fcfa(p):'Prix bientôt disponible'}</div><button class="btn sm" data-act="buy"${p?'':' disabled'}>Acheter</button>`;
 if(drawerOpen)$('#drawer').innerHTML=drawerHTML()}
function render(scroll){const r=route();$('#app').innerHTML=(PAGES[r.p]||pgHome)();chrome();
 $('#nav').classList.remove('open');$('.menu').setAttribute('aria-expanded','false');
 bindGallery();bindSbar();
 if(r.cart)openDrawer(true);
 if(scroll){const el=r.a&&document.getElementById(r.a);if(el)el.scrollIntoView();else window.scrollTo(0,0)}}
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),2600)};
const saveCart=()=>{LS.set('kt_cart',cart);chrome();if(route().p==='commande')refreshCheckout()};
function setOrder(o){order=o;LS.set('kt_order',o);if(o.status==='confirme'){cart.qty=0;LS.set('kt_cart',cart)}}
const mkRef=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return `CMD-${String(d.getFullYear()).slice(2)}${p(d.getMonth()+1)}${p(d.getDate())}-${Math.random().toString(36).slice(2,6).toUpperCase()}`};
function markDirty(){dirty=true;const r=$('#ready');if(r)r.innerHTML=readyHTML();const s=$('#savest');if(s){s.textContent='Modifications non enregistrées';document.querySelectorAll('[data-act=save],[data-act=cancel]').forEach(b=>b.disabled=false)}}
async function save(){const data=clone(cfg);
 if(DB){try{await DB.doc('store/config').set(data);remote=data;dirty=false;toast('Configuration enregistrée');render()}catch(e){toast('Échec de l’enregistrement'+(e&&e.code?' ('+e.code+')':''))}}
 else{LS.set('kt_cfg_local',data);dirty=false;toast('Enregistré dans ce navigateur');render()}}
function go(id){const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});else location.hash=id}
let gObs=null,sObs=null;
function setGi(i){gi=i;const n=imgs().length;const c=$('#gcount');if(c)c.textContent=`${i+1} / ${n}`;document.querySelectorAll('.thumbs button').forEach((b,j)=>b.setAttribute('aria-current',j===i));document.querySelectorAll('#dots i').forEach((d,j)=>d.classList.toggle('on',j===i))}
function bindGallery(){const gm=$('#gmain');if(!gm)return;if(gi)gm.scrollLeft=gi*gm.clientWidth;gm.onscroll=()=>{clearTimeout(gm._t);gm._t=setTimeout(()=>setGi(Math.round(gm.scrollLeft/gm.clientWidth)),60)}}
function bindSbar(){const h=$('.hero .hcta .btn'),b=$('#addbtn'),bar=$('#sbar');let show=false;if(h&&innerWidth<900&&h.getBoundingClientRect().bottom<0){const r=b?b.getBoundingClientRect():null;show=!(r&&r.bottom>0&&r.top<innerHeight)}bar.classList.toggle('on',show);bar.setAttribute('aria-hidden',!show);document.body.classList.toggle('hasbar',show)}
addEventListener('scroll',()=>{if(sObs)return;sObs=requestAnimationFrame(()=>{sObs=null;bindSbar()})},{passive:true});addEventListener('resize',bindSbar);
function gTo(i){const gm=$('#gmain');if(!gm)return;const n=gm.children.length;i=(i+n)%n;gm.scrollTo({left:i*gm.clientWidth,behavior:'smooth'});setGi(i)}
function validate(){const v=id=>($('#'+id)?.value||'').trim(),errs=[],mark=(id,bad)=>$('#'+id)?.setAttribute('aria-invalid',bad?'true':'false');
 const em=v('f_email'),ph=v('f_phone'),n=v('f_name');
 const eok=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);mark('f_email',!eok);if(!eok)errs.push('Indiquez une adresse e-mail valide.');
 const dg=ph.replace(/\D/g,'');mark('f_phone',dg.length<8);if(dg.length<8)errs.push('Indiquez un numéro de téléphone valide.');
 mark('f_country',!form.country);if(!form.country)errs.push('Choisissez votre pays.');
 mark('f_city',!has(form.f_city));if(!has(form.f_city))errs.push('Indiquez votre ville.');
 mark('f_name',n.length<3);if(n.length<3)errs.push('Indiquez votre nom complet.');
 if(form.country&&has(form.f_city)&&!shipOK())errs.push('Aucun mode de livraison n’est disponible pour cette adresse.');
 if(!$('#f_compat')?.checked)errs.push('Confirmez avoir vérifié la compatibilité.');
 if(!$('#f_cgv')?.checked)errs.push('Acceptez les conditions générales de vente.');
 return errs}

document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){e.preventDefault();go(g.dataset.go);return}
 const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
 if(a==='menu'){const o=$('#nav').classList.toggle('open');b.setAttribute('aria-expanded',o)}
 else if(a==='cart'){openDrawer(true)}
 else if(a==='close'){openDrawer(false)}
 else if(a==='flow'){flowS=b.dataset.k;$('#flow').innerHTML=flowHTML();document.querySelectorAll('[data-act=flow]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.k===flowS))}
 else if(a==='preset'){auto={w:b.dataset.w,p:b.dataset.k};$('#aw').value=auto.w;$('#ares').innerHTML=autoRes();document.querySelectorAll('[data-act=preset]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.k===auto.p))}
 else if(a==='sq'){selQty=Math.min(maxQ(),Math.max(1,selQty+ +b.dataset.d));$('#selq').textContent=selQty}
 else if(a==='add'||a==='buy'){if(!price())return;cart.qty=Math.min(maxQ(),(a==='buy'?0:cart.qty)+selQty);saveCart();if(a==='buy'){openDrawer(false);location.hash='commande'}else openDrawer(true)}
 else if(a==='cq'){cart.qty=Math.min(maxQ(),Math.max(1,cart.qty+ +b.dataset.d));saveCart()}
 else if(a==='crm'){cart.qty=0;saveCart()}
 else if(a==='gto')gTo(+b.dataset.i);
 else if(a==='gstep')gTo(gi+ +b.dataset.d);
 else if(a==='simto'){if(order&&order.test){setOrder({...order,status:b.dataset.s});location.hash='paiement-'+b.dataset.s}}
 else if(a==='refresh'){if(order&&order.session)checkPay(true);else{toast('Statut inchangé : toujours en attente');render()}}
 else if(a==='aadd'){const arr=b.dataset.arr;cfg[arr].push(arr==='reviews'?{name:'',country:'',rating:'5',date:'',text:'',verified:false}:{v:'',ok:true});markDirty();render()}
 else if(a==='adel'){cfg[b.dataset.arr].splice(+b.dataset.i,1);markDirty();render()}
 else if(a==='save')save();
 else if(a==='cancel'){cfg=LOCAL?merge(DEF,LS.get('kt_cfg_local',null)):merge(DEF,remote);dirty=false;render();toast('Modifications annulées')}
 else if(a==='export'){const t=JSON.stringify(cfg,null,2);const done=()=>toast('Configuration copiée'),fail=()=>{showJson=true;render()};try{navigator.clipboard.writeText(t).then(done,fail)}catch(err){fail()}}
 else if(a==='resetlocal'){LS.set('kt_cfg_local',null);cfg=merge(DEF,null);dirty=false;render();toast('Aperçu local effacé')}
});
function onField(e){const t=e.target;
 if(t.dataset.p){setP(cfg,t.dataset.p,t.type==='checkbox'?t.checked:t.value);markDirty();if(t.dataset.p==='pay.provider'&&e.type==='change')render();return}
 if(t.dataset.arr){const it=cfg[t.dataset.arr]?.[+t.dataset.i];if(it){it[t.dataset.f]=t.type==='checkbox'?t.checked:t.value;markDirty()}return}
 if(t.id==='aw'){auto={w:t.value,p:''};$('#ares').innerHTML=autoRes();document.querySelectorAll('[data-act=preset]').forEach(x=>x.setAttribute('aria-pressed','false'));return}
 if(t.id==='cv'||t.id==='ca'||t.id==='cc'){compatV={v:$('#cv').value,a:$('#ca').value,c:$('#cc').value};$('#cres').innerHTML=compatRes();return}
 if(t.name==='pm'&&t.closest('#coform')){form.pm=t.value;LS.set('kt_form2',form);document.querySelectorAll('.pm').forEach(l=>l.classList.toggle('sel',l.querySelector('input').checked));return}
 if(t.closest('#coform')&&t.id&&t.id!=='simres'){t.removeAttribute('aria-invalid');const fe=$('#ferr');if(fe)fe.textContent='';
  const key=t.id==='f_country'?'country':t.id;form[key]=t.type==='checkbox'?t.checked:t.value;LS.set('kt_form2',form);
  if(t.id==='f_country'||t.id==='f_city')refreshCheckout()}}
document.addEventListener('input',onField);document.addEventListener('change',onField);
document.addEventListener('change',async e=>{if(e.target.id!=='upl'||!ASSETS)return;const fs=[...e.target.files].filter(f=>f.type.startsWith('image/'));
 for(const f of fs){try{const r=await ASSETS.upload(f);cfg.photos.push({id:String(r.id),alt:''});markDirty()}catch(err){toast('Échec du téléversement d’une photo')}}
 render();if(fs.length)toast('Photos ajoutées : pensez à enregistrer')});
document.addEventListener('submit',e=>{if(e.target.id!=='coform')return;e.preventDefault();
 const errs=validate();$('#ferr').textContent=errs.join(' ');if(errs.length)return;
 const p=price(),f=fee(),q=cart.qty;if(!(p&&f!==null&&q&&shipOK()))return;
 const o={ref:mkRef(),qty:q,unit:p,fee:f,total:p*q+f,name:$('#f_name').value.trim(),phone:$('#f_phone').value.trim(),email:$('#f_email').value.trim(),country:form.country,city:form.f_city,pm:'momo',at:new Date().toISOString(),status:'attente'};
 if(PAY_ACTIVE){if(payBusy)return;payBusy=true;refreshCheckout();
   fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({qty:o.qty,name:o.name,phone:o.phone,email:o.email,country:o.country,city:o.city,pm:o.pm})})
   .then(r=>r.json().then(j=>({ok:r.ok,j}))).then(({ok,j})=>{if(!ok||!j.url)throw new Error(j.error||'Le paiement n’a pas pu être lancé. Réessayez dans un instant.');
    setOrder({...o,ref:j.ref,total:j.total,session:j.session,live:true,test:!!j.test,status:'attente'});location.href=j.url})
   .catch(err=>{payBusy=false;refreshCheckout();const fe=$('#ferr');if(fe)fe.textContent=err.message||'Le paiement n’a pas pu être lancé.'});return}
 if(!(OWNER&&cfg.test.enabled))return;
 o.test=true;o.status=$('#simres').value;setOrder(o);location.hash='paiement-'+o.status});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawerOpen)openDrawer(false);if(e.target.id==='gmain'&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();gTo(gi+(e.key==='ArrowRight'?1:-1))}});
window.addEventListener('hashchange',()=>{openDrawer(false);render(true)});

/* ---------- Paiement en ligne (SasPay, via les fonctions serveur /api) ---------- */
let pollN=0,pollT=null;
async function checkPay(manual){const o=order;if(!o||!o.session||o.status!=='attente')return;
 try{const r=await fetch('/api/status?session='+encodeURIComponent(o.session),{cache:'no-store'});const j=await r.json();
  if(r.ok&&j.status&&j.status!=='attente'){setOrder({...o,status:j.status});location.hash='paiement-'+j.status;return}
  if(manual)toast('Paiement toujours en attente de confirmation')}catch(e){if(manual)toast('Vérification impossible pour le moment')}
 clearTimeout(pollT);if(!manual&&route().p==='paiement-attente'&&++pollN<40)pollT=setTimeout(checkPay,5000)}
(async()=>{try{const u=new URL(location.href),t=u.searchParams.get('paytest');
  if(t!==null){LS.set('kt_paytest',t==='1'?1:0);u.searchParams.delete('paytest');history.replaceState(null,'',u.pathname+u.search+u.hash)}
  if(!/^https?:$/.test(location.protocol)||window.claude)return;
  const r=await fetch('/api/config',{cache:'no-store'});if(!r.ok)return;const j=await r.json();
  PAY_TEST=!!j.test;PAY_PRIV=!!j.active&&!j.open;PAY_ACTIVE=!!j.active&&(!!j.open||LS.get('kt_paytest',0)===1);
  if(PAY_ACTIVE)render();if(order&&order.session&&order.status==='attente'&&route().p==='paiement-attente')checkPay()}catch(e){}})();
window.addEventListener('hashchange',()=>{if(order&&order.session&&order.status==='attente'&&route().p==='paiement-attente'){pollN=0;checkPay()}});

/* ---------- Démarrage et données partagées ---------- */
render(true);
(async()=>{const C=window.claude;if(!C||typeof C.use!=='function')return;
 try{const[u,d,a]=await Promise.all([C.use('user'),C.use('db'),C.use('assets')]);USER=u;DB=d;ASSETS=a}catch(e){}
 try{if(USER&&!LOCAL)OWNER=!!(await USER.isOwner())}catch(e){}
 if(LOCAL)DB=null;
 if(DB){dbState='loading';const t=setTimeout(()=>{if(dbState==='loading'){dbState='slow';chrome()}},10000);
  try{DB.doc('store/config').onSnapshot(s=>{if(!s.metadata.fromCache)clearTimeout(t);dbState='ok';remote=s.exists?clone(s.data()):null;if(!dirty){cfg=merge(DEF,remote);render()}},()=>{clearTimeout(t);dbState='err';render()})}catch(e){dbState='err'}}
 render()})();
}
