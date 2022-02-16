const ouraogs = artifacts.require("LPStaking"); // pool contract 
// const BN = require("bn.js");
const OGS = artifacts.require("OGSToken");      // ogs contract 
const autocompound = artifacts.require("AutoCompound");  //auto compound contract
let BigNumber = require('bignumber.js');


const OGSToken = function(value){
    return value * 10 ** 0;
}

contract("AutoCompound",async accounts =>{
    it("AutoCompoundTest",async()=>{
        const skipBlocks = async function(blockCount) {
            for (var i = 0; i < blockCount; ++i) {
                await web3.eth.sendTransaction({ from: accounts[5], to: accounts[5], value: 1});
            }
        };

        const oweracc = accounts[0];
        const partiacc1 = accounts[1];
        const partiacc2 = accounts[2];
        const partiacc3 = accounts[3];
        const partiacc4 = accounts[4];

        let ogstoken = await OGS.new("OGSTOKEN","OGS",0,10000);
        owerOSG = await ogstoken.balanceOf(oweracc);
        

        assert.equal(OGSToken(10000),owerOSG.toNumber());
        await ogstoken.batchTransfer([partiacc1,partiacc2,partiacc3,partiacc4],[OGSToken(1000),OGSToken(1000),OGSToken(1000),OGSToken(1000)],{ from: oweracc });

        parti1OSG = await ogstoken.balanceOf(partiacc1);
        parti2OSG = await ogstoken.balanceOf(partiacc2);
        parti3OSG = await ogstoken.balanceOf(partiacc3);
        owerOSG = await ogstoken.balanceOf(oweracc);

        assert.equal(OGSToken(1000),parti1OSG.toNumber());
        assert.equal(OGSToken(1000),parti2OSG.toNumber());
        assert.equal(OGSToken(1000),parti3OSG.toNumber());
        assert.equal(OGSToken(10000-1000-1000-1000-1000),owerOSG.toNumber());

        //初始化lpstaking
        console.log("---部署ogs质押池......---");
        let blockReward = 15;
        lpstaking = await ouraogs.new(ogstoken.address);
        console.log("---ogs质押池部署完毕---");
        await lpstaking.setBlockReward(blockReward);
        console.log("---初始化BlockReward为15---");
        console.log("");

        //部署auto compound合约
        console.log("---部署auto compound合约......---");
        autoogs = await autocompound.new(ogstoken.address,lpstaking.address);
        console.log("---auto compound合约部署完毕---");
        console.log("");

 



        
        //approve用户
        await ogstoken.approve(lpstaking.address,OGSToken(10000),{from:partiacc1});
        await ogstoken.approve(lpstaking.address,OGSToken(10000),{from:partiacc2});
        await ogstoken.approve(lpstaking.address,OGSToken(10000),{from:partiacc3});
        await ogstoken.approve(lpstaking.address,OGSToken(10000),{from:partiacc4});
        await ogstoken.approve(autoogs.address,OGSToken(10000),{from:partiacc1});
        await ogstoken.approve(autoogs.address,OGSToken(10000),{from:partiacc2});
        await ogstoken.approve(autoogs.address,OGSToken(10000),{from:partiacc3});
        await ogstoken.approve(autoogs.address,OGSToken(10000),{from:partiacc4});

        


        
        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")
        //测试用户X存了500
        console.log("***质押池测试用户X质押500 ogs***")
        await lpstaking.deposit(OGSToken(500),{from : partiacc1});
        console.log("") 

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //手动跳过5个区块
        await skipBlocks(5);
        console.log("+++过了5个区块后...+++")
        console.log("")

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        
        //用户X投资情况
        console.log("===质押池测试用户X投资情况|开始===")
        console.log("===质押中的ogs===")
        console.log((await lpstaking.numStaked(partiacc1)).toNumber())
        console.log("===待获取的利息===")
        console.log((await lpstaking.checkReward(partiacc1)).toNumber())
        console.log("===质押池测试用户X投资情况|结束===")
        console.log("")
        console.log("")


        //用户X获取利息
        console.log("***质押池测试用户X获取利息***")
        await lpstaking.claimRewards({from : partiacc1});
        console.log("")



        //用户X投资情况
        console.log("===质押池测试用户X投资情况|开始===")
        console.log("===质押中的ogs===")
        console.log((await lpstaking.numStaked(partiacc1)).toNumber())
        console.log("===待获取的利息===")
        console.log((await lpstaking.checkReward(partiacc1)).toNumber())
        console.log("===质押池测试用户X投资情况|结束===")
        console.log("")
        console.log("")

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //auto compound 用户A质押100 ogs
        console.log("***auto compound 用户A质押100 ogs***")
        console.log("")
        await autoogs.clientDeposit(OGSToken(100),{from : partiacc2});

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")
        console.log("")


        //手动跳过5个区块
        await skipBlocks(5);
        console.log("+++过了5个区块后...+++")
        console.log("")

        //用户A投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")
        console.log("")

        //机器人手动触发复利
        console.log("***机器人手动触发复利***")
        await autoogs.harvest({from : partiacc1});
        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")
        console.log("")
        console.log("")
        console.log("")
        console.log("")
        console.log("")
        console.log("")








        //用户B开始快速投资
        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        console.log("***auto compound 用户B 钱包ogs余额***")
        parti3OSG = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSG.toNumber())

        console.log("^^^ 用户B开始快速投资 ^^^")
        //auto compound 用户B质押500 ogs
        console.log("***auto compound 用户B质押500 ogs***")
        console.log("")
        await autoogs.clientDeposit(OGSToken(500),{from : partiacc3});

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        console.log("^^^ 用户B投入资金后立即取出 ^^^")
        // 用户B投入资金后立即取出
        //auto compound 用户B取走所有的share
        console.log("***auto compound 用户B 钱包ogs余额***")
        parti3OSGb = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSGb.toNumber())

        console.log("***auto compound 用户B 取走所有的资产***")
        console.log("")
        await autoogs.clientWithdrawAll({from : partiacc3});

        console.log("***auto compound 用户B 钱包ogs余额***")
        parti3OSGa = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSGa.toNumber())
        parti3Profit = parti3OSGa.sub(parti3OSGb)
        console.log("***auto compound 用户B 本次投资获得|本金500***")
        console.log(parti3Profit.toNumber())

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")
        console.log("")
        console.log("")
        console.log("")
        console.log("")
        console.log("")







        
        //用户B再次开始快速投资
        //auto compound 用户B质押500 ogs
        console.log("^^^ 用户B再次开始快速投资 ^^^")
        console.log("***auto compound 用户B质押500 ogs***")
        console.log("")
        await autoogs.clientDeposit(OGSToken(500),{from : partiacc3});

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")
        
        console.log("^^^ 用户B投入资金后立即取出 ^^^")
        // 用户B投入资金后立即取出
        //auto compound 用户B取走所有的share
        console.log("***auto compound 用户B 钱包ogs余额***")
        parti3OSGb = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSGb.toNumber())

        console.log("***auto compound 用户B 取走所有的资产***")
        console.log("")
        await autoogs.clientWithdrawAll({from : partiacc3});

        console.log("***auto compound 用户B 钱包ogs余额***")
        parti3OSGa = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSGa.toNumber())
        parti3Profit = parti3OSGa.sub(parti3OSGb)
        console.log("***auto compound 用户B 本次投资获得|本金500***")
        console.log(parti3Profit.toNumber())

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")
        console.log("")
        console.log("")
        console.log("")
        console.log("")
        console.log("")















        //用户B再次开始快速投资,同时会有其他人一同参与投资
        //auto compound 用户B质押500 ogs
        console.log("^^^ 用户B再次开始快速投资,同时会有其他人一同参与投资 ^^^")
        console.log("***auto compound 用户B质押500 ogs***")
        console.log("")
        await autoogs.clientDeposit(OGSToken(500),{from : partiacc3});

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")


        console.log("***auto compound 用户C质押500 ogs***")
        console.log("")
        await autoogs.clientDeposit(OGSToken(500),{from : partiacc4});

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B,C投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===用户C投资情况|开始===")
        console.log("===用户C目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc4)).toNumber())
        console.log("===用户C投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")


        
        console.log("^^^ 用户B投入资金后立即取出 ^^^")
        // 用户B投入资金后立即取出
        //auto compound 用户B取走所有的share
        console.log("***auto compound 用户B 钱包ogs余额***")
        parti3OSGb = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSGb.toNumber())

        console.log("***auto compound 用户B 取走所有的资产***")
        console.log("")
        await autoogs.clientWithdrawAll({from : partiacc3});

        console.log("***auto compound 用户B 钱包ogs余额***")
        parti3OSGa = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSGa.toNumber())
        parti3Profit = parti3OSGa.sub(parti3OSGb)
        console.log("***auto compound 用户B 本次投资获得|本金500***")
        console.log(parti3Profit.toNumber())


        // 用户C投入资金后立即取出
        //auto compound 用户C取走所有的share
        console.log("***auto compound 用户C 钱包ogs余额***")
        parti4OSGb = await ogstoken.balanceOf(partiacc4);
        console.log(parti4OSGb.toNumber())

        console.log("***auto compound 用户C 取走所有的资产***")
        console.log("")
        await autoogs.clientWithdrawAll({from : partiacc4});

        console.log("***auto compound 用户C 钱包ogs余额***")
        parti4OSGa = await ogstoken.balanceOf(partiacc4);
        console.log(parti4OSGa.toNumber())
        parti4Profit = parti4OSGa.sub(parti4OSGb)
        console.log("***auto compound 用户C 本次投资获得|本金500***")
        console.log(parti4Profit.toNumber())

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B,C投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===用户C投资情况|开始===")
        console.log("===用户C目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc4)).toNumber())
        console.log("===用户C投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")
        console.log("")
        console.log("")
        console.log("")
        console.log("")
        console.log("")











        // 用户B投资后第一时间有机器人来做自动复利
        //auto compound 用户B质押500 ogs
        console.log("^^^ 用户B再次开始快速投资,但第一时间有机器人来做自动复利 ^^^")
        console.log("***auto compound 用户B质押500 ogs***")
        console.log("")
        await autoogs.clientDeposit(OGSToken(500),{from : partiacc3});

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")


        //机器人手动触发复利
        console.log("***机器人手动触发复利***")
        await autoogs.harvest({from : partiacc1});
        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")


        console.log("^^^ 用户B投入资金等待机器人手动触发复利后,便取出所有资金 ^^^")
        // 用户B投入资金等待机器人手动触发复利后,便取出所有资金
        //auto compound 用户B取走所有的share
        console.log("***auto compound 用户B 钱包ogs余额***")
        parti3OSGb = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSGb.toNumber())

        console.log("***auto compound 用户B 取走所有的资产***")
        console.log("")
        await autoogs.clientWithdrawAll({from : partiacc3});

        console.log("***auto compound 用户B 钱包ogs余额***")
        parti3OSGa = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSGa.toNumber())

        parti3Profit=parti3OSGa.sub(parti3OSGb)
        console.log("***auto compound 用户B 本次投资获得|本金500***")
        console.log(parti3Profit.toNumber())

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")
        console.log("")
        console.log("")
        console.log("")
        console.log("")
        console.log("")










        // 用户B投资后第一时间有机器人来做自动复利,同时会有其他人一同参与投资
        //auto compound 用户B质押500 ogs
        console.log("^^^ 用户B再次开始快速投资,但第一时间有机器人来做自动复利,同时会有其他人一同参与投资 ^^^")
        console.log("***auto compound 用户B质押500 ogs***")
        console.log("")
        await autoogs.clientDeposit(OGSToken(500),{from : partiacc3});

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")


        console.log("***auto compound 用户C质押500 ogs***")
        console.log("")
        await autoogs.clientDeposit(OGSToken(500),{from : partiacc4});

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B,C投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===用户C投资情况|开始===")
        console.log("===用户C目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc4)).toNumber())
        console.log("===用户C投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")


        //机器人手动触发复利
        console.log("***机器人手动触发复利***")
        await autoogs.harvest({from : partiacc1});
        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")


        console.log("^^^ 用户B投入资金等待机器人手动触发复利后,便取出所有资金 ^^^")
        // 用户B投入资金等待机器人手动触发复利后,便取出所有资金
        //auto compound 用户B取走所有的share
        console.log("***auto compound 用户B 钱包ogs余额***")
        parti3OSGb = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSGb.toNumber())

        console.log("***auto compound 用户B 取走所有的资产***")
        console.log("")
        await autoogs.clientWithdrawAll({from : partiacc3});

        console.log("***auto compound 用户B 钱包ogs余额***")
        parti3OSGa = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSGa.toNumber())

        parti3Profit=parti3OSGa.sub(parti3OSGb)
        console.log("***auto compound 用户B 本次投资获得|本金500***")
        console.log(parti3Profit.toNumber())


        // 用户C投入资金后立即取出
        //auto compound 用户C取走所有的share
        console.log("***auto compound 用户C 钱包ogs余额***")
        parti4OSGb = await ogstoken.balanceOf(partiacc4);
        console.log(parti4OSGb.toNumber())

        console.log("***auto compound 用户C 取走所有的资产***")
        console.log("")
        await autoogs.clientWithdrawAll({from : partiacc4});

        console.log("***auto compound 用户C 钱包ogs余额***")
        parti4OSGa = await ogstoken.balanceOf(partiacc4);
        console.log(parti4OSGa.toNumber())
        parti4Profit = parti4OSGa.sub(parti4OSGb)
        console.log("***auto compound 用户C 本次投资获得|本金500***")
        console.log(parti4Profit.toNumber())

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B,C投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===用户C投资情况|开始===")
        console.log("===用户C目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc4)).toNumber())
        console.log("===用户C投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")
        console.log("")
        console.log("")
        console.log("")
        console.log("")
        console.log("")













        // 用户B重新开始正常投资
        //auto compound 用户B质押500 ogs
        console.log("^^^ 用户B开始正常投资 ^^^")
        console.log("***auto compound 用户B质押500 ogs***")
        console.log("")
        await autoogs.clientDeposit(OGSToken(500),{from : partiacc3});

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")


        //手动跳过5个区块
        await skipBlocks(5);
        console.log("+++过了5个区块后...+++")
        console.log("")


        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")

        //机器人手动触发复利
        console.log("***机器人手动触发复利***")
        await autoogs.harvest({from : partiacc1});
        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")


        console.log("^^^ 用户B投入资金后等待一段时间且机器人手动触发复利 ^^^")
        // 用户B投入资金后等待一段时间且机器人手动触发复利
        //auto compound 用户B取走所有的share
        console.log("***auto compound 用户B 钱包ogs余额***")
        parti3OSGb = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSGb.toNumber())

        console.log("***auto compound 用户B 取走所有的资产***")
        console.log("")
        await autoogs.clientWithdrawAll({from : partiacc3});

        console.log("***auto compound 用户B 钱包ogs余额***")
        parti3OSGa = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSGa.toNumber())

        parti3Profit=parti3OSGa.sub(parti3OSGb)
        console.log("***auto compound 用户B 本次投资获得|本金500***")
        console.log(parti3Profit.toNumber())

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户A,B投资情况| agent的投资情况
        console.log("===用户A投资情况|开始===")
        console.log("===用户A目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc2)).toNumber())
        console.log("===用户A投资情况|结束===")

        console.log("===用户B投资情况|开始===")
        console.log("===用户B目前的share数量===")
        console.log((await autoogs.getClintCurrentShare(partiacc3)).toNumber())
        console.log("===用户B投资情况|结束===")

        console.log("===agent的投资情况|开始===")
        console.log("===目前的share兑换ogs的价值===")
        shareValue= await autoogs.getOgsPerAgentShare()
        shareValue = BigNumber(shareValue).dividedBy(1e18)
        console.log(shareValue.toNumber())
        console.log("===目前待复利的ogs===")
        console.log((await autoogs.agentTotalPendingOgsRewards()).toNumber())
        console.log("===agent的投资情况|结束===")        
        console.log("")
        console.log("")
        console.log("")
        console.log("")
        console.log("")
        console.log("")


        








        // 用户B单独投资
        console.log("^^^ 用户B 单独投资 ogs pool ^^^")

        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        //用户B存了500
        console.log("***用户B 质押500 ogs***")
        await lpstaking.deposit(OGSToken(500),{from : partiacc3});
        console.log("")


        //手动跳过5个区块
        await skipBlocks(5);
        console.log("+++过了5个区块后...+++")
        console.log("")


        //当前区块高度
        currentBlock = await web3.eth.getBlockNumber();
        console.log("---当前区块高度---")
        console.log(currentBlock)
        console.log("")

        console.log("***auto compound 用户B 钱包ogs余额***")
        parti3OSGb = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSGb.toNumber())

        //用户B获取利息
        console.log("***用户B获取利息***")
        await lpstaking.claimRewards({from : partiacc3});
        console.log("")

        //用户B获取质押本金
        console.log("***用户B获取质押本金500 ogs***")
        await lpstaking.withdraw(OGSToken(500),{from : partiacc3});
        console.log("")

        console.log("***用户B 钱包ogs余额***")
        parti3OSGa = await ogstoken.balanceOf(partiacc3);
        console.log(parti3OSGa.toNumber())

        parti3Profit=parti3OSGa.sub(parti3OSGb)
        console.log("***用户B 本次投资获得|本金500***")
        console.log(parti3Profit.toNumber())





        
        


























    });
})