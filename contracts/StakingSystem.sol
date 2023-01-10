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

    // total nft staked
    uint256 public totalStaked;

    struct Staker {
        uint256[] tokenIds;
        uint256 balance;
        uint256 rewardsReleased;
        address owner;
    }

    // mapping of a staker to its wallet
    mapping(address => Staker) public stakers;

    // mapping of tokenId to owner
    mapping(uint256 => address) public tokenOwner;

    // mapping of tokenId to stakedTime
    mapping(uint256 => uint256) public tokenIdStakedAt;

    // mapping of tokenId to StakingStatus
    mapping(uint => bool) public nftStatus;

    // event emitted when a user has staked a nft
    event Staked(address owner, uint256 amount);

    // event emitted when a user has unstaked a nft
    event Unstaked(address owner, uint256 amount);

    // event emitted when a user claims reward
    event RewardPaid(address indexed user, uint256 reward);

    // Allows reward tokens to be claimed
    event ClaimableStatusUpdated(bool status);

    modifier isValidAddress() {
        require(msg.sender != address(0));
        _;
    }

    constructor(IERC721Enumerable _nft, IRewardToken _rewardToken) {
        nft = _nft;
        rewardToken = _rewardToken;
    }

    /**
     * @dev claim rewards function
     * @param account (type address) - address of account to claim reward for
     */
    function claimRewards(address account) public isValidAddress {
        calculateAndClaimRewards(account);
    }

    /**
     * @dev stake NFTs
     * @param tokenId (type uint) - the nft token id to stake
     */
    function stake(uint256 tokenId) external {
        _stake(msg.sender, tokenId);
    }

    /**
     * @dev stake multiple NFTs at once
     * @param tokenIds (type uint256[]) - the nft token ids to stake
     */
    function stakeBatch(uint256[] calldata tokenIds) external isValidAddress {
        for (uint i = 0; i < tokenIds.length; i++) {
            _stake(msg.sender, tokenIds[i]);
        }
    }

    /**
     * @dev unstake NFTs
     * @param tokenId (type address) - the nft token id to unstake
     */
    function unstake(uint256 tokenId) external isValidAddress {
        calculateAndClaimRewards(msg.sender);
        _unstake(msg.sender, tokenId);
    }

    /**
     * @dev unstake multiple NFTs at once and cl
     * @param tokenIds (type uint256[]) - the nft token ids to unstake
     */
    function unstakeBatch(uint256[] memory tokenIds) external isValidAddress {
        calculateAndClaimRewards(msg.sender);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (tokenOwner[tokenIds[i]] == msg.sender) {
                _unstake(msg.sender, tokenIds[i]);
            }
        }
    }

    function calculateAndClaimRewards(address account) internal {
        Staker storage staker = stakers[account];
        uint balance = staker.balance;
        uint rewardsReleased = staker.rewardsReleased;
        uint256[] storage ids = staker.tokenIds;
        for (uint i = 0; i < ids.length; i++) {
            uint tokenId = ids[i];
            uint256 stakedTime = ((block.timestamp - tokenIdStakedAt[tokenId]) /
                1 days);
            balance = 1e18 * stakedTime;
        }

        if (balance > 0) {
            rewardsReleased += balance;
            balance = 0;
            rewardToken.mint(account, balance);
            emit RewardPaid(account, balance);
        }
    }

    function _stake(address _account, uint256 _tokenId) internal {
        require(
            nft.ownerOf(_tokenId) == _account,
            "StakingSystem: User must be owner of NFT"
        );

        totalStaked++;
        Staker storage staker = stakers[_account];
        staker.tokenIds.push(_tokenId);
        tokenOwner[_tokenId] = _account;
        tokenIdStakedAt[_tokenId] = block.timestamp;
        nftStatus[_tokenId] = true;
        // check if it returns bool
        nft.transferFrom(_account, address(this), _tokenId);
        emit Staked(_account, _tokenId);
    }

    function _unstake(address _user, uint256 _tokenId) internal {
        require(
            tokenOwner[_tokenId] == _user,
            "Nft Staking System: user must be the owner of the staked nft"
        );
        totalStaked--;
        Staker storage staker = stakers[_user];

        uint256 lastIndex = staker.tokenIds.length - 1;
        uint256 lastIndexKey = staker.tokenIds[lastIndex];

        if (staker.tokenIds.length > 0) {
            staker.tokenIds.pop();
        }
        delete tokenOwner[_tokenId];

        nft.safeTransferFrom(address(this), _user, _tokenId);

        emit Unstaked(_user, _tokenId);
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
