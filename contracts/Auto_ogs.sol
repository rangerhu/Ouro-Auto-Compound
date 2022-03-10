// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "./library.sol";



interface iLPStaking {
    function deposit(uint256 _amount) external;

    function claimRewards() external;

    function withdraw(uint256 amount) external;

    function numStaked(address account) external view returns (uint256);

    function totalStaked() external view returns (uint256);

    function checkReward(address account) external view returns (uint256);
}


/**
 * @dev AutoCompound ogs 
 */
contract AutoCompound is Ownable, ReentrancyGuard,Pausable {
    using SafeERC20 for IERC20;
    using SafeMath for uint;
    
    uint256 internal constant SHARE_MULTIPLIER = 1e18; // share multiplier to avert division underflow
    
    address public immutable assetContract; // the asset to invest -> ogs
    // address public constant ogsContract = 0x416947e6Fc78F158fd9B775fA846B72d768879c2;

    
    mapping(address => uint256) private clientShareNum; // tracking the number of shares own by investment agent clients 
    uint256 private totalClientShareNum = 0; // track the total shares given by investment agent 
    uint256 private lastHarvestedTime; // track the latest harvest timesteamp
    
    address private lpstaking;
    


    
    /**
     * ======================================================================================
     * 
     * SYSTEM FUNCTIONS
     *
     * ======================================================================================
     */
    constructor(address assetContract_,address _lpstaking) public {
        require(assetContract_ != address(0), "constructor： assetContract_ is zero address");
        assetContract = assetContract_; //ogs
        lpstaking=_lpstaking;
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
     * AGENT MANAGE INVESTMENT(AUTO COMPOUND) FUNCTIONS
     *
     * ======================================================================================
     */


    /**
     * @notice all "agent" refer to "auto compound investment agent" 
     */

    /**
     * @dev obtain agent's uncompound ogs balance
     */
    function available() public view returns (uint256) {
        return IERC20(assetContract).balanceOf(address(this));
    }

    /**
     * @dev obtain agent's staked and uncompound ogs balance
     */    
    function balanceOf() public view returns (uint256) {
        uint256 amount = iLPStaking(lpstaking).numStaked(address(this));
        return IERC20(assetContract).balanceOf(address(this)).add(amount);
    }


    /**
     * @dev agent deposits all his uncompound ogs into ogs lpstaking to earn staking rewards
     */
    function _earn() internal {
        uint256 bal = available();
        if (bal > 0) {
            IERC20(assetContract).approve(lpstaking, bal);
            iLPStaking(lpstaking).deposit(bal);
        }
    }


    /** 
     * @notice need to be frenquently called by bot  
     * @dev obtain agent's investment reward, compound agent's all balance 
     */
    function harvest() external nonReentrant whenNotPaused {
        iLPStaking(lpstaking).claimRewards();
        _earn();

        lastHarvestedTime = block.timestamp;

        emit Harvest(msg.sender,lastHarvestedTime);
    }

    
    
    /**
     * ======================================================================================
     * 
     * CLIENT JOIN INVESTMENT(AUTO COMPOUND) FUNCTIONS
     *
     * ======================================================================================
     */
     

    /**
     * @notice all "agent" refer to "auto compound investment agent" 
     */


    /**
     * @dev client send ogs to agent and join an auto compound investment
     */
    function clientDeposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "zero deposit");
        // obtain agent pool oga balance
        uint256 agentPool = balanceOf();

        // transfer ogs from client to agent 
        IERC20(assetContract).safeTransferFrom(msg.sender, address(this), amount);
        
        // convert client deposit into shares(client can withdraw share and convert share into ogs)
        // inital current client shares number as 0
        uint256 currentClientShareNum = 0;
        //  calculate the number of current client shares given by agent
        //  the same way whow pancake auto pool calculate the share
        if (totalClientShareNum != 0) {
            // There may exists computational accuracy issues ,however pancake auto pool accept it, not sure whether we accept it or not
            currentClientShareNum = (amount.mul(totalClientShareNum)).div(agentPool);
        } else {
            currentClientShareNum = amount;
        }
        // update the number of current client shares 
        clientShareNum[msg.sender] += currentClientShareNum;
        // update agent's total client share number
        totalClientShareNum += currentClientShareNum;
        
        _earn();

        emit ClientDeposit(msg.sender,amount,currentClientShareNum,clientShareNum[msg.sender]);

    }
    
    
    /**
     * @notice input value is the number of shares client want to withdraw rather than ogs amount, different with deposit function 
     * @dev client withdraw shares from agent and agent return client shares worth ogs 
     */
    function clientWithdraw(uint256 shares) external nonReentrant{
        require(shares > 0, "nothing to withdraw");
        require(shares <= clientShareNum[msg.sender], "balance exceeded");

        // calculate client's withdraw share worth how much ogs
        // There may exists computational accuracy issues ,however pancake auto pool accept it, not sure whether we accept it or not
        // the emedial measurement is taken at line 210
        uint256 withdrawShareWorth = (balanceOf().mul(shares)).div(totalClientShareNum);

        // update the number of current client shares
        clientShareNum[msg.sender] -= shares;
        // update agent's total client share number
        totalClientShareNum -= shares;


        // agent return client shares worth ogs
        // agent's uncompound ogs balance
        uint256 bal = available();
        // if agent's uncompound ogs balance is enough to cover clent withdrawShareWorth ogs then withdraw ogs from agent's uncompound ogs
        // else agent withdraw staking balance from lpstaking pool to fill up client withdraw vacancy
        // agent's uncompound ogs balance can't cover withdrawShareWorth ogs scenario
        if (bal < withdrawShareWorth) {
            // client withdraw vacancy
            uint256 balWithdraw = withdrawShareWorth.sub(bal);
            // agent withdraw the vacancy from lpstaking pool
            iLPStaking(lpstaking).withdraw(balWithdraw);
            // agent's uncompound ogs after withdraw from lpstaking pool
            uint256 balAfter = available();
            uint256 diff = balAfter.sub(bal);
            // if withdraw still can't fill the vacancy,it might be the computational accuracy issues, remedying by changing client withdrawShareWorth
            if (diff < balWithdraw) {
                withdrawShareWorth  = bal.add(diff);
            }
        }
        // transfer client withdraw share worth ogs 
        IERC20(assetContract).safeTransfer(msg.sender, withdrawShareWorth);

        emit ClientWithdraw(msg.sender,withdrawShareWorth,shares,clientShareNum[msg.sender]);
    }


    /**
     * @dev withdraw client's all shares from agent and agent return client shares worth ogs
     */
    function clientWithdrawAll() external nonReentrant{
        uint256 shares = clientShareNum[msg.sender];
        require(shares > 0, "nothing to withdraw");
        require(shares <= clientShareNum[msg.sender], "balance exceeded");

        // calculate client's withdraw share worth how much ogs
        // There may exists computational accuracy issues ,however pancake auto pool accept it, not sure whether we accept it or not
        // the emedial measurement is taken at line 210
        uint256 withdrawShareWorth = (balanceOf().mul(shares)).div(totalClientShareNum);

        // update the number of current client shares
        clientShareNum[msg.sender] -= shares;
        // update agent's total client share number
        totalClientShareNum -= shares;


        // agent return client shares worth ogs
        // agent's uncompound ogs balance
        uint256 bal = available();
        // if agent's uncompound ogs balance is enough to cover clent withdrawShareWorth ogs then withdraw ogs from agent's uncompound ogs
        // else agent withdraw staking balance from lpstaking pool to fill up client withdraw vacancy
        // agent's uncompound ogs balance can't cover withdrawShareWorth ogs scenario
        if (bal < withdrawShareWorth) {
            // client withdraw vacancy
            uint256 balWithdraw = withdrawShareWorth.sub(bal);
            // agent withdraw the vacancy from lpstaking pool
            iLPStaking(lpstaking).withdraw(balWithdraw);
            // agent's uncompound ogs after withdraw from lpstaking pool
            uint256 balAfter = available();
            uint256 diff = balAfter.sub(bal);
            // if withdraw still can't fill the vacancy,it might be the computational accuracy issues, remedying by changing client withdrawShareWorth
            if (diff < balWithdraw) {
                withdrawShareWorth  = bal.add(diff);
            }
        }
        // transfer client withdraw share worth ogs 
        IERC20(assetContract).safeTransfer(msg.sender, withdrawShareWorth);

        emit ClientWithdraw(msg.sender,withdrawShareWorth,shares,clientShareNum[msg.sender]);
        
    }


    
    /**
     * ======================================================================================
     * 
     * VIEW FUNCTIONS
     *
     * ======================================================================================
     */

    /**
     * @notice all "agent" refer to "auto compound investment agent" 
    */

    /**
     * @dev return agent's total pending rewards that can be compounded/restaked
     */
    function agentTotalPendingOgsRewards() external view returns (uint256) { 
        uint256 amount = iLPStaking(lpstaking).checkReward(address(this));
        //add agent's uncompound ogs balance
        amount = amount.add(available());
        
        return amount;
    }


    /**
     * @notice return result multiplied SHARE_MULTIPLIER
     * @dev return the price(ogs) per share(given by agent) 
     */
    function getOgsPerAgentShare() external view returns (uint256) {
        // balanceOf() include agent's staked and uncompound ogs balance
        return totalClientShareNum == 0 ? SHARE_MULTIPLIER : balanceOf().mul(SHARE_MULTIPLIER).div(totalClientShareNum);
    }



    /**
     * @dev return the current shares own by client 
     */
    function getClintCurrentShare(address account) external view returns (uint256) { 
        return clientShareNum[account];
    }

   
    
    /**
     * ======================================================================================
     * 
     * AUTO COMPOUND EVENTS
     *
     * ======================================================================================
     */
     event ClientDeposit(address account, uint256 depositOgs, uint256 depositShares, uint256 accountCurrentShares);
     event ClientWithdraw(address account, uint256 withdrawOgs, uint256 withdrawShares, uint256 accountCurrentShares);
     event Harvest(address account, uint256 timestamp);

}