"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./diagnostics.module.css";

type Course = { id:string; course_key:string; name:string; icon:string; diagnostic_available:boolean };
type Attempt = { id:string; course_request_id:string|null; course_key:string; status:"in_progress"|"limit_reached"|"completed"; current_level:number; started_at:string; completed_at:string|null };
type Result = { attempt_id:string; course_key:string; course_name:string; placement_level:number; placement_title:string; mastered_through_level:number; mastered_topics:Array<{level:number;key:string;topic:string}>; reinforce_topics:Array<{level:number;key:string;topic:string}>; level_summary:Array<{level:number;title:string;answered:number;total:number;correct:number;percentage:number;mastered:boolean}> };
type Available = { course:Course; requestId:string|null };

function formatDate(value:string|null) { if (!value) return "En progreso"; return new Intl.DateTimeFormat("es-GT",{year:"numeric",month:"long",day:"numeric"}).format(new Date(value)); }

export default function DiagnosticsPage() {
  const [available,setAvailable]=useState<Available[]>([]);
  const [attempts,setAttempts]=useState<Attempt[]>([]);
  const [results,setResults]=useState<Result[]>([]);
  const [courses,setCourses]=useState<Course[]>([]);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{ async function load(){ try {
    const {data:sessionData}=await supabase.auth.getSession(); const session=sessionData.session; if(!session){goTo("/");return;}
    const [courseRes,attemptRes,resultRes,enrollRes,requestRes]=await Promise.all([
      supabase.from("courses").select("id, course_key, name, icon, diagnostic_available").eq("active",true).eq("diagnostic_available",true).order("name"),
      supabase.from("diagnostic_attempts").select("id, course_request_id, course_key, status, current_level, started_at, completed_at").eq("user_id",session.user.id).order("started_at",{ascending:false}),
      supabase.from("diagnostic_results").select("attempt_id, course_key, course_name, placement_level, placement_title, mastered_through_level, mastered_topics, reinforce_topics, level_summary").eq("user_id",session.user.id),
      supabase.from("course_enrollments").select("course_id").eq("user_id",session.user.id).eq("status","active"),
      supabase.from("course_requests").select("id, course_id, diagnostic_opt_in").eq("user_id",session.user.id).eq("diagnostic_opt_in",true)
    ]);
    if(courseRes.error)throw courseRes.error;if(attemptRes.error)throw attemptRes.error;if(resultRes.error)throw resultRes.error;if(enrollRes.error)throw enrollRes.error;if(requestRes.error)throw requestRes.error;
    const loadedCourses=(courseRes.data??[]) as Course[]; const loadedAttempts=(attemptRes.data??[]) as Attempt[]; const attemptedKeys=new Set(loadedAttempts.map(a=>a.course_key));
    const enrolledIds=new Set((enrollRes.data??[]).map(r=>r.course_id as string)); const requestByCourse=new Map<string,string>(); for(const r of requestRes.data??[]){if(r.course_id)requestByCourse.set(r.course_id as string,r.id as string);}
    setCourses(loadedCourses); setAttempts(loadedAttempts); setResults((resultRes.data??[]) as Result[]);
    setAvailable(loadedCourses.filter(c=>!attemptedKeys.has(c.course_key)&&(enrolledIds.has(c.id)||requestByCourse.has(c.id))).map(c=>({course:c,requestId:requestByCourse.get(c.id)??null})));
  } catch(e){setError(e instanceof Error?e.message:"No se pudieron cargar tus diagnósticos.");} finally{setReady(true);} } load(); },[]);

  const courseMap=new Map(courses.map(c=>[c.course_key,c])); const resultMap=new Map(results.map(r=>[r.attempt_id,r]));
  function openDiagnostic(courseKey:string,requestId:string|null){goTo(`/diagnostic/run/?course=${encodeURIComponent(courseKey)}${requestId?`&request=${encodeURIComponent(requestId)}`:""}`);}

  return <AppShell>
    <div className="page-header"><div><p className="eyebrow">Tu punto de partida</p><h1>Diagnósticos</h1><p>Encuentra desde qué temas conviene comenzar en cada materia. Son opcionales y se realizan una sola vez por curso.</p></div></div>
    {!ready?<div className="empty-state">Cargando diagnósticos...</div>:error?<div className="auth-message auth-error">{error}</div>:<>
      {available.length>0&&<section style={{display:"grid",gap:14,marginBottom:22}}>{available.map(({course,requestId})=><article className={styles.card} key={course.id}><div className={styles.cardHeader}><div><p className="eyebrow">Diagnóstico disponible</p><h2>{course.icon} {course.name}</h2><span className={styles.dateText}>Opcional · una sola vez</span></div><span className={`${styles.status} ${styles.statusProgress}`}>Disponible</span></div><div className={styles.progressPanel}><div><strong>Descubre tu punto de partida</strong><span>Nexora recorrerá niveles de dificultad y guardará los temas dominados y los que conviene reforzar.</span></div><button className="primary-button" onClick={()=>openDiagnostic(course.course_key,requestId)}>Comenzar diagnóstico</button></div></article>)}</section>}
      {attempts.length===0&&available.length===0?<article className="panel"><div className={styles.emptyIcon}>🧠</div><h2>No tienes diagnósticos disponibles todavía</h2><p className="muted-copy">Aparecerán cuando estés inscrito en una materia con diagnóstico o solicites una que lo tenga disponible.</p></article>:<section className={styles.list}>{attempts.map(attempt=>{const course=courseMap.get(attempt.course_key);const result=resultMap.get(attempt.id);const inProgress=attempt.status==="in_progress";return <article className={styles.card} key={attempt.id}><div className={styles.cardHeader}><div><p className="eyebrow">Diagnóstico inicial</p><h2>{course?.icon??"🧠"} {result?.course_name??course?.name??attempt.course_key}</h2><span className={styles.dateText}>{inProgress?`Comenzado el ${formatDate(attempt.started_at)}`:`Realizado el ${formatDate(attempt.completed_at)}`}</span></div><span className={`${styles.status} ${inProgress?styles.statusProgress:styles.statusDone}`}>{inProgress?"En progreso":attempt.status==="limit_reached"?"Mi límite":"Finalizado"}</span></div>{inProgress?<div className={styles.progressPanel}><div><strong>Nivel {attempt.current_level}</strong><span>Tu progreso está guardado.</span></div><button className="primary-button" onClick={()=>openDiagnostic(attempt.course_key,attempt.course_request_id)}>Continuar</button></div>:result?<><div className={styles.placement}><span className={styles.placementIcon}>📍</span><div><small>Ubicación estimada</small><strong>Nivel {result.placement_level}: {result.placement_title}</strong><p>{result.mastered_through_level>0?`Base dominada hasta el Nivel ${result.mastered_through_level}.`:"Conviene comenzar reforzando desde las bases."}</p></div></div><div className={styles.topicColumns}><section><h3>✅ Dominabas</h3><div className={styles.chips}>{result.mastered_topics.length?result.mastered_topics.map(t=><span className={styles.goodChip} key={`${t.level}-${t.key}`}>{t.topic}</span>):<span className={styles.mutedSmall}>Sin temas confirmados todavía.</span>}</div></section><section><h3>📚 Reforzar</h3><div className={styles.chips}>{result.reinforce_topics.length?result.reinforce_topics.map(t=><span className={styles.reinforceChip} key={`${t.level}-${t.key}`}>{t.topic}</span>):<span className={styles.mutedSmall}>Sin temas pendientes detectados.</span>}</div></section></div></>:<div className="auth-message auth-error">El resultado no está disponible todavía.</div>}</article>;})}</section>}
    </>}
  </AppShell>;
}
