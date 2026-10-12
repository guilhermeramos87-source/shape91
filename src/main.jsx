import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Dumbbell, HeartPulse, Utensils, CheckCircle2, Scale, Droplets, Activity, CalendarDays, LogOut } from 'lucide-react'
import { supabase } from './supabaseClient'
import './styles.css'

const workouts = {
  A: ['Supino reto — 4x6–10','Remada baixa — 4x8–12','Leg press — 3x10–12','Cadeira extensora — 3x12–15 (sem dor)','Mesa flexora — 3x10–15','Elevação lateral — 3x12–15','Tríceps na polia — 3x10–15','Prancha — 3x30–60s'],
  B: ['Puxada frontal — 4x8–12','Supino inclinado com halteres — 3x8–12','Agachamento no banco/caixa — 3x8–12','Terra romeno — 3x8–12','Mesa flexora — 3x12–15','Rosca direta — 3x10–15','Panturrilha — 4x12–20','Abdominal — 3x12–20'],
  C: ['Remada máquina — 4x8–12','Desenvolvimento máquina/halteres — 3x8–12','Leg press — 3x10–15','Hip thrust — 4x8–12','Mesa flexora — 3x12–15','Peitoral máquina/crossover — 3x10–15','Bíceps + tríceps — 3x10–15','Prancha — 3 séries']
}

const meals = [
  ['06:00','Café da manhã','30 g whey + banana + iogurte proteico + 30–40 g aveia'],
  ['09:00','Lanche','1 fruta + iogurte natural/proteico'],
  ['12:00','Almoço','150–180 g proteína + 120–150 g arroz + 80–100 g feijão + salada'],
  ['15:30','Lanche','Pão integral + 100–120 g frango/atum + salada'],
  ['18:00','Pré-treino','Banana + 25–30 g whey'],
  ['20:00','Jantar','180–200 g proteína + arroz/batata + legumes']
]

