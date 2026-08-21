import { getVpnStatus } from '../lib/vpn/vpnManager.js';
import logger from '../lib/logger.js';

export const getVpnStatusHandler = (_req, res) => {
  try {
    res.json({ success: true, ...getVpnStatus() });
  } catch (err) {
    logger.error({ err }, 'getVpnStatus error');
    res.status(500).json({ success: false, message: 'Gagal mengambil status VPN' });
  }
};
