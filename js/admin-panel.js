// js/admin-panel.js - Painel Admin Viva Sorte
const ADMIN_CREDENTIALS = {
    user: "admin",
    pass: "viva2025"
};

let allTransactions = [];
let currentPage = 1;
const itemsPerPage = 15;
let autoRefreshInterval = null;

// LOGIN SIMPLES
function login() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    
    if (user === ADMIN_CREDENTIALS.user && pass === ADMIN_CREDENTIALS.pass) {
        localStorage.setItem('admin_logged_in', 'true');
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        carregarDados();
        iniciarAtualizacaoAuto();
    } else {
        document.getElementById('loginError').style.display = 'block';
        setTimeout(() => {
            document.getElementById('loginError').style.display = 'none';
        }, 3000);
    }
}

// LOGOUT
function logout() {
    localStorage.removeItem('admin_logged_in');
    location.reload();
}

// VERIFICAR LOGIN
if (localStorage.getItem('admin_logged_in') === 'true') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    carregarDados();
    iniciarAtualizacaoAuto();
}

// CARREGAR DADOS
function carregarDados() {
    try {
        // Carregar transações
        const transacoes = JSON.parse(localStorage.getItem('vivasorte_transacoes') || '[]');
        
        // Carregar usuários (CPF)
        const usuarios = JSON.parse(localStorage.getItem('vivasorte_usuarios') || '{}');
        
        // Combinar dados
        allTransactions = transacoes.map(trans => {
            const usuario = usuarios[trans.cpf] || {};
            return {
                ...trans,
                nome: usuario.nome || 'Cliente ' + (trans.cpf ? trans.cpf.substring(0, 3) + '***' : ''),
                idade: usuario.idade || 'N/A',
                cidade: usuario.cidade || 'Não identificado',
                uf: usuario.uf || 'N/A',
                mae: usuario.mae || 'Não identificada'
            };
        });
        
        // Ordenar por data
        allTransactions.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        console.log('📊 Dados carregados:', allTransactions.length, 'transações');
        
        atualizarEstatisticas();
        atualizarTabela();
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
    }
}

// ATUALIZAR ESTATÍSTICAS
function atualizarEstatisticas() {
    const total = allTransactions.length;
    const pagos = allTransactions.filter(t => t.status === 'pago' || t.status === 'paid').length;
    const pendentes = allTransactions.filter(t => t.status === 'pending').length;
    const cancelados = allTransactions.filter(t => t.status === 'canceled' || t.status === 'expired').length;
    
    const totalPago = allTransactions
        .filter(t => t.status === 'pago' || t.status === 'paid')
        .reduce((sum, t) => sum + (t.valor || 0), 0);
    
    document.getElementById('totalTransacoes').textContent = total;
    document.getElementById('totalPago').textContent = 'R$ ' + totalPago.toFixed(2).replace('.', ',');
    document.getElementById('pendentes').textContent = pendentes;
    document.getElementById('cancelados').textContent = cancelados;
    document.getElementById('totalRegistros').textContent = total;
}

