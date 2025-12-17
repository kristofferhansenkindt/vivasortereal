// api/check-confirmed.js
let confirmedPayments = {};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const input = req.method === 'POST' ? req.body : req.query;
        const transactionId = input.transaction_id || '';
        
        if (!transactionId) {
            return res.status(400).json({
                success: false,
                error: 'Transaction ID não fornecido'
            });
        }
        
        // SIMULAR BANCO DE DADOS EM MEMÓRIA
        // Em produção, use um banco real
        const isConfirmed = confirmedPayments[transactionId] && 
                           confirmedPayments[transactionId].status === 'paid';
        
        return res.status(200).json({
            success: true,
            transaction_id: transactionId,
            is_confirmed: isConfirmed,
            payment_data: isConfirmed ? confirmedPayments[transactionId] : null,
            checked_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro:', error);
        
        return res.status(200).json({
            success: true,
            transaction_id: req.body?.transaction_id || '',
            is_confirmed: false,
            checked_at: new Date().toISOString()
        });
    }
}