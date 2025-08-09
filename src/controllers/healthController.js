const supabase = require('../services/supabase');
const provider = require('../services/ethers');

const checkHealth = async (req, res) => {
    const healthStatus = {
        serverTime: new Date().toISOString(),
        status: 'OK',
        dependencies: {
            supabase: 'OK',
            baseNetwork: 'OK',
        },
    };

    try {
        // Check Supabase connection
        const { error: supabaseError } = await supabase.from('users').select('id').limit(1);
        if (supabaseError) {
            throw new Error(`Supabase error: ${supabaseError.message}`);
        }
    } catch (error) {
        healthStatus.status = 'ERROR';
        healthStatus.dependencies.supabase = error.message;
    }

    try {
        // Check Base network provider connection
        const blockNumber = await provider.getBlockNumber();
        if (typeof blockNumber !== 'number') {
            throw new Error('Could not retrieve block number.');
        }
    } catch (error) {
        healthStatus.status = 'ERROR';
        healthStatus.dependencies.baseNetwork = error.message;
    }

    if (healthStatus.status === 'ERROR') {
        return res.status(503).json(healthStatus);
    }

    res.status(200).json(healthStatus);
};

module.exports = {
    checkHealth,
};
