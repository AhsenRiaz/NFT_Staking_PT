// SPDX-License-Identifier: MIT LICENSE
pragma solidity 0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC721Enumerable.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./IRewardToken.sol";

contract StakingSystem is Ownable, IERC721Receiver {
    IERC721Enumerable public nft;
    IRewardToken public rewardToken;

    uint256 public totalStaked;

    struct Stake {
        uint24 tokenId;
        uint48 timestamp;
        address owner;
    }

    mapping(uint256 => Stake) public vault;

    event NFTStaked(address owner, uint256 tokenId, uint256 value);
    event NFTUnstaked(address owner, uint256 tokenId, uint256 value);
    event Claimed(address owner, uint256 amount);

    constructor(IERC721Enumerable _nft, IRewardToken _rewardToken) {
        nft = _nft;
        rewardToken = _rewardToken;
    }

    function stake(uint256[] calldata tokenIds) external {
        _stake(msg.sender, tokenIds);
    }

    function unstake(uint256[] calldata tokenIds) external {
        _unstake(msg.sender, tokenIds);
    }

    function claim(uint256[] calldata tokenIds) external {
        _claim(msg.sender, tokenIds);
    }

    function balanceOf(address account) public view returns (uint256) {
        uint256 balance = 0;
        uint256 supply = nft.totalSupply();
        for (uint i = 1; i <= supply; i++) {
            if (vault[i].owner == account) {
                balance += 1;
            }
        }
        return balance;
    }

    function _stake(address account, uint256[] calldata tokenIds) internal {
        uint256 tokenId;
        totalStaked += tokenIds.length;
        for (uint i = 0; i < tokenIds.length; i++) {
            tokenId = tokenIds[i];
            require(
                nft.ownerOf(tokenId) == account,
                "StakingSystem: User does not own the NFT"
            );
            require(
                vault[tokenId].tokenId == 0,
                "StakingSystem: Already Staked"
            );

            vault[tokenId] = Stake({
                owner: account,
                tokenId: uint24(tokenId),
                timestamp: uint48(block.timestamp)
            });

            nft.transferFrom(account, address(this), tokenId);
            emit NFTStaked(account, tokenId, block.timestamp);
        }
    }

    function _unstake(address account, uint256[] calldata tokenIds) internal {
        uint256 tokenId;
        totalStaked -= tokenIds.length;
        for (uint i = 0; i < tokenIds.length; i++) {
            tokenId = tokenIds[i];
            Stake memory staked = vault[tokenId];
            require(staked.owner == msg.sender, "not an owner");

            delete vault[tokenId];
            emit NFTUnstaked(account, tokenId, block.timestamp);
            nft.transferFrom(address(this), account, tokenId);
        }
    }

    function _claim(address account, uint256[] calldata tokenIds) internal {
        uint256 tokenId;
        uint256 earned = 0;

        for (uint i = 0; i < tokenIds.length; i++) {
            tokenId = tokenIds[i];
            Stake memory staked = vault[tokenId];
            require(staked.owner == account, "not an owner");
            uint256 stakedAt = staked.timestamp;
            earned += (1e18 * (block.timestamp - stakedAt)) / 1 days;
            vault[tokenId] = Stake({
                owner: account,
                tokenId: uint24(tokenId),
                timestamp: uint48(block.timestamp)
            });
        }
        if (earned > 0) {
            rewardToken.mint(account, earned);
        }

        emit Claimed(account, earned);
    }

    function onERC721Received(
        address,
        address from,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        require(from == address(0x0), "Cannot send nfts to Vault directly");
        return IERC721Receiver.onERC721Received.selector;
    }
}
