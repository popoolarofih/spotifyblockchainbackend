const { ethers } = require('ethers');
require('dotenv').config();

const baseRpcUrl = process.env.BASE_RPC_URL;

if (!baseRpcUrl) {
    throw new Error('BASE_RPC_URL is not defined in the environment variables.');
}

const provider = new ethers.JsonRpcProvider(baseRpcUrl);

module.exports = provider;
