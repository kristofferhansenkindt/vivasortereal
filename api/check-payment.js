// api/check-payment.js
const ALLOWPAY_API_KEY = "sk_live_NJJH7xyFl6IpBZ1vNiOPzmjxd5jmNF7VoXJOcuryYyrdXkMZ";
const ALLOWPAY_API_URL = "https://api.allowpay.online/functions/v1/transactions";

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
        
        // CONSULTAR ALLOW PAY
        const auth = Buffer.from(ALLOWPAY_API_KEY + ":").toString('base64');
        const checkUrl = ALLOWPAY_API_URL + "/" + transactionId;
        
        const response = await fetch(checkUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + auth
            }
        });
        
        if (response.status !== 200) {
            return res.status(200).json({
                success: true,
                transaction_id: transactionId,
                status: 'pending',
                allowpay_status: 'pending',
                amount: 0,
                last_check: new Date().toISOString()
            });
        }
        
        const responseData = await response.json();
        const allowPayStatus = responseData.status || 'unknown';
        const amount = responseData.amount || 0;
        
        // MAPEAR STATUS
        const statusMap = {
            'paid': 'paid',
            'completed': 'paid',
            'pending': 'pending',
            'waiting_payment': 'pending',
            'expired': 'expired',
            'failed': 'failed',
            'canceled': 'canceled'
        };
        
        const status = statusMap[allowPayStatus] || 'unknown';
        
        return res.status(200).json({
            success: true,
            transaction_id: transactionId,
            status: status,
            allowpay_status: allowPayStatus,
            amount: amount / 100,
            last_check: new Date().toISOString(),
            response_data: responseData
        });
        
    } catch (error) {
        console.error('Erro:', error);
        
        return res.status(200).json({
            success: true,
            transaction_id: req.body?.transaction_id || '',
            status: 'pending',
            allowpay_status: 'pending',
            amount: 0,
            last_check: new Date().toISOString(),
            error: error.message
        });
    }
}