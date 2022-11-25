// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.12;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFanToken is IERC20 {
    function mint(address account, uint256 amount) external returns (bool);

    function getCurrentPrice() external returns (uint);

    function setNewPrice(uint _newPrice) external;
}
