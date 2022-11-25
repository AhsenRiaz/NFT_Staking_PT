// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FanToken is ERC20, Ownable {
    uint256 private _price;

    mapping(address => bool) private _controllers;

    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol)
    {}

    /**
     * @dev function use to mint token
     * @param account (type address) address of recipient
     * @param amount (type uint256) amount of token
     */

    function mint(address account, uint256 amount) public returns (bool) {
        require(
            _controllers[msg.sender],
            "FanToken: only controllers can mint"
        );
        require(amount != uint256(0), "FanToken: amount is 0");
        _mint(account, amount);
        return true;
    }

    /**
     * @dev function to use to burn token
     * @param amount (type uint256) amount of token
     * @param account (type address) address of recipient
     */
    function burn(uint256 amount, address account) public returns (bool) {
        require(
            _controllers[msg.sender],
            "FanToken: only controllers can burn"
        );
        require(amount > uint256(0), "FanToken: amount is 0");
        _burn(account, amount);
        return true;
    }

    /**
     * @dev function to allow only specific address to interact with this contract
     * @param controller (type address) address to allow
     */
    function addController(address controller) external onlyOwner {
        _controllers[controller] = true;
    }

    /**
     * @dev function to remove an address which is interacting with this contract
     * @param controller (type address) address to allow
     */
    function removeController(address controller) external onlyOwner {
        _controllers[controller] = false;
    }

    /**
     * @dev function to get the current price
     */
    function getCurrentPrice() external view returns (uint256) {
        require(
            _controllers[msg.sender],
            "FanToken: only controllers can mint"
        );
        return _price;
    }

    /**
     * @dev function to set a new price
     * @param _newPrice (type uint) address to allow
     */
    function setNewPrice(uint256 _newPrice) external {
        require(
            _controllers[msg.sender],
            "FanToken: only controllers can mint"
        );
        _price = _newPrice;
    }
}
