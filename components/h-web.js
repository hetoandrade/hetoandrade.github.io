const paths = {
  Anexar: '<path d="m9 16 9-9a3 3 0 0 0-4-4L4 13a5 5 0 0 0 7 7L21 10M7 14l8-8" />',
  Enviar: '<path d="m2 11 20-9-7 20-4-8-9-3ZM11 14 22 2" />',
  Excluir: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 10v7M14 10v7" />',
  Confirmar: '<path d="m5 12.5 4.2 4.2L19 7" />'
};
export function hIcone(acao) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[acao] || ''}</svg>`;
}
const estilo = `:host([compacto]){font-size:13px}:host([compacto]) .erro:empty,:host([compacto]) .anexos:empty{display:none}:host{display:block;font-family:inherit;color:var(--h-azul-escuro,#0d47a1)}*{box-sizing:border-box}button{font:inherit;cursor:pointer;border-radius:8px}button:disabled{cursor:wait;opacity:.6}svg{width:22px;height:22px;flex-shrink:0}.erro{margin-top:6px;min-height:1em;font-size:13px;color:#b45309}.acao{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:42px;padding:10px 16px;border:1px solid var(--h-azul,#42a5f5);color:#0d47a1;background:transparent;box-shadow:none}.acao.primario{color:#fff;background:var(--h-degrade,linear-gradient(135deg,#42a5f5,#0d47a1));border:0}:host([compacto]) .acao{min-height:30px;padding:5px 9px;font-size:13px}button:focus-visible{outline:2px solid #42a5f5;outline-offset:3px}[hidden]{display:none!important}.anexos{display:flex;flex-wrap:wrap;gap:12px;margin-top:14px}.anexo{display:flex;align-items:center;gap:12px;max-width:100%;padding:12px;border:1px solid #dbeafe;border-radius:4px;background:#fff}.anexo img{width:110px;height:80px;object-fit:contain;background:#f3f6fa}.dados{min-width:0}.nome{display:block;overflow-wrap:anywhere;color:#15283b}.tamanho{display:block;margin:5px 0 8px;color:#64748b;font-size:13px}`;

export class HBotaoWeb extends HTMLElement {
  connectedCallback(){
    if(this.shadowRoot)return;
    const root=this.attachShadow({mode:'open'});
    if(this.hasAttribute('superficie')){
      root.innerHTML='<style>:host{display:contents}::slotted(button){border-radius:8px!important}</style><slot></slot>';
      return;
    }
    root.innerHTML=`<style>${estilo}:host{display:inline-block}</style><button type="button" class="acao ${this.hasAttribute('primario')?'primario':''}"><span class="icone">${hIcone(this.getAttribute('acao'))}</span><span class="texto"></span></button>`;
    root.querySelector('.texto').textContent=this.getAttribute('texto')||'';
    root.querySelector('button').addEventListener('click',()=>this.dispatchEvent(new CustomEvent('h-acao',{bubbles:true})));
  }
  set ocupado(v){(this.hasAttribute('superficie')?this.querySelector('button'):this.shadowRoot.querySelector('button')).disabled=v;}
}
export class HAnexosWeb extends HTMLElement {
  arquivos=[];
  diagnostico=null;
  urls=[];
  connectedCallback(){
    if(this.shadowRoot)return;
    const root=this.attachShadow({mode:'open'});
    root.innerHTML=`<style>${estilo}.acoes{display:flex;gap:16px;flex-wrap:wrap}:host([compacto]) .acoes{gap:10px}.erro{color:#b91c1c}.diagnostico:not(:empty){margin-top:10px}.diagnostico .anexo{justify-content:space-between}</style><input id="imagens" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden><input id="zip" type="file" accept=".zip,application/zip,application/x-zip-compressed" hidden><div class="acoes"><h-botao-web id="selecionar-imagens" acao="Anexar" texto="Selecionar imagens"></h-botao-web><h-botao-web id="anexar-log" acao="Anexar" texto="Anexar log (.zip)"></h-botao-web></div><div class="erro erro-imagens" aria-live="polite"></div><div class="anexos"></div><div class="erro erro-zip" aria-live="polite"></div><div class="diagnostico"></div>`;
    const imagens=root.getElementById('imagens');
    const zip=root.getElementById('zip');
    root.getElementById('selecionar-imagens').addEventListener('h-acao',()=>imagens.click());
    root.getElementById('anexar-log').addEventListener('h-acao',()=>zip.click());
    imagens.addEventListener('change',()=>{this.adicionar(Array.from(imagens.files));imagens.value='';});
    zip.addEventListener('change',()=>{this.adicionarDiagnostico(Array.from(zip.files));zip.value='';});
    if(this.hasAttribute('compacto'))root.querySelectorAll('h-botao-web').forEach(b=>b.setAttribute('compacto',''));
  }
  adicionar(arquivos){
    if(this.busy || !arquivos.length)return;
    const zips=arquivos.filter(f=>/\.zip$/i.test(f.name));
    if(zips.length){
      this.adicionarDiagnostico(zips);
      arquivos=arquivos.filter(f=>!zips.includes(f));
      if(!arquivos.length)return;
    }
    this.erro='';
    if(arquivos.some(f=>!['image/png','image/jpeg','image/webp'].includes(f.type))){this.erro='Selecione imagens PNG, JPEG ou WebP.';return;}
    if(this.arquivos.length+arquivos.length>3 || [...this.arquivos,...arquivos].reduce((s,f)=>s+f.size,0)>10*1024*1024){this.erro='Envie até três imagens, somando no máximo 10 MB.';return;}
    this.arquivos.push(...arquivos);this.renderizar();this.dispatchEvent(new CustomEvent('h-alterado',{bubbles:true}));
  }
  adicionarDiagnostico(arquivos){
    if(this.busy || !arquivos.length)return;
    this.erroDiagnostico='';
    if(arquivos.length!==1 || this.diagnostico){this.erroDiagnostico='Anexe um ZIP por chamado. Remova o atual para escolher outro.';return;}
    const arquivo=arquivos[0];
    if(!/\.zip$/i.test(arquivo.name) || arquivo.size<22 || arquivo.size>100*1024*1024){this.erroDiagnostico='Selecione um arquivo ZIP de até 100 MB.';return;}
    this.diagnostico=arquivo;
    this.renderizarDiagnostico();
    this.dispatchEvent(new CustomEvent('h-alterado',{bubbles:true}));
  }
  set erro(v){this.shadowRoot.querySelector('.erro-imagens').textContent=v;}
  set erroDiagnostico(v){this.shadowRoot.querySelector('.erro-zip').textContent=v;}
  set ocupado(v){this.busy=v;this.shadowRoot.querySelectorAll('input').forEach(i=>i.disabled=v);this.shadowRoot.querySelectorAll('h-botao-web').forEach(b=>b.ocupado=v);}
  limpar(){this.arquivos=[];this.diagnostico=null;this.erro='';this.erroDiagnostico='';this.renderizar();this.renderizarDiagnostico();}
  desconectarURLs(){this.urls.forEach(URL.revokeObjectURL);this.urls=[];}
  disconnectedCallback(){this.desconectarURLs();}
  renderizarDiagnostico(){
    const lista=this.shadowRoot.querySelector('.diagnostico');lista.replaceChildren();
    if(!this.diagnostico)return;
    const card=document.createElement('div');card.className='anexo';
    const dados=document.createElement('div');dados.className='dados';
    const nome=document.createElement('strong');nome.className='nome';nome.textContent=this.diagnostico.name;
    const tamanho=document.createElement('span');tamanho.className='tamanho';
    tamanho.textContent=`ZIP · ${Math.ceil(this.diagnostico.size/1024).toLocaleString('pt-BR')} KB`;
    const remover=document.createElement('h-botao-web');remover.setAttribute('acao','Excluir');remover.setAttribute('texto','Remover');remover.setAttribute('compacto','');
    remover.addEventListener('h-acao',()=>{
      if(this.busy)return;
      this.diagnostico=null;this.erroDiagnostico='';this.renderizarDiagnostico();
      this.dispatchEvent(new CustomEvent('h-alterado',{bubbles:true}));
    });
    dados.append(nome,tamanho);card.append(dados,remover);lista.append(card);
  }
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
customElements.define('h-botao-web',HBotaoWeb);
customElements.define('h-anexos-web',HAnexosWeb);
