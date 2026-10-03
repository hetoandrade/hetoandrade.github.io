import './components/h-web.js';

const form=document.getElementById('chamados-form');
const email=document.getElementById('chamados-email');
const descricao=document.getElementById('chamados-descricao');
const anexos=document.getElementById('chamados-anexos');
const enviar=document.getElementById('chamados-enviar');
const aviso=document.getElementById('chamados-aviso');
let enviando=false;
let identificacao=null;
let assinatura=null;
try {
  const anterior=JSON.parse(sessionStorage.getItem('heto-chamado-envio') || 'null');
  if(anterior?.ID && anterior?.ASSINATURA){identificacao=anterior.ID;assinatura=anterior.ASSINATURA;}
} catch {}
descricao.addEventListener('h-colar-imagens',e=>anexos.adicionar(e.detail));
form.addEventListener('h-alterado',()=>{if(aviso.classList.contains('sucesso'))mensagem('');});
form.addEventListener('submit',e=>{e.preventDefault();enviarChamado();});
enviar.addEventListener('h-acao',()=>enviarChamado());

function mensagem(texto,tipo='erro'){
  aviso.textContent=texto;aviso.className=`chamados-aviso ${tipo}`;aviso.hidden=!texto;
}
async function fingerprint(){
  const textos=new TextEncoder().encode(email.value.trim()+'\n'+descricao.value);
  const hashes=[await crypto.subtle.digest('SHA-256',textos)];
  for(const arquivo of anexos.arquivos)hashes.push(await crypto.subtle.digest('SHA-256',await arquivo.arrayBuffer()));
  return hashes.map(h=>Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('')).join(':');
}
async function enviarChamado(){
  if(enviando)return;
  email.erro='';descricao.erro='';
  let valido=true;
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) || /[^\x00-\x7F]/.test(email.value)){
    email.erro='Informe um e-mail válido.';email.focus();valido=false;
  }
  if(!descricao.value.trim() || descricao.value.length>10000){
    descricao.erro='Informe a descrição com até 10 mil caracteres.';if(valido)descricao.focus();valido=false;
  }
  if(!valido)return;
  enviando=true;[email,descricao,anexos,enviar].forEach(c=>c.ocupado=true);mensagem('');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
  try{
    const atual=await fingerprint();
    if(atual!==assinatura){identificacao=crypto.randomUUID();assinatura=atual;}
    try{sessionStorage.setItem('heto-chamado-envio',JSON.stringify({ID:identificacao,ASSINATURA:assinatura}));}catch{}
    const configuracao=await fetch('chamados-config.json',{cache:'no-store',signal:controller.signal});
    if(!configuracao.ok)throw new Error('O serviço de chamados não está configurado.');
    const config=await configuracao.json();
    const url=new URL(config.API_URL);
    if(url.protocol!=='https:' || url.hostname!=='chamados.hetoandrade.com.br' || url.pathname!=='/api/chamados')
      throw new Error('O endereço do serviço de chamados não passou na verificação.');
    const dados=new FormData();dados.append('CLIENTE_ID',identificacao);dados.append('EMAIL',email.value.trim());dados.append('DESCRICAO',descricao.value);
    anexos.arquivos.forEach((f,i)=>dados.append('IMAGENS',f,f.name||`captura-${i+1}.png`));
    const response=await fetch(url.href,{method:'POST',body:dados,signal:controller.signal,credentials:'omit'});
    const resultado=await response.json().catch(()=>null);
    if(!response.ok){
      if(resultado?.CAMPO==='EMAIL'){email.erro=resultado.MENSAGEM;email.focus();return;}
      if(resultado?.CAMPO==='DESCRICAO'){descricao.erro=resultado.MENSAGEM;descricao.focus();return;}
      if(resultado?.CAMPO==='IMAGENS'){anexos.erro=resultado.MENSAGEM;return;}
      throw new Error(resultado?.MENSAGEM || 'Não foi possível registrar o chamado. Tente novamente.');
    }
    if(resultado?.ID!==identificacao || !Number.isSafeInteger(resultado.NUMERO) || resultado.NUMERO<1)
      throw new Error('Não foi possível confirmar o recebimento. Tente novamente; a identificação deste envio será mantida.');
    mensagem(`Chamado CH-${String(resultado.NUMERO).padStart(6,'0')} recebido. Obrigado pelo seu relato!`,'sucesso');
    email.value='';descricao.value='';anexos.limpar();identificacao=null;assinatura=null;
    try{sessionStorage.removeItem('heto-chamado-envio');}catch{}
  }catch(error){
    mensagem(error.name==='AbortError'?'Não foi possível confirmar o recebimento a tempo. Seu relato foi mantido; você pode tentar novamente.':
      error instanceof TypeError?'Não foi possível conectar ao serviço de chamados. Seu relato foi mantido; tente novamente em instantes.':error.message);
  }finally{clearTimeout(timer);enviando=false;[email,descricao,anexos,enviar].forEach(c=>c.ocupado=false);}
}
