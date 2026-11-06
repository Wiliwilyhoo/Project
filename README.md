# Hướng dẫn chạy Blockchain Token Wallet từ đầu

Dự án dùng React + Vite làm giao diện, MetaMask để ký giao dịch, Truffle để triển khai smart contract và Ganache làm blockchain trên máy cá nhân. Bạn có thể gửi **MoolahCoin (MC, ERC-20)**, kiểm tra chủ sở hữu và chuyển **Condos NFT (ERC-721)**.

Hướng dẫn dành cho Windows, PowerShell và MetaMask trên trình duyệt cùng máy. Đường dẫn ví dụ là `F:\Blockchain\Sub\Prj1`; nếu lưu dự án nơi khác, thay bằng đường dẫn của bạn.

## 1. Các khái niệm cần biết

| Thành phần | Vai trò |
| --- | --- |
| Ganache | Blockchain thử nghiệm, cung cấp tài khoản và ETH thử nghiệm |
| Truffle | Compile Solidity, deploy contract và chạy test |
| MetaMask | Chọn tài khoản, mạng và xác nhận giao dịch |
| React + Vite | Trang web tương tác với contract |
| ETH | Tiền trả phí giao dịch trên Ganache |
| MC | Token riêng của dự án, khác ETH |
| NFT ID | Số định danh của NFT, ví dụ `1` |
| ABI | Mô tả các hàm contract để giao diện gọi được |
| Deploy | Gửi giao dịch tạo contract trên blockchain |

ETH và token trong bài này chỉ dùng thử nghiệm. Không dùng tài khoản có tài sản thật hoặc private key thật cho bài thực hành.

## 2. Cài công cụ

