// SPDX-License-Identifier: MIT LICENSE
pragma solidity 0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC721Enumerable.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./IRewardToken.sol";

contract StakingSystem is IERC721Receiver, Ownable, ReentrancyGuard {
    IERC721Enumerable public nft;
    IRewardToken public rewardToken;

    uint256 public totalStaked;

    struct Stake {
        uint256 tokenId;
        uint256 stakedAt;
        address owner;
        uint256 released;
    }

    // mapping of tokenId to stake
    mapping(uint256 => Stake) public vaults;

    // mapping of tokenId to StakingStatus
    mapping(uint => bool) public nftStatus;

    event Staked(address owner, uint256 tokenId, uint256 value);
    event Unstaked(address owner, uint256 tokenId, uint256 value);
    event Claimed(address owner, uint256 amount);

    constructor(IERC721Enumerable _nft, IRewardToken _rewardToken) {
        nft = _nft;
        rewardToken = _rewardToken;
    }

    function stake(uint256[] calldata tokenIds) external nonReentrant {
        _stake(msg.sender, tokenIds);
    }

    function unstake(uint256[] calldata tokenIds) external nonReentrant {
        _unstake(msg.sender, tokenIds);
    }

    function claim(uint256[] calldata tokenIds) external nonReentrant {
        _claim(msg.sender, tokenIds);
    }

    function balanceOf(address account) external view returns (uint256) {
        uint256 balance = 0;
        uint256 supply = nft.totalSupply();
        for (uint i = 1; i <= supply; i++) {
            if (vaults[i].owner == account) {
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
                vaults[tokenId].tokenId == 0,
                "StakingSystem: Already Staked"
            );

            Stake storage vault = vaults[tokenId];
            vault.owner = account;
            vault.tokenId = tokenId;
            vault.stakedAt = block.timestamp;

            nftStatus[tokenId] = true;

            nft.safeTransferFrom(account, address(this), tokenId);
            emit Staked(account, tokenId, block.timestamp);
        }
    }

    function _unstake(
        address account,
        uint256[] calldata tokenIds
    ) internal nonReentrant {
        uint256 tokenId;
        totalStaked -= tokenIds.length;
        for (uint i = 0; i < tokenIds.length; i++) {
            tokenId = tokenIds[i];
            Stake memory staked = vaults[tokenId];
            require(staked.owner == msg.sender, "not an owner");

            delete vaults[tokenId];
            nft.transferFrom(address(this), account, tokenId);
            emit Unstaked(account, tokenId, block.timestamp);
        }
    }

    function _claim(
        address account,
        uint256[] calldata tokenIds
    ) internal nonReentrant {
        uint256 tokenId;
        uint256 earned = 0;

        for (uint i = 0; i < tokenIds.length; i++) {
            tokenId = tokenIds[i];
            Stake memory staked = vaults[tokenId];
            require(staked.owner == account, "not an owner");
            uint256 stakedAt = staked.stakedAt;
            earned += (1e18 * (block.timestamp - stakedAt)) / 1 days;
            Stake storage vault = vaults[tokenId];
            vault.owner = account;
            vault.tokenId = tokenId;
            vault.stakedAt = block.timestamp;
            staked.released = staked.released + earned;
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
