
// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "./library.sol";

/**
 * @dev LP staking related to OURO/xxx pair
 */
contract LPStaking is Ownable, ReentrancyGuard,Pausable {
    using SafeERC20 for IERC20;
    using SafeMath for uint;
    
    uint256 internal constant SHARE_MULTIPLIER = 1e18; // share multiplier to avert division underflow
    
    //==改动开始==
    ///assetContract 即用户的质押资产固定为ogs 
    ///auto compound tg上甲方定义为质押ogs生出ogs
    // address public constant assetContract = 0x416947e6Fc78F158fd9B775fA846B72d768879c2; // the asset to stake
    //==改动结束==

    address public assetContract;
    address public ogsContract;
    // address public constant ogsContract = 0x416947e6Fc78F158fd9B775fA846B72d768879c2;

    mapping (address => uint256) private _balances; // tracking staker's value
   
    //==改动开始==
    uint256 private _numStaker = 0 ; // track the number of total staker
    mapping (uint256 => address) private _stakersAddress; // tracking stakers' address  
    //==改动结束==

    mapping (address => uint256) internal _rewardBalance; // tracking staker's claimable reward tokens
    uint256 private _totalStaked; // track total staked value
    
    /// @dev initial block reward
    uint256 public BlockReward = 0;
    
    /// @dev round index mapping to accumulate share.
    mapping (uint => uint) private _accShares;
    /// @dev mark staker's highest settled round.
    mapping (address => uint) private _settledRounds;
    /// @dev a monotonic increasing round index, STARTS FROM 1
    uint256 private _currentRound = 1;
    // @dev last rewarded block
    uint256 private _lastRewardBlock = block.number;
    
    /**
     * ======================================================================================
     * 
     * SYSTEM FUNCTIONS
     *
     * ======================================================================================
     */
    //==改动开始==
    ///assetContract即质押资产固定为ogs,由此不需要构造函数
    constructor(address _ogsContract) public {
        require(_ogsContract != address(0), "constructor： assetContract_ is zero address");
        ogsContract = _ogsContract;
        assetContract = _ogsContract; 
    }
    //==改动结束==
        
    /**
     * @dev set block reward
     */
    function setBlockReward(uint256 reward) external onlyOwner {
        // settle previous rewards
        updateReward();
        // set new block reward
        BlockReward = reward;
            
        // log
        emit BlockRewardSet(reward);
    }

    /**
     * @dev called by the owner to pause, triggers stopped state
     **/
    function pause() onlyOwner external { _pause(); }

    /**
    * @dev called by the owner to unpause, returns to normal state
    */
    function unpause() onlyOwner external { _unpause(); }
    
    /**
     * ======================================================================================
     * 
     * STAKING FUNCTIONS
     *
     * ======================================================================================
     */
     
    /**
     * @dev stake assets
     */
    //清算并compound所有用户
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "zero deposit");
        // settle and compound all rewards
        settleStaker();
        
        // modifiy
        _balances[msg.sender] += amount;
        _totalStaked += amount;

        //==改动开始==
        _stakersAddress[_numStaker] = msg.sender; //the index 0 mapping to the first staker address
        _numStaker += 1; //add a staker
        
        //==改动结束==
        // transfer asset from AssetContract
        IERC20(assetContract).safeTransferFrom(msg.sender, address(this), amount);
        // log
        emit Deposit(msg.sender, amount);
    }
    
    //==改动开始==
    //在结算时将自动compound所有用户，所以claimRewards触发时中所有用户reward的值固定为0，即_rewardBalance[msg.sender]=0
    //用户的所有利息与本金均应直接通过 withdraw取出，即用户的所有利息与本金在结算时均在_balances[msg.sender]中
    // /**
    //  * @dev claim rewards
    //  */
    // //清算并compound所有用户
    // function claimRewards() external nonReentrant whenNotPaused {
    //     // settle and compound all rewards
    //     settleStaker();
        
    //     // reward balance modification
    //     uint amountReward = _rewardBalance[msg.sender];
    //     delete _rewardBalance[msg.sender]; // zero reward balance

    //     // mint reward to sender
    //     IOGSToken(ogsContract).mint(msg.sender, amountReward);
        
    //     // log
    //     emit OGSClaimed(msg.sender, amountReward);
    // }
    //==改动结束==
    
    /**
     * @dev withdraw the staked assets
     */
    //清算并compound所有用户
    function withdraw(uint256 amount) external nonReentrant {
        require(amount <= _balances[msg.sender], "balance exceeded");

        // settle and compound all rewards
        settleStaker();

        // modifiy
        _balances[msg.sender] -= amount;
        _totalStaked -= amount;
        
        // transfer assets back
        IERC20(assetContract).safeTransfer(msg.sender, amount);
        
        // log
        emit Withdraw(msg.sender, amount);
    }

    /**
     * @dev settle a staker
     */
    //==改动开始==
    //关于什么时候把用户的利息拿去compound，必须得有触发机制，即用户积攒到何时的利息再拿去投资？
    //***这里暂时定义为当前auto ogs池中每当有用户来withdraw或deposit或claimRewards时触发所有用户的compound(注:compound的效果与auto ogs池的社区用户参与活跃程度正相关,极端情况当auto ogs池后续没有活跃社区用户时,无compound效果,即与manual的效果相同)***
    //每当结算一个用户的时候,自动地将所有用户的利润放到质押池中,清零所有用户的利润,更新所有用户的质押金额与总质押池的大小
    function settleStaker() internal {
        // update reward snapshot
        updateReward();
        
        // settle this account
        uint accountCollateral;
        uint lastSettledRound;
        uint newSettledRound = _currentRound - 1;
        
        // round rewards
        uint roundReward;  
        
        ///===改动开始===
        // reinvest all accounts'reward
        //由于balances即质押的是ogs,reward也是ogs,所以这里应该可以直接相加
        if (_numStaker > 0){     //auto ogs池必须有参与用户
            // auto compound 所有用户
            for (uint256 _i=0; _i<_numStaker; _i++ ){
                   
                address currentStaker = _stakersAddress[_i]; //当前池中其他Staker的地址

                // settle this account
                accountCollateral = _balances[currentStaker];
                lastSettledRound = _settledRounds[currentStaker];

                // round rewards
                roundReward = _accShares[newSettledRound].sub(_accShares[lastSettledRound])
                                .mul(accountCollateral)
                                .div(SHARE_MULTIPLIER);  // remember to div by SHARE_MULTIPLIER

                // update reward balance
                _rewardBalance[currentStaker] += roundReward;
                
                // mark new settled reward round
                _settledRounds[currentStaker] = newSettledRound;

                //reinvest current account's reward
                _balances[currentStaker] += _rewardBalance[currentStaker];
                _totalStaked += _rewardBalance[currentStaker];
                // log current account reinvest
                emit Deposit(currentStaker, _rewardBalance[currentStaker]);
                // zero reward balance, save gas
                delete _rewardBalance[currentStaker];  //如果测试报错的话,该行改为:  _rewardBalance[currentStaker]=0  

            }
        }

        ///===改动结束===
    }
    //==改动结束==
     
    /**
     * @dev update accumulated block reward until current block
     */
    function updateReward() internal {
        // skip round changing in the same block
        if (_lastRewardBlock == block.number) {
            return;
        }
    
        // postpone rewarding if there is none staker
        if (_totalStaked == 0) {
            return;
        }

        // settle reward share for [_lastRewardBlock, block.number]
        uint blocksToReward = block.number.sub(_lastRewardBlock);
        uint mintedReward = BlockReward.mul(blocksToReward);

        // reward share
        uint roundShare = mintedReward.mul(SHARE_MULTIPLIER)
                                        .div(_totalStaked);
                                
        // mark block rewarded;
        _lastRewardBlock = block.number;
            
        // accumulate reward share
        _accShares[_currentRound] = roundShare.add(_accShares[_currentRound-1]); 
       
        // next round setting                                 
        _currentRound++;
        
    }
    
    /**
     * ======================================================================================
     * 
     * VIEW FUNCTIONS
     *
     * ======================================================================================
     */
        
    /**
     * @dev return value staked for an account
     */
    function numStaked(address account) external view returns (uint256) { return _balances[account]; }

    /**
     * @dev return total staked value
     */
    function totalStaked() external view returns (uint256) { return _totalStaked; }
     
    /**
     * @notice sum unclaimed reward;
     */
    function checkReward(address account) external view returns(uint256 rewards) {
        uint accountCollateral = _balances[account];
        uint lastSettledRound = _settledRounds[account];
        
        // reward = settled rewards + unsettled rewards + newMined rewards
        uint unsettledShare = _accShares[_currentRound-1].sub(_accShares[lastSettledRound]);
        
        uint newMinedShare;
        if (_totalStaked > 0) {
            uint blocksToReward = block.number.sub(_lastRewardBlock);
            uint mintedReward = BlockReward.mul(blocksToReward);
    
            // reward share
            newMinedShare = mintedReward.mul(SHARE_MULTIPLIER)
                                        .div(_totalStaked);
        }
        
        return _rewardBalance[account] + (unsettledShare + newMinedShare).mul(accountCollateral)
                                            .div(SHARE_MULTIPLIER);  // remember to div by SHARE_MULTIPLIER;
    }
    
    /**
     * ======================================================================================
     * 
     * STAKING EVENTS
     *
     * ======================================================================================
     */
     event Deposit(address account, uint256 amount);
     event Withdraw(address account, uint256 amount);
     event OGSClaimed(address account, uint256 amount);
     event BlockRewardSet(uint256 reward);
}