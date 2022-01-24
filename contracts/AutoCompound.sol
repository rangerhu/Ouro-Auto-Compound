// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interface/IMasterCom.sol";

contract AutoCompound is Ownable,Pausable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    struct UserInfo{
        uint256 shares; //shares for a user
        uint256 lastDepositedTime; // keep track of last Deposite time
        uint256 ouroAtLastUserAction; // keep track of ouro deposited at the last user action
        uint256 lastUserActionTime; // keep track of the last user action time
    }

    IERC20 public immutable token; //ouro token
    IERC20 public immutable receiptToken; // receiptToken

    IMasterCom public immutable mastercomp;

    mapping(address=> UserInfo) userInfo;

    uint256 public totalShares;
    uint256 public lastHarvestedTime;
    address public admin;
    address public treasury;

    uint256 public constant MAX_PERFORMANCE_FEE = 500; // 5%
    uint256 public constant MAX_CALL_FEE = 100; // 1%
    uint256 public constant MAX_WITHDRAW_FEE = 100; // 1%
    uint256 public constant MAX_WITHDRAW_FEE_PERIOD = 72 hours; // 3 days

    uint256 public performanceFee = 200; // 2%
    uint256 public callFee = 25; // 0.25%
    uint256 public withdrawFee = 10; // 0.1%
    uint256 public withdrawFeePeriod = 72 hours; // 3 days

    event Deposit(address indexed sender, uint256 amount, uint256 shares, uint256 lastDepositedTime);
    event Withdraw(address indexed sender, uint256 amount, uint256 shares);
    event Harvest(address indexed sender, uint256 performanceFee, uint256 callFee);
    event Pause();
    event Unpause();

    constructor(
        IERC20 _token,
        IERC20 _receiptToken,
        IMasterCom _mastercomp,
        address _admin,
        address _treasury
        ) public {
            token = _token;
            receiptToken = _receiptToken;
            mastercomp = _mastercomp;
            admin = _admin;
            treasury = _treasury;

            // Infinite approve
            IERC20(_token).safeApprove(address(_mastercomp), uint256(-1));
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "admin: wut?");
        _;
    }

    modifier notContract() {
        require(!_isContract(msg.sender), "contract not allowed");
        require(msg.sender == tx.origin, "proxy contract not allowed");
        _;
    }

    function deposit(uint256 _amount) external whenNotPaused notContract{
        require(_amount > 0, "Nothing to deposit");
        
        uint256 pool = balanceOf();
        token.safeTransferFrom(msg.sender, address(this), _amount);
        uint256 currentShares = 0;
        if(totalShares != 0){
            currentShares = (_amount.mul(totalShares)).div(pool);
        }else{
            currentShares = _amount;
        }
        UserInfo storage user = userInfo[msg.sender];

        user.shares = user.shares.add(currentShares);
        user.lastDepositedTime = block.timestamp;

        totalShares = totalShares + currentShares;

        user.ouroAtLastUserAction = user.shares.mul(balanceOf()).div(totalShares);
        user.lastUserActionTime = block.timestamp;

        _earn();
        emit Deposit(msg.sender, _amount, currentShares, block.timestamp);
    }


    function available() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function _earn() internal {
        uint256 bal = available();
        if (bal > 0) {
            IMasterCom(mastercomp).enterStaking(bal);
        }
    }

    function balanceOf() public view returns (uint256) {
        (uint256 amount, ) = IMasterCom(mastercomp).userInfo(0, address(this));
        return token.balanceOf(address(this)).add(amount);
    }

    function setAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "Cannot be zero address");
        admin = _admin;
    }

    function setPerformanceFee(uint256 _performanceFee) external onlyAdmin {
        require(_performanceFee <= MAX_PERFORMANCE_FEE, "performanceFee cannot be more than MAX_PERFORMANCE_FEE");
        performanceFee = _performanceFee;
    }

    function setWithdrawFeePeriod(uint256 _withdrawFeePeriod) external onlyAdmin {
        require(
            _withdrawFeePeriod <= MAX_WITHDRAW_FEE_PERIOD,
            "withdrawFeePeriod cannot be more than MAX_WITHDRAW_FEE_PERIOD"
        );
        withdrawFeePeriod = _withdrawFeePeriod;
    }

    function setWithdrawFee(uint256 _withdrawFee) external onlyAdmin {
        require(_withdrawFee <= MAX_WITHDRAW_FEE, "withdrawFee cannot be more than MAX_WITHDRAW_FEE");
        withdrawFee = _withdrawFee;
    }

    function setCallFee(uint256 _callFee) external onlyAdmin {
        require(_callFee <= MAX_CALL_FEE, "callFee cannot be more than MAX_CALL_FEE");
        callFee = _callFee;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Cannot be zero address");
        treasury = _treasury;
    }

    function _isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
}
