'use client'
import { useEffect, useState, useRef, useCallback } from 'react'

interface Delivery {
  id:string;vin:string;vehicle:string;customer:string;delivery_type:string
  status:string;assigned_to:string;submitted_by:string;charge_level:number
  location:string;customer_eta:string;blocker:string;customer_note:string
}
interface LS{stage:number;blocked:boolean;completed:boolean;flagged:boolean}
interface IngressItem{
  id:string;vin:string;status:'awaiting'|'inbounded';inspector:string
  miles:number;extColor:string;intColor:string;keys:number;charge:number
  charger:string;lights:string;damage:string;photos:number
}
interface ShuttleTrip{
  id:string;vehicle:string;vin:string;from:string;to:string
  tripType:'drop-off'|'pickup'|'both';status:'pending'|'en-route'|'complete';assignedTo:string
}
interface TeamMember{
  id:string;initials:string;name:string;color:string;bg:string
  role:'inventory'|'ingress'|'shuttling';in:boolean
}

const STAGES=['REQ','RFS','PREP','RFD']
const SLABELS=['Requested','Ready for Sale','Prepped','Ready for Delivery']
const SMAP:Record<string,number>={requested:0,rfs:1,prepped:2,rfd:3,blocked:2}
const LOCATIONS=[
  {label:'HQ',emoji:'🏢'},{label:'Morris',emoji:'🅿️'},
  {label:'EA — Charging',emoji:'⚡'},{label:'OTW to EA',emoji:'🚗'},
  {label:'OTW to Detail',emoji:'🚗'},{label:'Staged at Detail',emoji:'✨'},
  {label:'In line — Car Wash',emoji:'🚿'},{label:'At Car Wash',emoji:'🫧'},
  {label:'OTW to HQ',emoji:'🚗'},
]
const CHARGES=[15,25,50,80,100]
const SHUTTLE_LABELS=['Pending','En Route','Complete']
const ROLE_ICONS:Record<string,string>={inventory:'📦',ingress:'🚛',shuttling:'🔄'}
const ROLE_COLORS:Record<string,string>={inventory:'#BF8BC6',ingress:'#5BC8F5',shuttling:'#5CCE8A'}
const ROLE_BGS:Record<string,string>={inventory:'#2A1535',ingress:'#0E2840',shuttling:'#0D2B1A'}
const ROLE_BORDERS:Record<string,string>={inventory:'#5C2B5E',ingress:'#1A4060',shuttling:'#1A4A2A'}

const INGRESS_MOCK:IngressItem[]=[
  {id:'i-001',vin:'P2961549',status:'awaiting',inspector:'Ace Venenciano',miles:12450,extColor:'Silver',intColor:'Black',keys:2,charge:45,charger:'Yes',lights:'None',damage:'',photos:0},
  {id:'i-002',vin:'SF052182',status:'awaiting',inspector:'Specialist 1',miles:8230,extColor:'White',intColor:'Gray',keys:1,charge:80,charger:'Yes',lights:'None',damage:'Minor scratch rear bumper',photos:3},
  {id:'i-003',vin:'RN044461',status:'inbounded',inspector:'Specialist 1',miles:5120,extColor:'Blue',intColor:'Black',keys:2,charge:65,charger:'Yes',lights:'None',damage:'',photos:7},
]
const SHUTTLE_MOCK:ShuttleTrip[]=[
  {id:'s-001',vehicle:'2023 Rivian R1T',vin:'PN027059',from:'HQ',to:'Roberts Tires',tripType:'drop-off',status:'en-route',assignedTo:'Ace Venenciano'},
  {id:'s-002',vehicle:'2022 Hyundai Ioniq 5',vin:'NF475840',from:'Hyundai San Bruno',to:'HQ',tripType:'pickup',status:'pending',assignedTo:'Ace Venenciano'},
  {id:'s-003',vehicle:'2024 Kia EV9',vin:'R6021953',from:'HQ',to:'AGN',tripType:'both',status:'pending',assignedTo:'Specialist 3'},
]
const TEAM_MOCK:TeamMember[]=[
  {id:'t-001',initials:'S1',name:'Specialist 1',color:'#5BC8F5',bg:'#0E2840',role:'ingress',in:true},
  {id:'t-002',initials:'AV',name:'Ace Venenciano',color:'#BF8BC6',bg:'#3F1B42',role:'shuttling',in:true},
  {id:'t-003',initials:'S2',name:'Specialist 2',color:'#5CCE8A',bg:'#0D2B1A',role:'shuttling',in:true},
  {id:'t-004',initials:'S3',name:'Specialist 3',color:'#ECB22E',bg:'#2B2010',role:'shuttling',in:true},
  {id:'t-005',initials:'S4',name:'Specialist 4',color:'#E8912D',bg:'#2B1810',role:'inventory',in:true},
  {id:'t-006',initials:'S5',name:'Specialist 5',color:'#BF8BC6',bg:'#3F1B42',role:'ingress',in:true},
  {id:'t-007',initials:'S6',name:'Specialist 6',color:'#5BC8F5',bg:'#0E2840',role:'inventory',in:true},
  {id:'t-008',initials:'S7',name:'Specialist 7',color:'#5CCE8A',bg:'#0D2B1A',role:'inventory',in:true},
  {id:'t-009',initials:'S8',name:'Specialist 8',color:'#888',bg:'#222529',role:'inventory',in:false},
  {id:'t-010',initials:'S9',name:'Specialist 9',color:'#888',bg:'#222529',role:'shuttling',in:false},
]

const S={
  purple:'#3F0E40',purpleDark:'#350D36',purpleLight:'#BF8BC6',purpleGlow:'rgba(124,48,133,0.2)',
  bg:'#1A1D1F',surface:'#222529',surface2:'#2C2D30',border:'#383C42',
  text:'#D1D2D3',textSub:'#9B9EA4',textMuted:'#696B6D',
  green:'#007A5A',greenBg:'#0D2B1A',greenBright:'#5CCE8A',
  blue:'#1D9BD1',blueBg:'#0E2840',red:'#E8525A',redBg:'#2B1215',
  amber:'#ECB22E',amberBg:'#2B2010',
}