function Login() {
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [mode,setMode] = useState('login')
  const [msg,setMsg] = useState('')
  const [loading,setLoading] = useState(false)

  async function submit(e){
    e.preventDefault()
    setLoading(true); setMsg('')
    try{
      if(mode === 'signup'){
        const { error } = await supabase.auth.signUp({email,password})
        if(error) throw error
        setMsg('Cadastro criado. Se a confirmação de e-mail estiver ativa, confirme o e-mail antes de entrar.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({email,password})
        if(error) throw error
      }
    } catch(err){
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return <div className="loginWrap">
    <form className="loginCard" onSubmit={submit}>
      <div className="eyebrow">SEU APP PESSOAL</div>
      <h1>Shape 91</h1>
      <p>{mode==='login'?'Entre para acessar seus dados':'Crie seu acesso particular'}</p>
      <label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
      <label>Senha<input type="password" minLength="6" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
      <button className="primary" disabled={loading}>{loading?'Aguarde...':mode==='login'?'Entrar':'Criar conta'}</button>
      {msg && <div className="note">{msg}</div>}
      <button className="linkBtn" type="button" onClick={()=>{setMode(mode==='login'?'signup':'login');setMsg('')}}>
        {mode==='login'?'Primeiro acesso? Criar conta':'Já tenho conta'}
      </button>
    </form>
  </div>
}

function Card({children}){ return <section className="card">{children}</section> }

function App(){
  const [session,setSession] = useState(null)
  const [tab,setTab] = useState('Hoje')
  const [weight,setWeight] = useState(97)
  const [water,setWater] = useState(0)
  const [pain,setPain] = useState(0)
  const [hunger,setHunger] = useState(0)
  const [energy,setEnergy] = useState(5)
  const [cardioDone,setCardioDone] = useState(false)
  const [workoutDone,setWorkoutDone] = useState(false)
  const [history,setHistory] = useState([])
  const [status,setStatus] = useState('')

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event,s)=>setSession(s))
    return ()=>listener.subscription.unsubscribe()
  },[])

  useEffect(()=>{
    if(session?.user) loadHistory()
  },[session])

  async function loadHistory(){
    const { data,error } = await supabase
      .from('daily_checkins')
      .select('*')
      .order('checkin_date',{ascending:true})
    if(!error){
      setHistory(data || [])
      if(data?.length) setWeight(Number(data[data.length-1].weight_kg || 97))
    }
  }

  async function saveDay(){
    setStatus('Salvando...')
    const today = new Date().toISOString().slice(0,10)
    const payload = {
      user_id: session.user.id,
      checkin_date: today,
      weight_kg: weight,
      water_l: water,
      knee_pain: pain,
      hunger,
      energy,
      cardio_done: cardioDone,
      workout_done: workoutDone
    }
    const { error } = await supabase
      .from('daily_checkins')
      .upsert(payload,{onConflict:'user_id,checkin_date'})
    if(error) setStatus('Erro: '+error.message)
    else {
      setStatus('Dia salvo e sincronizado.')
      await loadHistory()
    }
  }

  const progress = useMemo(()=>Math.max(0,Math.min(100,((97-weight)/(97-91))*100)),[weight])
  const chartData = history.map(x=>({date:new Date(x.checkin_date+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),peso:Number(x.weight_kg)}))

  if(!session) return <Login />

  return <div className="app">
    <header className="topbar">
      <div><div className="eyebrow">PLANO PESSOAL</div><h1>Shape 91</h1><p>97 kg → 91 kg em 8 semanas</p></div>
      <button className="logout" onClick={()=>supabase.auth.signOut()}><LogOut size={17}/> Sair</button>
    </header>

    <nav className="tabs">
      {['Hoje','Treino','Alimentação','Progresso'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}
    </nav>

    {tab==='Hoje' && <>
      <div className="grid two">
        <Card>
          <div className="cardTitle"><Scale size={18}/> Peso atual</div>
          <div className="big">{weight.toFixed(1)} kg</div>
          <label className="field">Registrar peso<input type="number" min="70" max="130" step="0.1" value={weight} onChange={e=>setWeight(Number(e.target.value))}/></label>
          <div className="progress"><span style={{width:`${progress}%`}}/></div>
          <small>{progress.toFixed(0)}% da meta inicial</small>
        </Card>
        <Card>
          <div className="cardTitle"><Activity size={18}/> Meta diária</div>
          <div className="stats">
            <div><b>~2.200</b><span>kcal</span></div>
            <div><b>180 g</b><span>proteína</span></div>
            <div><b>3 L</b><span>água</span></div>
            <div><b>30 min</b><span>cardio</span></div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="cardTitle"><CalendarDays size={18}/> Rotina da manhã</div>
        <div className="timeline">
          {[['03:55','Acordar'],['04:00','Água'],['04:05','Rotina matinal'],['04:15','Cardio'],['04:45','Finalizar cardio'],['04:50','Banho e troca'],['05:10','Sair de casa']].map(([a,b])=><div className="timeRow" key={a}><b>{a}</b><span>{b}</span></div>)}
        </div>
      </Card>

      <div className="grid two">
        <Card>
          <div className="cardTitle"><HeartPulse size={18}/> Cardio</div>
          <p>Bicicleta ergométrica, elíptico ou caminhada confortável.</p>
          <div className="callout">5 min leve + 20 min moderado + 5 min leve</div>
          <button className={cardioDone?'done action':'action'} onClick={()=>setCardioDone(!cardioDone)}><CheckCircle2 size={18}/>{cardioDone?'Concluído':'Marcar cardio'}</button>
        </Card>
        <Card>
          <div className="cardTitle"><Dumbbell size={18}/> Musculação</div>
          <p>Treino A — Full body</p>
          <ul>{workouts.A.slice(0,4).map(x=><li key={x}>{x}</li>)}</ul>
          <button className={workoutDone?'done action':'action'} onClick={()=>setWorkoutDone(!workoutDone)}><CheckCircle2 size={18}/>{workoutDone?'Concluído':'Marcar treino'}</button>
        </Card>
      </div>

      <Card>
        <div className="cardTitle"><Droplets size={18}/> Check-in diário</div>
        <div className="formGrid">
          <label>Água (L)<input type="number" step="0.1" value={water} onChange={e=>setWater(Number(e.target.value))}/></label>
          <label>Dor no joelho (0–10)<input type="range" min="0" max="10" value={pain} onChange={e=>setPain(Number(e.target.value))}/><span>{pain}</span></label>
          <label>Fome (0–10)<input type="range" min="0" max="10" value={hunger} onChange={e=>setHunger(Number(e.target.value))}/><span>{hunger}</span></label>
          <label>Disposição (0–10)<input type="range" min="0" max="10" value={energy} onChange={e=>setEnergy(Number(e.target.value))}/><span>{energy}</span></label>
        </div>
        <button className="primary" onClick={saveDay}>Salvar dia na nuvem</button>
        {status && <div className="saveStatus">{status}</div>}
      </Card>
    </>}

    {tab==='Treino' && <div className="grid three">
      {Object.entries(workouts).map(([name,items])=><Card key={name}><div className="cardTitle"><Dumbbell size={18}/> Treino {name}</div><ul className="clean">{items.map(x=><li key={x}>{x}</li>)}</ul><div className="note">Joelho: pare se houver dor aguda, inchaço, travamento ou instabilidade.</div></Card>)}
    </div>}

    {tab==='Alimentação' && <Card>
      <div className="cardTitle"><Utensils size={18}/> Plano alimentar base</div>
      <div className="mealList">{meals.map(([time,title,desc])=><div className="meal" key={time+title}><b>{time}</b><div><strong>{title}</strong><span>{desc}</span></div></div>)}</div>
      <div className="note">Meta-base: ~2.200 kcal e ~180 g de proteína/dia. Ajustes devem seguir peso, cintura, fome, energia e desempenho.</div>
    </Card>}

    {tab==='Progresso' && <>
      <Card>
        <div className="cardTitle"><Scale size={18}/> Histórico de peso</div>
        {chartData.length ? <div style={{width:'100%',height:320}}><ResponsiveContainer><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis domain={['dataMin - 1','dataMax + 1']}/><Tooltip/><Line type="monotone" dataKey="peso" strokeWidth={3}/></LineChart></ResponsiveContainer></div> : <p>Salve o primeiro check-in para começar seu gráfico.</p>}
      </Card>
      <Card><div className="cardTitle">Registros sincronizados</div><p>{history.length} check-in(s) salvo(s) no Supabase.</p></Card>
    </>}

    <footer>Shape 91 • V2 Supabase</footer>
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