1. Cài [Node.js](https://nodejs.org/en/download) cho Windows, kèm npm. Để chạy Vite 8, dùng Node 22 từ **22.12 trở lên**, hoặc Node 24 từ **24.0 trở lên**.
2. Có thể cài [Visual Studio Code](https://code.visualstudio.com/) để mở và sửa dự án.
3. Cài MetaMask từ [metamask.io](https://metamask.io/) vào trình duyệt. Tạo và mở khóa ví theo hướng dẫn của tiện ích.
4. Đóng rồi mở lại PowerShell hoặc VS Code sau khi cài Node.

Kiểm tra:

```powershell
node -v
npm -v
```

Nếu hiện số phiên bản là được. Nếu không tìm thấy lệnh, mở lại terminal và kiểm tra Node đã được thêm vào PATH khi cài.

Truffle/Ganache là công cụ cũ, có thể crash với Node 24. Các lệnh blockchain dưới đây dùng **Node 22 tạm thời qua `npx`**, không đổi Node toàn máy. Lần đầu cần Internet để tải package; nếu hỏi cài thì nhập `y`. Các lần sau npm thường dùng cache.

Nếu PowerShell chặn `npm.ps1` hoặc `npx.ps1`, thay `npm` bằng `npm.cmd`, `npx` bằng `npx.cmd` trong các lệnh tương ứng.

## 3. Mở dự án và cài thư viện

Mở PowerShell, chuyển đến thư mục có `package.json` và `truffle-config.js`:

```powershell
cd F:\Blockchain\Sub\Prj1
npm ci
```

`npm ci` cài đúng dependency trong `package-lock.json` và tạo lại `node_modules`. Không cần chạy mỗi lần mở dự án.

Bạn sẽ dùng ba terminal: một terminal giữ Ganache chạy, một terminal chạy lệnh deploy/test, một terminal giữ giao diện Vite chạy. Trong VS Code có thể mở nhiều terminal bằng nút `+` ở bảng Terminal.

## 4. Chạy Ganache — terminal số 1

Trong thư mục dự án, chạy:

```powershell
npx -p node@22 -p ganache@7.9.2 -c "ganache --server.host 127.0.0.1 --server.port 7545 --chain.chainId 1337 --chain.networkId 5777 --database.dbPath .ganache"
```

Giữ terminal này mở. Ý nghĩa các tham số:

- `7545`: port RPC, khớp `truffle-config.js`.
- `1337`: Chain ID để nhập vào MetaMask.
- `5777`: Network ID để Truffle ghi nhận deployment; khác Chain ID.
- `.ganache`: thư mục lưu blockchain để dùng lại sau khi tắt/mở.

Ganache sẽ in các tài khoản, ETH thử nghiệm và private key. Địa chỉ tài khoản và private key là hai thông tin khác nhau.

Nếu trước đây dùng Ganache GUI hoặc CLI khác, dừng instance cũ trước khi chạy lệnh này. Instance mới có thể có tài khoản khác, cần deploy lại và import đúng tài khoản. Không chạy hai Ganache cùng port.

Nếu dùng Git, thêm dòng sau vào `.gitignore` để không commit dữ liệu blockchain và ví thử nghiệm:

```gitignore
.ganache/
```

Kiểm tra RPC bằng terminal khác:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:7545 -Method Post -ContentType 'application/json' -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

`result` là `0x0` nghĩa là blockchain ở block 0; số hex khác cũng bình thường. Mở URL RPC trong trình duyệt có thể hiện 404 vì đây không phải trang web.

## 5. Deploy contract — terminal số 2

Giữ Ganache chạy, mở terminal mới:

```powershell
cd F:\Blockchain\Sub\Prj1
npx -p node@22 -p truffle@5.11.5 -c "truffle migrate --reset --network development"
```

Lệnh tải/dùng Truffle 5.11.5, không cần cài Truffle global. Thành công phải có:

- `Compiled successfully`.
- `contract address` cho cả `MoolahCoin` và `Condos`.
- `Total deployments: 2`.

Sau deploy:

- Tài khoản deploy mặc định là tài khoản đầu tiên của Ganache, thường có chỉ số `(0)`.
- Tài khoản này nhận **1.000 MC** và sở hữu **NFT #1**.
- NFT có metadata mẫu `Condo #1`, chưa có ảnh.
- `build/contracts/*.json` lưu ABI và địa chỉ deployment theo Network ID.

Kiểm tra địa chỉ:

```powershell
npx -p node@22 -p truffle@5.11.5 -c "truffle networks"
```

Giao diện đọc trực tiếp từ `build/contracts`. Không cần chép địa chỉ vào `App.jsx` hay cập nhật JSON trong `src/contracts`.

**Chú ý:** `--reset` deploy các instance mới. Số dư và NFT của instance cũ không chuyển sang instance mới. Không chạy migration trước mỗi lần mở web nếu muốn tiếp tục dữ liệu cũ.

Nếu chạy `node -v` bên ngoài `npx` vẫn thấy Node 24 thì bình thường. Kiểm tra Node tạm thời bằng:

```powershell
npx -p node@22 -c "node -v"
```

## 6. Thêm mạng vào MetaMask

Mở MetaMask, chọn thêm mạng thủ công. Tên nút có thể khác giữa các phiên bản. Nhập:

| Trường | Giá trị |
| --- | --- |
| Network name | `Ganache Local` |
| Default RPC URL | `http://127.0.0.1:7545` |
| Chain ID | `1337` |
| Currency symbol | `ETH` |
| Block explorer URL | Để trống |

Lưu và chọn mạng. RPC phải có tiền tố `http://`. Không nhập `5777` vào Chain ID với cấu hình Ganache trong hướng dẫn.

Nếu dùng Ganache GUI hoặc cấu hình khác, lấy Chain ID thật:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:7545 -Method Post -ContentType 'application/json' -Body '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

`0x539` tương ứng với `1337`. Lấy Network ID bằng:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:7545 -Method Post -ContentType 'application/json' -Body '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'
```

## 7. Import hai tài khoản thử nghiệm

Để demo, cần ví gửi và ví nhận:

1. Trong terminal Ganache, tìm private key của tài khoản đầu tiên `(0)`.
2. Trong MetaMask, chọn thêm/import tài khoản bằng **Private key**.
3. Dán private key đó, đặt tên `Ganache Sender`.
4. Lặp lại với tài khoản `(1)`, đặt tên `Ganache Receiver`.
5. Chọn Sender và mạng Ganache Local.

Địa chỉ Sender phải trùng dòng `account` trong log deploy để có 1.000 MC ngay sau deploy mới. Không dùng một địa chỉ mẫu từ máy người khác.

Không dán private key vào ô người nhận trên web, không chia sẻ key hoặc seed phrase. Các tài khoản Ganache in key ra terminal chỉ dành cho thử nghiệm.

Nếu dùng ví nhận tự tạo riêng trong MetaMask, ví đó có thể chưa có ETH trên Ganache. Gửi một ít ETH thử nghiệm từ tài khoản Ganache qua chức năng Send của MetaMask trước khi ví nhận cần thực hiện giao dịch.

## 8. Chạy giao diện — terminal số 3

```powershell
cd F:\Blockchain\Sub\Prj1
npm run dev
```

Mở URL ở dòng `Local`, thường là:

```text
http://localhost:5173
```

Nếu port bận, Vite có thể chọn port khác; dùng đúng URL nó in ra. Không mở trực tiếp `index.html` bằng File Explorer. Giữ terminal Vite mở.

Bấm **Connect Wallet**, chọn Sender và cho phép kết nối trong MetaMask. Nếu không thấy popup, mở tiện ích để kiểm tra yêu cầu đang chờ.

Ngay sau deploy mới, Sender phải thấy 1.000 MC. ETH trong MetaMask là tiền trả phí, không phải MC trên giao diện.

## 9. Thử gửi MC

1. Sao chép địa chỉ công khai của Receiver từ MetaMask hoặc Ganache.
2. Kết nối Sender trên web.
3. Dán địa chỉ Receiver vào **Recipient address**. Địa chỉ gồm `0x` và 40 ký tự hex phía sau.
4. Nhập `10` vào **Amount of MC**. Dùng dấu chấm cho số thập phân, ví dụ `0.5`.
5. Bấm **Send MC**, kiểm tra và xác nhận giao dịch trong MetaMask.
6. Chờ `MC transfer successful!`. Nếu chưa có giao dịch khác, Sender còn 990 MC.
7. Đổi sang Receiver trong MetaMask. Trang tự tải lại; bấm **Connect Wallet** và cho phép Receiver kết nối nếu cần. Receiver có 10 MC.

Ví gửi cần cả MC để chuyển và ETH trả phí. Giao diện chưa tự cập nhật số dư khi nhận token từ giao dịch bên ngoài; reload rồi kết nối lại để đọc số dư mới.

Muốn thấy MC trong MetaMask, dùng Import token/Custom token với địa chỉ **MoolahCoin** từ `truffle networks`, symbol `MC`, decimals `18`. Địa chỉ contract token khác địa chỉ tài khoản nhận.

## 10. Kiểm tra và chuyển NFT

**Check NFT Owner** đọc chủ sở hữu, không chuyển NFT và không phát sinh phí giao dịch:

1. Kết nối ví.
2. Nhập `1` vào **NFT Token ID**.
3. Bấm **Check NFT Owner**. Sau deploy mới, kết quả phải là Sender.

**Transfer NFT** chuyển toàn bộ NFT sang ví khác:

1. Chọn Sender trong MetaMask, kết nối lại sau khi trang reload.
2. Dán địa chỉ Receiver vào **Recipient address** ở phần MC phía trên. Chức năng NFT dùng chung ô này.
3. Nhập Token ID `1`.
4. Bấm **Transfer NFT to Recipient Above**, xác nhận trong MetaMask.
5. Chờ thành công và kiểm tra Owner: phải là Receiver.

Giao diện chuyển NFT từ ví đang kết nối, nên hãy dùng chính ví sở hữu NFT. Ví gửi cần ETH trả phí. Sau khi gửi cho Receiver, Sender không còn quyền gửi NFT #1 lần nữa.

Migration chỉ tạo NFT #1; ID `2` chưa tồn tại nếu chưa mint thêm. Web chưa có nút mint; hàm `mintCondo` chỉ cho owner của contract gọi. Owner của contract và chủ sở hữu một NFT là hai vai trò khác nhau.

## 11. Chạy test tự động

Giữ Ganache chạy, dùng terminal riêng:

```powershell
npx -p node@22 -p truffle@5.11.5 -c "truffle test --network development"
```

Test hiện kiểm tra địa chỉ deployment có bytecode, NFT #1 thuộc về owner và metadata có tên đúng. Mong đợi `1 passing`. Chưa có test tự động đầy đủ cho chuyển token và thao tác MetaMask.

Test dùng blockchain development đang cấu hình, có thể deploy thêm contract và tiêu ETH thử nghiệm. Nếu muốn tiếp tục demo với deployment mới nhất được lưu cho web, chạy migration ở bước 5 rồi reload giao diện.

## 12. Build giao diện để xem thử

Deploy trước khi build vì địa chỉ contract được lấy từ artifact tại thời điểm build:

```powershell
npm run build
npm run preview
```

Mở URL preview in trong terminal. `preview` dùng xem thử, không phải máy chủ production. Khi deploy đổi địa chỉ, cần build lại nếu sử dụng bản trong `dist`.

Với `npm run dev`, sau deploy hãy reload trang. Nếu chưa nhận artifact mới, dừng rồi chạy lại Vite.

## 13. Mở lại dự án những lần sau

Nếu còn thư mục `.ganache` và dùng đúng cấu hình bước 4:

1. Chạy lại Ganache bằng lệnh bước 4, tại đúng thư mục dự án.
2. Chạy `npm run dev` trong terminal khác.
3. Mở web, chọn mạng/tài khoản MetaMask rồi Connect Wallet.

Không cần `npm ci` hay migrate lại nếu thư viện và blockchain cũ vẫn còn. Khi xong, nhấn `Ctrl+C` ở terminal Vite và Ganache; chờ Ganache đóng xong để lưu dữ liệu.

Nếu xóa/mất `.ganache` hoặc chạy blockchain mới, cần deploy lại. Cùng RPC và Chain ID không đảm bảo dữ liệu blockchain vẫn là dữ liệu cũ. Nếu MetaMask giữ giao dịch pending/nonce từ blockchain cũ, kiểm tra chức năng xóa dữ liệu hoạt động tài khoản trong Settings; đọc kỹ và chỉ dùng cho tài khoản thử nghiệm.

## 14. Lỗi thường gặp

| Lỗi/hiện tượng | Nguyên nhân và cách xử lý |
| --- | --- |
| `Couldn't connect to node ...7545` | Ganache chưa chạy hoặc sai port. Kiểm tra bước 4. |
| `EADDRINUSE` | Port đang bị chiếm; dừng instance cũ hoặc dùng instance đang chạy. |
| Mở RPC bằng trình duyệt thấy 404 | RPC không phục vụ trang web. Kiểm tra bằng POST; mở giao diện qua URL Vite. |
| MetaMask không lấy được Chain ID | Kiểm tra Ganache, tiền tố `http://` và Chain ID thật. |
| Cảnh báo µWS, rồi `Falling back to a NodeJS implementation` | Native module không khớp Node. Nếu tiếp tục chạy thì chỉ là cảnh báo. |
| `Assertion failed ... UV_HANDLE_CLOSING` | Truffle crash trên Node/Windows. Dùng lệnh Node 22 trong hướng dẫn. |
| `Contracts have not been deployed to any network` | Migration chưa hoàn tất hoặc chưa lưu địa chỉ. File migration phải bắt đầu bằng số như `1_deploy_token.js`. |
| `Contracts are not deployed on network ...` | MetaMask đang ở mạng chưa có deployment trong artifact; chọn đúng mạng hoặc deploy lại rồi reload. |
| `Contracts are missing on this blockchain` | Artifact trỏ tới contract cũ sau khi reset/đổi Ganache. Deploy lại và reload; build lại nếu dùng preview. |
| `could not decode result data ... decimals ... 0x` | Thường gọi vào địa chỉ không có contract hoặc sai mạng. Kiểm tra Ganache/deployment. |
| `network does not support ENS` | Người nhận trống/sai. Nhập địa chỉ ví đầy đủ, không nhập URL, tên tài khoản hay private key. |
| Có ETH nhưng 0 MC | ETH và MC khác nhau. MC ban đầu thuộc tài khoản deploy; dùng ví đó hoặc chuyển MC sang ví hiện tại. |
| `insufficient funds` | Thiếu ETH trả phí, kể cả khi có MC/NFT. Nạp ETH thử nghiệm. |
| Chuyển MC bị revert | Kiểm tra số dư MC, số gửi dương, đúng mạng và người nhận hợp lệ. |
| NFT không tồn tại/chuyển thất bại | Dùng ID 1 sau deploy; kiểm tra Owner và kết nối đúng ví sở hữu. |
| Từ chối giao dịch trong MetaMask | Thực hiện lại và xác nhận nếu muốn tiếp tục. |
| Đổi tài khoản/mạng thì reload | Hành vi hiện tại để xóa dữ liệu ví cũ. Bấm Connect Wallet lại; dữ liệu đang nhập sẽ mất. |
| Giao diện trắng/không mở được | Giữ Vite chạy, dùng đúng URL; xem terminal và Console trình duyệt bằng F12. Port 7545 không phải frontend. |
| Build cảnh báo bundle lớn hoặc CommonJS/ESM | Xem kết quả cuối; cảnh báo không đồng nghĩa build thất bại. Không đổi `type` tùy tiện vì migration dùng CommonJS. |

Nếu cần hỗ trợ, gửi lệnh, log lỗi đầy đủ và địa chỉ tài khoản công khai/mạng đang chọn. Không gửi private key, seed phrase hoặc ảnh có các thông tin đó.

## 15. Các file quan trọng

| File/thư mục | Nội dung |
| --- | --- |
| `contracts/MoolahCoin.sol` | ERC-20; tạo 1.000 MC cho người deploy; owner có thể mint thêm |
| `contracts/Condos.sol` | ERC-721; owner contract được mint NFT |
| `migrations/1_deploy_token.js` | Deploy hai contract, mint NFT #1 cho owner |
| `truffle-config.js` | RPC development `127.0.0.1:7545`, Solidity 0.8.21 |
| `build/contracts/*.json` | Artifact deployment mà frontend đang dùng |
| `src/contracts/*.json` | Bản sao cũ, frontend hiện không import từ đây |
| `src/index.jsx` | Gắn React vào HTML |
| `src/App.jsx` | Kết nối ví, số dư, gửi MC và thao tác NFT |
| `test/deployment.js` | Test deployment và NFT mẫu |
| `.ganache/` | Dữ liệu blockchain khi chạy theo hướng dẫn |
| `dist/` | Frontend được tạo bởi `npm run build` |

Hướng dẫn chạy local trên một máy. `127.0.0.1` luôn trỏ về thiết bị hiện tại: MetaMask trên điện thoại/máy khác không tự kết nối được Ganache trên máy tính qua địa chỉ này.
