const ourautoogs = artifacts.require("LPStaking");
const BN = require("bn.js");
const OGS = artifacts.require("OGSToken");

const OGSToken = function(value){
    return value * 10 ** 0;
}

contract("LPStaking",async accounts =>{
    it("LPStakingTest",async()=>{
        const skipBlocks = async function(blockCount) {
            for (var i = 0; i < blockCount; ++i) {
                await web3.eth.sendTransaction({ from: accounts[3], to: accounts[3], value: 1});
            }
        };

        const oweracc = accounts[0];
        const partiacc1 = accounts[1];
        const partiacc2 = accounts[2];

        let ogstoken = await OGS.new("OGSTOKEN","OGS",0,10000);
        owerOSG = await ogstoken.balanceOf(oweracc);

        assert.equal(OGSToken(10000),owerOSG.toNumber());
        await ogstoken.batchTransfer([partiacc1,partiacc2],[OGSToken(1000),OGSToken(1000)],{ from: oweracc });

        parti1OSG = await ogstoken.balanceOf(partiacc1);
        parti2OSG = await ogstoken.balanceOf(partiacc2);
        owerOSG = await ogstoken.balanceOf(oweracc);

        assert.equal(OGSToken(1000),parti1OSG.toNumber());
        assert.equal(OGSToken(1000),parti2OSG.toNumber());
        assert.equal(OGSToken(10000-1000-1000),owerOSG.toNumber());

        //初始化lpstaking
        let blockReward = 15;
        lpstaking = await ourautoogs.new(ogstoken.address);
        await lpstaking.setBlockReward(blockReward);

        //设置
        await ogstoken.approve(lpstaking.address,OGSToken(1000),{from:partiacc1});
        await ogstoken.approve(lpstaking.address,OGSToken(1000),{from:partiacc2});


        await lpstaking.deposit(OGSToken(500),{from : partiacc1});  

        parti1OSG = await ogstoken.balanceOf(partiacc1);
        assert.equal(OGSToken(1000-500),parti1OSG.toNumber());

        previoublock = await web3.eth.getBlockNumber();
        await skipBlocks(5);

        await lpstaking.deposit(OGSToken(500),{from : partiacc2});
        previoublock = await web3.eth.getBlockNumber() - previoublock;
        console.log(previoublock)
        
        console.log((await lpstaking.numStaked(partiacc1)).toNumber())
        console.log((await lpstaking.numStaked(partiacc2)).toNumber())

        await lpstaking.withdraw(100,{from:partiacc2});


    });
})