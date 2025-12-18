// api/allowpay.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const ALLOWPAY_API_KEY = "sk_live_NJJH7xyFl6IpBZ1vNiOPzmjxd5jmNF7VoXJOcuryYyrdXkMZ";
        const ALLOWPAY_API_URL = "https://api.allowpay.online/functions/v1";
        
        const { amount, cpf, telefone, quantidade, nome } = req.body;
        
        if (!amount || !cpf) {
            return res.status(400).json({
                success: false,
                error: 'Dados incompletos'
            });
        }
        
        // DADOS PARA A ALLOWPAY
        const payload = {
            amount: Math.round(amount * 100), // Em centavos
            description: `Viva Sorte - ${quantidade || 6} títulos`,
            currency: "BRL",
            payment_method: "pix",
            customer: {
                name: nome || `Cliente ${cpf.substring(0, 3)}***`,
                document: {
                    type: "cpf",
                    number: cpf
                },
                phone: telefone ? {
                    country_code: "55",
                    number: telefone.length === 11 ? telefone.substring(2) : telefone,
                    area_code: telefone.substring(0, 2)
                } : undefined
            },
            metadata: {
                quantidade: quantidade || 6,
                origem: "vivasorte"
            }
        };
        
        // AUTENTICAÇÃO BASIC
        const auth = Buffer.from(ALLOWPAY_API_KEY + ":").toString('base64');
        
        const response = await fetch(ALLOWPAY_API_URL + "/transactions", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + auth
            },
            body: JSON.stringify(payload)
        });
        
        if (response.status !== 201 && response.status !== 200) {
            const errorText = await response.text();
            console.error('Erro AllowPay:', errorText);
            
            return res.status(200).json({
                success: false,
                error: 'Erro ao criar transação',
                allowpay_error: errorText
            });
        }
        
        const responseData = await response.json();
        
        // SALVAR TRANSAÇÃO NO LOCALSTORAGE (via resposta)
        const transacao = {
            id: responseData.id,
            cpf: cpf,
            telefone: telefone,
            quantidade: quantidade,
            valor: amount,
            data: new Date().toISOString(),
            status: 'pending',
            allowpay_data: responseData
        };
        
        // Retornar dados do PIX
        return res.status(200).json({
            success: true,
            transaction_id: responseData.id,
            qr_code: responseData.pix?.qr_code || responseData.qr_code,
            qr_code_image: responseData.pix?.qr_code_image || 
                          `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(responseData.pix?.qr_code || responseData.qr_code)}`,
            codigo_pix: responseData.pix?.brcode || responseData.pix?.qr_code,
            expiration_date: responseData.pix?.expiration_date || new Date(Date.now() + 30 * 60000).toISOString(),
            amount: amount,
            transacao_salva: transacao
        });
        
    } catch (error) {
        console.error('Erro:', error);
        
        // FALLBACK - Gerar PIX estático para desenvolvimento
        if (process.env.NODE_ENV !== 'production') {
            const transactionId = 'VS-' + Date.now() + '-TEST';
            const qrCodeText = `00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540${req.body.amount.toFixed(2)}5802BR5909Viva Sorte6008Brasilia62070503***6304`;
            
            return res.status(200).json({
                success: true,
                transaction_id: transactionId,
                qr_code: qrCodeText,
                qr_code_image: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeText)}`,
                codigo_pix: qrCodeText,
                expiration_date: new Date(Date.now() + 30 * 60000).toISOString(),
                amount: req.body.amount,
                is_test: true
            });
        }
        
        return res.status(200).json({
            success: false,
            error: error.message
        });
    }
}