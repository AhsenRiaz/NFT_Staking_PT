// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CoinioToken is ERC20, Ownable {
    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol)
    {
        _mint(address(this), 100000 * 10**decimals());
    }

    /**
     * @dev function use to mint token
     * @param account (type address) address of recipient
     * @param amount (type uint256) amount of token
     */

    function mint(address account, uint256 amount) public returns (bool) {
        require(amount != uint256(0), "NounsToken: amount is 0");
        _mint(account, amount);
        return true;
    }
}
