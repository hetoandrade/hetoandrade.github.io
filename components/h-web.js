const paths = {
  Anexar: '<path d="m9 16 9-9a3 3 0 0 0-4-4L4 13a5 5 0 0 0 7 7L21 10M7 14l8-8" />',
  Enviar: '<path d="m2 11 20-9-7 20-4-8-9-3ZM11 14 22 2" />',
  Excluir: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7M14 10v7" />',
  Confirmar: '<path d="m5 12.5 4.2 4.2L19 7" />'
};
export function hIcone(acao) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[acao] || ''}</svg>`;
}
const estilo = `:host{display:block;font-family:inherit;color:var(--h-azul-escuro,#0d47a1)}*{box-sizing:border-box}button,input,textarea{font:inherit}button{cursor:pointer;border-radius:4px}button:disabled{cursor:wait;opacity:.6}svg{width:22px;height:22px;flex-shrink:0}label{display:block;font-weight:600;margin-bottom:8px}.campo{display:flex;align-items:stretch;border:1px solid var(--erp-border,#dbeafe);border-radius:4px;background:#fff}.campo:focus-within{border-color:var(--h-azul,#42a5f5);box-shadow:0 0 0 2px #42a5f526}input,textarea{flex:1;min-width:0;width:100%;padding:14px 16px;color:#15283b;background:transparent;border:0!important;outline:0!important;box-shadow:none!important}textarea{resize:vertical;min-height:150px;padding-right:76px}:host([multilinha]) .campo{position:relative}:host([multilinha]) .limpar{position:absolute;top:0;right:10px}.limpar{display:flex;align-items:center;justify-content:center;align-self:flex-start;flex-shrink:0;background:transparent;border:0;color:#64748b;padding:12px;font-size:22px;line-height:1}.erro{margin-top:6px;min-height:1em;font-size:13px;color:#b45309}.acao{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:42px;padding:10px 16px;border:1px solid var(--h-azul,#42a5f5);color:#0d47a1;background:transparent;box-shadow:none}.acao.primario{color:#fff;background:var(--h-degrade,linear-gradient(135deg,#42a5f5,#0d47a1));border:0}:host([compacto]) .acao{min-height:30px;padding:5px 9px;font-size:13px}button:focus-visible{outline:2px solid #42a5f5;outline-offset:3px}[hidden]{display:none!important}.anexos{display:flex;flex-wrap:wrap;gap:12px;margin-top:14px}.anexo{display:flex;align-items:center;gap:12px;max-width:100%;padding:12px;border:1px solid #dbeafe;border-radius:4px;background:#fff}.anexo img{width:110px;height:80px;object-fit:contain;background:#f3f6fa}.dados{min-width:0}.nome{display:block;overflow-wrap:anywhere;color:#15283b}.tamanho{display:block;margin:5px 0 8px;color:#64748b;font-size:13px}textarea{scrollbar-width:thin;scrollbar-color:transparent transparent}.campo:hover textarea,.campo:focus-within textarea{scrollbar-color:#8ac7a9 transparent}@media(hover:none){textarea{scrollbar-color:#8ac7a9 transparent}}textarea::-webkit-scrollbar{width:10px}textarea::-webkit-scrollbar-thumb{background:transparent;border:3.5px solid transparent;background-clip:padding-box;border-radius:4px}.campo:hover textarea::-webkit-scrollbar-thumb,.campo:focus-within textarea::-webkit-scrollbar-thumb{background-color:#8ac7a9}@media(hover:none){textarea::-webkit-scrollbar-thumb{background-color:#8ac7a9}}`;

export class HCampoWeb extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({mode:'open'});
    const memo = this.hasAttribute('multilinha');
    root.innerHTML = `<style>${estilo}</style><label for="entrada"></label><div class="campo"><${memo?'textarea':'input'} id="entrada" aria-describedby="erro" ${memo?'rows="5"':'type="email" autocomplete="email"'}></${memo?'textarea':'input'}><button class="limpar" type="button" aria-label="Limpar campo" hidden>⌫</button></div><div class="erro" id="erro" aria-live="polite"></div>`;
    this.entrada = root.querySelector('#entrada');
    this.entrada.setAttribute('aria-required','true');
    this.entrada.maxLength = Number(this.getAttribute('maxlength') || (memo?10000:254));
    root.querySelector('label').textContent = this.getAttribute('rotulo') || '';
    root.querySelector('.limpar').setAttribute('aria-label','Limpar '+(this.getAttribute('rotulo') || 'campo').toLocaleLowerCase('pt-BR'));
    root.querySelector('.limpar').addEventListener('click', () => { this.value=''; this.entrada.focus(); this.alterado(); });
    this.entrada.addEventListener('input', () => this.alterado());
    this.entrada.addEventListener('beforeinput', e => {
      if (!memo && e.data && /[^\x00-\x7F]/.test(e.data)) { e.preventDefault(); this.erro='O e-mail deve usar caracteres sem acentos.'; }
    });
    this.entrada.addEventListener('paste', e => {
      if (!memo && /[^\x00-\x7F]/.test(e.clipboardData.getData('text/plain'))) {
        e.preventDefault(); this.erro='O e-mail deve usar caracteres sem acentos.';
      }
      if (memo && !this.entrada.readOnly) {
        const arquivos = Array.from(e.clipboardData.items).filter(i=>i.kind==='file').map(i=>i.getAsFile()).filter(Boolean);
        if (arquivos.length) this.dispatchEvent(new CustomEvent('h-colar-imagens',{detail:arquivos,bubbles:true}));
      }
    });
  }
  get value(){ return this.entrada?.value || ''; }
  set value(v){ this.entrada.value=v; this.shadowRoot.querySelector('.limpar').hidden=!v; }
  set erro(v){ this.shadowRoot.querySelector('.erro').textContent=v; this.entrada.setAttribute('aria-invalid',String(Boolean(v))); }
  set ocupado(v){ this.entrada.readOnly=v; this.shadowRoot.querySelector('.limpar').disabled=v; }
  focus(){ this.entrada.focus(); }
  alterado(){ this.shadowRoot.querySelector('.limpar').hidden=!this.value; this.erro=''; this.dispatchEvent(new CustomEvent('h-alterado',{bubbles:true})); }
}
export class HBotaoWeb extends HTMLElement {
  connectedCallback(){
    if(this.shadowRoot)return;
    const root=this.attachShadow({mode:'open'});
    root.innerHTML=`<style>${estilo}:host{display:inline-block}</style><button type="button" class="acao ${this.hasAttribute('primario')?'primario':''}"><span class="icone">${hIcone(this.getAttribute('acao'))}</span><span class="texto"></span></button>`;
    root.querySelector('.texto').textContent=this.getAttribute('texto')||'';
    root.querySelector('button').addEventListener('click',()=>this.dispatchEvent(new CustomEvent('h-acao',{bubbles:true})));
  }
  set ocupado(v){this.shadowRoot.querySelector('button').disabled=v;}
}
export class HAnexosWeb extends HTMLElement {
  arquivos=[];
  urls=[];
  connectedCallback(){
    if(this.shadowRoot)return;
    const root=this.attachShadow({mode:'open'});
    root.innerHTML=`<style>${estilo}</style><input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden><h-botao-web acao="Anexar" texto="Selecionar imagens"></h-botao-web><div class="erro" aria-live="polite"></div><div class="anexos"></div>`;
    root.querySelector('h-botao-web').addEventListener('h-acao',()=>root.querySelector('input').click());
    root.querySelector('input').addEventListener('change',e=>{this.adicionar(Array.from(e.target.files));e.target.value='';});
  }
  adicionar(arquivos){
    if(this.busy)return;
    this.erro='';
    if(arquivos.some(f=>!['image/png','image/jpeg','image/webp'].includes(f.type))){this.erro='Selecione imagens PNG, JPEG ou WebP.';return;}
    if(this.arquivos.length+arquivos.length>3 || [...this.arquivos,...arquivos].reduce((s,f)=>s+f.size,0)>10*1024*1024){this.erro='Envie até três imagens, somando no máximo 10 MB.';return;}
    this.arquivos.push(...arquivos);this.renderizar();this.dispatchEvent(new CustomEvent('h-alterado',{bubbles:true}));
  }
  set erro(v){this.shadowRoot.querySelector('.erro').textContent=v;}
  set ocupado(v){this.busy=v;this.shadowRoot.querySelector('input').disabled=v;this.shadowRoot.querySelectorAll('h-botao-web').forEach(b=>b.ocupado=v);}
  limpar(){this.arquivos=[];this.erro='';this.renderizar();}
  desconectarURLs(){this.urls.forEach(URL.revokeObjectURL);this.urls=[];}
  disconnectedCallback(){this.desconectarURLs();}
  renderizar(){
    this.desconectarURLs();const lista=this.shadowRoot.querySelector('.anexos');lista.replaceChildren();
    this.arquivos.forEach((file,index)=>{
      const card=document.createElement('div');card.className='anexo';
      const img=document.createElement('img');img.src=URL.createObjectURL(file);this.urls.push(img.src);img.alt='Prévia da imagem anexada';
      const dados=document.createElement('div');dados.className='dados';
      const nome=document.createElement('span');nome.className='nome';nome.textContent=file.name||`captura-${index+1}.png`;
      const tamanho=document.createElement('span');tamanho.className='tamanho';tamanho.textContent=`${Math.ceil(file.size/1024)} KB`;
      const remover=document.createElement('h-botao-web');remover.setAttribute('acao','Excluir');remover.setAttribute('texto','Remover');remover.setAttribute('compacto','');
      remover.addEventListener('h-acao',()=>{if(this.busy)return;this.erro='';this.arquivos.splice(index,1);this.renderizar();this.dispatchEvent(new CustomEvent('h-alterado',{bubbles:true}));});
      dados.append(nome,tamanho,remover);card.append(img,dados);lista.append(card);
    });
  }
}
customElements.define('h-campo-web',HCampoWeb);
customElements.define('h-botao-web',HBotaoWeb);
customElements.define('h-anexos-web',HAnexosWeb);
