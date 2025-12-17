// api/allowpay.js - Versão para Vercel/Netlify
const ALLOWPAY_API_KEY = "sk_live_NJJH7xyFl6IpBZ1vNiOPzmjxd5jmNF7VoXJOcuryYyrdXkMZ";
const ALLOWPAY_API_URL = "https://api.allowpay.online/functions/v1/transactions";

export default async function handler(req, res) {
    // Permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const input = req.body;
        
        // VALIDAÇÃO
        const amount = parseFloat(input.amount) || 0;
        const cpf = (input.cpf || '').replace(/\D/g, '');
        const telefone = (input.telefone || '').replace(/\D/g, '');
        const quantidade = parseInt(input.quantidade) || 0;
        
        if (amount <= 0 || cpf.length !== 11 || telefone.length < 10 || quantidade <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Dados inválidos ou incompletos'
            });
        }
        
        // CONVERTER VALOR
        const valorCentavos = Math.round(amount * 100);
        const transactionId = "VS-" + Date.now() + "-" + Math.random().toString(36).substr(2, 8);
        
        // PAYLOAD PARA ALLOW PAY
        const payload = {
            'customer': {
                'name': input.nome || "Cliente Viva Sorte",
                'email': cpf.substring(0, 8) + "@vivasorte.temp.com",
                'phone': telefone,
                'document': {
                    'type': "CPF",
                    'number': cpf
                }
            },
            'shipping': {
                'address': {
                    'street': "Não informado",
                    'streetNumber': "S/N",
                    'complement': "",
                    'neighborhood': "Centro",
                    'city': "São Paulo",
                    'state': "SP",
                    'zipCode': "01000000",
                    'country': "BR"
                }
            },
            'paymentMethod': "PIX",
            'pix': {
                'expiresInDays': 1
            },
            'items': [{
                'title': "Viva Sorte - " + quantidade + " títulos de capitalização",
                'quantity': 1,
                'unitPrice': valorCentavos,
                'externalRef': "VS-" + cpf.substring(0, 6)
            }],
            'amount': valorCentavos,
            'description': "Viva Sorte - " + quantidade + " títulos",
            'externalId': transactionId,
            'postbackUrl': "https://" + req.headers.host + "/api/webhook"
        };
        
        // AUTENTICAÇÃO
        const auth = Buffer.from(ALLOWPAY_API_KEY + ":").toString('base64');
        
        // CHAMADA PARA ALLOW PAY
        const response = await fetch(ALLOWPAY_API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + auth
            },
            body: JSON.stringify(payload)
        });
        
        const responseData = await response.json();
        
        if (response.status !== 200) {
            throw new Error("Erro na comunicação com Allow Pay (HTTP " + response.status + ")");
        }
        
        // VERIFICAR QR CODE
        const qrCode = responseData.pix?.qrcode || responseData.qr_code || '';
        
        if (!qrCode) {
            throw new Error('QR Code PIX não gerado');
        }
        
        // SUCESSO
        return res.status(200).json({
            success: true,
            transaction_id: responseData.id || transactionId,
            qr_code: qrCode,
            qr_code_image: 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + encodeURIComponent(qrCode),
            codigo_pix: qrCode,
            valor: amount,
            quantidade: quantidade,
            expira_em: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
        
    } catch (error) {
        console.error('Erro:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro interno no servidor'
        });
    }
}