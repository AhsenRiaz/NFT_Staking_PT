// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.12;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IFanToken.sol";
import "./NounsToken.sol";
import "./CoinioToken.sol";

contract Swapper is ReentrancyGuard {
    IFanToken public fanToken;
    NounsToken public nounsToken;
    CoinioToken public coinioToken;

    constructor(
        address _fanToken,
        address _nounsToken,
        address _coinioToken
    ) {
        fanToken = IFanToken(_fanToken);
        nounsToken = NounsToken(_nounsToken);
        coinioToken = CoinioToken(_coinioToken);

        fanToken.approve(address(this), fanToken.totalSupply());
        nounsToken.approve(address(this), nounsToken.totalSupply());
        coinioToken.approve(address(this), coinioToken.totalSupply());
    }

    /**
     * Convert an amount of input token_ to an equivalent amount of the output token
     *
     * @param token_ address of the token to swap
     * @param amount amount of token to swap/receive
     */
    function swap(address token_, uint256 amount) external nonReentrant {
        require(msg.sender != address(0), "Swapper: sender is address zero");
        require(amount > 0, "Swapper: amount is zero");

        uint256 balanceOf = IERC20(token_).balanceOf(msg.sender);

        require(balanceOf >= amount, "Swapper: insufficient balance");
        uint256 allowance = IERC20(token_).allowance(msg.sender, address(this));
        require(allowance >= amount, "Tokens not approved");

        IERC20(token_).transferFrom(msg.sender, address(this), amount);
        bool sent = fanToken.mint(msg.sender, amount);
        require(sent, "Swapper: transaction failed");
    }

    /**
     * Convert an amount of output token to an equivalent amount of the input token
     *
     * @param token_ address of the token to swap
     * @param amount amount of token to swap/receive
     */
    function unswap(address token_, uint256 amount) external {
        require(msg.sender != address(0), "Swapper: sender is address zero");
        require(amount > 0, "Swapper: amount is zero");

        uint256 balanceOf = fanToken.balanceOf(msg.sender);

        require(balanceOf >= amount, "Swapper: insufficient balance");

        IERC20(fanToken).transferFrom(msg.sender, address(this), amount);

        IERC20(token_).transferFrom(token_, msg.sender, amount);
    }

    /**
     * get the current price of the FanToken
     *
     */
    function getCurrentPrice() public returns (uint256) {
        return fanToken.getCurrentPrice();
    }

    /**
     * set new price of the FanToken
     *
     * @param _price address of the token to swap
     */
    function setPrice(uint256 _price) external {
        fanToken.setNewPrice(_price);
    }

    function getFanTokenAddress() external view returns (address) {
        return address(fanToken);
    }
}
