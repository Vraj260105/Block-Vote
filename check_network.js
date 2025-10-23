const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

async function checkNetwork() {
    try {
        // Connect to Ganache
        const web3 = new Web3('http://127.0.0.1:7545');
        
        console.log('🔗 Connecting to Ganache...');
        
        // Check connection
        const isConnected = await web3.eth.net.isListening();
        console.log('✅ Connected:', isConnected);
        
        // Get network info
        const networkId = await web3.eth.net.getId();
        const blockNumber = await web3.eth.getBlockNumber();
        console.log('📍 Network ID:', networkId);
        console.log('📦 Current Block:', blockNumber);
        
        // Get accounts
        const accounts = await web3.eth.getAccounts();
        console.log('👥 Available Accounts:', accounts.length);
        console.log('🏦 First Account (Admin):', accounts[0]);
        
        // Check contract deployment
        const contractPath = path.join(__dirname, 'frontend', 'src', 'contracts', 'VotingSystem.json');
        if (fs.existsSync(contractPath)) {
            const contractData = JSON.parse(fs.readFileSync(contractPath));
            console.log('📋 Contract Address:', contractData.address);
            
            // Try to interact with contract
            const contract = new web3.eth.Contract(contractData.abi, contractData.address);
            const owner = await contract.methods.owner().call();
            console.log('👑 Contract Owner:', owner);
            console.log('🎯 Owner matches first account:', owner.toLowerCase() === accounts[0].toLowerCase());
        } else {
            console.log('❌ Contract not found. Run truffle migrate first.');
        }
        
        console.log('\n🔧 MetaMask Configuration:');
        console.log('Network Name: Ganache Local');
        console.log('RPC URL: http://127.0.0.1:7545');
        console.log('Chain ID:', networkId);
        console.log('Currency Symbol: ETH');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n🚨 Make sure:');
        console.log('1. Ganache is running on http://127.0.0.1:7545');
        console.log('2. Run "truffle migrate" to deploy contracts');
    }
}

checkNetwork();