export default function Home(){
  const [deliveries,setDeliveries]=useState<Delivery[]>([])
  const [loading,setLoading]=useState(true)
  const [role,setRole]=useState<'spec'|'adv'>('spec')
  const [activeTab,setActiveTab]=useState<'inventory'|'ingress'|'shuttling'>('inventory')
  const [assignedRole]=useState<'inventory'|'ingress'|'shuttling'>('inventory')
  const [inToday,setInToday]=useState(true)
  const [ls,setLs]=useState<Record<string,LS>>({})
  const [locations,setLocations]=useState<Record<string,string>>({})
  const [charges,setCharges]=useState<Record<string,number>>({})
  const [ingressItems,setIngressItems]=useState<IngressItem[]>(INGRESS_MOCK)
  const [ingressDamage,setIngressDamage]=useState<Record<string,string>>({})
  const [shuttleTrips,setShuttleTrips]=useState<ShuttleTrip[]>(SHUTTLE_MOCK)
  const [team,setTeam]=useState<TeamMember[]>(TEAM_MOCK)
  const [bottomSheet,setBottomSheet]=useState<{type:'loc'|'chg';cardId:string}|null>(null)
  const [toast,setToast]=useState<{msg:string;undo?:()=>void}|null>(null)
  const [comments,setComments]=useState<Record<string,{text:string;time:string}[]>>({})
  const [commentInputs,setCommentInputs]=useState<Record<string,string>>({})
  const [draggedId,setDraggedId]=useState<string|null>(null)
  const [dragOverRole,setDragOverRole]=useState<string|null>(null)
  const toastTimer=useRef<ReturnType<typeof setTimeout>>()

  useEffect(()=>{
    fetch('http://localhost:8080/deliveries')
      .then(r=>r.json())
      .then((data:Delivery[])=>{
        setDeliveries(data)
        const s:Record<string,LS>={};const loc:Record<string,string>={};const chg:Record<string,number>={}
        data.forEach(d=>{
          s[d.id]={stage:SMAP[d.status]??0,blocked:d.status==='blocked',completed:false,flagged:false}
          loc[d.id]=d.location;chg[d.id]=d.charge_level
        })
        setLs(s);setLocations(loc);setCharges(chg);setLoading(false)
      })
  },[])



  const showToast=useCallback((msg:string,undo?:()=>void)=>{
    clearTimeout(toastTimer.current);setToast({msg,undo})
    toastTimer.current=setTimeout(()=>setToast(null),4500)
  },[])

  const addComment=(id:string,text:string)=>{
    const time=new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})
    setComments(p=>({...p,[id]:[...(p[id]||[]),{text,time}]}))
  }
  const postComment=(id:string)=>{
    const val=commentInputs[id]?.trim();if(!val)return
    addComment(id,val);setCommentInputs(p=>({...p,[id]:''}))
  }

  // INVENTORY
  const upd=(id:string,patch:Partial<LS>)=>setLs(p=>({...p,[id]:{...p[id],...patch}}))
  const setStage=(id:string,idx:number)=>{const prev=ls[id];upd(id,{stage:idx,blocked:false});showToast('Stage → '+SLABELS[idx],()=>upd(id,prev))}
  const complete=(id:string,label:string)=>{upd(id,{completed:true});showToast('✅ '+label+' — Patrick notified')}
  const undoComplete=(id:string)=>{upd(id,{completed:false});showToast('↩ Marked incomplete')}
  const flag=(id:string)=>{const prev=ls[id]?.flagged;upd(id,{flagged:!prev});showToast(prev?'🚩 Flag removed':'🚩 Flagged — ops notified',prev?undefined:()=>upd(id,{flagged:false}))}
  const unblock=(id:string)=>{const prev=ls[id];upd(id,{blocked:false});showToast('✅ Unblocked',()=>upd(id,prev))}
  const openLoc=(id:string)=>setBottomSheet({type:'loc',cardId:id})
  const openChg=(id:string)=>setBottomSheet({type:'chg',cardId:id})
  const pickLoc=(id:string,label:string)=>{setLocations(p=>({...p,[id]:label}));addComment(id,'📍 '+label);setBottomSheet(null);showToast('📍 '+label)}
  const pickChg=(id:string,pct:number)=>{setCharges(p=>({...p,[id]:pct}));addComment(id,'⚡ Charge → '+pct+'%');setBottomSheet(null);showToast('⚡ '+pct+'%')}

  // INGRESS
  const markInbounded=(id:string)=>{
    setIngressItems(p=>p.map(i=>i.id===id?{...i,status:'inbounded'}:i))
    showToast('✅ Vehicle inbounded — passed to techs')
  }
  const addPhoto=(id:string)=>{
    setIngressItems(p=>p.map(i=>i.id===id?{...i,photos:i.photos+1}:i))
    showToast('📷 Photo added')
  }

  // SHUTTLE
  const advanceShuttle=(id:string)=>{
    setShuttleTrips(p=>p.map(t=>{
      if(t.id!==id)return t
      const stages=['pending','en-route','complete'] as const
      const idx=stages.indexOf(t.status)
      const next=stages[Math.min(idx+1,2)]
      showToast('Stage → '+SHUTTLE_LABELS[stages.indexOf(next)])
      return{...t,status:next}
    }))
  }

  // DRAG AND DROP
  const handleDragStart=(id:string)=>setDraggedId(id)
  const handleDragEnd=()=>{setDraggedId(null);setDragOverRole(null)}
  const handleDragOver=(r:string,e:React.DragEvent)=>{e.preventDefault();setDragOverRole(r)}
  const handleDragLeave=()=>setDragOverRole(null)
  const handleDrop=(r:'inventory'|'ingress'|'shuttling',e:React.DragEvent)=>{
    e.preventDefault()
    if(draggedId){
      const prev=team.find(m=>m.id===draggedId)
      const prevRole=prev?.role
      setTeam(p=>p.map(m=>m.id===draggedId?{...m,role:r}:m))
      showToast(ROLE_ICONS[r]+' '+r+' → '+prev?.name,()=>{
        if(prevRole) setTeam(p=>p.map(m=>m.id===draggedId?{...m,role:prevRole}:m))
      })
    }
    setDraggedId(null);setDragOverRole(null)
  }

  const autoAssign=()=>{
    const inMembers=team.filter(m=>m.in)
    const roles:('inventory'|'ingress'|'shuttling')[]=['ingress','inventory','shuttling','shuttling','inventory','ingress','inventory','shuttling']
    setTeam(p=>p.map((m,i)=>m.in?{...m,role:roles[i]||'inventory'}:m))
    showToast('✦ Auto-assigned '+inMembers.length+' specialists')
  }

  // HELPERS
  const dotStyle=(state:LS,idx:number)=>{
    if(idx<state.stage)return{bg:S.green,border:S.green,color:'#fff',shadow:'none'}
    if(idx===state.stage){
      if(state.blocked)return{bg:S.redBg,border:S.red,color:S.red,shadow:'0 0 0 3px rgba(232,82,90,.15)'}
      if(idx===3)return{bg:S.greenBg,border:S.greenBright,color:S.greenBright,shadow:'0 0 0 3px rgba(92,206,138,.15)'}
      return{bg:S.purpleDark,border:S.purpleLight,color:S.purpleLight,shadow:S.purpleGlow}
    }
    return{bg:S.surface2,border:S.border,color:S.textMuted,shadow:'none'}
  }
  const typeBadge=(t:string)=>{
    if(t==='ON-SITE')return{bg:'#2B1810',color:'#E8912D',border:'#5C3015'}
    if(t==='CARPOOL')return{bg:S.blueBg,color:S.blue,border:'#1A4060'}
    return{bg:S.amberBg,color:S.amber,border:'#4A3810'}
  }
  const chargeColor=(n:number)=>n<40?S.red:n<70?S.amber:S.greenBright
  const shuttleColor=(s:string)=>s==='complete'?S.greenBright:s==='en-route'?S.amber:S.textMuted

  if(loading)return(
    <div style={{background:S.bg,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
      <div style={{width:36,height:36,borderRadius:8,background:S.purple,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#fff'}}>E</div>
      <p style={{color:S.textMuted,fontSize:14}}>Loading Ever Dashboard…</p>
    </div>
  )

  // ── INVENTORY ────────────────────────────────────────────────────
  const inventoryView=(
    <div style={{maxWidth:520,margin:'0 auto',padding:'16px 14px 90px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,gap:12}}>
        <div>
          <p style={{color:'#fff',fontSize:20,fontWeight:700}}>Good evening, Ace 👋</p>
          <p style={{color:S.textMuted,fontSize:13,marginTop:4}}>{deliveries.length} active deliveries</p>
        </div>
        <button onClick={()=>setInToday(p=>!p)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 12px',borderRadius:20,cursor:'pointer',border:'1px solid '+(inToday?S.green:S.border),flexShrink:0,background:inToday?S.greenBg:S.surface2}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:inToday?S.greenBright:S.textMuted}}/>
          <span style={{fontSize:12,fontWeight:600,color:inToday?S.greenBright:S.textMuted}}>{inToday?'In today':'Off today'}</span>
        </button>
      </div>
      {deliveries.map(d=>{
        const state=ls[d.id];if(!state)return null
        const loc=locations[d.id]||d.location;const chg=charges[d.id]??d.charge_level
        const locObj=LOCATIONS.find(l=>l.label===loc);const tb=typeBadge(d.delivery_type)
        return(
          <div key={d.id} style={{background:S.surface,borderRadius:12,marginBottom:16,border:'1px solid '+(state.blocked?'#4A1520':S.border),borderLeft:'3px solid '+(state.blocked?S.red:state.stage===3?S.greenBright:S.purpleLight),position:'relative'}}>
            <div style={{padding:'12px 14px 10px',borderBottom:'1px solid '+S.surface2}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                <div><p style={{color:'#fff',fontSize:15,fontWeight:700}}>{d.vehicle}</p><p style={{color:S.textSub,fontSize:12,marginTop:2}}>{d.customer}</p></div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,flexShrink:0}}>
                  <span style={{...tb,fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:4,border:'1px solid '+tb.border}}>{d.delivery_type}</span>
                  {d.customer_eta&&<span style={{fontSize:11,color:S.textMuted}}>{d.customer_eta}</span>}
                </div>
              </div>
              <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
                <button onClick={()=>openLoc(d.id)} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,cursor:'pointer',background:S.surface2,border:'1px solid '+S.border,fontSize:12,fontWeight:500,color:S.text}}>
                  <span>{locObj?.emoji||'📍'}</span><span>{loc}</span><span style={{fontSize:9,color:S.textMuted}}>▾</span>
                </button>
                <button onClick={()=>openChg(d.id)} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,cursor:'pointer',background:S.surface2,border:'1px solid '+S.border,fontSize:12,fontWeight:600,color:chargeColor(chg)}}>
                  <span>⚡</span><span>{chg}%</span><span style={{fontSize:9,color:S.textMuted}}>▾</span>
                </button>
                <span style={{display:'flex',alignItems:'center',gap:4,padding:'4px 8px',fontSize:11,color:S.textMuted}}>👤 {d.assigned_to.split(' ')[0]}</span>
              </div>
            </div>
            <div style={{padding:'14px 14px 10px',borderBottom:'1px solid '+S.surface2}}>
              <p style={{fontSize:10,fontWeight:700,color:S.textMuted,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>Delivery stage — tap to update</p>
              <div style={{display:'flex',alignItems:'flex-start',overflowX:'auto',paddingBottom:4}}>
                {STAGES.map((abbr,i)=>{
                  const ds=dotStyle(state,i)
                  return(
                    <div key={i} style={{display:'flex',alignItems:'flex-start',flex:i<4?1:'initial'}}>
                      <button onClick={()=>setStage(d.id,i)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',padding:'0 3px',flexShrink:0}}>
                        <div style={{width:42,height:42,borderRadius:'50%',border:'2px solid '+ds.border,background:ds.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:ds.color,boxShadow:ds.shadow,transition:'all .2s'}}>{abbr}</div>
                        <span style={{fontSize:9,fontWeight:600,textAlign:'center',lineHeight:1.3,maxWidth:50,color:i<state.stage?S.greenBright:i===state.stage&&state.blocked?S.red:i===state.stage?S.purpleLight:S.textMuted}}>{SLABELS[i]}</span>
                      </button>
                      {i<4&&<div style={{flex:1,height:2,background:i<state.stage?S.green:S.surface2,marginTop:20,minWidth:6,transition:'background .2s'}}/>}
                    </div>
                  )
                })}
              </div>
            </div>
            {(state.blocked||d.customer_note)&&(
              <div style={{padding:'10px 14px 0'}}>
                {state.blocked&&<div style={{background:S.redBg,border:'1px solid #5A1520',borderRadius:8,padding:'9px 12px',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:12,color:'#FF6B75',fontWeight:600}}>🚫 {d.blocker||'Blocked'}</span>
                  <button onClick={()=>unblock(d.id)} style={{fontSize:11,fontWeight:700,color:S.textMuted,background:'none',border:'1px solid '+S.border,borderRadius:20,padding:'3px 10px',cursor:'pointer'}}>Unblock</button>
                </div>}
                {d.customer_note&&<div style={{background:S.amberBg,border:'1px solid #4A3810',borderRadius:8,padding:'8px 12px',marginBottom:8}}>
                  <span style={{fontSize:11,color:S.amber}}>💬 {d.customer_note}</span>
                </div>}
              </div>
            )}
            <div style={{padding:'10px 14px'}}>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>complete(d.id,d.vehicle+' — '+d.customer)} style={{flex:1,padding:'11px 0',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer',border:'none',background:S.green,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>✓ Mark complete</button>
                <button onClick={()=>flag(d.id)} style={{width:46,height:46,borderRadius:8,fontSize:18,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid '+(state.flagged?S.red:S.border),background:state.flagged?S.redBg:S.surface2}}>🚩</button>
              </div>
            </div>
            <div style={{borderTop:'1px solid '+S.surface2,padding:'10px 14px 12px'}}>
              <p style={{fontSize:10,fontWeight:700,color:S.textMuted,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>Thread</p>
              {(comments[d.id]||[]).map((c,i)=>(
                <div key={i} style={{display:'flex',gap:8,marginBottom:10,alignItems:'flex-start'}}>
                  <div style={{width:28,height:28,borderRadius:6,background:'#3F1B42',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:S.purpleLight,flexShrink:0}}>AV</div>
                  <div><div style={{display:'flex',alignItems:'baseline',gap:6}}><span style={{fontSize:13,fontWeight:700,color:'#fff'}}>Ace Venenciano</span><span style={{fontSize:11,color:S.textMuted}}>{c.time}</span></div>
                  <p style={{fontSize:13,color:S.text,marginTop:1,lineHeight:1.4}}>{c.text}</p></div>
                </div>
              ))}
              <div style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}>
                <input value={commentInputs[d.id]||''} onChange={e=>setCommentInputs(p=>({...p,[d.id]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&postComment(d.id)} placeholder="Update the thread…" style={{flex:1,background:S.surface2,border:'1px solid '+S.border,borderRadius:8,padding:'8px 12px',fontSize:13,color:S.text,outline:'none'}}/>
                <button onClick={()=>setCommentInputs(p=>({...p,[d.id]:'🚨 Need help — '+(p[d.id]||'')}))} style={{fontSize:16,background:'none',border:'none',cursor:'pointer'}}>🚩</button>
                <button onClick={()=>postComment(d.id)} style={{fontSize:13,fontWeight:700,color:S.purpleLight,background:'none',border:'none',cursor:'pointer'}}>Post</button>
              </div>
            </div>
            {state.completed&&(
              <div style={{position:'absolute',inset:0,background:'rgba(26,29,31,.92)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,borderRadius:12,backdropFilter:'blur(4px)'}}>
                <div style={{background:S.greenBg,border:'1px solid '+S.green,borderRadius:10,padding:'12px 24px',fontSize:14,fontWeight:700,color:S.greenBright}}>✓ Complete — Patrick notified</div>
                <button onClick={()=>undoComplete(d.id)} style={{fontSize:12,fontWeight:600,color:S.textMuted,background:'none',border:'1px solid '+S.border,borderRadius:20,padding:'6px 16px',cursor:'pointer'}}>↩ Undo</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  // ── INGRESS ──────────────────────────────────────────────────────
  const ingressView=(
    <div style={{maxWidth:520,margin:'0 auto',padding:'16px 14px 90px'}}>
      <p style={{color:'#fff',fontSize:20,fontWeight:700,marginBottom:4}}>Inbound Vehicles</p>
      <p style={{color:S.textMuted,fontSize:13,marginBottom:20}}>{ingressItems.filter(i=>i.status==='awaiting').length} awaiting · {ingressItems.filter(i=>i.status==='inbounded').length} inbounded</p>
      {ingressItems.map(item=>(
        <div key={item.id} style={{background:S.surface,borderRadius:12,marginBottom:14,border:'1px solid '+(item.status==='inbounded'?S.green:S.border),borderLeft:'3px solid '+(item.status==='inbounded'?S.greenBright:S.amber)}}>
          <div style={{padding:'12px 14px',borderBottom:'1px solid '+S.surface2}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div><p style={{color:'#fff',fontSize:13,fontWeight:700,fontFamily:'monospace'}}>VIN ••••{item.vin}</p><p style={{color:S.textSub,fontSize:12,marginTop:2}}>Inspector: {item.inspector}</p></div>
              <span style={{fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:20,background:item.status==='inbounded'?S.greenBg:S.amberBg,color:item.status==='inbounded'?S.greenBright:S.amber,border:'1px solid '+(item.status==='inbounded'?S.green:'#4A3810')}}>
                {item.status==='inbounded'?'Inbounded':'Awaiting Inbound'}
              </span>
            </div>
          </div>
          <div style={{padding:'12px 14px',borderBottom:'1px solid '+S.surface2}}>
            <p style={{fontSize:10,fontWeight:700,color:S.textMuted,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>Vehicle details</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 16px'}}>
              {[['Miles',item.miles.toLocaleString()],['Keys',String(item.keys)],['Ext. Color',item.extColor],['Int. Color',item.intColor],['Charge',item.charge+'%'],['Charger',item.charger],['Lights',item.lights]].map(([label,value])=>(
                <div key={label}><p style={{fontSize:10,color:S.textMuted,fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</p><p style={{fontSize:13,color:'#fff',fontWeight:500,marginTop:2}}>{value}</p></div>
              ))}
            </div>
            <div style={{marginTop:12}}>
              <p style={{fontSize:10,color:S.textMuted,fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>Transport Damage / Call Outs</p>
              <input value={ingressDamage[item.id]??item.damage} onChange={e=>setIngressDamage(p=>({...p,[item.id]:e.target.value}))} placeholder="None" style={{width:'100%',background:S.surface2,border:'1px solid '+S.border,borderRadius:8,padding:'8px 12px',fontSize:13,color:S.text,outline:'none'}}/>
            </div>
          </div>
          <div style={{padding:'12px 14px',borderBottom:'1px solid '+S.surface2}}>
            <p style={{fontSize:10,fontWeight:700,color:S.textMuted,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Photos — {item.photos}/5 min · tap + to add</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {[...Array(Math.max(item.photos,5))].map((_,i)=>(
                <div key={i} style={{width:56,height:56,borderRadius:8,background:i<item.photos?S.greenBg:S.surface2,border:'1px solid '+(i<item.photos?S.green:S.border),display:'flex',alignItems:'center',justifyContent:'center',fontSize:i<item.photos?16:20,cursor:i<item.photos?'default':'pointer'}} onClick={i>=item.photos?()=>addPhoto(item.id):undefined}>
                  {i<item.photos?'✓':'＋'}
                </div>
              ))}
            </div>
            <p style={{fontSize:11,color:S.textMuted,marginTop:8}}>Dash · Interior · Door sticker · Emissions · Exterior · Charger · Damage</p>
          </div>
          {item.status==='awaiting'&&(
            <div style={{padding:'12px 14px'}}>
              <button onClick={()=>markInbounded(item.id)} style={{width:'100%',padding:'12px 0',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer',border:'none',background:S.blue,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>🚛 Mark Inbounded</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  // ── SHUTTLING ────────────────────────────────────────────────────
  const shuttlingView=(
    <div style={{maxWidth:520,margin:'0 auto',padding:'16px 14px 90px'}}>
      <p style={{color:'#fff',fontSize:20,fontWeight:700,marginBottom:4}}>Shuttle Trips</p>
      <p style={{color:S.textMuted,fontSize:13,marginBottom:20}}>{shuttleTrips.filter(t=>t.status!=='complete').length} active · {shuttleTrips.filter(t=>t.status==='complete').length} complete</p>
      {shuttleTrips.map(trip=>{
        const stages=['pending','en-route','complete'] as const
        const idx=stages.indexOf(trip.status)
        const typeColor:{[k:string]:{bg:string;color:string;border:string}}={'drop-off':{bg:S.redBg,color:S.red,border:'#5A1520'},'pickup':{bg:S.greenBg,color:S.greenBright,border:S.green},'both':{bg:S.amberBg,color:S.amber,border:'#4A3810'}}
        const tc=typeColor[trip.tripType]
        return(
          <div key={trip.id} style={{background:S.surface,borderRadius:12,marginBottom:14,border:'1px solid '+(trip.status==='complete'?S.green:S.border),borderLeft:'3px solid '+(trip.status==='complete'?S.greenBright:trip.status==='en-route'?S.amber:S.textMuted)}}>
            <div style={{padding:'12px 14px',borderBottom:'1px solid '+S.surface2}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                <div><p style={{color:'#fff',fontSize:15,fontWeight:700}}>{trip.vehicle}</p><p style={{color:S.textSub,fontSize:12,marginTop:2}}>••••{trip.vin}</p></div>
                <span style={{...tc,fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:4,border:'1px solid '+tc.border,flexShrink:0}}>{trip.tripType}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>
                <span style={{fontSize:13,fontWeight:600,color:'#fff',background:S.surface2,padding:'5px 10px',borderRadius:6}}>{trip.from}</span>
                <span style={{color:S.textMuted,fontSize:16}}>→</span>
                <span style={{fontSize:13,fontWeight:600,color:S.purpleLight,background:S.purpleDark,padding:'5px 10px',borderRadius:6}}>{trip.to}</span>
              </div>
            </div>
            <div style={{padding:'12px 14px',borderBottom:'1px solid '+S.surface2}}>
              <div style={{display:'flex',alignItems:'center',gap:0}}>
                {stages.map((s,i)=>(
                  <div key={s} style={{display:'flex',alignItems:'center',flex:i<2?1:'initial'}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                      <div style={{width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,border:'2px solid '+(i<idx?S.green:i===idx?shuttleColor(trip.status):S.border),background:i<idx?S.green:i===idx?(trip.status==='complete'?S.greenBg:trip.status==='en-route'?S.amberBg:S.surface2):S.surface2,transition:'all .2s'}}>
                        {i<idx?'✓':i===0?'⏳':i===1?'🚗':'🏁'}
                      </div>
                      <span style={{fontSize:9,fontWeight:600,color:i<=idx?shuttleColor(trip.status):S.textMuted,textAlign:'center'}}>{SHUTTLE_LABELS[i]}</span>
                    </div>
                    {i<2&&<div style={{flex:1,height:2,background:i<idx?S.green:S.surface2,marginBottom:18,minWidth:12,transition:'background .2s'}}/>}
                  </div>
                ))}
              </div>
            </div>
            {trip.status!=='complete'&&(
              <div style={{padding:'10px 14px',display:'flex',gap:8}}>
                <button onClick={()=>advanceShuttle(trip.id)} style={{flex:1,padding:'11px 0',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',border:'none',background:trip.status==='en-route'?S.green:S.amber,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  {trip.status==='pending'?'🚗 Start trip':'✓ Mark complete'}
                </button>
                <button onClick={()=>showToast('🚩 Flagged — ops notified')} style={{width:46,height:46,borderRadius:8,fontSize:18,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid '+S.border,background:S.surface2}}>🚩</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  // ── ADVISOR — DRAG & DROP ────────────────────────────────────────
  const teamIn=team.filter(m=>m.in)
  const teamOut=team.filter(m=>!m.in)
  const advisorView=(
    <div style={{display:'flex',alignItems:'flex-start',gap:0}}>

      {/* LEFT — role drop zones, scrolls freely */}
      <div style={{flex:1,padding:'16px 12px 60px 16px',display:'flex',flexDirection:'column',gap:12,minWidth:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
          <div>
            <p style={{color:'#fff',fontSize:18,fontWeight:700}}>Role Assignment</p>
            <p style={{color:S.textMuted,fontSize:12,marginTop:3}}>Drag specialists from the panel to assign</p>
          </div>
          <button onClick={autoAssign} style={{padding:'8px 14px',borderRadius:8,fontSize:13,fontWeight:700,border:'none',cursor:'pointer',background:S.purpleLight,color:'#1A1D1F',flexShrink:0}}>✦ Auto-assign</button>
        </div>

        {(['ingress','inventory','shuttling'] as const).map(rk=>{
          const assigned=team.filter(m=>m.role===rk&&m.in)
          const isOver=dragOverRole===rk
          const taskCount=rk==='inventory'?deliveries.length:rk==='ingress'?ingressItems.filter(i=>i.status==='awaiting').length:shuttleTrips.filter(t=>t.status!=='complete').length
          return(
            <div key={rk}
              onDragOver={e=>handleDragOver(rk,e)}
              onDragLeave={handleDragLeave}
              onDrop={e=>handleDrop(rk,e)}
              style={{background:isOver?ROLE_BGS[rk]:S.surface,borderRadius:12,border:'2px solid '+(isOver?ROLE_COLORS[rk]:S.border),transition:'all .15s',overflow:'hidden'}}
            >
              {/* Role header */}
              <div style={{background:ROLE_BGS[rk],padding:'10px 14px',borderBottom:'1px solid '+(isOver?ROLE_COLORS[rk]:S.border),display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:20}}>{ROLE_ICONS[rk]}</span>
                <div style={{flex:1}}>
                  <p style={{color:ROLE_COLORS[rk],fontSize:14,fontWeight:700,textTransform:'capitalize'}}>{rk}</p>
                  <p style={{color:S.textMuted,fontSize:11,marginTop:1}}>{taskCount} active task{taskCount!==1?'s':''}</p>
                </div>
                <span style={{fontSize:11,fontWeight:600,color:S.textMuted,background:S.surface2,padding:'2px 8px',borderRadius:20}}>{assigned.length} assigned</span>
              </div>

              {/* Assigned member chips */}
              <div style={{padding:'10px 12px 8px',minHeight:70,display:'flex',flexWrap:'wrap',gap:8,alignItems:'flex-start',alignContent:'flex-start'}}>
                {assigned.map(m=>(
                  <div key={m.id} draggable
                    onDragStart={()=>handleDragStart(m.id)}
                    onDragEnd={handleDragEnd}
                    style={{display:'flex',alignItems:'center',gap:7,background:m.bg,border:'1px solid '+ROLE_BORDERS[rk],borderRadius:8,padding:'6px 10px',cursor:'grab',opacity:draggedId===m.id?0.4:1,transition:'opacity .15s'}}
                  >
                    <div style={{width:24,height:24,borderRadius:6,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:m.color,flexShrink:0}}>{m.initials}</div>
                    <span style={{fontSize:13,fontWeight:600,color:'#fff',whiteSpace:'nowrap'}}>{m.name}</span>
                    <span style={{fontSize:10,color:S.textMuted,cursor:'default'}}>⠿</span>
                  </div>
                ))}
                {assigned.length===0&&!isOver&&(
                  <p style={{color:S.textMuted,fontSize:12,padding:'8px 4px',fontStyle:'italic'}}>Drop specialists here to assign</p>
                )}
                {isOver&&draggedId&&(
                  <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.05)',border:'2px dashed '+ROLE_COLORS[rk],borderRadius:8,padding:'6px 12px'}}>
                    <span style={{fontSize:12,color:ROLE_COLORS[rk],fontWeight:600}}>Drop to assign {rk}</span>
                  </div>
                )}
              </div>

              {/* Task list — always visible */}
              {rk==='inventory'&&deliveries.length>0&&(
                <div style={{borderTop:'2px solid '+S.border,marginTop:4}}>
                  <div style={{padding:'8px 14px 6px',display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(0,0,0,0.15)'}}>
                    <span style={{fontSize:11,fontWeight:700,color:S.purpleLight,textTransform:'uppercase',letterSpacing:'.06em'}}>📦 Deliveries</span>
                    <span style={{fontSize:11,fontWeight:600,color:S.textMuted,background:S.surface2,padding:'2px 8px',borderRadius:20}}>{deliveries.filter(d=>ls[d.id]?.completed).length}/{deliveries.length} complete</span>
                  </div>
                  {deliveries.map(d=>{
                    const state=ls[d.id];const chg=charges[d.id]??d.charge_level;const loc=locations[d.id]||d.location
                    return(
                      <div key={d.id} style={{padding:'10px 12px',borderTop:'1px solid '+S.surface2,opacity:state?.completed?0.45:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                          <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:state?.blocked?S.redBg:state?.stage===3?S.greenBg:S.purpleDark,color:state?.blocked?S.red:state?.stage===3?S.greenBright:S.purpleLight,flexShrink:0}}>{state?.blocked?'BLOCKED':state?.stage===3?'RFD':STAGES[state?.stage??0]}</span>
                          <span style={{flex:1,fontSize:13,color:'#fff',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{d.vehicle}</span>
                          {state?.completed&&<span style={{fontSize:11,color:S.greenBright,flexShrink:0}}>✓</span>}
                        </div>
                        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                          <span style={{fontSize:11,color:S.textSub}}>{d.customer}</span>
                          <span style={{fontSize:11,color:chargeColor(chg)}}>⚡{chg}%</span>
                          <span style={{fontSize:11,color:S.textMuted}}>📍{loc}</span>
                          {d.customer_eta&&<span style={{fontSize:11,color:S.textMuted}}>🕐{d.customer_eta}</span>}
                          {state?.flagged&&<span style={{fontSize:11,color:S.red}}>🚩 Flagged</span>}
                          {state?.blocked&&<span style={{fontSize:11,color:S.red}}>🚫 {d.blocker}</span>}
                        </div>
                        <div style={{display:'flex',gap:0,marginTop:8}}>
                          {STAGES.map((s,i)=>(
                            <div key={i} style={{flex:i<4?1:'initial',display:'flex',alignItems:'center'}}>
                              <div style={{width:8,height:8,borderRadius:'50%',background:i<(state?.stage??0)?S.green:i===(state?.stage??0)&&state?.blocked?S.red:i===(state?.stage??0)?S.purpleLight:S.border,flexShrink:0}}/>
                              {i<4&&<div style={{flex:1,height:1.5,background:i<(state?.stage??0)?S.green:S.border}}/>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {rk==='ingress'&&(
                <div style={{borderTop:'2px solid '+S.border,marginTop:4}}>
                  <div style={{padding:'8px 14px 6px',display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(0,0,0,0.15)'}}>
                    <span style={{fontSize:11,fontWeight:700,color:'#5BC8F5',textTransform:'uppercase',letterSpacing:'.06em'}}>🚛 Inbound vehicles</span>
                    <span style={{fontSize:11,fontWeight:600,color:S.textMuted,background:S.surface2,padding:'2px 8px',borderRadius:20}}>{ingressItems.filter(i=>i.status==='inbounded').length}/{ingressItems.length} inbounded</span>
                  </div>
                  {ingressItems.map(i=>(
                    <div key={i.id} style={{padding:'10px 12px',borderTop:'1px solid '+S.surface2,opacity:i.status==='inbounded'?0.55:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                        <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:i.status==='inbounded'?S.greenBg:S.amberBg,color:i.status==='inbounded'?S.greenBright:S.amber,flexShrink:0}}>{i.status==='inbounded'?'INBOUNDED':'AWAITING'}</span>
                        <span style={{flex:1,fontSize:13,color:'#fff',fontWeight:600,fontFamily:'monospace'}}>••••{i.vin}</span>
                      </div>
                      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                        <span style={{fontSize:11,color:S.textSub}}>👤 {i.inspector}</span>
                        <span style={{fontSize:11,color:chargeColor(i.charge)}}>⚡{i.charge}%</span>
                        <span style={{fontSize:11,color:i.photos>=5?S.greenBright:S.amber}}>📷 {i.photos}/5 photos</span>
                        <span style={{fontSize:11,color:S.textMuted}}>{i.extColor} / {i.intColor}</span>
                        {i.damage&&<span style={{fontSize:11,color:S.red}}>⚠ {i.damage}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {rk==='shuttling'&&(
                <div style={{borderTop:'2px solid '+S.border,marginTop:4}}>
                  <div style={{padding:'8px 14px 6px',display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(0,0,0,0.15)'}}>
                    <span style={{fontSize:11,fontWeight:700,color:'#5CCE8A',textTransform:'uppercase',letterSpacing:'.06em'}}>🔄 Shuttle trips</span>
                    <span style={{fontSize:11,fontWeight:600,color:S.textMuted,background:S.surface2,padding:'2px 8px',borderRadius:20}}>{shuttleTrips.filter(t=>t.status==='complete').length}/{shuttleTrips.length} complete</span>
                  </div>
                  {shuttleTrips.map(t=>(
                    <div key={t.id} style={{padding:'10px 12px',borderTop:'1px solid '+S.surface2,opacity:t.status==='complete'?0.45:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                        <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:4,background:t.status==='complete'?S.greenBg:t.status==='en-route'?S.amberBg:S.surface2,color:t.status==='complete'?S.greenBright:t.status==='en-route'?S.amber:S.textMuted,flexShrink:0}}>{t.status==='complete'?'COMPLETE':t.status==='en-route'?'EN ROUTE':'PENDING'}</span>
                        <span style={{flex:1,fontSize:13,color:'#fff',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.vehicle}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:11,color:S.textSub,background:S.surface2,padding:'3px 8px',borderRadius:4}}>{t.from}</span>
                        <span style={{fontSize:12,color:S.textMuted}}>→</span>
                        <span style={{fontSize:11,color:S.purpleLight,background:S.purpleDark,padding:'3px 8px',borderRadius:4}}>{t.to}</span>
                        <span style={{fontSize:10,color:S.textMuted,marginLeft:'auto',background:S.surface2,padding:'2px 6px',borderRadius:4}}>{t.tripType}</span>
                      </div>
                      <div style={{marginTop:5}}>
                        <span style={{fontSize:11,color:S.textMuted}}>Assigned: {t.assignedTo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* RIGHT — sticky team roster panel */}
      <div style={{width:230,flexShrink:0,borderLeft:'1px solid '+S.border,background:S.surface,display:'flex',flexDirection:'column',position:'sticky',top:98,maxHeight:'calc(100vh - 108px)',overflowY:'auto',alignSelf:'flex-start'}}>
        <div style={{padding:'14px 14px 10px',borderBottom:'1px solid '+S.surface2,position:'sticky',top:0,background:S.surface,zIndex:1}}>
          <p style={{color:'#fff',fontSize:14,fontWeight:700}}>Team</p>
          <p style={{color:S.textMuted,fontSize:11,marginTop:2}}>{teamIn.length} in · {teamOut.length} out · drag to assign</p>
        </div>

        <div style={{padding:'8px 10px'}}>
          {/* In today */}
          <p style={{fontSize:10,fontWeight:700,color:S.textMuted,textTransform:'uppercase',letterSpacing:'.05em',padding:'8px 4px 6px'}}>In today</p>
          {teamIn.map(m=>(
            <div key={m.id} draggable
              onDragStart={()=>handleDragStart(m.id)}
              onDragEnd={handleDragEnd}
              style={{display:'flex',alignItems:'center',gap:9,padding:'9px 8px',borderRadius:8,cursor:'grab',marginBottom:3,transition:'all .15s',
                background:draggedId===m.id?ROLE_BGS[m.role]:'transparent',
                opacity:draggedId===m.id?0.5:1,
                border:'1px solid '+(draggedId===m.id?ROLE_COLORS[m.role]:'transparent'),
              }}
            >
              <div style={{width:30,height:30,borderRadius:8,background:m.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:m.color,flexShrink:0}}>{m.initials}</div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{color:'#fff',fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</p>
                <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}>
                  <span style={{fontSize:9}}>{ROLE_ICONS[m.role]}</span>
                  <span style={{fontSize:10,color:ROLE_COLORS[m.role],fontWeight:600,textTransform:'capitalize'}}>{m.role}</span>
                </div>
              </div>
              <div style={{width:6,height:6,borderRadius:'50%',background:S.greenBright,flexShrink:0}}/>
            </div>
          ))}

          {/* Divider */}
          <div style={{borderTop:'1px solid '+S.surface2,margin:'10px 0 6px'}}>
            <p style={{fontSize:10,fontWeight:700,color:S.textMuted,textTransform:'uppercase',letterSpacing:'.05em',padding:'8px 4px 4px'}}>Not in today</p>
          </div>

          {/* Out today */}
          {teamOut.map(m=>(
            <div key={m.id} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 8px',borderRadius:8,marginBottom:3,opacity:0.4}}>
              <div style={{width:30,height:30,borderRadius:8,background:'#2A2A2A',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#666',flexShrink:0,filter:'grayscale(1)'}}>{m.initials}</div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{color:S.textSub,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</p>
                <p style={{fontSize:10,color:S.textMuted,marginTop:2}}>Not in today</p>
              </div>
              <div style={{width:6,height:6,borderRadius:'50%',background:S.border,flexShrink:0}}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const channelNames={inventory:'# sf-onsite-delivery',ingress:'# sf-inbound-landed',shuttling:'# sf-delivery-ops'}

  return(
    <div style={{background:S.bg,minHeight:'100vh',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',color:S.text}}>

      {/* HEADER */}
      <div style={{background:S.purple,position:'sticky',top:0,zIndex:50,borderBottom:'1px solid #5C2B5E'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px 0'}}>
          <div style={{width:28,height:28,borderRadius:6,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff',flexShrink:0}}>E</div>
          <span style={{fontSize:15,fontWeight:700,color:'#fff',flex:1}}>Ever Cars</span>
          <span style={{fontSize:11,color:S.purpleLight,background:'rgba(0,0,0,0.2)',padding:'2px 8px',borderRadius:20}}>
            {role==='spec'?channelNames[activeTab]:'# ops-overview'}
          </span>
        </div>
        <div style={{display:'flex',padding:'8px 12px 0',gap:4}}>
          <button onClick={()=>setRole('spec')} style={{flex:1,padding:'8px 0',borderRadius:'8px 8px 0 0',fontSize:13,fontWeight:600,cursor:'pointer',border:'none',background:role==='spec'?S.bg:'transparent',color:role==='spec'?'#fff':S.purpleLight}}>👤 My Tasks</button>
          <button onClick={()=>setRole('adv')} style={{flex:1,padding:'8px 0',borderRadius:'8px 8px 0 0',fontSize:13,fontWeight:600,cursor:'pointer',border:'none',background:role==='adv'?S.bg:'transparent',color:role==='adv'?'#fff':S.purpleLight}}>📊 Team View</button>
        </div>
      </div>

      {/* CONTENT */}
      {role==='spec'&&activeTab==='inventory'&&inventoryView}
      {role==='spec'&&activeTab==='ingress'&&ingressView}
      {role==='spec'&&activeTab==='shuttling'&&shuttlingView}
      {role==='adv'&&advisorView}

      {/* BOTTOM NAV */}
      {role==='spec'&&(
        <div style={{position:'fixed',bottom:0,left:0,right:0,background:S.purple,borderTop:'1px solid #5C2B5E',display:'flex',zIndex:50}}>
          {(['inventory','ingress','shuttling'] as const).map(tab=>{
            const isActive=activeTab===tab;const isAssigned=assignedRole===tab
            return(
              <button key={tab} onClick={()=>setActiveTab(tab)} style={{flex:1,padding:'10px 0 8px',background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <span style={{fontSize:20}}>{tab==='inventory'?'📦':tab==='ingress'?'🚛':'🔄'}</span>
                <span style={{fontSize:10,fontWeight:600,color:isActive?'#fff':S.purpleLight,textTransform:'capitalize'}}>{tab}</span>
                {isAssigned&&<div style={{width:4,height:4,borderRadius:'50%',background:S.purpleLight}}/>}
              </button>
            )
          })}
        </div>
      )}

      {/* BOTTOM SHEET — works on mobile and desktop */}
      {bottomSheet&&(
        <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'flex-end'}} onClick={()=>setBottomSheet(null)}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.6)'}}/>
          <div style={{position:'relative',background:S.surface,borderRadius:'16px 16px 0 0',width:'100%',maxHeight:'80vh',overflowY:'auto',paddingBottom:'env(safe-area-inset-bottom,16px)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px',borderBottom:'1px solid '+S.surface2}}>
              <p style={{fontSize:16,fontWeight:700,color:'#fff'}}>{bottomSheet.type==='loc'?'Update location':'Update charge level'}</p>
              <button onClick={()=>setBottomSheet(null)} style={{fontSize:14,fontWeight:600,color:S.purpleLight,background:'none',border:'none',padding:'6px 10px',minHeight:44,cursor:'pointer'}}>Done</button>
            </div>
            {bottomSheet.type==='loc'&&LOCATIONS.map(l=>(
              <button key={l.label} onClick={()=>pickLoc(bottomSheet.cardId,l.label)} style={{display:'flex',alignItems:'center',gap:14,padding:'16px',borderTop:'1px solid '+S.surface2,borderLeft:'none',borderRight:'none',borderBottom:'none',background:locations[bottomSheet.cardId]===l.label?S.purpleDark:'transparent',width:'100%',textAlign:'left',minHeight:56,cursor:'pointer'}}>
                <span style={{fontSize:22,width:32,textAlign:'center',flexShrink:0}}>{l.emoji}</span>
                <span style={{fontSize:15,color:locations[bottomSheet.cardId]===l.label?S.purpleLight:'#fff',flex:1,fontWeight:500}}>{l.label}</span>
                {locations[bottomSheet.cardId]===l.label&&<span style={{color:S.greenBright,fontSize:18}}>✓</span>}
              </button>
            ))}
            {bottomSheet.type==='chg'&&(
              <div style={{padding:20,display:'flex',flexWrap:'wrap',gap:12}}>
                {CHARGES.map(pct=>(
                  <button key={pct} onClick={()=>pickChg(bottomSheet.cardId,pct)} style={{padding:'14px 20px',borderRadius:20,fontSize:16,fontWeight:700,border:'1px solid '+((charges[bottomSheet.cardId]??0)===pct?chargeColor(pct):S.border),background:(charges[bottomSheet.cardId]??0)===pct?S.surface2:'transparent',color:chargeColor(pct),minHeight:52,minWidth:72,cursor:'pointer'}}>{pct}%</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast&&(
        <div style={{position:'fixed',bottom:role==='spec'?80:24,left:'50%',transform:'translateX(-50%)',background:S.surface,border:'1px solid '+S.border,borderRadius:10,padding:'10px 16px',fontSize:13,color:S.text,display:'flex',alignItems:'center',gap:12,zIndex:9999,boxShadow:'0 8px 28px rgba(0,0,0,.8)',maxWidth:'90vw',whiteSpace:'nowrap'}}>
          <span>{toast.msg}</span>
          {toast.undo&&<button onClick={()=>{toast.undo?.();setToast(null)}} style={{fontSize:12,fontWeight:700,color:S.purpleLight,background:'none',border:'none',cursor:'pointer'}}>Undo</button>}
        </div>
      )}
    </div>
  )
}