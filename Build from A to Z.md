# Dựng dự án Token Wallet từ đầu (A → Z)

Hướng dẫn này dựng lại toàn bộ dự án từ con số 0: tạo frontend, cài blockchain tool, viết contract, deploy, nối với giao diện. Dùng khi muốn hiểu kiến trúc hoặc làm lại một dự án tương tự.

Versions đã test trong repo này — nên giữ nguyên để tránh lỗi không tương thích: Node 22, Vite 8, React 19, Truffle 5.11.5, Ganache 7.9.2, Solidity 0.8.21, OpenZeppelin Contracts 4.9.6, ethers 6.

## 0. Cài công cụ máy

| Công cụ | Vai trò | Ghi chú tương thích |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | Chạy npm, Vite | Vite 8 cần Node 22.12+ hoặc Node 24.0+. Truffle/Ganache (bản cũ) **không chạy ổn trên Node 24** — xem mục 7. |
| MetaMask (extension trình duyệt) | Ký giao dịch | Không liên quan Node version |
| VS Code (tuỳ chọn) | Sửa code | |

```powershell
node -v
npm -v
```

## 1. Tạo project React + Vite

```powershell
mkdir "Blockchain-Wallet" ; cd "Blockchain-Wallet"
npm create vite@latest . -- --template react
npm install
```

Chọn `react` (không cần TypeScript trừ khi muốn). Lệnh này tạo `index.html`, `src/App.jsx`, `vite.config.js`, `package.json`.

Đổi `type` trong `package.json` nếu muốn dùng `require()` trong `truffle-config.js` và migrations (Truffle là CommonJS):

```json
"type": "commonjs"
```

## 2. Cài thư viện blockchain cho frontend

```powershell
npm install ethers
npm install @openzeppelin/contracts
```

- `ethers` (v6): gọi contract từ trình duyệt qua MetaMask.
- `@openzeppelin/contracts`: base contract ERC-20/ERC-721 chuẩn, đã audit, không tự viết lại từ đầu.

## 3. Tạo cấu trúc Truffle (compile + deploy)

Không cần cài Truffle global. Dùng `npx` để chạy đúng version mà không ảnh hưởng máy:

```powershell
npx -p truffle@5.11.5 -c "truffle init"
```

Lệnh này tạo:
- `contracts/` — chứa file `.sol`
- `migrations/` — script deploy
- `test/` — test contract
- `truffle-config.js` — cấu hình network, compiler

**Chú ý Windows:** nếu PowerShell chặn file `.ps1` (`npm.ps1`/`npx.ps1` bị từ chối chạy do Execution Policy), đổi `npm` → `npm.cmd`, `npx` → `npx.cmd`.

## 4. Cấu hình `truffle-config.js`

Mở file, sửa phần `networks` và `compilers`:

```js
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,       // khớp port Ganache sẽ chạy ở bước 6
      network_id: "*"
    }
  },
  compilers: {
    solc: {
      version: "0.8.21" // ghim cứng version — tránh solc tự chọn bản mới gây lỗi cú pháp khác
    }
  }
};
```

⚠️ **Lưu ý tương thích:** Solidity version trong `compilers.solc.version` phải **khớp hoặc cao hơn** `pragma solidity` khai báo trong file `.sol`. Dự án dùng `pragma solidity ^0.8.20;` nên solc `0.8.21` hợp lệ.

## 5. Viết smart contract

