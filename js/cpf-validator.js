// FUNÇÕES DE VALIDAÇÃO E CONSULTA DE CPF

// VALIDAR ALGORITMO DO CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    
    if (digito1 !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    
    return digito2 === parseInt(cpf.charAt(10));
}

// CONSULTAR DADOS DO CPF NA API
async function consultarDadosCPF(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (cpfLimpo.length !== 11) {
        return null;
    }
    
    try {
        const response = await fetch(`https://apis.fr4ud.center/search/cpf/${cpfLimpo}`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
                // SALVAR DADOS NO LOCALSTORAGE
                let clientesSalvos = JSON.parse(localStorage.getItem('vivasorte_clientes') || '{}');
                clientesSalvos[cpfLimpo] = {
                    nome: data.data.nome || '',
                    nascimento: data.data.nascimento || '',
                    mae: data.data.mae || '',
                    cpf: cpfLimpo,
                    consultado_em: new Date().toISOString(),
                    endereco: data.data.endereco || '',
                    cidade: data.data.cidade || '',
                    estado: data.data.estado || ''
                };
                
                localStorage.setItem('vivasorte_clientes', JSON.stringify(clientesSalvos));
                
                return clientesSalvos[cpfLimpo];
            }
        }
    } catch (error) {
        console.error('Erro ao consultar CPF:', error);
    }
    
    return null;
}

// FORMATAR CPF
function formatarCPF(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return cpf;
    
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// OBTER DADOS DO CLIENTE SALVOS
function obterDadosCliente(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    const clientesSalvos = JSON.parse(localStorage.getItem('vivasorte_clientes') || '{}');
    return clientesSalvos[cpfLimpo] || null;
}

// FUNÇÃO PARA SALVAR TELEFONE NO ADMIN
function salvarTelefoneParaAdmin(telefone, cpf) {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (!cpfLimpo || cpfLimpo.length !== 11) return;
    
    // Atualizar dados do cliente com telefone
    let clientesSalvos = JSON.parse(localStorage.getItem('vivasorte_clientes') || '{}');
    if (clientesSalvos[cpfLimpo]) {
        clientesSalvos[cpfLimpo].telefone = telefoneLimpo;
        clientesSalvos[cpfLimpo].atualizado_em = new Date().toISOString();
        localStorage.setItem('vivasorte_clientes', JSON.stringify(clientesSalvos));
    }
    
    console.log('Telefone salvo para admin:', { cpf: cpfLimpo, telefone: telefoneLimpo });
}

// EXPORTAR FUNÇÕES (se usando módulos)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validarCPF,
        consultarDadosCPF,
        formatarCPF,
        obterDadosCliente,
        salvarTelefoneParaAdmin
    };
}