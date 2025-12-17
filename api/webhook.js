// api/webhook.js
let confirmedPayments = {};

export default async function handler(req, res) {
    try {
        const ALLOWPAY_API_KEY = "sk_live_NJJH7xyFl6IpBZ1vNiOPzmjxd5jmNF7VoXJOcuryYyrdXkMZ";
        
        // VERIFICAR AUTENTICAÇÃO
        const authHeader = req.headers.authorization || '';
        if (authHeader !== 'Bearer ' + ALLOWPAY_API_KEY) {
            return res.status(401).json({ error: 'Não autorizado' });
        }
        
        const data = req.body;
        
        if (!data) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }
        
        // PROCESSAR EVENTO
        const eventType = data.type || data.event || 'unknown';
        const transactionId = data.data?.id || data.transaction_id;
        const status = data.data?.status;
        const amount = data.data?.amount || 0;
        const cpf = data.data?.customer?.document?.number || '';
        
        console.log('Webhook recebido:', eventType, transactionId, status);
        
        // SE FOR PAGAMENTO CONFIRMADO
        if ((eventType === 'transaction_status_changed' || eventType === 'payment_received') && 
            (status === 'paid' || status === 'completed')) {
            
            // SALVAR NA MEMÓRIA (em produção use banco)
            confirmedPayments[transactionId] = {
                transaction_id: transactionId,
                cpf: cpf,
                amount: amount / 100,
                status: 'paid',
                confirmed_at: new Date().toISOString(),
                allowpay_data: data
            };
            
            console.log('Pagamento confirmado salvo:', transactionId);
            
            return res.status(200).json({
                success: true,
                message: 'Pagamento confirmado e salvo',
                transaction_id: transactionId
            });
        }
        
        // OUTROS EVENTOS
        return res.status(200).json({
            success: true,
            message: 'Webhook recebido',
            event: eventType,
            status: status
        });
        
    } catch (error) {
        console.error('Erro no webhook:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}