const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

async function showRealBlockchainData() {
    try {
        const web3 = new Web3('http://127.0.0.1:7545');
        
        console.log('🔗 CONNECTING TO REAL BLOCKCHAIN...\n');
        
        // 1. Show real network info
        const networkId = await web3.eth.net.getId();
        const blockNumber = await web3.eth.getBlockNumber();
        console.log('📍 Network ID:', networkId.toString());
        console.log('📦 Latest Block:', blockNumber.toString());
        console.log('🌐 This is a REAL Ethereum blockchain (local)\n');
        
        // 2. Show real accounts with real balances
        const accounts = await web3.eth.getAccounts();
        console.log('💰 REAL ACCOUNTS WITH REAL ETH BALANCES:');
        for (let i = 0; i < 3; i++) {
            const balance = await web3.eth.getBalance(accounts[i]);
            const balanceEth = web3.utils.fromWei(balance, 'ether');
            console.log(`Account ${i}: ${accounts[i]} = ${balanceEth} ETH`);
        }
        
        // 3. Check if contract exists
        const contractPath = path.join(__dirname, 'frontend', 'src', 'contracts', 'VotingSystem.json');
        if (fs.existsSync(contractPath)) {
            const contractData = JSON.parse(fs.readFileSync(contractPath));
            console.log('\n📋 REAL SMART CONTRACT DEPLOYED:');
            console.log('Address:', contractData.address);
            
            // 4. Show real contract data
            const contract = new web3.eth.Contract(contractData.abi, contractData.address);
            
            try {
                // Real blockchain calls
                const owner = await contract.methods.owner().call();
                const votingOpen = await contract.methods.votingOpen().call();
                const candidateCount = await contract.methods.getCandidateCount().call();
                
                console.log('👑 Real Contract Owner:', owner);
                console.log('🗳️ Real Voting Status:', votingOpen ? 'OPEN' : 'CLOSED');
                console.log('👥 Real Candidate Count:', candidateCount.toString());
                
                // Show real candidates
                if (candidateCount > 0) {
                    console.log('\n📊 REAL CANDIDATES FROM BLOCKCHAIN:');
                    for (let i = 0; i < candidateCount; i++) {
                        const candidate = await contract.methods.getCandidate(i).call();
                        console.log(`${i}: ${candidate.name} - ${candidate.votes} votes`);
                    }
                }
                
                // Show real transaction history
                console.log('\n📜 REAL TRANSACTION HISTORY:');
                const latestBlock = await web3.eth.getBlock('latest', true);
                if (latestBlock.transactions.length > 0) {
                    latestBlock.transactions.slice(0, 5).forEach((tx, i) => {
                        console.log(`TX ${i + 1}: ${tx.hash.substring(0, 20)}... from ${tx.from.substring(0, 10)}...`);
                    });
                } else {
                    console.log('No transactions yet');
                }
                
            } catch (contractError) {
                console.log('⚠️ Contract not accessible (may need redeployment)');
            }
        } else {
            console.log('\n❌ Contract not found - run "truffle migrate" first');
        }
        
        console.log('\n✅ EVERYTHING YOU SEE IS REAL BLOCKCHAIN DATA!');
        console.log('💡 No static/fake data anywhere - this is actual Ethereum protocol!');
        
    } catch (error) {
        console.error('❌ Error - Make sure Ganache is running on localhost:7545');
        console.log('\n🚨 TO PROVE IT\'S REAL:');
        console.log('1. Start Ganache GUI');
        console.log('2. Run "truffle migrate"');
        console.log('3. Run this script again');
        console.log('4. Watch transactions appear in Ganache GUI in real-time!');
    }
}

showRealBlockchainData();