/**
 * FormManager - Gerenciador de formulário com auto-salvamento
 * 
 * Esta classe fornece um gerenciador completo para formulários grandes,
 * com funcionalidades de auto-salvamento, backup local, e feedback visual.
 */
class FormManager {
    constructor(options = {}) {
      // Configurações padrão
      this.config = {
        formSelector: 'form',
        saveEndpoint: '/auto_save_form/',
        saveInterval: 60000, // 1 minuto
        debounceTime: 3000,  // 3 segundos
        maxRetries: 3,
        localStoragePrefix: 'form_backup_',
        cpfFieldId: 'cpf',
        statusMessageDuration: 3000,
        duplicateErrorTimeout: 30000, // 30 segundos de bloqueio após erro de duplicidade
        ...options
      };
  
      // Estado interno
      this.state = {
        initialData: null,
        lastSavedData: null,
        pendingSave: false,
        saveTimer: null,
        retryCount: 0,
        saveQueue: [],
        processingQueue: false,
        modifiedFields: new Set(),
        fieldTimers: new Map(),
        isSaving: false,                // Indica se um salvamento está em andamento
        lastSaveTimestamp: 0,           // Timestamp do último salvamento (para controle de frequência)
        duplicateErrorBlocked: false,   // Bloqueio por erro de duplicidade
        duplicateErrorTimer: null       // Timer para liberar bloqueio de duplicidade
      };
  
      // Inicialização
      this.init();
    }
    
    /**
     * Normaliza os nomes de recrutadores para garantir consistência
     * @param {string} recrutadorNome - O nome do recrutador a ser normalizado
     * @returns {string} - O nome normalizado
     */
    normalizeRecruiterName(recrutadorNome) {
      // Lista de nomes de recrutadores normalizados
      const recrutadores = {
        "samira": "Samira Barbosa",
        "nara": "Nara Rodrigues",
        "wilson": "Wilson Monteiro",
        "vivian": "Vivian Wanderley",
        "grasielle": "Grasielle Mapa",
        "guilherme": "Guilherme Vieira"
      };
      
      // Se não houver valor ou for nulo, retorna string vazia
      if (!recrutadorNome) return "";
      
      // Converte para string e remove espaços desnecessários
      const nomeNormalizado = String(recrutadorNome).trim();
      
      // Verifica se o nome contém alguma palavra-chave dos recrutadores
      for (const [chave, nomeCompleto] of Object.entries(recrutadores)) {
        if (nomeNormalizado.toLowerCase().includes(chave.toLowerCase())) {
          console.log(`Recrutador normalizado: ${nomeNormalizado} -> ${nomeCompleto}`);
          return nomeCompleto;
        }
      }
      
      // Se não encontrou correspondência mas tem um nome válido, retorna como está
      return nomeNormalizado !== "None" && nomeNormalizado !== "undefined" ? nomeNormalizado : "";
    }
  
    /**
     * Inicializa o gerenciador de formulário
     */
    init() {
      console.log('Inicializando FormManager...');
  
      // Referências para elementos do DOM
      this.form = document.querySelector(this.config.formSelector);
      if (!this.form) {
        console.error('Formulário não encontrado:', this.config.formSelector);
        return;
      }
  
      // Verifica se temos o campo CPF
      this.cpfField = document.getElementById(this.config.cpfFieldId);
      if (!this.cpfField) {
        console.error('Campo CPF não encontrado:', this.config.cpfFieldId);
        return;
      }
  
      // Criar elemento para status
      this.createStatusElement();
  
      // Inicializar estado
      this.captureInitialState();
  
      // Verificar backups locais
      this.checkLocalBackups();
  
      // Configurar listeners de eventos
      this.setupEventListeners();
  
      // Iniciar temporizador de auto-salvamento
      this.startAutoSaveTimer();
  
      console.log('FormManager inicializado com sucesso');
    }
  
    /**
     * Captura o estado inicial do formulário para comparação
     */
    captureInitialState() {
      const formData = this.getFormData();
      this.state.initialData = JSON.stringify(formData);
      this.state.lastSavedData = this.state.initialData;
      console.log('Estado inicial do formulário capturado');
    }
  
