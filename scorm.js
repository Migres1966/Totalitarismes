/* SCORM 1.2: un únic SCO, sense dependències externes. */
window.LMS = (() => {
  let api=null, initialized=false, finished=false, message='Mode web · dades en aquest navegador';
  function find(w){for(let i=0;w&&i<12;i++){try{if(w.API)return w.API;if(w.parent===w)break;w=w.parent;}catch(_){break;}}return null;}
  try{api=find(window);if(!api&&window.opener)api=find(window.opener);}catch(_){}
  function get(k){try{return initialized?String(api.LMSGetValue(k)||''):'';}catch(_){return '';}}
  function set(k,v){try{return initialized&&String(api.LMSSetValue(k,String(v)))==='true';}catch(_){return false;}}
  function commit(){try{return initialized&&String(api.LMSCommit(''))==='true';}catch(_){return false;}}
  if(api){try{initialized=String(api.LMSInitialize(''))==='true';}catch(_){}message=initialized?'Moodle · SCORM 1.2 connectat':'SCORM detectat, però no s’ha pogut iniciar';}
  const id=get('cmi.core.student_id'), name=get('cmi.core.student_name');
  let restored=null;try{restored=JSON.parse(get('cmi.suspend_data')||'null');}catch(_){}
  let interactionIndex=Number(get('cmi.interactions._count'))||0;
  function record(module,questions,answers){
    if(!initialized)return;
    questions.forEach((q,i)=>{const n=interactionIndex++;const key=`cmi.interactions.${n}.`;set(key+'id',`ola_${module}_${i}_${n}`);set(key+'type','choice');set(key+'student_response',String.fromCharCode(97+answers[i]));set(key+'correct_responses.0.pattern',String.fromCharCode(97+q.answer));set(key+'result',answers[i]===q.answer?'correct':'wrong');set(key+'weighting','1');});
  }
  function sync(state,summary,seconds){
    if(!initialized)return {ok:!api,compact:false,message};
    let payload=JSON.stringify(state),compact=false;
    if(new TextEncoder().encode(payload).length>3900){
      compact=true;
      payload=JSON.stringify({schema:1,revision:2,course:'la-ola-t8',id:state.id,updated:state.updated,identity:state.identity,diagnostic:'',final:'',reflection:'',checks:[],notes:{},historyPartial:true,compact:true,imported:state.imported||false,quizzes:Object.fromEntries(Object.entries(state.quizzes).map(([k,v])=>[k,{attempts:[],count:v.count,first:v.first,best:v.best,last:v.last}]))});
    }
    const status=summary.complete?(summary.score>=70?'passed':'failed'):'incomplete';
    const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=Math.floor(seconds%60);
    const time=`${String(h).padStart(4,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    const results=[set('cmi.core.score.min',0),set('cmi.core.score.max',100),set('cmi.core.score.raw',summary.score),set('cmi.core.lesson_status',status),set('cmi.core.lesson_location',location.hash.slice(1)),set('cmi.suspend_data',payload),set('cmi.core.exit',status==='passed'?'':'suspend'),set('cmi.core.session_time',time)];
    const ok=results.every(Boolean)&&commit();
    message=ok?(compact?'Moodle desat · textos en aquest navegador; exporta una còpia JSON':'Moodle · progrés sincronitzat'):'No s’ha confirmat el desament a Moodle. Descarrega la còpia JSON.';
    return {ok,compact,message};
  }
  function finish(){if(!initialized||finished)return;commit();try{api.LMSFinish('');}catch(_){}finished=true;}
  return {connected:initialized,detected:!!api,id,name,restored,get message(){return message;},sync,record,finish};
})();
