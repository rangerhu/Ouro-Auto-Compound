const ouraogs = artifacts.require("LPStaking"); // pool contract 
const OGS = artifacts.require("OGSToken");      // ogs contract 
let BigNumber = require('bignumber.js');


const OGSToken = function(value){
    return value * 10 ** 0;
}

contract("AutoOgsApy",async accounts =>{
    it("AutoOgsApyTest",async()=>{

        // 计算ogs pool APR公式
        // Pool APR = Annualized rewards (ogs) / User funds staked in OGS Pool (ogs)  * 100 %
        const calculate_APR = async function(lpstaking, ogstoken, blockReward, blockPerSec) {
            
            // 一年产生的区块个数
            let blockPerYear = BigNumber(blockPerSec).multipliedBy(60).multipliedBy(24).multipliedBy(365);

            // 一年的区块 ogs reward  
            let blockRewardPerYear = blockPerYear.multipliedBy(blockReward);

            console.log("block Reward Per Year ", blockRewardPerYear.toNumber(), " ogs");

            // 计算当前ogs pool中的质押资产总额
            lpstackingOGS = await ogstoken.balanceOf(lpstaking.address);

            // 计算当前ogs pool的APR
            // Pool APR = Annualized rewards (ogs) / User funds staked in OGS Pool (ogs)  * 100 %
            let lpstackingAPR = blockRewardPerYear.dividedBy(BigNumber(lpstackingOGS)).toNumber();
            
            // console.log("APR for ogs pool ", lpstackingAPR * 100, "%");

            return lpstackingAPR;
       
        }; 


        // 计算auto ogs pool APY公式
        // 需要先计算 ogs pool 的APR
        // Auto Pool APY = (1 + Compound timely rate)^ Yearly compound times -1  * 100 %
        function calculate_APY(lpstackingAPR, averageDaliyCompoundTimes){

            const averageYearCompoundTimes =  averageDaliyCompoundTimes * 365;

            const intraDailyRate = lpstackingAPR / averageYearCompoundTimes;

            // 由当前ogs pool 的APR计算 auto ogs pool 的APY
            // Auto Pool APY = (1 + Compound timely rate)^ Yearly compound times -1  * 100 %
            const autoAPY = Math.pow(1 + intraDailyRate, averageYearCompoundTimes) - 1;
            
            // console.log("APY for auto ogs pool ", autoAPY * 100, "%");

            return autoAPY;

        }


        //实例测试
        const oweracc = accounts[0];
        const partiacc1 = accounts[1];
        const partiacc2 = accounts[2];

        let ogstoken = await OGS.new("OGSTOKEN","OGS",0,20000000);
        owerOSG = await ogstoken.balanceOf(oweracc);
        

        assert.equal(OGSToken(20000000),owerOSG.toNumber());
        await ogstoken.batchTransfer([partiacc1,partiacc2],[OGSToken(10000000),OGSToken(10000000)],{ from: oweracc });


        // 设定质押池的block reward 为15 ogs
        let blockReward = 15;

        console.log("---部署ogs质押池......---");
        lpstaking = await ouraogs.new(ogstoken.address);
        console.log("---ogs质押池部署完毕---");
        await lpstaking.setBlockReward(blockReward);
        console.log("---初始化BlockReward为15---");
        console.log("");

        //设置质押池为mintable
        await ogstoken.setMintable(lpstaking.address,true);

        //approve用户
        await ogstoken.approve(lpstaking.address,OGSToken(10000000),{from:partiacc1});
        await ogstoken.approve(lpstaking.address,OGSToken(10000000),{from:partiacc2});


        //测试用户质押资产
        console.log("***质押池测试用户1质押10000000 ogs***")
        await lpstaking.deposit(OGSToken(10000000),{from : partiacc1});
        console.log("")
        
        console.log("***质押池测试用户2质押10000000 ogs***")
        await lpstaking.deposit(OGSToken(10000000),{from : partiacc2});
        console.log("")


        // 测试ogs pool APR
        // 设定每秒产生2个区块
        let ogsPoolApr = await calculate_APR(lpstaking, ogstoken, blockReward, 2);
        console.log("APR for ogs pool ", ogsPoolApr * 100, "%");

        // 测试auto ogs pool APY
        // 设定平均每天触发compound 288次
        let autoOgsPoolApy = calculate_APY(ogsPoolApr, 288);
        console.log("APY for auto ogs pool ", autoOgsPoolApy * 100, "%");

        
        
    });
})






 