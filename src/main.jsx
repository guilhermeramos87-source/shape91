
import React,{useEffect,useMemo,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from 'recharts'
import {Dumbbell,HeartPulse,Utensils,Scale,Droplets,Activity,LogOut,Settings,Clock3} from 'lucide-react'
import {supabase} from './supabaseClient'
import './styles.css'

const APP_VERSION='V10 CLEAN'

const blankProfile={
  name:'',sex:'',age:'',height_cm:'',start_weight_kg:'',target_weight_kg:'',
  activity_level:'moderado',training_days:3,goal:'Perda de gordura e definição',
  limitations:'',experience_level:'iniciante',training_location:'academia',
  focus_area:'corpo inteiro',cardio_preference:'caminhada',session_minutes:45,
  targets_mode:'auto',custom_calories:'',custom_protein_g:'',custom_water_l:'',
  custom_cardio_minutes:'',photo_url:'',meals_per_day:5,
  wake_time:'',cardio_time:'',breakfast_time:'',leave_home_time:'',
  lunch_time:'',snack_time:'',home_time:'',workout_time:'',dinner_time:'',sleep_time:'',
  food_restrictions:'',food_preferences:'',diet_style:'equilibrada'
}

function autoTargets(p,w){
  const weight=Number(w||p.start_weight_kg||0),h=Number(p.height_cm||0),a=Number(p.age||0)
  if(!weight||!h||!a||!p.sex)return null
  const bmr=p.sex==='masculino'?10*weight+6.25*h-5*a+5:10*weight+6.25*h-5*a-161
  const factor={baixo:1.3,moderado:1.5,alto:1.7}[p.activity_level]||1.5
  const deficit=(p.goal||'').toLowerCase().includes('ganho')?-200:450
  return {
    calories:Math.max(p.sex==='masculino'?1700:1400,Math.round(bmr*factor-deficit)),
    protein:Math.round(Math.min(weight,Number(p.target_weight_kg||weight)*1.15)*1.8),
    water:Math.round(weight*0.032*10)/10,
    cardio:30
  }
}
function getTargets(p,w){
  const a=autoTargets(p,w)||{calories:0,protein:0,water:0,cardio:0}
  if(p.targets_mode!=='manual')return a
  return {
    calories:Number(p.custom_calories||a.calories),
    protein:Number(p.custom_protein_g||a.protein),
    water:Number(p.custom_water_l||a.water),
    cardio:Number(p.custom_cardio_minutes||a.cardio)
  }
}
function buildPlan(p){
  const home=p.training_location==='casa'
  const knee=(p.limitations||'').toLowerCase().includes('joelho')
  const focus=(p.focus_area||'').toLowerCase()
  const lowerFocus=focus.includes('glúte')||focus.includes('perna')
  const days=Math.max(1,Math.min(5,Number(p.training_days||3)))

  const homeLow=[
    'Agachamento para cadeira — 3x10–15','Elevação pélvica no chão — 4x12–20',
    'Stiff com mochila/halteres — 3x10–15','Avanço assistido — 3x8–12 por perna',
    'Abdução com faixa — 3x15–20','Panturrilha em pé — 4x15–20'
  ]
  const homeUp=[
    'Flexão na parede/banco/chão — 4x6–15','Remada unilateral com mochila/halter — 4x10–15',
    'Desenvolvimento com halteres/garrafas — 3x10–15','Elevação lateral — 3x12–20',
    'Rosca bíceps — 3x10–15','Tríceps acima da cabeça — 3x10–15'
  ]
  const gymLow=[
    knee?'Leg press amplitude confortável — 3x10–15':'Agachamento livre/hack — 4x8–12',
    'Hip thrust — 4x8–12','Mesa flexora — 3x10–15',
    knee?'Cadeira extensora leve — 3x12–15':'Afundo/passada — 3x10–12',
    'Cadeira abdutora — 3x15–20','Panturrilha máquina — 4x12–20'
  ]
  const gymUp=[
    'Supino reto/máquina — 4x6–10','Puxada frontal — 4x8–12','Remada baixa — 3x8–12',
    'Desenvolvimento — 3x8–12','Elevação lateral — 3x12–15','Rosca + tríceps — 3x10–15'
  ]

  const low=home?homeLow:gymLow, up=home?homeUp:gymUp
  const full=[low[0],up[0],up[1],low[1],up[3],'Prancha — 3x30–60s']
  let out=[]
  if(days===1)out=[{name:'A',sub:'Corpo inteiro',ex:full}]
  if(days===2)out=[{name:'A',sub:lowerFocus?'Inferiores':'Corpo inteiro',ex:lowerFocus?low:full},{name:'B',sub:'Superiores + core',ex:[...up.slice(0,5),'Prancha — 3x30–60s']}]
  if(days===3)out=[{name:'A',sub:lowerFocus?'Glúteos/posteriores':'Corpo inteiro 1',ex:lowerFocus?low:full},{name:'B',sub:'Superiores + core',ex:[...up.slice(0,5),'Prancha — 3x30–60s']},{name:'C',sub:lowerFocus?'Pernas/glúteos':'Corpo inteiro 2',ex:lowerFocus?low:[...low.slice(0,3),...up.slice(0,3)]}]
  if(days>=4){
    out=[{name:'A',sub:'Inferiores',ex:low},{name:'B',sub:'Superiores',ex:up},{name:'C',sub:'Inferiores 2',ex:[...low].reverse()},{name:'D',sub:'Superiores 2 + core',ex:[...up.slice(1,5),'Prancha — 3x30–60s']}]
    if(days===5)out.push({name:'E',sub:'Corpo inteiro leve',ex:full})
  }
  return out
}
function percent(done,goal){return goal?Math.min(100,Math.round(Number(done||0)/Number(goal)*100)):0}
function Goal({label,done,goal,unit}){
  const p=percent(done,goal)
  return <div className="goal"><div className="goalHead"><b>{label}</b><span>{done} / {goal} {unit}</span></div><div className="bar"><span style={{width:p+'%'}}/></div><small>{p}%</small></div>
}
function routineItems(p){
  return [
    [p.wake_time,'Acordar'],
    [p.cardio_time,'Cardio'],
    [p.breakfast_time,'Café da manhã'],
    [p.leave_home_time,'Sair de casa'],
    [p.lunch_time,'Almoço'],
    [p.snack_time,'Lanche'],
    [p.home_time,'Chegar em casa'],
    [p.workout_time,'Musculação'],
    [p.dinner_time,'Jantar'],
    [p.sleep_time,'Dormir']
  ].filter(x=>x[0])
}
function grams(x){return Math.max(0,Math.round(x))}
function kcalSplit(n){
  if(n<=3)return [0.25,0.40,0.35]
  if(n===4)return [0.20,0.35,0.15,0.30]
  return [0.20,0.10,0.30,0.10,0.30]
}
function dietSlots(p){
  const base=[
    [p.breakfast_time,'Café da manhã','breakfast'],
    [p.snack_time,'Lanche','snack'],
    [p.lunch_time,'Almoço','lunch'],
    [p.home_time,'Lanche 2','snack2'],
    [p.dinner_time,'Jantar','dinner']
  ].filter(x=>x[0])
  const n=Math.max(3,Math.min(5,Number(p.meals_per_day||5)))
  if(base.length>=n)return base.slice(0,n)
  return base
}
function buildAutomaticDiet(p,t){
  const slots=dietSlots(p)
  const n=slots.length || 4
  const splits=kcalSplit(n)
  const proteinPerMeal=Math.max(20,Math.round(Number(t.protein||0)/n))

  return slots.map((slot,i)=>{
    const [time,name,type]=slot
    const mealKcal=Math.round(Number(t.calories||0)*(splits[i]||1/n))
    let items=[]
    let swaps=[]

    if(type==='breakfast'){
      const oats=grams(mealKcal*0.08)
      items=[
        `${Math.max(2,Math.round(proteinPerMeal/8))} ovos ou omelete equivalente`,
        `${Math.max(30,oats)} g de aveia`,
        `1 banana ou outra fruta`,
        `Café sem açúcar ou com adoçante`
      ]
      swaps=['Aveia ↔ pão integral','Ovos ↔ iogurte proteico + whey','Banana ↔ mamão/maçã']
    } else if(type==='lunch'||type==='dinner'){
      const rice=grams(mealKcal*0.22)
      const meat=Math.max(120,grams(proteinPerMeal*5.5))
      items=[
        `${meat} g de frango, peixe ou carne magra`,
        `${Math.max(80,rice)} g de arroz cozido`,
        `80–100 g de feijão`,
        `Salada e legumes à vontade`
      ]
      swaps=['Arroz ↔ batata/mandioca/macarrão','Frango ↔ peixe/carne magra/ovos','Feijão ↔ lentilha/grão-de-bico']
    } else {
      items=[
        `1 iogurte proteico ou natural`,
        `${Math.max(20,Math.round(proteinPerMeal*0.8))} g de whey ou proteína equivalente`,
        `1 fruta`,
        `10–20 g de castanhas se houver espaço nas calorias`
      ]
      swaps=['Whey ↔ ovos/frango/atum','Iogurte ↔ cottage/queijo fresco','Fruta ↔ outra fruta equivalente']
    }

    return {time,name,mealKcal,proteinPerMeal,items,swaps}
  })
}

function Login(){
  const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[signup,setSignup]=useState(false),[msg,setMsg]=useState('')
  async function go(e){
    e.preventDefault();setMsg('')
    const r=signup?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password})
    if(r.error)setMsg(r.error.message);else if(signup)setMsg('Conta criada. Agora entre.')
  }
  return <div className="center"><form className="panel login" onSubmit={go}>
    <div className="eyebrow">SHAPE 91 • {APP_VERSION}</div><h1>Shape 91</h1>
    <label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
    <label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength="6" required/></label>
    <button className="primary">{signup?'Criar conta':'Entrar'}</button>
    {msg&&<div className="note">{msg}</div>}
    <button type="button" className="link" onClick={()=>setSignup(!signup)}>{signup?'Já tenho conta':'Primeiro acesso? Criar conta'}</button>
  </form></div>
}

