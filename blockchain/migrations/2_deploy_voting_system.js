const fs = require('fs');
const path = require('path');
const VotingSystem = artifacts.require('VotingSystem');

module.exports = async function (deployer) {
  await deployer.deploy(VotingSystem);
  const instance = await VotingSystem.deployed();

  // Write ABI + address for the frontend
  const artifactPath = path.join(__dirname, '..', 'build', 'contracts', 'VotingSystem.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const outputDir = path.join(__dirname, '..', '..', 'frontend', 'src', 'contracts');
  fs.mkdirSync(outputDir, { recursive: true });
  const output = {
    address: instance.address,
    abi: artifact.abi,
  };
  fs.writeFileSync(path.join(outputDir, 'VotingSystem.json'), JSON.stringify(output, null, 2));
  console.log('VotingSystem deployed at', instance.address);
  console.log('Wrote frontend contract artifact to', path.join(outputDir, 'VotingSystem.json'));
};