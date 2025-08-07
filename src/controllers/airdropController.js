const supabase = require('../services/supabase');

const claim = async (req, res) => {
    const userId = req.user.id;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('last_claimed_at')
            .eq('id', userId)
            .single();

        if (error) throw error;

        const threeDays = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
        const now = new Date();
        const lastClaimed = user.last_claimed_at ? new Date(user.last_claimed_at) : null;

        if (lastClaimed && (now.getTime() - lastClaimed.getTime()) < threeDays) {
            const timeRemaining = threeDays - (now.getTime() - lastClaimed.getTime());
            const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            return res.status(400).json({ message: `You have already claimed your airdrop. Please wait ${days}d ${hours}h ${minutes}m to claim again.` });
        }

        // TODO: Implement smart contract interaction and payment processing here.
        // This is a placeholder for the airdrop claim logic.

        const { error: updateError } = await supabase
            .from('users')
            .update({ last_claimed_at: now.toISOString() })
            .eq('id', userId);

        if (updateError) throw updateError;

        res.json({ message: 'Airdrop claimed successfully! Your funds will reflect in 3 days.' });

    } catch (error) {
        console.error('Error claiming airdrop:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    claim,
};