function Profile({session,initial,onSave,onCancel}){
  const[f,setF]=useState(initial?{...blankProfile,...initial}:blankProfile),[msg,setMsg]=useState('')
  function s(k,v){setF(x=>({...x,[k]:v}))}
  const a=autoTargets(f,f.start_weight_kg)
  function num(v){return v===''||v===null||v===undefined?null:Number(v)}
  async function save(e){
    e.preventDefault()
    const payload={...f,
      age:num(f.age),height_cm:num(f.height_cm),start_weight_kg:num(f.start_weight_kg),
      target_weight_kg:num(f.target_weight_kg),training_days:num(f.training_days),
      session_minutes:num(f.session_minutes),meals_per_day:num(f.meals_per_day)||5,
      custom_calories:num(f.custom_calories),custom_protein_g:num(f.custom_protein_g),
      custom_water_l:num(f.custom_water_l),custom_cardio_minutes:num(f.custom_cardio_minutes),
      user_id:session.user.id,updated_at:new Date().toISOString()
    }
    const {data,error}=await supabase.from('profiles').upsert(payload,{onConflict:'user_id'}).select().eq('user_id',session.user.id).single()
    if(error)setMsg(error.message);else onSave(data)
  }
  return <div className="center"><form className="panel profile" onSubmit={save}>
    <div className="eyebrow">PERFIL • ROTINA • METAS • {APP_VERSION}</div>
    {!initial&&<div className="note">Novo usuário: dados pessoais começam em branco.</div>}

    <h3>Dados pessoais</h3>
    <div className="formGrid">
      <label>Nome<input value={f.name} onChange={e=>s('name',e.target.value)} required/></label>
      <label>Sexo<select value={f.sex} onChange={e=>s('sex',e.target.value)} required><option value="">Selecione</option><option value="masculino">Masculino</option><option value="feminino">Feminino</option></select></label>
      <label>Idade<input type="number" value={f.age} onChange={e=>s('age',e.target.value)} required/></label>
      <label>Altura (cm)<input type="number" value={f.height_cm} onChange={e=>s('height_cm',e.target.value)} required/></label>
      <label>Peso inicial<input type="number" step="0.1" value={f.start_weight_kg} onChange={e=>s('start_weight_kg',e.target.value)} required/></label>
      <label>Meta de peso<input type="number" step="0.1" value={f.target_weight_kg} onChange={e=>s('target_weight_kg',e.target.value)} required/></label>
      <label>Foto (URL)<input type="url" placeholder="https://..." value={f.photo_url||''} onChange={e=>s('photo_url',e.target.value)}/></label>
    </div>

    <h3>Treino</h3>
    <div className="formGrid">
      <label>Objetivo<select value={f.goal} onChange={e=>s('goal',e.target.value)}><option>Perda de gordura e definição</option><option>Recomposição corporal</option><option>Ganho de massa muscular</option><option>Condicionamento e saúde</option></select></label>
      <label>Foco<select value={f.focus_area} onChange={e=>s('focus_area',e.target.value)}><option value="corpo inteiro">Corpo inteiro</option><option value="glúteos">Glúteos</option><option value="pernas">Pernas</option><option value="superiores">Superiores</option><option value="abdômen">Abdômen/core</option></select></label>
      <label>Nível<select value={f.experience_level} onChange={e=>s('experience_level',e.target.value)}><option value="iniciante">Iniciante</option><option value="intermediario">Intermediário</option><option value="avancado">Avançado</option></select></label>
      <label>Local<select value={f.training_location} onChange={e=>s('training_location',e.target.value)}><option value="academia">Academia</option><option value="casa">Casa</option><option value="ambos">Ambos</option></select></label>
      <label>Dias/semana<input type="number" min="1" max="5" value={f.training_days} onChange={e=>s('training_days',e.target.value)}/></label>
      <label>Tempo/sessão<input type="number" value={f.session_minutes} onChange={e=>s('session_minutes',e.target.value)}/></label>
      <label>Cardio<select value={f.cardio_preference} onChange={e=>s('cardio_preference',e.target.value)}><option value="caminhada">Caminhada</option><option value="bicicleta">Bicicleta</option><option value="elíptico">Elíptico</option><option value="escada">Escada</option></select></label>
      <label>Limitações<input value={f.limitations||''} onChange={e=>s('limitations',e.target.value)}/></label>
      <label>Estilo da dieta<select value={f.diet_style||'equilibrada'} onChange={e=>s('diet_style',e.target.value)}><option value="equilibrada">Equilibrada</option><option value="mais proteica">Mais proteica</option><option value="pratica">Prática</option></select></label>
      <label>Alimentos que prefere<input value={f.food_preferences||''} onChange={e=>s('food_preferences',e.target.value)} placeholder="Ex.: frango, arroz, banana"/></label>
      <label>Restrições/alimentos que evita<input value={f.food_restrictions||''} onChange={e=>s('food_restrictions',e.target.value)} placeholder="Ex.: lactose, peixe, amendoim"/></label>
    </div>

    <h3>Rotina e horários</h3>
    <div className="formGrid">
      <label>Acordar<input type="time" value={f.wake_time||''} onChange={e=>s('wake_time',e.target.value)}/></label>
      <label>Cardio<input type="time" value={f.cardio_time||''} onChange={e=>s('cardio_time',e.target.value)}/></label>
      <label>Café da manhã<input type="time" value={f.breakfast_time||''} onChange={e=>s('breakfast_time',e.target.value)}/></label>
      <label>Sair de casa<input type="time" value={f.leave_home_time||''} onChange={e=>s('leave_home_time',e.target.value)}/></label>
      <label>Almoço<input type="time" value={f.lunch_time||''} onChange={e=>s('lunch_time',e.target.value)}/></label>
      <label>Lanche<input type="time" value={f.snack_time||''} onChange={e=>s('snack_time',e.target.value)}/></label>
      <label>Chegar em casa<input type="time" value={f.home_time||''} onChange={e=>s('home_time',e.target.value)}/></label>
      <label>Musculação<input type="time" value={f.workout_time||''} onChange={e=>s('workout_time',e.target.value)}/></label>
      <label>Jantar<input type="time" value={f.dinner_time||''} onChange={e=>s('dinner_time',e.target.value)}/></label>
      <label>Dormir<input type="time" value={f.sleep_time||''} onChange={e=>s('sleep_time',e.target.value)}/></label>
    </div>

    <h3>Metas</h3>
    <div className="formGrid">
      <label>Atividade<select value={f.activity_level} onChange={e=>s('activity_level',e.target.value)}><option value="baixo">Baixo</option><option value="moderado">Moderado</option><option value="alto">Alto</option></select></label>
      <label>Modo metas<select value={f.targets_mode} onChange={e=>s('targets_mode',e.target.value)}><option value="auto">Automático</option><option value="manual">Manual</option></select></label>
    </div>
    <div className="targets">
      {f.targets_mode==='auto'
        ? <p>{a?`~${a.calories} kcal • ${a.protein} g proteína • ${a.water} L água • ${a.cardio} min cardio`:'Preencha sexo, idade, altura e peso.'}</p>
        : <div className="formGrid">
            <label>Calorias<input type="number" value={f.custom_calories??''} onChange={e=>s('custom_calories',e.target.value)}/></label>
            <label>Proteína (g)<input type="number" value={f.custom_protein_g??''} onChange={e=>s('custom_protein_g',e.target.value)}/></label>
            <label>Água (L)<input type="number" step="0.1" value={f.custom_water_l??''} onChange={e=>s('custom_water_l',e.target.value)}/></label>
            <label>Cardio (min)<input type="number" value={f.custom_cardio_minutes??''} onChange={e=>s('custom_cardio_minutes',e.target.value)}/></label>
          </div>}
    </div>

    <button className="primary">Salvar perfil, rotina e metas</button>
    {initial&&<button type="button" className="secondary" onClick={onCancel}>Cancelar</button>}
    {msg&&<div className="note">{msg}</div>}
  </form></div>
}

