const estilos = ['comp.css', 'h-campos-web.css'].map(nome => new URL('../css/' + nome, import.meta.url));

export function arquivosColados(clipboard) {
    if (!clipboard) return [];
    const arquivos = Array.from(clipboard.items || [])
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter(Boolean);
    return arquivos.length ? arquivos : Array.from(clipboard.files || []);
}

class HCampoWeb extends HTMLElement {
    connectedCallback() {
        if (this.shadowRoot) return;

        const root = this.attachShadow({ mode: 'open' });
        const memo = this instanceof HMemoWeb;
        const obrigatorio = this.hasAttribute('obrigatorio');
        const rotulo = this.getAttribute('rotulo') || '';
        root.innerHTML = `
            <div class="${memo ? 'hmemo h-rolagem-fio-minimo' : 'hinput hinput-validacao'}">
                <div class="${memo ? 'hmemo-field' : 'hinput-field'}">
                    ${memo ? '<textarea id="entrada" class="h-rolagem-fio-curto"></textarea>' : '<input id="entrada">'}
                    <label for="entrada"${memo ? ' class="hmemo-label"' : ''}></label>
                    ${memo
                        ? '<button type="button" class="hbutton hbutton-apresentacao hbutton-limparcampo hbutton-soicone hbutton-tipo-limpar hbutton-cores-estaveis hbutton-hover-padrao" hidden><span class="hbutton-icone-glifo hbutton-icone-limpar" aria-hidden="true">⌫</span></button>'
                        : '<div class="hinput-actions"><button class="hinput-clear" type="button" hidden>⌫</button></div>'}
                </div>
                <div id="erro" class="hvalidacao-oculta" role="alert" aria-atomic="true">
                    <svg class="h-icone" viewBox="0 0 24 24" width="16" height="16" fill="none"
                         stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
                         aria-hidden="true" focusable="false"><path d="M12 3L22 21H2Z M12 9V14 M12 17V17.2"/></svg>
                    <span></span>
                </div>
            </div>`;

        const folhas = memo ? [...estilos, new URL('../css/h-rolagem.css', import.meta.url)] : estilos;
        for (const href of folhas) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            root.insertBefore(link, root.lastElementChild);
        }

        const entrada = root.getElementById('entrada');
        const campo = entrada.parentElement;
        const limpar = root.querySelector('button');
        this.entrada = entrada;
        this.limpar = limpar;
        this.campo = campo;
        this.validacao = root.getElementById('erro');

        entrada.required = obrigatorio;
        if (obrigatorio) entrada.setAttribute('aria-required', 'true');
        entrada.setAttribute('aria-describedby', 'erro');
        const maximo = Number(this.getAttribute('maxlength'));
        if (this.hasAttribute('maxlength') && Number.isInteger(maximo) && maximo >= 0) {
            entrada.maxLength = maximo;
        }
        root.querySelector('label').textContent = rotulo;
        limpar.setAttribute('aria-label', 'Limpar ' + (rotulo || 'campo').toLocaleLowerCase('pt-BR'));

        if (memo) {
            const linhas = Number(this.getAttribute('linhas'));
            entrada.rows = Number.isInteger(linhas) && linhas > 0 ? linhas : 4;
        } else {
            entrada.type = this.getAttribute('tipo') || 'text';
            if (this.hasAttribute('autocomplete')) entrada.autocomplete = this.getAttribute('autocomplete');
        }

        const classeFoco = memo ? 'hmemo-focused' : 'hinput-focused';
        campo.addEventListener('focusin', () => campo.classList.add(classeFoco));
        campo.addEventListener('focusout', evento => {
            if (!campo.contains(evento.relatedTarget)) campo.classList.remove(classeFoco);
        });
        limpar.addEventListener('click', () => {
            this.value = '';
            this.focus();
            this.alterado();
        });
        entrada.addEventListener('input', () => this.alterado());

        const erroAcentos = this.getAttribute('erro-caracteres');
        if (erroAcentos) {
            entrada.addEventListener('beforeinput', evento => {
                if (evento.data) this.validarCaracteres(evento, evento.data, erroAcentos);
            });
        }
        entrada.addEventListener('paste', evento => {
            const clipboard = evento.clipboardData;
            if (!clipboard || entrada.readOnly) return;

            const texto = clipboard.getData('text/plain');
            if (erroAcentos) this.validarCaracteres(evento, texto, erroAcentos);
            if (!this.hasAttribute('colar-arquivos')) return;

            const arquivos = arquivosColados(clipboard);
            if (!arquivos.length) return;
            if (!texto) evento.preventDefault();
            this.dispatchEvent(new CustomEvent('h-colar-arquivos', { detail: arquivos, bubbles: true }));
        });
    }

    get value() { return this.entrada.value; }
    set value(valor) {
        this.entrada.value = valor;
        this.limpar.hidden = !this.value;
    }

    get valido() { return this.entrada.validity.valid && (!this.entrada.required || Boolean(this.value.trim())); }

    set erro(mensagem) {
        const invalido = Boolean(mensagem);
        this.campo.classList.toggle('hinput-invalido', invalido);
        this.entrada.setAttribute('aria-invalid', String(invalido));
        this.validacao.querySelector('span').textContent = mensagem;
        this.validacao.className = invalido ? 'hvalidacao-tag' : 'hvalidacao-oculta';
    }

    set ocupado(ocupado) {
        this.entrada.readOnly = ocupado;
        this.limpar.disabled = ocupado;
        this.campo.classList.toggle(this instanceof HMemoWeb ? 'hmemo-readonly-field' : 'hinput-readonly-field', ocupado);
    }

    focus(opcoes) { this.entrada.focus(opcoes); }

    alterado() {
        this.limpar.hidden = !this.value;
        this.erro = '';
        this.dispatchEvent(new CustomEvent('h-alterado', { bubbles: true }));
    }

    validarCaracteres(evento, texto, mensagem) {
        if (/[^\x00-\x7F]/.test(texto)) {
            evento.preventDefault();
            this.erro = mensagem;
        }
    }
}

export class HInputWeb extends HCampoWeb {}
export class HMemoWeb extends HCampoWeb {}

customElements.define('h-input-web', HInputWeb);
customElements.define('h-memo-web', HMemoWeb);
