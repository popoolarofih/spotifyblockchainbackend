const supabase = require('../services/supabase');
const provider = require('../services/ethers');
const { ethers } = require('ethers');

const claim = async (req, res) => {
    const userId = req.user.id;
    const { transactionHash } = req.body;

    if (!transactionHash) {
        return res.status(400).json({ message: 'Transaction hash is required.' });
    }

    try {
        // 1. Check user's cooldown status first to prevent unnecessary blockchain calls
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('last_claimed_at')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        const threeDays = 3 * 24 * 60 * 60 * 1000;
        const now = new Date();
        const lastClaimed = user.last_claimed_at ? new Date(user.last_claimed_at) : null;

        if (lastClaimed && (now.getTime() - lastClaimed.getTime()) < threeDays) {
            const timeRemaining = threeDays - (now.getTime() - lastClaimed.getTime());
            const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            return res.status(400).json({ message: `You have already claimed. Please wait ${days}d ${hours}h to claim again.` });
        }

        // 2. Verify the transaction on the blockchain
        const tx = await provider.getTransaction(transactionHash);
        if (!tx) {
            return res.status(404).json({ message: 'Transaction not found.' });
        }

        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        if (receipt.status !== 1) {
            return res.status(400).json({ message: 'Transaction failed.' });
        }

        // 3. Perform verification checks
        const targetAddress = process.env.PAYMENT_WALLET_ADDRESS;
        const requiredAmount = ethers.parseEther(process.env.FIXED_ETH_AMOUNT || '0.0003');

        if (tx.to.toLowerCase() !== targetAddress.toLowerCase()) {
            return res.status(400).json({ message: `Payment sent to wrong address. Expected ${targetAddress}.` });
        }

        if (tx.value < requiredAmount) {
            return res.status(400).json({ message: `Insufficient payment amount. Sent ${ethers.formatEther(tx.value)}, required ${ethers.formatEther(requiredAmount)}.` });
        }

        // 4. If all checks pass, update the user's claim timestamp
        const { error: updateError } = await supabase
            .from('users')
            .update({ last_claimed_at: now.toISOString() })
            .eq('id', userId);

        if (updateError) throw updateError;

        res.json({ message: 'Congratulations! Airdrop claimed successfully. Your rewards will reflect after the cooldown period.' });

    } catch (error) {
        console.error('Error claiming airdrop:', error);
        res.status(500).json({ message: 'Server error during airdrop claim.' });
    }
};

module.exports = {
    claim,
};
