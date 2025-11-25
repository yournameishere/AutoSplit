import {
  bytesToStr,
  JsonRpcProvider,
  SmartContract,
} from '@massalabs/massa-web3';
import 'dotenv/config';

const CONTRACT_ADDR = process.env.CONTRACT_ADDRESS ?? '';
if (!CONTRACT_ADDR) {
  throw new Error(
    'Please set CONTRACT_ADDRESS in your environment!',
  );
}

const provider = JsonRpcProvider.buildnet();
const autosplitContract = new SmartContract(provider, CONTRACT_ADDR);

const configResponse = await autosplitContract.read('getConfig');
const payload = bytesToStr(configResponse.value);

console.log('AutoSplit config:', payload);