function App(){
  const[session,setSession]=useState(null),[profile,setProfile]=useState(null),[edit,setEdit]=useState(false),[tab,setTab]=useState('Hoje')
  const[history,setHistory]=useState([]),[weight,setWeight]=useState(0),[water,setWater]=useState(0),[cal,setCal]=useState(0),[protein,setProtein]=useState(0),[cardio,setCardio]=useState(0),[status,setStatus]=useState('')

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session))
    const{data:l}=supabase.auth.onAuthStateChange((_e,s)=>{setProfile(null);setHistory([]);setSession(s)})
    return()=>l.subscription.unsubscribe()
  },[])
  useEffect(()=>{if(session?.user)load()},[session])

  async function load(){
    const uid=session.user.id
    const{data:p}=await supabase.from('profiles').select('*').eq('user_id',uid).maybeSingle()
    setProfile(p||null)
    const{data:h}=await supabase.from('daily_checkins').select('*').eq('user_id',uid).order('checkin_date',{ascending:true})
    const hist=h||[];setHistory(hist)
    const today=new Date().toISOString().slice(0,10),row=hist.find(x=>x.checkin_date===today)
    if(row){setWeight(Number(row.weight_kg||p?.start_weight_kg||0));setWater(Number(row.water_l||0));setCal(Number(row.calories_consumed||0));setProtein(Number(row.protein_consumed_g||0));setCardio(Number(row.cardio_minutes_done||0))}
    else if(p){setWeight(Number(p.start_weight_kg));setWater(0);setCal(0);setProtein(0);setCardio(0)}
  }

  async function saveDay(){
    const uid=session.user.id
    const{error}=await supabase.from('daily_checkins').upsert({
      user_id:uid,checkin_date:new Date().toISOString().slice(0,10),
      weight_kg:weight,water_l:water,calories_consumed:cal,protein_consumed_g:protein,cardio_minutes_done:cardio
    },{onConflict:'user_id,checkin_date'})
    setStatus(error?error.message:'Progresso salvo.')
    if(!error)load()
  }

  const t=useMemo(()=>profile?getTargets(profile,weight):null,[profile,weight])
  const p=useMemo(()=>profile?buildPlan(profile):[],[profile])
  const routine=useMemo(()=>profile?routineItems(profile):[],[profile])
  const meals=useMemo(()=>profile&&t?buildAutomaticDiet(profile,t):[],[profile,t])
  const chart=history.map(x=>({date:new Date(x.checkin_date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),peso:Number(x.weight_kg)}))

  if(!session)return <Login/>
  if(!profile||edit)return <Profile session={session} initial={profile} onCancel={()=>setEdit(false)} onSave={x=>{setProfile(x);setEdit(false);if(!history.length)setWeight(Number(x.start_weight_kg))}}/>

  return <div className="app">
    <header>
      <div className="userHead">
        {profile.photo_url?<img className="avatar" src={profile.photo_url} alt="Foto"/>:<div className="avatarFallback">{(profile.name||'?').slice(0,1).toUpperCase()}</div>}
        <div><div className="eyebrow">{profile.name.toUpperCase()} • {APP_VERSION}</div><h1>Shape 91</h1><p>{profile.goal}</p></div>
      </div>
      <div className="actions"><button onClick={()=>setEdit(true)}><Settings size={17}/> Perfil</button><button onClick={()=>supabase.auth.signOut()}><LogOut size={17}/> Sair</button></div>
    </header>

    <nav>{['Hoje','Treino','Alimentação','Progresso'].map(x=><button className={tab===x?'active':''} onClick={()=>setTab(x)} key={x}>{x}</button>)}</nav>

    {tab==='Hoje'&&<>
      <div className="grid2">
        <section><div className="title"><Scale size={18}/> Peso</div><div className="big">{weight.toFixed(1)} kg</div><p>Meta: {Number(profile.target_weight_kg).toFixed(1)} kg</p><label>Peso hoje<input type="number" step="0.1" value={weight} onChange={e=>setWeight(Number(e.target.value))}/></label></section>
        <section><div className="title"><Activity size={18}/> Meta x realizado</div><Goal label="Água" done={water} goal={t.water} unit="L"/><Goal label="Proteína" done={protein} goal={t.protein} unit="g"/><Goal label="Calorias" done={cal} goal={t.calories} unit="kcal"/><Goal label="Cardio" done={cardio} goal={t.cardio} unit="min"/></section>
      </div>

      <section><div className="title"><Clock3 size={18}/> Rotina de hoje</div>{routine.length?<div className="timeline">{routine.map(([time,name])=><div className="timeRow" key={time+name}><b>{String(time).slice(0,5)}</b><span>{name}</span></div>)}</div>:<p>Cadastre seus horários em Perfil.</p>}</section>

      <section><div className="title"><Droplets size={18}/> Registrar hoje</div><div className="formGrid"><label>Água (L)<input type="number" step="0.1" value={water} onChange={e=>setWater(Number(e.target.value))}/></label><label>Proteína (g)<input type="number" value={protein} onChange={e=>setProtein(Number(e.target.value))}/></label><label>Calorias<input type="number" value={cal} onChange={e=>setCal(Number(e.target.value))}/></label><label>Cardio (min)<input type="number" value={cardio} onChange={e=>setCardio(Number(e.target.value))}/></label></div><button className="primary" onClick={saveDay}>Salvar progresso</button>{status&&<div className="note">{status}</div>}</section>
    </>}

    {tab==='Treino'&&<>
      <section><div className="title"><Dumbbell size={18}/> Local</div><p><b>{profile.training_location==='casa'?'Casa':profile.training_location==='academia'?'Academia':'Casa e academia'}</b></p></section>
      <div className="grid2">{p.map(d=><section key={d.name}><div className="title"><Dumbbell size={18}/> Treino {d.name}</div><p><b>{d.sub}</b></p><ul>{d.ex.map(x=><li key={x}>{x}</li>)}</ul></section>)}</div>
    </>}

    {tab==='Alimentação'&&<>
      <section>
        <div className="title"><Utensils size={18}/> Dieta automática de {profile.name}</div>
        <div className="stats">
          <div><b>{t.calories}</b><span>kcal/dia</span></div>
          <div><b>{t.protein} g</b><span>proteína</span></div>
          <div><b>{t.water} L</b><span>água</span></div>
          <div><b>{profile.meals_per_day||5}</b><span>refeições/dia</span></div>
        </div>
        {profile.food_preferences&&<div className="note">Preferências: {profile.food_preferences}</div>}
        {profile.food_restrictions&&<div className="note">Evitar/restrições: {profile.food_restrictions}</div>}
      </section>

      <div className="grid2">
        {meals.map(m=><section key={m.name+m.time}>
          <div className="mealTitle"><b>{String(m.time).slice(0,5)}</b><strong>{m.name}</strong></div>
          <p>Meta aproximada: <b>{m.mealKcal} kcal</b> • <b>{m.proteinPerMeal} g proteína</b></p>
          <ul>{m.items.map(x=><li key={x}>{x}</li>)}</ul>
          <div className="swapBox"><strong>Substituições</strong>{m.swaps.map(x=><span key={x}>{x}</span>)}</div>
        </section>)}
      </div>

      <section>
        <div className="note">As quantidades são estimativas automáticas para organização do plano. O ajuste deve acompanhar peso, fome, energia, treino e evolução.</div>
      </section>
    </>}

    {tab==='Progresso'&&<section><div className="title"><Scale size={18}/> Evolução</div>{chart.length?<div style={{height:300}}><ResponsiveContainer><LineChart data={chart}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis domain={['dataMin - 1','dataMax + 1']}/><Tooltip/><Line dataKey="peso" strokeWidth={3}/></LineChart></ResponsiveContainer></div>:<p>Sem registros ainda.</p>}</section>}

    <footer>{APP_VERSION}</footer>
  </div>
}

createRoot(document.getElementById('root')).render(<App/>)
