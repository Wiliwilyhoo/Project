
import { useEffect, useState } from "react";
import {
  BrowserProvider,
  Contract,
  isAddress,
  ZeroAddress,
  formatUnits,
  parseUnits
} from "ethers";

import MoolahCoin from "../build/contracts/MoolahCoin.json";
import Condos from "../build/contracts/Condos.json";

import "./App.css";

export default function App() {
  const [account, setAccount] = useState("");
  const [mcBalance, setMcBalance] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [nftId, setNftId] = useState("1");
  const [nftOwner, setNftOwner] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum) return;
    // ponytail: reload resets wallet state; use in-place synchronization if preserving form input becomes necessary.
    const reload = () => window.location.reload();
    ethereum.on("accountsChanged", reload);
    ethereum.on("chainChanged", reload);
    return () => {
      ethereum.removeListener("accountsChanged", reload);
      ethereum.removeListener("chainChanged", reload);
    };
  }, []);

  async function getContracts() {
    if (!window.ethereum) {
      throw new Error("Please install MetaMask");
    }

    const provider = new BrowserProvider(window.ethereum);
    const networkId = await provider.send("net_version", []);
    const mcAddress = MoolahCoin.networks[networkId]?.address;
    const condosAddress = Condos.networks[networkId]?.address;
    if (!mcAddress || !condosAddress) {
      throw new Error(`Contracts are not deployed on network ${networkId}. Deploy contracts and reload this page.`);
    }
    const codes = await Promise.all([provider.getCode(mcAddress), provider.getCode(condosAddress)]);
    if (codes.some(code => code === "0x")) {
      throw new Error("Contracts are missing on this blockchain. Redeploy contracts and reload this page.");
    }
    const signer = await provider.getSigner();

    const mc = new Contract(
      mcAddress,
      MoolahCoin.abi,
      signer
    );

    const condos = new Contract(
      condosAddress,
      Condos.abi,
      signer
    );

    return { signer, mc, condos };
  }

  async function refreshBalance(mc, address) {
    const decimals = await mc.decimals();
    const balance = await mc.balanceOf(address);

    setMcBalance(formatUnits(balance, decimals));
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) throw new Error("Please install MetaMask");
      await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      const { signer, mc } = await getContracts();
      const address = await signer.getAddress();

      setAccount(address);
      await refreshBalance(mc, address);
      setStatus("Wallet connected");
    } catch (error) {
      setStatus(error.reason || error.message);
    }
  }

  async function transferMC() {
    try {
      const to = recipient.trim();
      if (!isAddress(to) || to === ZeroAddress) {
        throw new Error("Nhập địa chỉ ví nhận hợp lệ: 0x và 40 ký tự hex. Không nhập tên tài khoản hoặc địa chỉ RPC.");
      }
      setStatus("Sending MC...");

      const { mc, signer } = await getContracts();
      const decimals = await mc.decimals();
      const value = parseUnits(amount.trim(), decimals);
      if (value <= 0n) throw new Error("Số MC phải lớn hơn 0.");

      const tx = await mc.transfer(
        to,
        value
      );

      await tx.wait();

      await refreshBalance(mc, await signer.getAddress());
      setStatus("MC transfer successful!");
    } catch (error) {
      setStatus(error.reason || error.message);
    }
  }

  async function checkNFT() {
    try {
      const { condos } = await getContracts();
      const owner = await condos.ownerOf(nftId);

      setNftOwner(owner);
      setStatus("NFT owner found");
    } catch (error) {
      setStatus(error.reason || error.message);
    }
  }

  async function transferNFT() {
    try {
      const to = recipient.trim();
      if (!isAddress(to) || to === ZeroAddress) {
        throw new Error("Nhập địa chỉ ví nhận hợp lệ: 0x và 40 ký tự hex. Không nhập tên tài khoản hoặc địa chỉ RPC.");
      }
      setStatus("Transferring NFT...");

      const { condos, signer } = await getContracts();
      const from = await signer.getAddress();

      const tx = await condos.transferFrom(
        from,
        to,
        nftId
      );

      await tx.wait();
      setNftOwner(await condos.ownerOf(nftId));
      setStatus("NFT transfer successful!");
    } catch (error) {
      setStatus(error.reason || error.message);
    }
  }

  return (
    <main className="wallet">
      <h1>Blockchain Token Wallet</h1>
      <p>Chapter 2 — ERC-20 & ERC-721</p>

      <section>
        <h2>MetaMask Wallet</h2>
        <button onClick={connectWallet}>
          Connect Wallet
        </button>
        <p>Account: {account || "Not connected"}</p>
      </section>

      <section>
        <h2>MoolahCoin (ERC-20)</h2>
        <h3>Balance: {mcBalance || "—"} MC</h3>

        <input
          placeholder="Recipient address (0x...)"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />

        <input
          placeholder="Amount of MC"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <button onClick={transferMC} disabled={!account}>
          Send MC
        </button>
      </section>

      <section>
        <h2>Condos (ERC-721)</h2>

        <input
          placeholder="NFT Token ID"
          value={nftId}
          onChange={(e) => setNftId(e.target.value)}
        />

        <button onClick={checkNFT} disabled={!account}>
          Check NFT Owner
        </button>

        <p>NFT Owner: {nftOwner || "Unknown"}</p>

        <button onClick={transferNFT} disabled={!account}>
          Transfer NFT to Recipient Above
        </button>
      </section>

      <p className="status">{status}</p>
    </main>
  );
}
