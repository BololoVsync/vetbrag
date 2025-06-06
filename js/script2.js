document.addEventListener('DOMContentLoaded', () => {
    // Pegando os elementos do HTML pra gente poder usar no JS
    const patientNameInput = document.getElementById('patientName');
    const patientImageInput = document.getElementById('patientImage');
    const addPatientBtn = document.getElementById('addPatientBtn');
    const urgentPatientBtn = document.getElementById('urgentPatientBtn');
    const attendPatientBtn = document.getElementById('attendPatientBtn');
    const currentPatientDisplay = document.getElementById('currentPatientDisplay');
    const currentPatientName = document.getElementById('currentPatientName');
    const currentPatientImg = document.getElementById('currentPatientImg');
    const waitingList = document.getElementById('waitingList');

    // Nosso 'vetor' de pacientes esperando. Cada paciente é um objeto!
    let patients = []; 

    // Função para carregar os pacientes que estavam salvos no localStorage
    function loadPatients() {
        const storedPatients = localStorage.getItem('waitingPatients');
        if (storedPatients) {
            patients = JSON.parse(storedPatients); // Transforma o texto de volta em objeto
            renderWaitingList(); // Atualiza a lista na tela
        }

        const storedCurrentPatient = localStorage.getItem('currentPatient');
        if (storedCurrentPatient) {
            const current = JSON.parse(storedCurrentPatient);
            displayCurrentPatient(current.name, current.imageBase64);
        } else {
            clearCurrentPatientDisplay(); // Se não tem paciente salvo, limpa a tela
        }
    }

    // Função para salvar a lista de pacientes no localStorage
    function savePatients() {
        localStorage.setItem('waitingPatients', JSON.stringify(patients)); // Transforma o objeto em texto pra salvar
    }

    // Função para salvar o paciente que está sendo atendido no localStorage
    function saveCurrentPatient(name, imageBase64) {
        localStorage.setItem('currentPatient', JSON.stringify({ name, imageBase64 }));
    }

    // Função para tirar o paciente atual do localStorage
    function clearCurrentPatient() {
        localStorage.removeItem('currentPatient');
    }

    // Função para mostrar a lista de espera na tela
    function renderWaitingList() {
        waitingList.innerHTML = ''; // Limpa a lista antes de redesenhar

        if (patients.length === 0) {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = 'Nenhum paciente aguardando no momento.';
            waitingList.appendChild(li);
            return;
        }

        // Para cada paciente no nosso array, cria um item na lista
        patients.forEach((patient) => {
            const li = document.createElement('li');
            // Se for urgente, adiciona a classe CSS pra mudar a cor
            li.className = `list-group-item ${patient.urgent ? 'urgent-item' : ''}`;
            const timestamp = new Date(patient.timestamp).toLocaleTimeString(); // Pega só a hora

            // Monta o HTML do item da lista, com nome, hora e a imagem se tiver
            li.innerHTML = `
                <span>${patient.name} (${timestamp})</span>
                ${patient.imageBase64 ? `<img src="${patient.imageBase64}" alt="${patient.name}" class="ms-auto">` : ''}
            `;
            waitingList.appendChild(li);
        });
    }

    // Função para mostrar quem está sendo atendido
    function displayCurrentPatient(name, imageBase64) {
        currentPatientName.textContent = name;
        if (imageBase64) {
            currentPatientImg.src = imageBase64;
            currentPatientImg.style.display = 'inline'; // Mostra a imagem
        } else {
            currentPatientImg.src = '';
            currentPatientImg.style.display = 'none'; // Esconde a imagem se não tiver
        }
        // Adiciona classes do Bootstrap para destacar visualmente
        currentPatientDisplay.classList.add('border-success', 'bg-success-subtle');
        currentPatientDisplay.classList.remove('border-secondary', 'bg-light');
    }

    // Função para limpar a área do paciente em atendimento
    function clearCurrentPatientDisplay() {
        currentPatientName.textContent = 'Nenhum paciente em atendimento.';
        currentPatientImg.src = '';
        currentPatientImg.style.display = 'none';
        // Remove os estilos de destaque
        currentPatientDisplay.classList.remove('border-success', 'bg-success-subtle');
        currentPatientDisplay.classList.add('border-secondary', 'bg-light');
    }

    // Função que adiciona um paciente, seja normal ou urgente
    async function addPatient(isUrgent = false) {
        const name = patientNameInput.value.trim();
        if (!name) {
            alert('Ops! Precisa informar o nome do paciente.');
            return;
        }

        let imageBase64 = null;
        // Verifica se o usuário selecionou uma imagem
        if (patientImageInput.files.length > 0) {
            // Converte a imagem para Base64. É assíncrono, então usamos await
            imageBase64 = await convertImageToBase64(patientImageInput.files[0]);
        }

        // Cria o objeto do novo paciente
        const newPatient = {
            name: name,
            imageBase64: imageBase64,
            timestamp: new Date().toISOString(), // Salva a hora exata
            urgent: isUrgent // Marca se é urgente ou não
        };

        if (isUrgent) {
            patients.unshift(newPatient); // Adiciona no começo da fila (para urgência)
        } else {
            patients.push(newPatient); // Adiciona no final da fila (normal)
        }
        
        savePatients(); // Salva a lista atualizada
        renderWaitingList(); // Atualiza a tela
        patientNameInput.value = ''; // Limpa o campo do nome
        patientImageInput.value = ''; // Limpa o campo da imagem
    }

    // Função para transformar a imagem em texto (Base64)
    function convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader(); // Objeto pra ler arquivos
            reader.readAsDataURL(file); // Lê o arquivo como URL de dados (Base64)
            reader.onload = () => resolve(reader.result); // Quando terminar de ler, resolve a Promise com o resultado
            reader.onerror = error => reject(error); // Se der erro, rejeita a Promise
        });
    }

    // Eventos: o que acontece quando clica nos botões
    addPatientBtn.addEventListener('click', () => addPatient(false)); // Clica em Adicionar
    urgentPatientBtn.addEventListener('click', () => addPatient(true)); // Clica em Urgência

    attendPatientBtn.addEventListener('click', () => {
        if (patients.length > 0) {
            const patientToAttend = patients.shift(); // Pega o primeiro da fila e tira ele da fila
            displayCurrentPatient(patientToAttend.name, patientToAttend.imageBase64); // Mostra ele como atendido
            saveCurrentPatient(patientToAttend.name, patientToAttend.imageBase64); // Salva ele no localStorage
            savePatients(); // Salva a lista de espera sem o paciente que saiu
            renderWaitingList(); // Atualiza a tela da lista de espera
        } else {
            alert('Não há ninguém na fila de espera para atender.');
            clearCurrentPatientDisplay(); // Limpa a tela de atendimento
            clearCurrentPatient(); // Limpa o paciente atual do localStorage
        }
    });

    // Chamadas iniciais: quando a página carrega
    loadPatients(); // Carrega os pacientes salvos
});