`contracts/MoolahCoin.sol` — token ERC-20:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MoolahCoin is ERC20, Ownable {
    constructor() ERC20("Moolah Coin", "MC") {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
```

`contracts/Condos.sol` — NFT ERC-721:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Condos is ERC721URIStorage, Ownable {
    uint256 public nextTokenId = 1;

    constructor() ERC721("Condos", "CONDO") {}

    function mintCondo(address to, string memory uri)
        external
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = nextTokenId;
        nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }
}
```

Kế thừa từ OpenZeppelin thay vì tự viết `transfer`, `approve`, `balanceOf`... — những hàm này dễ sai bảo mật nếu viết tay.

## 6. Viết migration (script deploy)

`migrations/1_deploy_token.js`:

```js
const MoolahCoin = artifacts.require("MoolahCoin");
const Condos = artifacts.require("Condos");

module.exports = async function (deployer) {
  await deployer.deploy(MoolahCoin);
  await deployer.deploy(Condos);
};
```

`artifacts.require` chỉ hoạt động trong môi trường Truffle chạy (`truffle migrate`), không chạy được bằng `node migrations/1_deploy_token.js` trực tiếp.

## 7. Cài và chạy blockchain thử nghiệm (Ganache)

```powershell
npx -p node@22 -p ganache@7.9.2 -c "ganache --server.host 127.0.0.1 --server.port 7545 --chain.chainId 1337 --chain.networkId 5777 --database.dbPath .ganache"
```

⚠️ **Lỗi tương thích thường gặp:** Ganache 7.9.2 dùng binary gốc (`uws`) chỉ build cho Node 16/18/20. Chạy với Node 22+ trên Windows sẽ crash:
```
Error: Cannot find module '../binaries/uws_win32_x64_127.node'
```
Sửa bằng cách set biến môi trường bắt Ganache dùng bản JS fallback (chậm hơn chút nhưng chạy ổn, chấp nhận được cho máy dev):

```powershell
$env:UWS_USE_FALLBACK="true"; npx -p node@22 -p ganache@7.9.2 -c "ganache --server.host 127.0.0.1 --server.port 7545 --chain.chainId 1337 --chain.networkId 5777 --database.dbPath .ganache"
```

Ý nghĩa tham số:
- `chainId 1337`: nhập vào MetaMask khi thêm network.
- `networkId 5777`: Truffle dùng để lưu địa chỉ deploy trong `build/contracts/*.json`. Phải **cố định** — nếu để Ganache tự sinh random mỗi lần, artifact deploy cũ sẽ không khớp lần chạy sau, phải deploy lại liên tục.
- `--database.dbPath .ganache`: lưu toàn bộ state blockchain ra đĩa, tắt mở lại không mất dữ liệu (số dư, NFT...). Thêm `.ganache/` vào `.gitignore`.

Giữ terminal này mở khi làm việc.

## 8. Compile và deploy contract

Terminal khác, cùng thư mục dự án:

```powershell
npx -p node@22 -p truffle@5.11.5 -c "truffle migrate --reset --network development"
```

Kỳ vọng thấy `Compiled successfully` và địa chỉ `contract address` cho từng contract. Kết quả được ghi vào `build/contracts/MoolahCoin.json` và `build/contracts/Condos.json` — file này chứa cả ABI (mô tả hàm) và địa chỉ deploy theo từng network ID.

(Tuỳ chọn) chạy test:

```powershell
npx -p node@22 -p truffle@5.11.5 -c "truffle test --network development"
```

## 9. Nối frontend với contract

Trong `src/App.jsx`, dùng `ethers` để lấy contract từ artifact Truffle sinh ra:

```jsx
import { BrowserProvider, Contract } from "ethers";
import MoolahCoin from "../build/contracts/MoolahCoin.json";

const provider = new BrowserProvider(window.ethereum);
const networkId = await provider.send("net_version", []);
const address = MoolahCoin.networks[networkId]?.address;
const signer = await provider.getSigner();
const mc = new Contract(address, MoolahCoin.abi, signer);
```

Điểm quan trọng: tra `networks[networkId]` tại runtime, **không hard-code địa chỉ** — vì mỗi lần deploy lại (hoặc đổi máy) địa chỉ contract thay đổi, nhưng network ID trong artifact luôn tự cập nhật đúng.

## 10. Thêm mạng + tài khoản vào MetaMask

1. MetaMask → Add network → RPC `http://127.0.0.1:7545`, Chain ID `1337`.
2. Copy private key của 1 account in ra khi Ganache khởi động (mục `Private Keys`) → MetaMask → Import account.

MetaMask không tự thấy tài khoản của Ganache — luôn phải import bằng private key.

## 11. Chạy giao diện

```powershell
npm run dev
```

Mở URL Vite in ra (ví dụ `http://localhost:5174`), chọn đúng network + account trong MetaMask, bấm Connect Wallet.

## Checklist các lỗi tương thích hay gặp

| Vấn đề | Nguyên nhân | Cách tránh |
| --- | --- | --- |
| Ganache crash lúc khởi động | Node 22+ không có binary native `uws` tương thích | Thêm `UWS_USE_FALLBACK=true` |
| Truffle/Ganache lỗi lạ, không rõ nguyên nhân | Chạy bằng Node 24 — Truffle 5.x là tool cũ, chưa test với Node mới nhất | Ép dùng Node 22 qua `npx -p node@22` khi gọi Truffle/Ganache, không cần đổi Node toàn máy |
| `npm`/`npx` báo lỗi "not digitally signed" hoặc bị chặn | PowerShell Execution Policy chặn file `.ps1` | Dùng `npm.cmd`/`npx.cmd` thay vì `npm`/`npx` |
| Contract compile lỗi version solc | `pragma solidity` trong file `.sol` không khớp `compilers.solc.version` | Ghim version solc ≥ version trong pragma |
| Frontend báo `Contracts are not deployed on network ...` | `networkId` Ganache đổi khác lần deploy trước (do không cố định bằng `--chain.networkId`) | Luôn chạy Ganache với `--chain.networkId` cố định, không đổi giữa các lần |
| MetaMask không thấy MC/NFT nào | Chưa import đúng private key account đã deploy, hoặc đang ở network khác | Import account bằng private key Ganache in ra, chọn đúng network 1337 |
| `insufficient funds` khi deploy | Dữ liệu `.ganache/` cũ còn giữ account đã cạn ETH | Xóa `.ganache/`, chạy lại Ganache để tạo blockchain mới |