// ATUALIZAR TABELA
function atualizarTabela() {
    const tbody = document.getElementById('transactionsBody');
    
    // Filtrar
    const filtered = filtrarTransacoes();
    
    // Paginar
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = filtered.slice(start, end);
    
    // Limpar tabela
    tbody.innerHTML = '';
    
    if (paginated.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <i class="bi bi-inbox" style="font-size: 48px; color: #ccc;"></i>
                    <p class="mt-2 text-muted">Nenhuma transação encontrada</p>
                </td>
            </tr>
        `;
    } else {
        // Adicionar linhas
        paginated.forEach((trans, index) => {
            const row = document.createElement('tr');
            
            // Formatar data
            const data = new Date(trans.data);
            const dataFormatada = data.toLocaleDateString('pt-BR');
            const horaFormatada = data.toLocaleTimeString('pt-BR').substring(0, 5);
            
            // Status
            let statusClass = 'badge-pending';
            let statusText = 'PENDENTE';
            
            if (trans.status === 'pago' || trans.status === 'paid') {
                statusClass = 'badge-paid';
                statusText = 'PAGO';
            } else if (trans.status === 'canceled' || trans.status === 'expired') {
                statusClass = 'badge-canceled';
                statusText = 'CANCELADO';
            }
            
            // WhatsApp
            let whatsappBtn = '';
            if (trans.telefone) {
                const telefoneLimpo = trans.telefone.replace(/\D/g, '');
                whatsappBtn = `
                    <a href="https://wa.me/55${telefoneLimpo}" target="_blank" class="btn-whatsapp">
                        <i class="bi bi-whatsapp"></i> Contato
                    </a>
                `;
            }
            
            row.innerHTML = `
                <td><small class="text-muted">${trans.id?.substring(0, 8) || 'N/A'}</small></td>
                <td>
                    <div>${dataFormatada}</div>
                    <small class="text-muted">${horaFormatada}</small>
                </td>
                <td>${trans.nome}</td>
                <td>${formatarCPF(trans.cpf)}</td>
                <td>${trans.telefone ? formatarTelefone(trans.telefone) : 'N/A'}</td>
                <td><strong class="text-primary">R$ ${(trans.valor || 0).toFixed(2).replace('.', ',')}</strong></td>
                <td><span class="badge-status ${statusClass}">${statusText}</span></td>
                <td>${whatsappBtn}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="verDetalhes(${index})" title="Ver detalhes">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="marcarComoPago('${trans.id}')" title="Marcar como pago">
                        <i class="bi bi-check-circle"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    // Atualizar paginação
    atualizarPaginacao(filtered.length);
}

// FILTRAR TRANSAÇÕES
function filtrarTransacoes() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const activeFilter = document.querySelector('.filter-btn.active').id;
    
    return allTransactions.filter(trans => {
        // Busca
        const matchesSearch = !search || 
            trans.cpf?.includes(search) ||
            trans.nome?.toLowerCase().includes(search) ||
            trans.telefone?.includes(search);
        
        // Status
        let transStatus = trans.status;
        if (transStatus === 'paid') transStatus = 'pago';
        
        const matchesStatus = status === 'all' || transStatus === status;
        
        // Data
        const matchesDate = filtrarPorDataLogica(trans.data, activeFilter);
        
        return matchesSearch && matchesStatus && matchesDate;
    });
}

function filtrarPorDataLogica(dataTrans, filter) {
    if (!dataTrans) return true;
    
    const data = new Date(dataTrans);
    const hoje = new Date();
    
    switch(filter) {
        case 'filterToday':
            return data.toDateString() === hoje.toDateString();
            
        case 'filterWeek':
            const umaSemanaAtras = new Date();
            umaSemanaAtras.setDate(hoje.getDate() - 7);
            return data >= umaSemanaAtras;
            
        case 'filterMonth':
            return data.getMonth() === hoje.getMonth() && 
                   data.getFullYear() === hoje.getFullYear();
            
        default: // filterAll
            return true;
    }
}

// FILTRAR POR DATA
function filtrarPorData(tipo) {
    // Remover active de todos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Ativar o clicado
    document.getElementById(`filter${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`).classList.add('active');
    
    currentPage = 1;
    atualizarTabela();
}

// PAGINAÇÃO
function atualizarPaginacao(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Anterior
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="mudarPagina(${currentPage - 1})">Anterior</a>
        </li>
    `;
    
    // Números
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="mudarPagina(${i})">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    // Próximo
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="mudarPagina(${currentPage + 1})">Próximo</a>
        </li>
    `;
    
    pagination.innerHTML = html;
    
    // Atualizar contadores
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    
    document.getElementById('showingCount').textContent = `${start}-${end}`;
    document.getElementById('totalCount').textContent = totalItems;
}

function mudarPagina(pagina) {
    if (pagina < 1) return;
    
    const totalItems = filtrarTransacoes().length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (pagina > totalPages) return;
    
    currentPage = pagina;
    atualizarTabela();
    window.scrollTo(0, 0);
}

// FILTRAR EM TEMPO REAL
function filtrarTabela() {
    currentPage = 1;
    atualizarTabela();
}

