import express from 'express';
import cors from 'cors';
import { parseUnits } from 'ethers';

const app = express();
app.use(express.json());
app.use(cors());
// CONFIGURACIÓN DE TU BILLETERA DE COBRO (Tu MetaMask)
const MI_BILLETERA_METAMASK = "0x64c721C260DFBB09B66155f690FE6c1aB38B0603"; 

// PORCENTAJE DE COMISIÓN (1%)
const PORCENTAJE_FEE = 0.01; 

/**
 * ENDPOINT DE ENRUTAMIENTO Y PEAJE
 * Recibe una solicitud de transacción de un tercero y calcula la división
 */
app.post('/api/v1/enrocar-transaccion', (req, res) => {
    try {
        const { usuario, montoUSDT, destinoFinal } = req.body;

        if (!usuario || !montoUSDT || !destinoFinal) {
            return res.status(400).json({ 
                exito: false, 
                error: "Faltan parámetros requeridos: usuario, montoUSDT, destinoFinal" 
            });
        }

        const montoTotal = parseFloat(montoUSDT);
        if (isNaN(montoTotal) || montoTotal <= 0) {
            return res.status(400).json({ exito: false, error: "Monto inválido" });
        }

        // CÁLCULO MATEMÁTICO DEL PEAJE
        const miComision = montoTotal * PORCENTAJE_FEE;
        const montoParaDestino = montoTotal - miComision;

        // ESTRUCTURA DE LA INSTRUCCIÓN PARA LA BLOCKCHAIN
        const instruccionEjecucion = {
            exito: true,
            timestamp: new Date().toISOString(),
            detallesOperacion: {
                usuarioOrigen: usuario,
                montoTotalIngresado: `${montoTotal} USDT`,
                destinoFinalApp: destinoFinal
            },
            divisionPagos: {
                montoEnviadoAlDestino: `${montoParaDestino.toFixed(4)} USDT`,
                miPeajeRetenido: `${miComision.toFixed(4)} USDT`,
                billeteraReceptoraPeaje: MI_BILLETERA_METAMASK
            },
            instruccionSmartContract: {
                transfer1: {
                    para: destinoFinal,
                    monto: parseUnits(montoParaDestino.toFixed(6), 6).toString()
                },
                transfer2_PEAJE: {
                    para: MI_BILLETERA_METAMASK,
                    monto: parseUnits(miComision.toFixed(6), 6).toString()
                }
            }
        };

        console.log(`[PEAJE PROCESADO] -> Usuario: ${usuario} | Total: ${montoTotal} USDT | Mi Tajada: ${miComision.toFixed(4)} USDT`);

        return res.status(200).json(instruccionEjecucion);

    } catch (error) {
        console.error("Error al procesar el peaje:", error);
        return res.status(500).json({ exito: false, error: "Error interno del servidor de peaje" });
    }
});

// PUERTO DE ESCUCHA DEL SERVIDOR LOCAL
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log("==================================================");
    console.log(` CABINA DE PEAJE DIGITAL INVISIBLE ACTIVA`);
    console.log(` Escuchando en el puerto: ${PUERTO}`);
    console.log(` Billetera de Cobro: ${MI_BILLETERA_METAMASK}`);
    console.log(` Porcentaje de Peaje: ${PORCENTAJE_FEE * 100}%`);
    console.log("==================================================");
