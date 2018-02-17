import axios from "axios";

import * as bip39 from "bip39";
import {HDNode, ECPair, networks} from "bitcoinjs-lib";

import {AtomicSwapTxBuilder} from "./atomic-swap-tx-builder";

import {BtcRpcConfiguration} from "../config/config";
import {BtcConfiguration} from "../config/config-btc";

import {FreshBitcoinWallet} from "./fresh-btc";
import {RegenerateBitcoinWallet} from "./regenerate-btc";

// TODO: refactor BitcoinWallet to use typescript mixins
export class BitcoinWallet extends AtomicSwapTxBuilder {
    // this is the mnemonic object
    public code: any;
    public hierarchicalPrivateKey: any;
    public btcConfiguration: any;
    public btcRpcConfiguration: any;

    constructor(net = "testnet") {
        super(net);
        if (net === "testnet") {
            this.btcConfiguration = BtcConfiguration;
            this.btcRpcConfiguration = BtcRpcConfiguration;
        } else if (net === "mainnet") {
            // TODO
        }
    }

    get hdPrivateKey(): any {
        return this.hierarchicalPrivateKey;
    }

    public get WIF(): string {
        return this.hierarchicalPrivateKey.keyPair.toWIF();
    }

    public async getbalance(address: string): Promise<any> {
        return await axios.get("https://chain.so/api/v2/get_address_balance/BTCTEST/" + address).then((balance) => {
            return balance.data.data.confirmed_balance;
        });
    }

    public recover(params: RegenerateBitcoinWallet) {
        // TODO: refactor
        // NOTE: params.code is in this case xprivKey, it should be called params.xprivKey
        // this.hierarchicalPrivateKey = new HDPrivateKey(params.code);
        this.hierarchicalPrivateKey = HDNode.fromBase58(params.code, networks.testnet);
    }

    public create(params: FreshBitcoinWallet) {
        // TODO: refactor
        // NOTE: params.code is memnonic in this case, it should be called params.mnemonic
        // const valid = Mnemonic.isValid(params.code);
        const valid = bip39.validateMnemonic(params.code);
        if (!valid) {
            throw Error("Not valid mnemonic code");
        }

        this.code = params.code;
        const seed = bip39.mnemonicToSeed(params.code);
        this.generateHDPrivateKey(seed);
    }

    public generateAddressFromWif(wif?: string): string {
        if (!wif) {
            wif = this.WIF;
        }
        const keypair = ECPair.fromWIF(wif, networks.testnet);
        return keypair.getAddress();
    }

    private generateHDPrivateKey(seed: Buffer): void {
        this.hierarchicalPrivateKey = HDNode.fromSeedBuffer(seed, networks.testnet);
    }
}