    /**
     * Cria o elemento de status para feedback visual
     */
    createStatusElement() {
      // Remover elemento existente se houver
      const existingStatus = document.getElementById('form-save-status');
      if (existingStatus) {
        existingStatus.remove();
      }
  
      // Criar novo elemento de status
      const statusElement = document.createElement('div');
      statusElement.id = 'form-save-status';
      statusElement.className = 'save-status-indicator';
      statusElement.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 15px;
        border-radius: 5px;
        background-color: #f8f9fa;
        color: #212529;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        transition: all 0.3s ease;
        opacity: 0;
        visibility: hidden;
        display: flex;
        align-items: center;
        gap: 10px;
      `;
  
      // Adicionar à página
      document.body.appendChild(statusElement);
      this.statusElement = statusElement;
    }
  
    /**
     * Configura todos os listeners de eventos necessários
     */
    setupEventListeners() {
      // Para cada tipo de campo, adicionamos o listener apropriado
      const formElements = this.form.querySelectorAll('input, select, textarea');
      
      formElements.forEach(element => {
        // Ignorar elementos sem nome ou sem id
        if (!element.name && !element.id) return;
        
        // Diferentes tipos de eventos baseados no tipo de campo
        if (element.type === 'checkbox' || element.type === 'radio') {
          element.addEventListener('change', () => this.onFieldChange(element));
        } else if (element.tagName === 'SELECT') {
          element.addEventListener('change', () => this.onFieldChange(element));
        } else if (element.type === 'file') {
          // Para uploads de arquivo, lide com isso separadamente
          // Geralmente arquivos são tratados em um endpoint separado
        } else {
          // Para campos de texto, usamos input com debounce
          element.addEventListener('input', () => this.onFieldChange(element));
          // Também salvamos no blur para garantir
          element.addEventListener('blur', () => this.onFieldBlur(element));
        }
      });
  
      // Evento de saída da página
      window.addEventListener('beforeunload', (e) => this.onBeforeUnload(e));
      
      // Evento de mudança de visibilidade
      document.addEventListener('visibilitychange', () => this.onVisibilityChange());
    }
  
    /**
     * Manipula a mudança em um campo
     * @param {Element} field - O campo que foi alterado
     */
    onFieldChange(field) {
      // Identifica o campo
      const fieldId = field.name || field.id;
      
      // Adiciona à lista de campos modificados
      this.state.modifiedFields.add(fieldId);
      
      // Cancela o timer existente para este campo
      if (this.state.fieldTimers.has(fieldId)) {
        clearTimeout(this.state.fieldTimers.get(fieldId));
      }
      
      // Cria um novo timer para debounce
      const timer = setTimeout(() => {
        this.debouncedSave();
      }, this.config.debounceTime);
      
      // Armazena o timer
      this.state.fieldTimers.set(fieldId, timer);
    }
  
    /**
     * Manipula o evento de saída de um campo
     * @param {Element} field - O campo que perdeu o foco
     */
    onFieldBlur(field) {
      // Quando um campo perde o foco, cancelamos o debounce
      // e salvamos imediatamente se ele foi modificado
      const fieldId = field.name || field.id;
      
      if (this.state.fieldTimers.has(fieldId)) {
        clearTimeout(this.state.fieldTimers.get(fieldId));
        this.state.fieldTimers.delete(fieldId);
      }
      
      if (this.state.modifiedFields.has(fieldId)) {
        this.debouncedSave();
      }
    }
  
    /**
     * Manipula o evento beforeunload (saída da página)
     * @param {Event} event - O evento beforeunload
     */
    onBeforeUnload(event) {
      // Se houver alterações não salvas
      if (this.hasFormChanged()) {
        // Tenta salvar sincronamente (ou pelo menos localmente)
        this.saveToLocalStorage();
        
        // Avisa o usuário
        const message = 'Você tem alterações não salvas. Tem certeza que deseja sair?';
        event.returnValue = message;
        return message;
      }
    }
  
    /**
     * Manipula a mudança de visibilidade da página
     */
    onVisibilityChange() {
      if (document.visibilityState === 'hidden' && this.hasFormChanged()) {
        // Se a página está sendo ocultada (usuário mudou de aba)
        // e há mudanças, tentamos salvar
        this.saveToLocalStorage();
        this.saveFormData();
      }
    }
  
    /**
     * Inicia o temporizador de auto-salvamento
     */
    startAutoSaveTimer() {
      // Limpa timer existente se houver
      if (this.state.saveTimer) {
        clearInterval(this.state.saveTimer);
      }
      
      // Inicia novo timer
      this.state.saveTimer = setInterval(() => {
        if (this.hasFormChanged()) {
          this.saveFormData();
        }
      }, this.config.saveInterval);
      
      console.log(`Timer de auto-salvamento iniciado (${this.config.saveInterval/1000}s)`);
    }
  
    /**
     * Verifica se o formulário foi modificado desde o último salvamento
     * @returns {boolean} - Verdadeiro se o formulário foi modificado
     */
    hasFormChanged() {
      // Verifica se há campos modificados
      if (this.state.modifiedFields.size === 0) {
        return false;
      }
      
      // Obtém dados atuais
      const currentData = JSON.stringify(this.getFormData());
      const hasChanged = this.state.lastSavedData !== currentData;
      
      // Registra uma mensagem de depuração se houve mudança
      if (hasChanged) {
        console.debug('Formulário modificado, campos alterados:', 
                     [...this.state.modifiedFields].join(', '));
      }
      
      return hasChanged;
    }
  
    /**
     * Salva o formulário com debounce (evita múltiplos salvamentos)
     */
    debouncedSave() {
      // Se já estamos salvando ou bloqueados por erro de duplicidade, não faz nada
      if (this.state.isSaving || this.state.duplicateErrorBlocked) {
        console.log('Salvamento ignorado: já existe um em andamento ou bloqueado temporariamente');
        return;
      }
      
      // Se não houve mudanças, não faz nada
      if (!this.hasFormChanged()) {
        console.log('Salvamento ignorado: não houve mudanças no formulário');
        return;
      }
      
      // Verifica limite de tempo entre salvamentos (mínimo 1.5s)
      const now = Date.now();
      const timeSinceLastSave = now - this.state.lastSaveTimestamp;
      if (timeSinceLastSave < 1500) {
        const delay = 1500 - timeSinceLastSave;
        console.log(`Agendando salvamento daqui a ${delay}ms para evitar múltiplos envios`);
        
        // Limpa timer existente para evitar múltiplas chamadas
        if (this.state.pendingSave) {
          clearTimeout(this.state.pendingSaveTimer);
        }
        
        // Cria novo timer com o delay adicional
        this.state.pendingSave = true;
        this.state.pendingSaveTimer = setTimeout(() => {
          this.state.pendingSave = false;
          this.saveFormData();
        }, delay);
        
        return;
      }
      
      // Processo normal de debounce
      if (this.state.pendingSave) {
        return;
      }
      
      this.state.pendingSave = true;
      this.state.pendingSaveTimer = setTimeout(() => {
        this.state.pendingSave = false;
        this.saveFormData();
      }, this.config.debounceTime);
    }
  
    /**
     * Salva os dados do formulário
     * @returns {Promise} - Promessa que resolve quando o salvamento termina
     */
    saveFormData() {
      // Se já estamos salvando, bloqueados por erro de duplicidade ou não há mudanças, não faz nada
      if (this.state.isSaving || this.state.duplicateErrorBlocked || !this.hasFormChanged()) {
        console.log('Salvamento ignorado: já em andamento, bloqueado ou sem mudanças');
        return Promise.resolve();
      }
      
      // Marca como salvando para evitar múltiplos salvamentos simultâneos
      this.state.isSaving = true;
      
      // Atualiza o timestamp do último salvamento
      this.state.lastSaveTimestamp = Date.now();
      
      // Mostra feedback visual de salvamento
      this.showStatusMessage('Salvando...', 'saving');
      
      // Sempre salva localmente primeiro (backup)
      this.saveToLocalStorage();
      
      // Adiciona esta operação à fila
      return new Promise((resolve, reject) => {
        this.state.saveQueue.push({ resolve, reject });
        this.processQueue();
      });
    }
  
    /**
     * Processa a fila de salvamento
     */
    processQueue() {
      // Se já estamos processando ou a fila está vazia, sai
      if (this.state.processingQueue || this.state.saveQueue.length === 0) {
        // Se não temos mais itens na fila, reseta o status de salvamento
        if (this.state.saveQueue.length === 0) {
          this.state.isSaving = false;
        }
        return;
      }
      
      // Marca como processando
      this.state.processingQueue = true;
      
      // Pega o primeiro item da fila
      const { resolve, reject } = this.state.saveQueue.shift();
      
      // Obtém os dados atuais
      const formData = this.getFormData();
      const cpf = this.cpfField.value.replace(/[.-]/g, '').trim();
      
      // Debug: verificar se telefone_recado está presente
      if ('telefone_recado' in formData) {
        console.log(`[DEBUG AUTO-SAVE] telefone_recado encontrado nos dados: "${formData.telefone_recado}"`);
      } else {
        console.warn(`[DEBUG AUTO-SAVE] telefone_recado NÃO encontrado nos dados coletados!`);
        console.log(`[DEBUG AUTO-SAVE] Campos disponíveis:`, Object.keys(formData));
      }
      
      if (!cpf) {
        console.error('CPF não encontrado ou vazio');
        this.showStatusMessage('Erro: CPF não informado', 'error');
        this.state.processingQueue = false;
        this.state.isSaving = false;
        reject(new Error('CPF não informado'));
        this.processQueue(); // Continua processando a fila
        return;
      }
      
      // Prepara os dados para envio
      const formBody = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formBody.append(key, value);
        // Debug específico para telefone_recado
        if (key === 'telefone_recado') {
          console.log(`[DEBUG AUTO-SAVE] Adicionando telefone_recado ao FormData: "${value}"`);
        }
      });
      
      // Configura timeout para a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
      
      // Faz a requisição
      fetch(`${this.config.saveEndpoint}${cpf}`, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formBody,
        credentials: 'include',
        signal: controller.signal
      })
      .then(response => {
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
      })
      .then(data => {
        if (data.success) {
          // Atualiza o estado após salvamento bem-sucedido
          this.state.lastSavedData = JSON.stringify(formData);
          this.state.modifiedFields.clear();
          this.state.retryCount = 0;
          
          // Remove o backup local, pois temos o servidor
          this.removeLocalBackup(cpf);
          
          // Mostra feedback visual
          this.showStatusMessage('Salvo com sucesso', 'success');
          resolve(data);
        } else {
          throw new Error(data.message || 'Erro ao salvar');
        }
      })
      .catch(error => {
        console.error('Erro ao salvar dados:', error);
        
        // Verificar se é um erro de duplicidade (já existe um registro sendo salvo)
        const isDuplicateError = error.message && 
          (error.message.toLowerCase().includes('duplicidade') || 
           error.message.toLowerCase().includes('duplicate') ||
           error.message.toLowerCase().includes('concorrência') || 
           error.message.toLowerCase().includes('já está sendo salvo'));
        
        if (isDuplicateError) {
          console.warn('Detectado erro de duplicidade. Bloqueando salvamentos por alguns segundos.');
          
          // Ativa o bloqueio temporário
          this.state.duplicateErrorBlocked = true;
          
          // Limpa qualquer timer existente
          if (this.state.duplicateErrorTimer) {
            clearTimeout(this.state.duplicateErrorTimer);
          }
          
          // Exibe mensagem para o usuário
          this.showStatusMessage('Formulário sendo salvo por outro processo. Aguarde.', 'warning');
          
          // Define um timer para desbloquear após o tempo configurado
          this.state.duplicateErrorTimer = setTimeout(() => {
            this.state.duplicateErrorBlocked = false;
            console.log('Bloqueio por duplicidade liberado.');
            
            // Após liberar, verifica se ainda há mudanças pendentes
            if (this.hasFormChanged()) {
              console.log('Mudanças pendentes detectadas após bloqueio. Tentando salvar novamente.');
              this.debouncedSave();
            }
          }, this.config.duplicateErrorTimeout);
          
          // Rejeita a promessa com o erro
          reject(error);
        }
        // Lógica de retry para erros de rede
        else if ((error.name === 'TypeError' || error.name === 'AbortError' || 
             error.message.includes('Failed to fetch') || 
             error.message.includes('Network')) && 
            this.state.retryCount < this.config.maxRetries) {
          
          this.state.retryCount++;
          const retryDelay = 3000 * this.state.retryCount;
          
          this.showStatusMessage(`Erro de conexão. Tentando novamente em ${retryDelay/1000}s...`, 'warning');
          
          setTimeout(() => {
            this.state.processingQueue = false;
            this.state.saveQueue.unshift({ resolve, reject });
            this.processQueue();
          }, retryDelay);
        } else {
          // Erro não recuperável
          this.showStatusMessage('Erro ao salvar. Tente manualmente.', 'error');
          reject(error);
          this.state.processingQueue = false;
          this.state.isSaving = false; // Reset do estado de salvamento
          this.processQueue(); // Continua processando a fila
        }
      })
      .finally(() => {
        // Libera para processar o próximo item da fila
        if (this.state.retryCount === 0) {
          this.state.processingQueue = false;
          
          // Quando não há mais retries pendentes, processa o próximo item
          this.processQueue();
        }
      });
    }
  
    /**
     * Salva os dados do formulário localmente (backup)
     */
    saveToLocalStorage() {
      try {
        const formData = this.getFormData();
        const cpf = this.cpfField.value.replace(/[.-]/g, '').trim();
        
        if (cpf) {
          localStorage.setItem(`${this.config.localStoragePrefix}${cpf}`, JSON.stringify({
            data: formData,
            timestamp: new Date().toISOString()
          }));
          console.log('Backup local salvo em localStorage');
        }
      } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
      }
    }
  
    /**
     * Remove o backup local após salvamento bem-sucedido
     * @param {string} cpf - O CPF do candidato
     */
    removeLocalBackup(cpf) {
      try {
        if (cpf) {
          localStorage.removeItem(`${this.config.localStoragePrefix}${cpf}`);
          console.log('Backup local removido após salvamento bem-sucedido');
        }
      } catch (error) {
        console.error('Erro ao remover backup local:', error);
      }
    }
  
    /**
     * Verifica se existem backups locais para recuperação
     */
    checkLocalBackups() {
        try {
          const cpf = this.cpfField.value.replace(/[.-]/g, '').trim();
          
          if (cpf) {
            const backupKey = `${this.config.localStoragePrefix}${cpf}`;
            const backup = localStorage.getItem(backupKey);
            
            if (backup) {
              const backupData = JSON.parse(backup);
              const timestamp = new Date(backupData.timestamp);
              const now = new Date();
              const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));
      
              // Remove o backup automaticamente sem alertar o usuário
              if (diffMinutes < 30) {
                localStorage.removeItem(backupKey);
                console.log('Backup local recente descartado automaticamente.');
              }
            }
          }
        } catch (error) {
          console.error('Erro ao verificar backups locais:', error);
        }
      }
      
  
    /**
     * Restaura dados do backup para o formulário
     * @param {Object} backupData - Os dados a serem restaurados
     */
    restoreFromLocalBackup(backupData) {
      if (!backupData) return;
      
      // Iterar pelos elementos do formulário
      const formElements = this.form.querySelectorAll('input, select, textarea');
      
      formElements.forEach(element => {
        const name = element.name || element.id;
        if (!name || !(name in backupData)) return;
        
        const value = backupData[name];
        
        // Aplicar os valores de acordo com o tipo de elemento
        if (element.type === 'checkbox') {
          if (typeof value === 'string' && value.includes(',')) {
            const values = value.split(',');
            element.checked = values.includes(element.value);
          } else {
            element.checked = (value === element.value) || (value === 'Sim');
          }
        } else if (element.type === 'radio') {
          element.checked = (value === element.value);
        } else if (element.tagName === 'SELECT' && element.multiple) {
          if (typeof value === 'string' && value.includes(',')) {
            const values = value.split(',');
            for (let i = 0; i < element.options.length; i++) {
              element.options[i].selected = values.includes(element.options[i].value);
            }
          }
        } else {
          element.value = value;
        }
        
        // Disparar evento para que outros scripts possam reagir
        element.dispatchEvent(new Event('change', { bubbles: true }));
      });
      
      // Atualizar o estado inicial
      this.captureInitialState();
      
      // Mostrar mensagem de sucesso
      this.showStatusMessage('Dados restaurados do backup local', 'success');
    }
  
    /**
     * Mostra uma mensagem de status
     * @param {string} message - A mensagem a ser exibida
     * @param {string} type - O tipo de mensagem (success, error, warning, saving)
     */
    showStatusMessage(message, type = 'info') {
      if (!this.statusElement) return;
      
      // Define cores e ícones com base no tipo
      let bgColor, textColor, icon;
      
      switch (type) {
        case 'success':
          bgColor = '#d4edda';
          textColor = '#155724';
          icon = '✅';
          break;
        case 'error':
          bgColor = '#f8d7da';
          textColor = '#721c24';
          icon = '❌';
          break;
        case 'warning':
          bgColor = '#fff3cd';
          textColor = '#856404';
          icon = '⚠️';
          break;
        case 'saving':
          bgColor = '#d1ecf1';
          textColor = '#0c5460';
          icon = '⏳';
          break;
        default:
          bgColor = '#f8f9fa';
          textColor = '#212529';
          icon = 'ℹ️';
      }
      
      // Atualiza o elemento de status
      this.statusElement.style.backgroundColor = bgColor;
      this.statusElement.style.color = textColor;
      this.statusElement.style.visibility = 'visible';
      this.statusElement.style.opacity = '1';
      this.statusElement.innerHTML = `${icon} ${message}`;
      
      // Esconde após um tempo (exceto para erros)
      if (type !== 'error') {
        setTimeout(() => {
          this.statusElement.style.opacity = '0';
          setTimeout(() => {
            this.statusElement.style.visibility = 'hidden';
          }, 300);
        }, this.config.statusMessageDuration);
      }
    }
  
    /**
     * Obtém todos os dados do formulário
     * @returns {Object} - Os dados do formulário
     */
    getFormData() {
      const formData = {};
      const checkboxGroups = {};
      const radioGroups = {};
      
      // Seleciona todos os campos do formulário
      const formElements = this.form.querySelectorAll('input, select, textarea');
      
      // Primeiro passo: preparar os grupos de checkboxes e radio buttons
      formElements.forEach(element => {
        try {
          // Ignorar elementos sem nome ou sem id
          if (!element.name && !element.id) return;
          
          // Ignorar elementos desabilitados ou ocultos - EXCETO para motivos de reprovação
          if (element.disabled || (element.type === 'hidden' && 
             !element.name.includes('motivo_reprovacao'))) return;
          
          // Usar o nome do elemento, ou o ID se o nome não estiver disponível
          const fieldName = element.name || element.id;
          
          // Para inputs do tipo checkbox, precisamos agrupá-los por nome
          if (element.type === 'checkbox') {
            if (!checkboxGroups[fieldName]) {
              checkboxGroups[fieldName] = [];
            }
            checkboxGroups[fieldName].push(element);
          }
          
          // Para inputs do tipo radio, precisamos agrupá-los por nome
          if (element.type === 'radio') {
            if (!radioGroups[fieldName]) {
              radioGroups[fieldName] = [];
            }
            radioGroups[fieldName].push(element);
          }
        } catch (error) {
          console.error('Erro ao processar elemento:', element, error);
        }
      });
      
      // Processar todos os grupos de checkboxes
      Object.entries(checkboxGroups).forEach(([groupName, checkboxes]) => {
        try {
          // Se há apenas um checkbox, tratar como booleano
          if (checkboxes.length === 1) {
            const checkbox = checkboxes[0];
            formData[groupName] = checkbox.checked ? (checkbox.value || 'Sim') : 'Não';
          } 
          // Se há múltiplos checkboxes com o mesmo nome, tratar como array
          else {
            const selectedValues = checkboxes
              .filter(cb => cb.checked)
              .map(cb => cb.value || 'Sim');
            
            // Armazenar como string separada por vírgulas
            formData[groupName] = selectedValues.join(',');
          }
        } catch (error) {
          console.error('Erro ao processar grupo de checkboxes:', groupName, error);
          formData[groupName] = '';
        }
      });
      
      // Processar todos os grupos de radio buttons
      Object.entries(radioGroups).forEach(([groupName, radios]) => {
        try {
          const selectedRadio = radios.find(r => r.checked);
          
          if (selectedRadio) {
            formData[groupName] = selectedRadio.value;
          } else {
            formData[groupName] = '';
          }
        } catch (error) {
          console.error('Erro ao processar grupo de radios:', groupName, error);
          formData[groupName] = '';
        }
      });
      
      // Processar os demais campos do formulário
      formElements.forEach(element => {
        try {
          // Ignorar elementos sem nome ou sem id
          if (!element.name && !element.id) return;
          
          // Usar o nome do elemento, ou o ID se o nome não estiver disponível
          const fieldName = element.name || element.id;
          
          // Pular checkboxes e radios, pois já foram processados
          if (element.type === 'checkbox' || element.type === 'radio') {
            return;
          }
          
          if (element.type === 'file') {
            // Para campos de arquivo, apenas indicar se há um arquivo selecionado
            if (element.files && element.files.length > 0) {
              formData[fieldName] = element.files[0].name;
            }
          } else if (element.tagName === 'SELECT' && element.multiple) {
            // Para selects múltiplos, capturar todos os valores selecionados
            formData[fieldName] = Array.from(element.selectedOptions)
              .map(option => option.value)
              .join(',');
          } else {
            // Tratamento especial para o campo de recrutador
            if (fieldName === 'recrutador') {
              formData[fieldName] = this.normalizeRecruiterName(element.value);
              // Log para depuração
              console.log(`Recrutador normalizado: ${element.value} -> ${formData[fieldName]}`);
            } else {
              // Para outros tipos de campos, armazenar o valor diretamente
              formData[fieldName] = element.value;
              // Log de debug para telefone_recado
              if (fieldName === 'telefone_recado') {
                console.log(`[DEBUG] Campo telefone_recado capturado: "${element.value}"`);
              }
            }
          }
        } catch (error) {
          console.error('Erro ao processar elemento:', element, error);
          // Em caso de erro, definir o campo com valor vazio
          if (element.name || element.id) {
            formData[element.name || element.id] = '';
          }
        }
      });
      
      return formData;
    }
  }
  
  // Inicializar o gerenciador de formulário quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    // Criar instância do gerenciador de formulário
    window.formManager = new FormManager({
      formSelector: '#registrationForm',
      saveEndpoint: '/auto_save_form/',
      saveInterval: 300000, // 5 minutos
      debounceTime: 2000,   // 2 segundos
      cpfFieldId: 'cpf'
    });
    
    // Adicionar listener específico para o campo de recrutador
    const recrutadorSelect = document.getElementById('recrutador-select');
    if (recrutadorSelect) {
      recrutadorSelect.addEventListener('change', (e) => {
        // Normaliza o valor do recrutador imediatamente ao selecionar
        const normalizedValue = window.formManager.normalizeRecruiterName(e.target.value);
        if (normalizedValue !== e.target.value) {
          console.log(`Normalizando recrutador na interface: ${e.target.value} -> ${normalizedValue}`);
          e.target.value = normalizedValue;
        }
        // Forçar salvamento ao selecionar um recrutador - isso garante que o campo seja salvo corretamente
        window.formManager.onFieldChange(recrutadorSelect);
        setTimeout(() => {
          window.formManager.saveFormData();
        }, 500);
      });
    }
    
    // Conectar com elementos de UI específicos
    const confirmSubmitButton = document.getElementById('confirmSubmitButton');
    if (confirmSubmitButton) {
      confirmSubmitButton.addEventListener('click', () => {
        // Força um salvamento antes do envio final
        if (window.formManager.hasFormChanged()) {
          window.formManager.saveFormData().then(() => {
            console.log('Dados salvos antes do envio final');
          }).catch(error => {
            console.error('Erro ao salvar antes do envio final:', error);
          });
        }
      });
    }
    
    // Conectar com o sistema de atualização de situação
    const updateSituacao = () => {
      const avaliacaoRH = document.getElementById('avaliacao_rh')?.value;
      const avaliacaoGerencia = document.getElementById('avaliacao_gerencia')?.value;
      const sindicancia = document.getElementById('sindicancia')?.value;
      const assinaturaGerencia = document.getElementById('assinatura_gerencia')?.value;
      
      let situacao = 'Não Avaliado';
  
      // Lógica para determinar a situação
      if (avaliacaoRH === 'Reprovado') {
        situacao = 'Reprovado RH';
      } else if (avaliacaoRH === 'Aprovado') {
        if (sindicancia === 'Reprovado') {
          situacao = 'Reprovado Sindicância';
        } else if (sindicancia === 'Aprovado') {
          if (avaliacaoGerencia === 'Reprovado') {
            situacao = 'Reprovado Gerência';
          } else if (avaliacaoGerencia === 'Aprovado') {
            // Removida a verificação especifica por "Sim" na assinatura da gerência
            // Agora qualquer valor selecionado para assinaturaGerencia será considerado
            if (assinaturaGerencia && assinaturaGerencia !== "") {
              situacao = 'Aprovado';
            }
          }
        }
      }
  
      // Atualiza o campo situacao e o status visual
      const situacaoField = document.getElementById('situacao');
      const statusBadge = document.getElementById('form-status');
      
      if (situacaoField) {
        situacaoField.value = situacao;
        
        // Atualiza o badge se existir
        if (statusBadge) {
          statusBadge.textContent = situacao;
          
          // Atualiza a classe do badge baseado na situação
          statusBadge.className = 'badge';
          if (situacao === 'Aprovado') {
            statusBadge.classList.add('badge-success');
          } else if (situacao.includes('Reprovado')) {
            statusBadge.classList.add('badge-danger');
          } else {
            statusBadge.classList.add('badge-info');
          }
        }
        
        // Força um auto-save quando a situação muda
        if (window.formManager.hasFormChanged()) {
          window.formManager.saveFormData();
        }
      }
    };
    
    // Adicionar listeners para os campos de avaliação
    const avaliacaoFields = ['avaliacao_rh', 'avaliacao_gerencia', 'sindicancia', 'assinatura_gerencia'];
    
    avaliacaoFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('change', updateSituacao);
      }
    });
    
    // Listener específico para telefone_recado para garantir que seja rastreado
    const telefoneRecadoField = document.getElementById('telefone_recado');
    if (telefoneRecadoField) {
      console.log('[DEBUG] Campo telefone_recado encontrado no DOM, adicionando listeners');
      
      // Adicionar listener de input para rastrear mudanças
      telefoneRecadoField.addEventListener('input', () => {
        console.log('[DEBUG] telefone_recado alterado:', telefoneRecadoField.value);
        if (window.formManager) {
          window.formManager.onFieldChange(telefoneRecadoField);
        }
      });
      
      // Adicionar listener de blur para garantir salvamento
      telefoneRecadoField.addEventListener('blur', () => {
        console.log('[DEBUG] telefone_recado perdeu foco, valor:', telefoneRecadoField.value);
        if (window.formManager) {
          window.formManager.onFieldBlur(telefoneRecadoField);
        }
      });
    } else {
      console.warn('[DEBUG] Campo telefone_recado NÃO encontrado no DOM!');
    }
  });
