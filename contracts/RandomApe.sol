// SPDX-License-Identifier: GPL-3.0
// internal one used memory for function's paremeters
// external one uses calldata for functions's parameters
pragma solidity 0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract RandomApe is ERC721Enumerable, Ownable {
    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {}

    function mint(address to_, uint256 mintAmount_) external {
        uint256 _totalSupply = totalSupply();

        for (uint i = 1; i <= mintAmount_; i++) {
            _safeMint(to_, _totalSupply + i);
        }
    }
}