// VER DETALHES
function verDetalhes(index) {
    const transacoesFiltradas = filtrarTransacoes();
    const trans = transacoesFiltradas[(currentPage - 1) * itemsPerPage + index];
    
    if (!trans) return;
    
    const data = new Date(trans.data);
    const modal = new bootstrap.Modal(document.getElementById('detalhesModal'));
    const conteudo = document.getElementById('detalhesConteudo');
    
    let statusBadge = '<span class="badge-status badge-pending">PENDENTE</span>';
    if (trans.status === 'pago' || trans.status === 'paid') {
        statusBadge = '<span class="badge-status badge-paid">PAGO</span>';
    } else if (trans.status === 'canceled' || trans.status === 'expired') {
        statusBadge = '<span class="badge-status badge-canceled">CANCELADO</span>';
    }
    
    conteudo.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card-admin">
                    <h6><i class="bi bi-person-badge"></i> Dados Pessoais</h6>
                    <table class="table table-sm">
                        <tr><td><strong>Nome:</strong></td><td>${trans.nome}</td></tr>
                        <tr><td><strong>CPF:</strong></td><td>${formatarCPF(trans.cpf)}</td></tr>
                        <tr><td><strong>Idade:</strong></td><td>${trans.idade}</td></tr>
                        <tr><td><strong>Mãe:</strong></td><td>${trans.mae}</td></tr>
                        <tr><td><strong>Cidade/UF:</strong></td><td>${trans.cidade} - ${trans.uf}</td></tr>
                    </table>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card-admin">
                    <h6><i class="bi bi-credit-card"></i> Dados da Transação</h6>
                    <table class="table table-sm">
                        <tr><td><strong>ID:</strong></td><td><code>${trans.id || 'N/A'}</code></td></tr>
                        <tr><td><strong>Data/Hora:</strong></td><td>${data.toLocaleString('pt-BR')}</td></tr>
                        <tr><td><strong>Telefone:</strong></td><td>${formatarTelefone(trans.telefone)}</td></tr>
                        <tr><td><strong>Valor:</strong></td><td><span class="text-success fw-bold">R$ ${(trans.valor || 0).toFixed(2).replace('.', ',')}</span></td></tr>
                        <tr><td><strong>Quantidade:</strong></td><td>${trans.quantidade || 0} títulos</td></tr>
                        <tr><td><strong>Status:</strong></td><td>${statusBadge}</td></tr>
                    </table>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-12">
                <div class="card-admin">
                    <h6><i class="bi bi-chat-dots"></i> Ações Rápidas</h6>
                    <div class="d-flex gap-2">
                        ${trans.telefone ? `
                            <a href="https://wa.me/55${trans.telefone.replace(/\D/g, '')}" target="_blank" class="btn btn-success">
                                <i class="bi bi-whatsapp"></i> WhatsApp
                            </a>
                        ` : ''}
                        
                        <button class="btn btn-primary" onclick="marcarComoPago('${trans.id}'); bootstrap.Modal.getInstance(document.getElementById('detalhesModal')).hide();">
                            <i class="bi bi-check-circle"></i> Marcar como Pago
                        </button>
                        
                        <button class="btn btn-warning" onclick="alterarStatus('${trans.id}', 'pending')">
                            <i class="bi bi-arrow-clockwise"></i> Reativar
                        </button>
                        
                        <button class="btn btn-danger" onclick="excluirTransacao('${trans.id}')">
                            <i class="bi bi-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-12">
                <div class="card-admin">
                    <h6><i class="bi bi-clock-history"></i> Histórico</h6>
                    <p class="text-muted mb-1"><small>Cadastrado em: ${data.toLocaleString('pt-BR')}</small></p>
                    ${trans.confirmado_em ? `
                        <p class="text-muted mb-1"><small>Confirmado em: ${new Date(trans.confirmado_em).toLocaleString('pt-BR')}</small></p>
                    ` : ''}
                    ${trans.consultado_em ? `
                        <p class="text-muted"><small>CPF consultado em: ${new Date(trans.consultado_em).toLocaleString('pt-BR')}</small></p>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    modal.show();
}

// AÇÕES
function marcarComoPago(id) {
    if (!id || !confirm('Marcar esta transação como PAGA?')) return;
    
    let transacoes = JSON.parse(localStorage.getItem('vivasorte_transacoes') || '[]');
    transacoes = transacoes.map(t => {
        if (t.id === id) {
            return { ...t, status: 'pago', confirmado_em: new Date().toISOString() };
        }
        return t;
    });
    
    localStorage.setItem('vivasorte_transacoes', JSON.stringify(transacoes));
    carregarDados();
    
    // Notificação
    const toast = document.createElement('div');
    toast.className = 'position-fixed top-0 end-0 p-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="toast show" role="alert">
            <div class="toast-header bg-success text-white">
                <strong class="me-auto"><i class="bi bi-check-circle"></i> Sucesso</strong>
                <button type="button" class="btn-close btn-close-white" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
            <div class="toast-body">
                Transação marcada como PAGA!
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function alterarStatus(id, status) {
    if (!id) return;
    
    let transacoes = JSON.parse(localStorage.getItem('vivasorte_transacoes') || '[]');
    transacoes = transacoes.map(t => {
        if (t.id === id) {
            return { ...t, status: status };
        }
        return t;
    });
    
    localStorage.setItem('vivasorte_transacoes', JSON.stringify(transacoes));
    carregarDados();
    alert('Status alterado com sucesso!');
}

function excluirTransacao(id) {
    if (!id || !confirm('Tem certeza que deseja excluir esta transação?\nEsta ação não pode ser desfeita.')) return;
    
    let transacoes = JSON.parse(localStorage.getItem('vivasorte_transacoes') || '[]');
    transacoes = transacoes.filter(t => t.id !== id);
    
    localStorage.setItem('vivasorte_transacoes', JSON.stringify(transacoes));
    carregarDados();
    alert('Transação excluída!');
}

// EXPORTAR EXCEL
function exportarExcel() {
    const dados = allTransactions.map(t => ({
        'ID': t.id || '',
        'Data': new Date(t.data).toLocaleString('pt-BR'),
        'Nome': t.nome || '',
        'CPF': t.cpf || '',
        'Telefone': t.telefone || '',
        'Valor': t.valor || 0,
        'Quantidade': t.quantidade || 0,
        'Status': t.status === 'pago' || t.status === 'paid' ? 'PAGO' : 'PENDENTE',
        'Cidade': t.cidade || '',
        'UF': t.uf || '',
        'Idade': t.idade || '',
        'Mãe': t.mae || ''
    }));
    
    if (dados.length === 0) {
        alert('Nenhum dado para exportar!');
        return;
    }
    
    // Criar CSV
    const cabecalhos = Object.keys(dados[0]);
    const linhas = dados.map(linha => 
        cabecalhos.map(cabecalho => 
            `"${linha[cabecalho]}"`
        ).join(',')
    );
    
    const csv = [cabecalhos.join(','), ...linhas].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = `viva_sorte_transacoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// ATUALIZAÇÃO AUTOMÁTICA
function iniciarAtualizacaoAuto() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(() => {
        console.log('🔄 Atualizando dados automaticamente...');
        carregarDados();
    }, 30000); // 30 segundos
}

// FUNÇÕES AUXILIARES
function formatarCPF(cpf) {
    if (!cpf) return 'N/A';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarTelefone(tel) {
    if (!tel) return 'N/A';
    const limpo = tel.replace(/\D/g, '');
    if (limpo.length === 11) {
        return limpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (limpo.length === 10) {
        return limpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return tel;
}

// EXPORTAR FUNÇÕES
window.login = login;
window.logout = logout;
window.carregarDados = carregarDados;
window.filtrarTabela = filtrarTabela;
window.filtrarPorData = filtrarPorData;
window.exportarExcel = exportarExcel;
window.verDetalhes = verDetalhes;
window.marcarComoPago = marcarComoPago;
window.alterarStatus = alterarStatus;
window.excluirTransacao = excluirTransacao;
window.mudarPagina = mudarPagina;